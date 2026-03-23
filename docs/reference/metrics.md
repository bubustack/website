---
id: reference-metrics
title: Metrics Reference
sidebar_position: 4
description: Prometheus metrics emitted by Bobrapet and Bobravoz to help you monitor Stories, StepRuns, and transports.
slug: /reference/metrics
---
# Metrics Reference

:::info Quick scan
- **Why**: Instrument Bubustack controllers and transports with the right Prometheus metrics.
- **When**: Consult this map while building dashboards or alerting for StoryRuns and transports.
- **How**: Scrape the controller and hub endpoints, then apply the recommended alert formulas.
:::

Bobrapet and Bobravoz expose Prometheus metrics to make Story performance and transport health
observable. Scrape them with Prometheus, Mimir, Datadog Agent, or your preferred collector.

## Controller Metrics (Bobrapet)

| Metric | Labels | Description |
| --- | --- | --- |
| `bobrapet_storyruns_total` | `namespace`, `story`, `phase` | Total StoryRuns processed by phase. |
| `bobrapet_storyrun_duration_seconds` | `namespace`, `story`, `phase` | Histogram of overall StoryRun duration. |
| `bobrapet_storyrun_steps_active` | `namespace`, `story` | Gauge of currently running steps. |
| `bobrapet_stepruns_total` | `namespace`, `engram`, `phase` | Total StepRuns, grouped by Engram and phase. |
| `bobrapet_steprun_duration_seconds` | `namespace`, `engram`, `phase` | Histogram of StepRun execution latency. |
| `bobrapet_steprun_retries_total` | `namespace`, `engram`, `reason` | Retry counts per reason (`Backoff`, `DeadlineExceeded`, etc.). |
| `bobrapet_controller_reconcile_total` | `controller`, `result` | Reconciliation outcomes for each controller. |
| `bobrapet_controller_reconcile_duration_seconds` | `controller` | Histogram of reconciliation latency. |
| `bobrapet_cel_evaluation_total` | `expression_type`, `result` | Count of CEL expressions evaluated and their outcomes. |
| `bobrapet_cel_evaluation_duration_seconds` | `expression_type` | Histogram for CEL evaluation time. |
| `bobrapet_resource_cleanup_total` | `resource_type`, `result` | Garbage collection for completed StepRuns and Jobs. |

Access these metrics via the controller’s metrics Service (default HTTPS on `:8443`). The Helm and
Kustomize bundles ship with a `ServiceMonitor` manifest ready for Prometheus Operator.

## Transport Metrics (Bobravoz gRPC)

| Metric | Labels | Description |
| --- | --- | --- |
| `bobravoz_streams_inflight` | `story`, `step` | Number of active streams per step. |
| `bobravoz_messages_sent_total` | `storyrun`, `step` | Messages emitted downstream. |
| `bobravoz_messages_received_total` | `storyrun`, `step` | Messages accepted from upstream. |
| `bobravoz_stream_latency_seconds` | `storyrun`, `step` | Histogram from ingress to egress through the hub. |
| `bobravoz_backpressure_events_total` | `storyrun`, `step` | Count of backpressure signals triggered. |
| `bobravoz_hub_messages_dropped_total` | `storyrun`, `step`, `reason` | Dropped messages (validation, timeout, etc.). |
| `bobravoz_stream_reconnects_total` | `storyrun`, `step` | Number of reconnection attempts for a stream. |
| `bobravoz_grpc_request_duration_seconds` | `method` | Histogram of hub API latency. |
| `bobravoz_grpc_requests_total` | `method`, `code` | Request counts by gRPC method/result code. |

Scrape the hub Deployment on port `9090` (HTTP). For multi-tenant environments, annotate the
Deployment with your monitoring label selectors.

## SDK Runtime Metrics (Go)

| Metric | Labels | Description |
| --- | --- | --- |
| `bubu.stream.messages_total` | `direction` (`sent`, `received`) | Total stream messages processed by the SDK client helper. |
| `bubu.stream.client_buffer.added_total` | `reason` | Messages buffered due to transient send failures. |
| `bubu.stream.client_buffer.dropped_total` | `reason` (`oversize`, `buffer_full`) | Buffered messages dropped after exceeding bounds. |
| `bubu.stream.client_buffer.flushed_total` | _none_ | Buffered messages successfully replayed after reconnect. |
| `bubu.stream.client_buffer.current_size` | _gauge_ | Current number of messages in the retry buffer. |
| `bubu.stream.client_buffer.current_bytes` | _gauge_ | Approximate size of buffered payloads. |
| `bubu.stream.reconnect.attempts_total` | `reason` | Automatic reconnect attempts initiated by the SDK. |
| `bubu.stream.reconnect.failures_total` | `reason` | Terminal reconnect failures (retry budget exhausted). |
| `bubu.stream.backpressure.timeouts_total` | `stage` (`client_receiver`, `server_reader`) | Timeouts delivering messages to callers because output channels were not drained. |

Export these metrics with any OpenTelemetry SDK exporter. Combine them with the hub metrics above
to differentiate hub-side congestion from client-side backpressure.

## Recommended Alerts

- StoryRun backlog: `max(bobrapet_storyrun_steps_active) > threshold`.
- Step retries: `rate(bobrapet_steprun_retries_total[5m])` spikes.
- Transport drops: `increase(bobravoz_hub_messages_dropped_total[5m]) > 0`.
- Hub saturation: `bobravoz_streams_inflight` near capacity (inform HPA decisions).

## Access Control

Metrics endpoints respect Kubernetes RBAC. Grant your Prometheus ServiceAccount permissions by
binding the provided ClusterRole or use the ServiceMonitor with TLS credentials generated by
cert-manager.

## Next steps

- Revisit [Day-2 Operations](../operator/day-two-operations.md) for ongoing runbooks.
- Configure transport tuning via the [Bobravoz guide](../transports/bobravoz.md).
- Feed metrics into community dashboards shared in [Community support](../community/support.md).
