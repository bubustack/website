---
id: sdk-streaming-observability
title: Streaming Observability
sidebar_position: 3
description: Capture metrics and traces from gRPC streaming engrams with the built-in SDK hooks.
slug: /sdk/streaming-observability
---

# Streaming Observability

The Go SDK instruments every gRPC streaming session so you can confirm throughput,
diagnose reconnection storms, and spot backpressure before buffers overflow.
Use the metrics and tracing hooks below to wire the SDK into your dashboards.

## Prometheus Metrics

The SDK exports OpenTelemetry metrics by default. Configure an OTLP exporter (or
Prometheus bridge) in your application and scrape the following series:

| Metric | Labels | Description |
| --- | --- | --- |
| `bubu.stream.messages_total` | `direction` (`sent`/`received`) | Total messages processed via the client helper. |
| `bubu.stream.client_buffer.added_total` | `reason` | Messages buffered because a send failed. |
| `bubu.stream.client_buffer.dropped_total` | `reason` (`oversize`, `buffer_full`) | Drops caused by bounded retry buffers. |
| `bubu.stream.client_buffer.flushed_total` | _none_ | Buffered messages successfully retried after reconnect. |
| `bubu.stream.client_buffer.current_size` | _gauge_ | Current buffered message count. |
| `bubu.stream.client_buffer.current_bytes` | _gauge_ | Total buffered payload bytes. |
| `bubu.stream.reconnect.attempts_total` | `reason` | Automatic reconnect attempts. |
| `bubu.stream.reconnect.failures_total` | `reason` | Terminal reconnect failures (no more retries). |
| `bubu.stream.backpressure.timeouts_total` | `stage` (`client_receiver`, `server_reader`) | Timeouts delivering messages to the caller when the downstream channel is blocked. |

### Dashboards

- **Reconnect health**: chart `rate(bubu.stream.reconnect.attempts_total[5m])` by `reason`.
- **Backpressure**: alert on `increase(bubu.stream.backpressure.timeouts_total[1m]) > 0`.
- **Buffered payloads**: track `bubu.stream.client_buffer.current_bytes` with burn-rate alerts when it trends upward.

## Tracing

`StreamToWithMetadata` starts a span named `sdk.stream.StreamToWithMetadata`. The span includes the
following attributes for correlation with Story and Step metadata:

| Attribute | Example | Notes |
| --- | --- | --- |
| `grpc.target` | `bobravoz-grpc-hub.default.svc.cluster.local:9000` | Final downstream address. |
| `bubu.story.name` | `daily-etl` | Story owning the StepRun. |
| `bubu.storyrun.id` | `daily-etl-20241025` | StoryRun identifier. |
| `bubu.step.name` | `materialize` | Step identifier within the Story. |
| `bubu.steprun.name` | `daily-etl-materialize-abc123` | StepRun name used for status updates. |
| `bubu.steprun.namespace` | `etl-prod` | Namespace for the StepRun resource. |

Span events are emitted for each reconnect attempt:

- `stream.attempt` / `stream.attempt.success` / `stream.attempt.failure`
- `stream.retry.scheduled` (with failure reason and gRPC status)
- `stream.retry.exhausted` when retries are out of budget
- `stream.backpressure.timeout` when the SDK has to drop a message because the caller did not drain the channel in time

Forward these spans to your tracing backend (Jaeger, Tempo, Honeycomb, etc.) by configuring any
OpenTelemetry exporter before calling `sdk.StartStreaming` or `sdk.StreamTo`.

## Integration Checklist

1. Initialise an OpenTelemetry SDK exporter (OTLP/HTTP or OTLP/gRPC) in your Engram binary.
2. Register Prometheus or OTLP metric readers for the application.
3. Point your dashboards at the metric families above and add alerts for reconnect spikes and backpressure timeouts.
4. Correlate spans using the Story and Step attributes when drilling into failures.

See [`pkg/metrics`](https://pkg.go.dev/github.com/bubustack/bubu-sdk-go/pkg/metrics) and
[`stream.go`](https://pkg.go.dev/github.com/bubustack/bubu-sdk-go#section-sourcefile-stream.go)
for the latest instrumentation hooks.
