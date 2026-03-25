---
title: Observability Runbook
description: Incident-oriented checks for common workflow and streaming failures.
---
# Observability Runbook

Use this page when a workflow or streaming pipeline behaves unexpectedly in production.

## If StoryRun is stuck in `Pending`

1. Check controller logs for reconcile errors.
2. Verify queue and concurrency limits in [Operator Configuration](../operator/configuration.md).
3. Verify referenced Story, Engram, and Impulse resources exist and pass validation.

## If traces are missing

1. Confirm `telemetry.enabled` in operator config.
2. Confirm `OTEL_EXPORTER_OTLP_ENDPOINT` and exporter settings on the controller deployment.
3. Verify collector reachability from cluster workloads.

## If streaming packets are dropped

1. Check buffer and drop metrics (hub/connector metrics in observability docs).
2. Review `flowControl`, buffer caps, and replay settings in [Transport Settings](../streaming/transport-settings.md).
3. Inspect connector reconnect behavior and hub health.

## If retries keep looping

1. Inspect `StepRun.status.error.exitClass` and `retryable` values.
2. Compare Step retry policy with Job backoff limits.
3. Confirm idempotency key and effect-ledger usage for external side effects.

## Related docs

- [Observability and Debugging](overview.md)
- [Run Lifecycle Contract](../runtime/lifecycle.md)
- [Structured Errors](../api/errors.md)
- [Transport Streaming Settings](../streaming/transport-settings.md)
