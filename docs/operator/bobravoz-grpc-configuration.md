---
title: Bobravoz gRPC Configuration
description: Bobravoz gRPC operator ConfigMap keys, defaults, and runtime precedence.
---
# Bobravoz gRPC Configuration

This page documents the operator configuration consumed by
[`bobravoz-grpc`](https://github.com/bubustack/bobravoz-grpc), the streaming
transport operator that manages the gRPC hub, connector injection, and
streaming topology runtime.

## Who this is for

- Platform engineers operating the Bobravoz gRPC transport stack.
- Operators tuning hub buffering, connector image defaults, or transport-side
  templating.

## What you'll get

- Where Bobravoz gRPC configuration lives.
- Which settings come from the ConfigMap versus deployment flags.
- The supported keys and shipped defaults.

Bobravoz gRPC is configured separately from the main Bobrapet operator. If you
need the workflow-controller settings, see
[Operator Configuration](configuration.md).

---

## Config source

The operator reads configuration from a Kubernetes `ConfigMap`. The manager
uses these process flags to locate it:

```text
--config-name=<helm-release>-bobravoz-grpc-operator-config
--config-namespace=<helm release namespace>
```

The raw binary defaults are `--config-name=bobravoz-grpc-operator-config` and
`--config-namespace=bobrapet-system`, but the Helm chart rewrites them to the
release-scoped ConfigMap in the release namespace.

The defaults below describe the shipped ConfigMap and Helm values in this
repository. If the ConfigMap is missing or cannot be loaded, Bobravoz gRPC
falls back to its in-process defaults from
`internal/config/operator_config.go`. One important divergence today:
`templating.evaluation-timeout` ships as `5s` in manifests, but the in-process
fallback remains `30s` when the ConfigMap is missing.

## Precedence

Explicit deployment flags and manager environment variables win over ConfigMap
values.

1. Manager flags and explicit manager environment variables.
2. Operator ConfigMap values.
3. In-process defaults.

This matters most for connector image settings: changing only the ConfigMap
does not override an image value already pinned on the Deployment.

---

## Hub

| Key | Default | Purpose |
| --- | --- | --- |
| `hub.transport-security-mode` | `tls` | Transport security mode for hub and connector traffic. `tls` is the only supported latest-contract value, and unsupported values are rejected at startup. |
| `hub.buffer-max-messages` | `1000` | Maximum buffered messages per stream. |
| `hub.buffer-max-bytes` | `10485760` | Maximum buffered bytes per stream (10 MiB). |
| `hub.buffer-eviction-ttl` | `10m` | Age after which buffered messages can be evicted. |
| `hub.buffer-eviction-interval` | `1m` | Interval between eviction sweeps. |
| `hub.channel-buffer-size` | `100` | Go channel buffer size used in stream processing. |
| `hub.per-message-timeout` | `10m` | Timeout for delivering a single message through the hub. |
| `hub.max-active-streams` | `2000` | Maximum concurrent active streams across the hub. |
| `hub.max-buffers` | `1000` | Maximum number of stream buffers held at once. |
| `hub.max-downstreams-hard-cap` | `64` | Hard cap on downstream fan-out per stream. |

## Connector

| Key | Default | Purpose |
| --- | --- | --- |
| `connector.image` | `ghcr.io/bubustack/bobravoz-grpc-connector:<chart appVersion>` | Connector sidecar image injected into streaming step pods. |
| `connector.image-pull-policy` | `IfNotPresent` | Image pull policy for injected connector sidecars. |

Deployment flags and explicit manager environment variables take precedence
over ConfigMap values for connector image settings. The checked-in Kustomize
and Helm deployments set initial `CONNECTOR_IMAGE` and
`CONNECTOR_IMAGE_PULL_POLICY` values on the manager Deployment, so update those
when you want a rollout to take effect immediately.

## Templating

| Key | Default | Purpose |
| --- | --- | --- |
| `templating.evaluation-timeout` | `5s` | Timeout for hub-side template evaluation. |
| `templating.max-output-bytes` | `65536` | Maximum evaluated output size. |
| `templating.deterministic` | `false` | Restricts non-deterministic template helpers. |
| `templating.offloaded-data-policy` | `error` | How hub-side template evaluation handles offloaded data references. |
| `templating.materialize-engram` | `bubu-materialize` | Engram used when pod-based materialization is required. |

## Telemetry

| Key | Default | Purpose |
| --- | --- | --- |
| `telemetry.trace-propagation` | `true` | Propagate OTEL trace context through hub and connector message paths. |

---

## Practical guidance

- Keep `hub.transport-security-mode` on `tls`. The supported contract is
  latest-only; do not rely on legacy plaintext settings.
- Treat connector image values as deployment-level settings. If the manager
  Deployment pins the image, update the Deployment as well as the ConfigMap.
- If `bobrapet` was installed with a non-default Helm release name, set
  `sharedCAIssuerName` when installing the Bobravoz chart so cert issuance
  points at the correct shared `ClusterIssuer`.
- Use tight buffer limits in shared clusters to prevent one realtime workload
  from consuming the entire hub.
- Revisit `hub.max-downstreams-hard-cap` before enabling wide fan-out topologies.

## Active hardening tracks

These published items are the current Bobravoz follow-on queue for the
latest-only transport contract:

- [bobravoz-grpc#44](https://github.com/bubustack/bobravoz-grpc/issues/44) for SAN-to-namespace and step identity binding on hub streams
- [bobravoz-grpc#45](https://github.com/bubustack/bobravoz-grpc/issues/45) for superseded-connector fencing after cutover
- [bobravoz-grpc#46](https://github.com/bubustack/bobravoz-grpc/issues/46) for aligning default hub buffer limits with the manager memory budget
- [bobravoz-grpc#47](https://github.com/bubustack/bobravoz-grpc/issues/47) for replacing batch and substory completion polling with watch-driven tracking
- [bobravoz-grpc#48](https://github.com/bubustack/bobravoz-grpc/issues/48) for reducing default telemetry cardinality on hot metrics
- [bobravoz-grpc#49](https://github.com/bubustack/bobravoz-grpc/issues/49) for deriving P2P endpoints from workload naming, domain, and port
- [bobravoz-grpc#50](https://github.com/bubustack/bobravoz-grpc/issues/50) for fail-closed admission availability posture
- [bobravoz-grpc#52](https://github.com/bubustack/bobravoz-grpc/issues/52) for concurrent buffer flush stabilization
- [RFC #77](https://github.com/orgs/bubustack/discussions/77) for canonical streaming ABI changes shared with `tractatus` and the Go SDK
- [RFC #78](https://github.com/orgs/bubustack/discussions/78) for telemetry and status-write offload decisions shared with the rest of the ecosystem

## Related docs

- [Operator Configuration](configuration.md)
- [Transport Streaming Settings](../streaming/transport-settings.md)
- [Streaming Contract](../streaming/streaming-contract.md)
- [Architecture](../overview/architecture.md)
