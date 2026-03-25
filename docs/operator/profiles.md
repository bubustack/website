---
title: Operator Profiles
description: Recommended baseline configuration profiles for dev and production setups.
---
# Operator Profiles

Use these profiles as starting points, then tune with your workload and cluster limits.

## small-dev

Best for local clusters and low traffic.

- Keep reconcile concurrency low.
- Keep retry limits conservative.
- Use minimal resource requests.

## balanced-prod

Best for general production workloads.

- Moderate reconcile concurrency.
- Telemetry enabled for traces and metrics.
- Explicit queue settings for predictable scheduling.

## high-throughput-streaming

Best for sustained streaming workloads.

- Higher worker counts.
- Tuned transport buffer and flow-control settings.
- Explicit replay and backpressure policies.

## Next steps

- Start from [Operator Configuration](configuration.md) for exact keys and defaults.
- Validate changes with `npm run build` and staging cluster smoke tests.
