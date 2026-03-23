---
title: Go SDK
sidebar_position: 1
description: Use the Bobrapet Go SDK to build Engrams that interact with Stories, StepRuns, and transport-aware control plane features.
---
# Go SDK

:::info Quick scan
- **Why**: Build Engrams in Go with first-class access to Bubustack inputs, outputs, and transport connections.
- **When**: Reach for the Go SDK when authoring Engrams that need production-grade telemetry and lifecycle management.
- **How**: Import the runtime package, bind inputs, report outputs, and take advantage of helpers for transports and testing.
:::

The Bobrapet Go SDK gives Engram authors a batteries-included toolkit for interacting with the
control plane. It handles configuration binding, status patching, telemetry, and transport-aware
connections so you can focus on business logic.

## Installation

```bash
go get github.com/bubustack/bobrapet-go-sdk@latest
```

Import the runtime package in your Engram entrypoint:

```go
import "github.com/bubustack/bobrapet-go-sdk/runtime"
```

## Runtime Entry Point

Wrap your logic with `runtime.Run`. It wires context cancellation, structured logging, and panic
recovery.

```go title="main.go"
runtime.Run(func(ctx context.Context, env *runtime.Environment) error {
	var cfg Config
	if err := env.BindInputs(&cfg); err != nil {
		return err
	}

	result, err := doWork(ctx, cfg)
	if err != nil {
		return err
	}

	return env.ReportOutputs(result)
})
```

- The context is canceled automatically if the StepRun is aborted or times out.
- Any returned error sets the StepRun status to `Failed` with the message.

## Working with Inputs

The SDK supports binding the Story's `with` payload onto struct types:

```go
type Config struct {
	ProjectID string   `json:"projectId"`
	Files     []string `json:"files"`
}

var cfg Config
if err := env.BindInputs(&cfg); err != nil {
	return err
}
```

You can also access raw JSON using `env.RawInputs()`.

## Reporting Outputs

Use `ReportOutputs` to attach structured data to the StepRun:

```go
if err := env.ReportOutputs(map[string]any{
	"status":   "ok",
	"duration": time.Since(start).Milliseconds(),
}); err != nil {
	return err
}
```

Outputs become available to downstream steps via `steps.<name>.outputs`.

### Custom Status Conditions

Report fine-grained status updates without finishing the step:

```go
env.SetCondition(runtime.Condition{
	Type:    "DownloadingDataset",
	Status:  runtime.ConditionTrue,
	Message: "Fetched 120MB",
})
```

Conditions show up under `status.conditions` on the StepRun resource.

## Artifacts and Logs

- `env.ReportArtifact(name, io.Reader)` uploads artifacts (e.g., JSON results) to the configured blob
  store.
- `env.Logger()` returns a structured logger with Story and Step context baked in.

```go
env.Logger().Infow("chunk processed", "chunk", idx, "size", size)
```

Log records include `storyRun`, `step`, and correlation IDs automatically.

## Transport Targets

For real-time meshes, Engrams running in `deployment` or `statefulset` mode receive transport
connection info:

```go
peers := env.Targets()
for _, target := range peers {
	conn, err := env.TransportConn(ctx, target)
	if err != nil {
		return err
	}
	client := pb.NewProcessorClient(conn)
	resp, err := client.Handle(ctx, payload)
	_ = resp
}
```

The SDK manages connection pooling, retries, and TLS settings for Bobravoz gRPC today, and will
abstract future transports as they are contributed.

### Streaming Context & Deadlines

Streaming Engrams no longer carry an implicit 30-second RPC deadline. The SDK constructs per-stream
contexts via `makeRPCContext`, which now defaults to `context.WithCancel` so long-lived connections
stay open indefinitely. If you need guard rails, set `BUBU_GRPC_STREAM_TIMEOUT` or
`BUBU_HUB_PER_MESSAGE_TIMEOUT` to a valid duration string (`5m`, `30s`, etc.) and the SDK will honor
the tighter deadline. A regression test asserts that the default context survives at least five
minutes without cancellation, so upgrades that reintroduce short deadlines will fail CI.

## Handling Secrets

The controller injects mounted secrets and config maps according to the Engram spec. Use the helper
to map them to files:

```go
path := env.SecretPath("openai-api")
key, err := os.ReadFile(filepath.Join(path, "api_key"))
```

## Testing Engrams

Use the `testruntime` package to simulate the environment without Kubernetes:

```go
import "github.com/bubustack/bobrapet-go-sdk/testruntime"

func TestEngram(t *testing.T) {
	tester := testruntime.New(testruntime.WithInputs(map[string]any{
		"projectId": "alpha",
	}))
	err := runtime.RunWith(tester, handler)
	require.NoError(t, err)
	assert.Equal(t, "alpha", tester.Output("projectId"))
}
```

## Version Compatibility

- The SDK follows semantic versioning. Minor releases are backward compatible.
- Supported Go versions: 1.22.x (minimum) and 1.23.x (preferred). The module declares `toolchain go1.23.3`, and CI exercises both minor streams. Older toolchains are not validated.
- SDK minor versions track the bobrapet operator minor stream. When you upgrade the operator, plan to consume the matching SDK minor within the same release train.
- Major releases may adjust the ABI; upgrade Stories and Engram templates accordingly.

:::note Community board
Python, TypeScript, and other SDK ideas adopt the same ABI contract. Track requests and volunteer to
help in the [community backlog](../community/roadmap.md) to influence prioritisation.
:::

## Additional Resources

- Browse sample Engrams in the [GitHub organization](https://github.com/bubustack).
- Read the [Engram Authoring Guide](../engrams/authoring.md) for an end-to-end tutorial.
- File issues or feature requests in the [`bobrapet` repository](https://github.com/bubustack/bobrapet/issues).

## Next steps

- Follow the [Engram Authoring Guide](../engrams/authoring.md) to publish your implementation.
- Review [Runtime configuration](/docs/reference/config) to understand injected environment variables.
- Join the SDK working group via [Community get-involved](../community/get-involved.md#working-groups).
