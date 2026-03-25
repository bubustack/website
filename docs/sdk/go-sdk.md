---
title: Go SDK
sidebar_position: 1
description: Build Engrams and Impulses with the BubuStack Go SDK.
---
# Go SDK

The Go SDK provides everything you need to build Engrams and Impulses that run
inside BubuStack workflows. It handles configuration binding, gRPC transport,
telemetry, and lifecycle management.

## Installation

```bash
go get github.com/bubustack/bubu-sdk-go@latest
```

Supported Go versions: **1.22+** (minimum), **1.23+** (preferred). The module
declares `toolchain go1.23.3`.

## Entry Points

The SDK provides three entry points depending on your workload type:

| Function | Mode | Workload | Description |
| --- | --- | --- | --- |
| `sdk.StartBatch[C, I](ctx, engram)` | Batch | Job | Runs once, returns result + exit code |
| `sdk.StartStreaming[C](ctx, engram)` | Streaming | Deployment | Long-lived gRPC server on port 50051 |
| `sdk.RunImpulse[C](ctx, impulse)` | Trigger | Deployment | Listens for events, creates StoryRuns |

## Batch Engrams

Implement the `BatchEngram` interface:

```go title="main.go"
package main

import (
    "context"
    "github.com/bubustack/bubu-sdk-go/sdk"
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
    return &engram.Result{
        Output: map[string]any{"status": "ok"},
    }, nil
}

func main() {
    sdk.StartBatch[Config, Inputs](context.Background(), &MyEngram{})
}
```

## Streaming Engrams

Implement the `StreamingEngram` interface for long-lived message processing:

```go title="main.go"
type MyStream struct{}

func (s *MyStream) Init(ctx context.Context, config Config, secrets *engram.Secrets) error {
    return nil
}

func (s *MyStream) Stream(ctx context.Context, in <-chan engram.StreamMessage, out chan<- engram.StreamMessage) error {
    for msg := range in {
        out <- engram.StreamMessage{Payload: msg.Payload}
    }
    return nil
}

func main() {
    sdk.StartStreaming[Config](context.Background(), &MyStream{})
}
```

## Impulses (Triggers)

Impulses listen for external events and create StoryRuns:

```go
type MyImpulse struct{}

func (i *MyImpulse) Init(ctx context.Context, config Config, secrets *engram.Secrets) error {
    return nil
}

func (i *MyImpulse) Run(ctx context.Context, client *k8s.Client) error {
    return sdk.StartStory(ctx, "my-story", map[string]any{"key": "value"})
}

func main() {
    sdk.RunImpulse[Config](context.Background(), &MyImpulse{})
}
```

## Secrets

```go
key, ok := secrets.Get("openai-api-key")
all := secrets.GetAll()                    // Values redacted in logs
raw := secrets.Raw()                       // Unredacted — use carefully
```

## Helper Functions

```go
sdk.StartStory(ctx, storyName, inputs)                 // Trigger a StoryRun
sdk.StartStoryWithToken(ctx, storyName, token, inputs)  // Idempotent trigger
sdk.StopStory(ctx, storyRunName)                        // Cancel a StoryRun
sdk.EmitSignal(ctx, key, payload)                       // Progress signal (max 8 KiB)
sdk.RecordEffect(ctx, key, payload)                     // Track side effects
sdk.ExecuteEffectOnce(ctx, key, fn)                     // Dedupe side effects
```

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

## Next steps

- Follow the [Building Engrams](building-engrams.md) guide to publish your Engram.
- Browse sample Engrams in the [GitHub organization](https://github.com/bubustack).
- Browse [Engrams](https://github.com/orgs/bubustack/repositories?q=engram) and [Impulses](https://github.com/orgs/bubustack/repositories?q=impulse) on GitHub.
- File issues in the [`bubu-sdk-go` repository](https://github.com/bubustack/bubu-sdk-go/issues).
- See the [Roadmap](../community/roadmap.md) for planned SDK features (Python, TypeScript).
