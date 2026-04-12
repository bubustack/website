---
title: Go SDK
sidebar_position: 1
description: Build Engrams and Impulses with the BubuStack Go SDK.
---
# Go SDK

The Go SDK provides everything you need to build Engrams and Impulses that run
inside BubuStack workflows. It handles configuration binding, gRPC transport,
telemetry, status patching, and lifecycle management.

## Installation

```bash
go get github.com/bubustack/bubu-sdk-go@latest
```

Supported Go version: **1.26+**. The module currently declares `go 1.26.2`.

## Entry Points

The SDK provides three entry points depending on your workload type:

| Function | Mode | Workload | Description |
| --- | --- | --- | --- |
| `sdk.StartBatch[C, I](ctx, engram)` | Batch | Job | Runs once and returns an error on failure |
| `sdk.StartStreaming[C](ctx, engram)` | Streaming | Deployment | Long-lived gRPC server on port 50051 |
| `sdk.RunImpulse[C](ctx, impulse)` | Trigger | Deployment | Listens for events, submits durable `StoryTrigger` requests, and waits for controller resolution |

## Batch Engrams

Implement the `BatchEngram` interface:

```go title="main.go"
package main

import (
    "context"
    sdk "github.com/bubustack/bubu-sdk-go"
    "github.com/bubustack/bubu-sdk-go/engram"
)

type Config struct {
    Model string `json:"model"`
}

type Inputs struct {
    Prompt string `json:"prompt"`
}

type MyEngram struct{}

func (e *MyEngram) Init(ctx context.Context, config Config, secrets *engram.Secrets) error {
    return nil
}

func (e *MyEngram) Process(ctx context.Context, execCtx *engram.ExecutionContext, inputs Inputs) (*engram.Result, error) {
    return engram.NewResultFrom(map[string]any{"status": "ok"}), nil
}

func main() {
    if err := sdk.StartBatch[Config, Inputs](context.Background(), &MyEngram{}); err != nil {
        panic(err)
    }
}
```

## Streaming Engrams

Implement the `StreamingEngram` interface for long-lived message processing:

```go title="main.go"
import (
    "context"
    sdk "github.com/bubustack/bubu-sdk-go"
    "github.com/bubustack/bubu-sdk-go/engram"
)

type MyStream struct{}

func (s *MyStream) Init(ctx context.Context, config Config, secrets *engram.Secrets) error {
    return nil
}

func (s *MyStream) Stream(ctx context.Context, in <-chan engram.InboundMessage, out chan<- engram.StreamMessage) error {
    for msg := range in {
        out <- engram.StreamMessage{
            Payload:  msg.Payload,
            Binary: &engram.BinaryFrame{
                Payload:  msg.Payload,
                MimeType: "application/json",
            },
        }
        msg.Done()
    }
    return nil
}

func main() {
    if err := sdk.StartStreaming[Config](context.Background(), &MyStream{}); err != nil {
        panic(err)
    }
}
```

Inbound messages use `engram.InboundMessage`. Call `Done()` after successful
handling or intentional drop so ordered / replay-capable transports can advance
their acknowledgement state.

For structured JSON streaming outputs, keep the canonical JSON bytes in
`Payload` and mirror the same bytes into `Binary` with
`MimeType: application/json`. Use raw `Binary` without `Payload` only for
opaque media or non-JSON blobs.

## Impulses (Triggers)

Impulses listen for external events and submit `StoryTrigger` requests. The
controller resolves each request to a `StoryRun` and records whether it was
created, reused, or rejected:

```go
import (
    "context"
    sdk "github.com/bubustack/bubu-sdk-go"
    "github.com/bubustack/bubu-sdk-go/engram"
    "github.com/bubustack/bubu-sdk-go/k8s"
)

type MyImpulse struct{}

func (i *MyImpulse) Init(ctx context.Context, config Config, secrets *engram.Secrets) error {
    return nil
}

func (i *MyImpulse) Run(ctx context.Context, client *k8s.Client) error {
    _, err := sdk.StartStoryWithToken(ctx, "my-story", "source-event-id-123", map[string]any{
        "key": "value",
    })
    return err
}

func main() {
    if err := sdk.RunImpulse[Config](context.Background(), &MyImpulse{}); err != nil {
        panic(err)
    }
}
```

`sdk.StartStory(...)` still returns the resolved `StoryRun`, but the durable
admission boundary is the `StoryTrigger` object.

Current runtime boundary:

- The SDK currently loads execution context, config, secrets, and transport
  descriptors from operator-injected environment variables.
- Mounted runtime bundles are planned as part of the roadmap's
  artifact-backed payload delivery work. Until that lands, treat the env var
  contract and `core/contracts` as the source of truth for runtime loading.

### Kubernetes RBAC for trigger helpers

The SDK trigger helpers use the `StoryTrigger` admission path, not direct
`StoryRun` creation.

Minimum permissions:

- `sdk.StartStory(...)` / `sdk.StartStoryWithToken(...)`:
  `storytriggers` `create`,`get` and `storyruns` `get`
- `sdk.StopStory(...)`:
  `storyruns` `get` and `storyruns/status` `patch`
- Impulse trigger metrics:
  `impulses` `get` and `impulses/status` `patch`

If you let the operator manage the Impulse runner identity, the generated
Role should cover this baseline. If you use a custom `serviceAccountName`, or
your component needs more than the baseline, extend it explicitly with
`execution.rbac.rules`. See [Managed Runner RBAC](../operator/runner-rbac.md).

## Secrets

```go
key, ok := secrets.Get("openai-api-key")
all := secrets.GetAll()                     // Returns a copy
names := secrets.Names()                    // Sorted key names
subset := secrets.Select("openai-api-key")  // Bounded plaintext selection
```

## Helper Functions

```go
sdk.StartStory(ctx, storyName, inputs)                  // Submit StoryTrigger, wait for StoryRun
sdk.StartStoryWithToken(ctx, storyName, token, inputs) // Deterministic trigger identity
sdk.StopStory(ctx, storyRunName)                        // Cancel a StoryRun
sdk.EmitSignal(ctx, key, payload)                       // Progress signal (bounded status payload)
sdk.RecordEffect(ctx, key, "succeeded", payload)        // Append StepRun effect summary
sdk.ExecuteEffectOnce(ctx, key, fn)                     // Reserve/renew/complete via EffectClaim
```

`ExecuteEffectOnce` now uses `EffectClaim` as the durable reservation authority.
`StepRun.status.effects` remains the append-only observability mirror.

## Testing

Use the testkit for local testing without Kubernetes:

```go
import "github.com/bubustack/bubu-sdk-go/testkit"

// Batch
h := testkit.BatchHarness[Config, Inputs]{
    Engram:  &MyEngram{},
    Config:  Config{Model: "gpt-4"},
    Inputs:  Inputs{Prompt: "hello"},
    Secrets: map[string]string{"api-key": "test"},
}
result, err := h.Run(context.Background())

// Streaming
sh := testkit.StreamHarness[Config]{
    Engram: &MyStream{},
    Config: Config{},
    Inputs: []engram.StreamMessage{{Payload: []byte("test")}},
}
outputs, err := sh.Run(context.Background())
```

## Version Compatibility

- SDK minor versions track the bobrapet operator minor stream.
- Upgrade the SDK when you upgrade the operator.
- Major releases may adjust the ABI.
- The current docs describe the latest-only trigger and effect contracts:
  `StoryTrigger` for durable trigger admission and `EffectClaim` for
  cross-process effect reservation.
- Future SDK work for mounted runtime bundles, CloudEvents-aligned trigger/hook
  envelopes, and additional language SDKs is tracked on the
  [Roadmap](../community/roadmap.md).

## Active Follow-on Work

The latest-only SDK contract is the supported path, but several hardening
tracks are still active before the ecosystem is considered settled:

- Trigger admission and runtime status-write scaling:
  [bubu-sdk-go#66](https://github.com/bubustack/bubu-sdk-go/issues/66),
  [bubu-sdk-go#67](https://github.com/bubustack/bubu-sdk-go/issues/67),
  [bubu-sdk-go#69](https://github.com/bubustack/bubu-sdk-go/issues/69), and
  [RFC #78](https://github.com/orgs/bubustack/discussions/78)
- Effect and signal durability:
  [bubu-sdk-go#68](https://github.com/bubustack/bubu-sdk-go/issues/68),
  [bubu-sdk-go#70](https://github.com/bubustack/bubu-sdk-go/issues/70),
  [bubu-sdk-go#71](https://github.com/bubustack/bubu-sdk-go/issues/71), and
  [RFC #76](https://github.com/orgs/bubustack/discussions/76)
- Streaming packet ABI consolidation:
  [bubu-sdk-go#72](https://github.com/bubustack/bubu-sdk-go/issues/72),
  [bubu-sdk-go#73](https://github.com/bubustack/bubu-sdk-go/issues/73),
  [bubu-sdk-go#74](https://github.com/bubustack/bubu-sdk-go/issues/74), and
  [RFC #77](https://github.com/orgs/bubustack/discussions/77)
- Mounted runtime bundles:
  [bobrapet#39](https://github.com/bubustack/bobrapet/issues/39)

Do not build new components against deprecated trigger, effect, or packet
shapes. The current docs describe only the latest supported contract.

## Next steps

- Follow the [Building Engrams](building-engrams.md) guide to publish your Engram.
- Browse sample Engrams in the [GitHub organization](https://github.com/bubustack).
- Browse [Engrams](https://github.com/orgs/bubustack/repositories?q=engram) and [Impulses](https://github.com/orgs/bubustack/repositories?q=impulse) on GitHub.
- File issues in the [`bubu-sdk-go` repository](https://github.com/bubustack/bubu-sdk-go/issues).
- See the [Roadmap](../community/roadmap.md) for planned SDK features (Python, TypeScript).
