---
title: Building Engrams and Impulses
description: Component authoring workflow with SDK interfaces and testing.
---
# Building Engrams and Impulses

This guide covers the Go SDK (`bubu-sdk-go`) for building Engrams (data processing
components) and Impulses (event triggers).

## Who this is for

- Developers building custom Engrams or Impulses.
- Teams extending BubuStack with domain-specific processing logic.

## What you'll get

- How to implement batch, streaming, and impulse components.
- SDK entry points, interfaces, and lifecycle.
- Testing and conformance patterns.
- Template definition for publishing components.

---

## SDK entry points

The SDK provides three entry points in `sdk.go`, one per component mode:

| Function | Mode | Kubernetes workload |
|----------|------|---------------------|
| `sdk.StartBatch[C, I](ctx, engram)` | Batch | Job |
| `sdk.StartStreaming[C](ctx, engram)` | Streaming | Deployment |
| `sdk.RunImpulse[C](ctx, impulse)` | Trigger | Deployment |

`C` is the config type, `I` is the inputs type. Both are deserialized from
environment variables injected by the operator.

---

## Batch Engrams

Batch Engrams run finite tasks as Kubernetes Jobs. They receive inputs, process
them, and return a result.

### Interface

```go
type BatchEngram[C, I any] interface {
    Init(ctx context.Context, config C, secrets *engram.Secrets) error
    Process(ctx context.Context, execCtx *engram.ExecutionContext, inputs I) (*engram.Result, error)
}
```

### Example

```go
package main

import (
    "context"

    "github.com/bubustack/bubu-sdk-go"
    "github.com/bubustack/bubu-sdk-go/engram"
)

type Config struct {
    Model string `mapstructure:"model"`
}

type Inputs struct {
    Prompt string `mapstructure:"prompt"`
}

type MyEngram struct {
    config Config
}

func New() *MyEngram { return &MyEngram{} }

func (e *MyEngram) Init(ctx context.Context, cfg Config, secrets *engram.Secrets) error {
    e.config = cfg
    return nil
}

func (e *MyEngram) Process(ctx context.Context, execCtx *engram.ExecutionContext, inputs Inputs) (*engram.Result, error) {
    // Your processing logic here
    return engram.NewResultFrom(map[string]any{
        "response": "processed: " + inputs.Prompt,
    }), nil
}

func main() {
    if err := sdk.StartBatch(context.Background(), New()); err != nil {
        panic(err)
    }
}
```

### Execution flow

1. SDK reads config and inputs from environment variables.
2. Config hydration resolves `$bubuStorageRef` values.
3. `Init` is called with deserialized config and secrets.
4. `Process` is called with hydrated inputs.
5. Output is dehydrated to storage if it exceeds the size limit.
6. StepRun status is patched with the result, exit code, and duration.

### Timeout handling

Batch steps enforce `BUBU_STEP_TIMEOUT` (shipped operator default: 5 minutes). If the timeout
fires, the SDK patches the StepRun with exit code 124 (retryable) and force-exits
the process to prevent zombie Jobs.

---

## Streaming Engrams

Streaming Engrams run as Deployments with bidirectional gRPC streams. They
process a continuous flow of messages.

### Interface

```go
type StreamingEngram[C any] interface {
    Init(ctx context.Context, config C, secrets *engram.Secrets) error
    Stream(ctx context.Context, in <-chan engram.InboundMessage, out chan<- engram.StreamMessage) error
}
```

### Example

```go
package main

import (
    "context"

    "github.com/bubustack/bubu-sdk-go"
    "github.com/bubustack/bubu-sdk-go/engram"
)

type Config struct {
    Enabled bool `mapstructure:"enabled"`
}

type MyStreamEngram struct {
    config Config
}

func New() *MyStreamEngram { return &MyStreamEngram{} }

func (e *MyStreamEngram) Init(ctx context.Context, cfg Config, secrets *engram.Secrets) error {
    e.config = cfg
    return nil
}

func (e *MyStreamEngram) Stream(ctx context.Context, in <-chan engram.InboundMessage, out chan<- engram.StreamMessage) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case msg, ok := <-in:
            if !ok {
                return nil
            }
            // Process and forward
            select {
            case out <- msg.StreamMessage:
            case <-ctx.Done():
                return ctx.Err()
            }
            msg.Done()
        }
    }
}

func main() {
    if err := sdk.StartStreaming(context.Background(), New()); err != nil {
        panic(err)
    }
}
```

### Streaming details

- The SDK starts a gRPC server on `BUBU_GRPC_PORT` (default 50051).
- Messages flow through bidirectional gRPC streams with the transport hub.
- Heartbeats are handled transparently by the SDK.
- The inbound channel carries `engram.InboundMessage`, which embeds `StreamMessage`
  and adds `Done()`.
- Call `msg.Done()` after successful handling or intentional drop. For
  best-effort traffic this is a no-op; for ordered / replay-capable traffic it
  advances delivery acknowledgement and deduplication.
- Backpressure is applied when the output channel buffer is full.
- Graceful shutdown drains in-flight messages on SIGTERM.

### Inbound and outbound message types

Inbound deliveries arrive as `engram.InboundMessage`. It embeds
`engram.StreamMessage` plus a `Done()` method used by the SDK runtime to track
processing completion for ordered / replayable transports. Outbound deliveries
still use plain `engram.StreamMessage`.

For structured JSON streaming outputs, keep the canonical JSON bytes in
`Payload` and mirror the same bytes into `Binary` with
`MimeType: application/json`. Reserve raw `Binary` without `Payload` for
opaque media or non-JSON blobs.

### StreamMessage fields

| Field | Description |
|-------|-------------|
| `Kind` | Semantic intent (data, heartbeat, hook, etc.) |
| `MessageID` | Caller-defined deduplication ID |
| `Metadata` | Tracing info (StoryRunID, StepName, etc.) |
| `Payload` | JSON-encoded data |
| `Audio` / `Video` / `Binary` | Media frames for real-time pipelines |
| `Inputs` | Template-resolved step configuration |
| `Envelope` | Stream sequencing metadata |

---

## Impulses (event triggers)

Impulses are long-running services that listen for external events and submit
durable `StoryTrigger` requests. The controller resolves those requests into
`StoryRun`s and records whether they were created, reused, or rejected.

### Interface

```go
type Impulse[C any] interface {
    Init(ctx context.Context, config C, secrets *engram.Secrets) error
    Run(ctx context.Context, client *k8s.Client) error
}
```

### Example

```go
package main

import (
    "context"

    "github.com/bubustack/bubu-sdk-go"
    "github.com/bubustack/bubu-sdk-go/k8s"
    "github.com/bubustack/bubu-sdk-go/engram"
)

type Config struct {
    Interval string `mapstructure:"interval"`
}

type MyImpulse struct {
    config Config
}

func New() *MyImpulse { return &MyImpulse{} }

func (i *MyImpulse) Init(ctx context.Context, cfg Config, secrets *engram.Secrets) error {
    i.config = cfg
    return nil
}

func (i *MyImpulse) Run(ctx context.Context, client *k8s.Client) error {
    _, err := sdk.StartStoryWithToken(ctx, "my-story", "source-event-id-123", map[string]any{
        "key": "value",
    })
    return err
}

func main() {
    if err := sdk.RunImpulse(context.Background(), New()); err != nil {
        panic(err)
    }
}
```

### Trigger helpers

The SDK provides helpers for durable trigger submission from Impulses:

| Function | Description |
|----------|-------------|
| `sdk.StartStory(ctx, storyName, inputs)` | Submit a `StoryTrigger` and wait for the resolved `StoryRun` |
| `sdk.StartStoryWithToken(ctx, storyName, token, inputs)` | Deterministic trigger identity for retries and duplicate suppression |
| `sdk.StopStory(ctx, storyRunName)` | Cancel an in-flight StoryRun |
| `sdk.GetTargetStory()` | Resolve target story name from environment |

For the latest contract, the SDK no longer creates `StoryRun` objects directly
from the trigger helper path.

---

## Secrets

The `Secrets` type provides sandboxed access to secrets mapped in the component
definition. Secrets are auto-expanded from Kubernetes Secret mounts and
environment variables.

```go
func (e *MyEngram) Init(ctx context.Context, cfg Config, secrets *engram.Secrets) error {
    apiKey, ok := secrets.Get("apiKey")
    if !ok {
        return fmt.Errorf("missing required secret: apiKey")
    }
    e.client = newClient(apiKey)
    return nil
}
```

| Method | Description |
|--------|-------------|
| `Get(key)` | Retrieve a specific secret value |
| `GetAll()` | Return a copy of all currently loaded secrets |
| `Names()` | Return sorted key names without values |
| `Select(keys...)` | Return a bounded plaintext subset by key |

Secrets implement `fmt.Formatter` to prevent accidental logging of values.

---

## Structured errors

When a step fails, the SDK produces a structured error with machine-readable
classification for retry decisions:

```go
type StructuredError struct {
    Version   string   // "v1"
    Type      string   // Timeout, Storage, Serialization, Validation, Initialization, Execution
    Message   string   // Human-readable (max 8 KiB)
    ExitCode  int      // Process exit code
    ExitClass string   // Success, Retry, RateLimited, Terminal
    Code      string   // Machine-readable error code
    Retryable bool     // Hint for the operator
}
```

The SDK auto-classifies errors based on type (storage, serialization, validation,
etc.). You can also implement `StructuredErrorProvider` on your errors for custom
classification.

See [Error Contract](../api/errors.md) for the full contract.

---

## Signals and effects

### Signals

Emit small metadata payloads (max 8 KiB) from within a step to communicate
progress or intermediate state:

```go
func (e *MyEngram) Process(ctx context.Context, execCtx *engram.ExecutionContext, inputs Inputs) (*engram.Result, error) {
    sdk.EmitSignal(ctx, "progress", map[string]any{"percent": 50})
    // ... continue processing
    return engram.NewResultFrom(result), nil
}
```

### Effects

Declare side effects for tracking and auditability:

```go
sdk.RecordEffect(ctx, "email.sent", "succeeded", map[string]any{"to": "user@example.com"})
```

The latest contract uses `EffectClaim` as the durable reservation authority for
`sdk.ExecuteEffectOnce(...)`. `StepRun.status.effects` remains the append-only
run-history mirror written by `sdk.RecordEffect(...)`.

---

## Observability

The SDK integrates with OpenTelemetry for tracing and metrics.

### Tracing

Enabled by default. Disable with `BUBU_SDK_TRACING_ENABLED=false`.
Trace context propagates via W3C tracecontext and baggage headers.

### Metrics

Enabled by default. Disable with `BUBU_SDK_METRICS_ENABLED=false`.

Built-in metrics include storage hydration/dehydration sizes, stream message
counts, reconnection attempts, and backpressure timeouts.

Custom metrics:

```go
import "github.com/bubustack/bubu-sdk-go/pkg/metrics"

counter, _ := metrics.Counter("myengram.records.processed_total", "Records processed")
counter.Add(ctx, 1)

hist, _ := metrics.Histogram("myengram.latency_seconds", "Processing latency", "s")
hist.Record(ctx, duration.Seconds())

metrics.Gauge("myengram.queue.depth", "Current queue depth", "items", func() float64 {
    return float64(len(queue))
})
```

### Logging

Inject a custom `slog.Logger`:

```go
ctx = sdk.WithLogger(ctx, myLogger)
// Later, retrieve it:
logger := sdk.LoggerFromContext(ctx)
```

The default logger writes JSON to stdout.

---

## Testing

### Unit testing with testkit

The `testkit` package provides harnesses for testing without a Kubernetes cluster:

**Batch harness:**

```go
import "github.com/bubustack/bubu-sdk-go/testkit"

func TestMyEngram(t *testing.T) {
    h := testkit.BatchHarness[Config, Inputs]{
        Engram:  New(),
        Config:  Config{Model: "test"},
        Inputs:  Inputs{Prompt: "hello"},
        Secrets: map[string]string{"apiKey": "test-key"},
    }
    result, err := h.Run(context.Background())
    if err != nil {
        t.Fatal(err)
    }
    // Assert on result.Data
}
```

**Stream harness:**

```go
h := testkit.StreamHarness[Config]{
    Engram: New(),
    Config: Config{Enabled: true},
    Inputs: []engram.StreamMessage{
        {Kind: "data", Payload: json.RawMessage(`{"text":"hello"}`)},
    },
}
outputs, err := h.Run(context.Background())
```

`StreamHarness.Inputs` remains `[]engram.StreamMessage`; the harness wraps them
into inbound messages before calling your `Stream` method.

### Conformance testing

The `conformance` package provides contract-oriented test suites that all Engrams
should pass:

```go
import "github.com/bubustack/bubu-sdk-go/conformance"

func TestConformance(t *testing.T) {
    suite := conformance.BatchSuite[Config, Inputs]{
        Engram:                New(),
        Config:                Config{Model: "test"},
        Inputs:                Inputs{Prompt: "hello"},
        RequireStructuredError: true,
        ValidateResult: func(r *engram.Result) error {
            // Custom validation
            return nil
        },
    }
    suite.Run(t)
}
```

Conformance suites enforce structured error contracts and validate output formats.

---

## Template definitions

Components are defined as `EngramTemplate` or `ImpulseTemplate` resources with
schemas for config, inputs, outputs, and secrets.

### Engram.yaml example

```yaml
apiVersion: bubustack.io/v1alpha1
kind: EngramTemplate
metadata:
  name: my-engram
spec:
  description: "Processes data with custom logic"
  image: ghcr.io/myorg/my-engram:0.1.0
  supports:
    - job          # batch mode
    - deployment   # streaming mode
  config:
    type: object
    properties:
      model:
        type: string
        description: "Model to use for processing"
        default: "default"
        required: true
      maxRetries:
        type: integer
        description: "Maximum retry attempts"
        default: 3
  inputs:
    type: object
    properties:
      prompt:
        type: string
        description: "Input prompt to process"
        required: true
  outputs:
    type: object
    properties:
      response:
        type: string
        description: "Processing result"
  secrets:
    type: object
    properties:
      apiKey:
        type: string
        description: "API key for external service"
        required: true
```

### ImpulseTemplate example

```yaml
apiVersion: bubustack.io/v1alpha1
kind: ImpulseTemplate
metadata:
  name: my-impulse
spec:
  description: "Triggers StoryRuns on webhook events"
  image: ghcr.io/myorg/my-impulse:0.1.0
  config:
    type: object
    properties:
      port:
        type: integer
        description: "HTTP port to listen on"
        default: 8080
      path:
        type: string
        description: "Webhook endpoint path"
        default: "/webhook"
  secrets:
    type: object
    properties:
      webhookSecret:
        type: string
        description: "Shared secret for webhook verification"
```

---

## Key environment variables

The operator injects these environment variables into component pods:

| Variable | Description |
|----------|-------------|
| `BUBU_TEMPLATE_CONTEXT` | JSON-encoded template context (story, run, step info) |
| `BUBU_STEP_TIMEOUT` | Batch step timeout (shipped Bobrapet default: 5m) |
| `BUBU_GRPC_PORT` | Streaming gRPC server port (default 50051) |
| `BUBU_GRPC_DIAL_TIMEOUT` | gRPC connection timeout |
| `BUBU_TRANSPORT_BINDING` | Serialized transport-binding envelope for the streaming workload |
| `BUBU_TRANSPORT_ENDPOINT` | Resolved transport endpoint for the current workload |
| `BUBU_SDK_TRACING_ENABLED` | Enable/disable OTel tracing |
| `BUBU_SDK_METRICS_ENABLED` | Enable/disable OTel metrics |
| `BUBU_HYBRID_BRIDGE` | Enable batch-to-stream output forwarding |

---

## Development workflow

1. **Create** a new component repo (see project structure below).
2. **Implement** the Engram or Impulse interface.
3. **Test locally** with `testkit` harnesses (no cluster needed).
4. **Run conformance** tests to validate contracts.
5. **Build** a Docker image.
6. **Define** an `EngramTemplate` or `ImpulseTemplate` YAML.
7. **Deploy** by referencing the template in a Story.

### Project structure

A typical Engram project:

```
my-engram/
  main.go              Entry point (sdk.StartBatch or sdk.StartStreaming)
  engram.go            Engram implementation (Init, Process/Stream)
  engram_test.go       Unit tests with testkit
  conformance_test.go  Conformance suite
  Engram.yaml          Template definition
  Dockerfile           Container image
  go.mod               Go module (depends on bubu-sdk-go)
```

---

## Storage reference handling

The SDK automatically resolves storage references before your Engram sees the
data:

- **Input hydration**: `$bubuStorageRef` values in inputs are fetched from storage
  and replaced with the actual content.
- **Output dehydration**: Large outputs are automatically offloaded to storage and
  replaced with a `$bubuStorageRef`.
- **Config hydration**: Storage refs in config values are resolved at startup.

You do not need to handle storage references manually. See
[Payloads](../runtime/payloads.md) for size limits and offload rules.

---

## Related docs

- [Component Ecosystem](../overview/component-ecosystem.md) -- Component ecosystem overview.
- [Durable Semantics](../overview/durable-semantics.md) -- Delivery guarantees and idempotency.
- [Error Contract](../api/errors.md) -- Structured error contract.
- [Inputs](../runtime/inputs.md) -- Schema defaults and validation.
- [Payloads](../runtime/payloads.md) -- Storage refs and size limits.
- [Streaming Contract](../streaming/streaming-contract.md) — Streaming message contract.
- [Observability](../observability/overview.md) — Tracing, metrics, and debugging.
- [Quickstart](../getting-started/quickstart.md) — Get running in under 10 minutes.
- [Roadmap](../community/roadmap.md) — What's planned and where to contribute.
