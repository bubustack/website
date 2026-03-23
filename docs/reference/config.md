---
id: reference-config
title: Runtime Configuration
sidebar_position: 3
description: Environment variables and configuration knobs exposed to Engrams and Impulses via the Bubustack SDKs.
slug: /reference/config
---

# Runtime Configuration

:::info Quick scan
- **Why**: Understand the environment variables the Bobrapet operator injects into Engrams and Impulses.
- **When**: Reference this table when wiring configuration or investigating runtime behaviour.
- **How**: Apply overrides declaratively, track precedence, and confirm via telemetry.
:::

The Bubustack SDKs rely on environment variables injected by the Bobrapet operator. This reference
lists the key knobs, grouped by responsibility. Values can be supplied via Engram templates, Secrets,
or runtime annotations. Configuration precedence is:

1. SDK defaults  
2. `BUBU_CONFIG` JSON blob  
3. `BUBU_CONFIG_*` overrides (highest priority)

## Core Execution

| Variable | Description | Default |
| --- | --- | --- |
| `BUBU_EXECUTION_MODE` | `batch` or `streaming`; derived from Engram mode. | `batch` |
| `BUBU_CONFIG` | JSON string with configuration payload. | `{}` |
| `BUBU_CONFIG_*` | Key-specific overrides (e.g., `BUBU_CONFIG_MODEL=t5`). | unset |
| `BUBU_INPUTS` | Resolved Story inputs for the step. | `{}` |
| `BUBU_MANIFEST_SPEC` | JSON array of manifest requests that tells the SDK which output metadata to compute (mirrors `StepRun.spec.requestedManifest`). | unset |
| `BUBU_STEP_TIMEOUT` | Per-step timeout; overrides Story rollout defaults. | Operator default (`30m`). |

## Story & Step Context

| Variable | Description |
| --- | --- |
| `BUBU_STORY_NAME` — Story name |
| `BUBU_STORYRUN_ID` — StoryRun identifier |
| `BUBU_STEP_NAME` — Step name inside the Story |
| `BUBU_STEPRUN_NAME` — StepRun resource name |
| `BUBU_STEPRUN_NAMESPACE` — Namespace for the StepRun (batch) |
| `BUBU_POD_NAMESPACE` — Namespace for the running pod (streaming) |
| `BUBU_STARTED_AT` — RFC3339 timestamp when execution began |

Use these to enrich logs, metrics, and telemetry emitted by Engrams.

## Story Triggering

| Variable | Description | Default |
| --- | --- | --- |
| `BUBU_TRIGGER_TOKEN` | Optional idempotency token supplied by the operator; when present the SDK derives a deterministic StoryRun name so retries de-duplicate instead of creating new runs. | unset |

## Secrets

- `BUBU_SECRET_*` variables map to Kubernetes Secrets mounted into the Engram container. Use the SDK
  helpers (e.g., `env.SecretPath("openai")`) instead of referencing the environment variables
  directly—this preserves portability across transports and execution modes.

## Storage Offloading

| Variable | Description | Default |
| --- | --- | --- |
| `BUBU_STORAGE_PROVIDER` | `s3`, `file`, or unset (inline). | unset |
| `BUBU_MAX_INLINE_SIZE` | Byte threshold before payloads are offloaded. | `1024` |
| `BUBU_MAX_RECURSION_DEPTH` | Maximum depth when traversing payloads during hydrate/dehydrate (guards against malicious nesting). | `10` |
| `BUBU_STORAGE_TIMEOUT` | Timeout for storage operations. | `300s` |
| `BUBU_S3_BUCKET` <br/><small>(legacy `BUBU_STORAGE_S3_BUCKET`)</small> | Target bucket name. | — |
| `BUBU_S3_ENDPOINT` <br/><small>(legacy `BUBU_STORAGE_S3_ENDPOINT`)</small> | S3-compatible endpoint for self-hosted stores (MinIO, Ceph, etc.). | — |
| `BUBU_S3_REGION` <br/><small>(legacy `BUBU_STORAGE_S3_REGION`)</small> | AWS region when using S3 proper. | `us-east-1` |
| `BUBU_S3_FORCE_PATH_STYLE` <br/><small>(legacy `BUBU_STORAGE_S3_USE_PATH_STYLE`)</small> | Force path-style URLs (required for many on-prem deployments). | Auto-detect |
| `BUBU_S3_TIMEOUT` <br/><small>(legacy `BUBU_STORAGE_S3_TIMEOUT`, `BUBU_STORAGE_S3_HTTP_TIMEOUT`)</small> | Timeout for S3 API calls. | `300s` |
| `BUBU_S3_MAX_PART_SIZE` <br/><small>(legacy `BUBU_STORAGE_S3_PART_SIZE`)</small> | Multipart upload part size (bytes). | `5 MiB` |
| `BUBU_S3_CONCURRENCY` <br/><small>(legacy `BUBU_STORAGE_S3_CONCURRENCY`)</small> | Parallel multipart upload workers. | `5` |
| `BUBU_S3_MAX_RETRIES` <br/><small>(legacy `BUBU_STORAGE_S3_MAX_RETRIES`)</small> | Client retry attempts for S3 operations. | `3` |
| `BUBU_S3_MAX_BACKOFF` <br/><small>(legacy `BUBU_STORAGE_S3_MAX_BACKOFF`)</small> | Maximum backoff between S3 retries. | `10s` |
| `BUBU_S3_SSE` / `BUBU_S3_SSE_KMS_KEY` <br/><small>(legacy `BUBU_STORAGE_S3_SSE`, `BUBU_STORAGE_S3_SSE_KMS_KEY_ID`)</small> | Optional server-side encryption mode and KMS key. | unset |

:::tip Migration
The SDK continues to honour the legacy `BUBU_STORAGE_S3_*` variables for backward compatibility, but new deployments should prefer the `BUBU_S3_*` names to stay aligned with the operator defaults.
:::
| `BUBU_STORAGE_PATH` | Base path for file-backed storage. | Required for `file`. |
| `BUBU_STORAGE_OUTPUT_PREFIX` | Output object prefix. | `outputs` |
| `BUBU_STORAGE_INPUT_PREFIX` | Input object prefix. | `inputs` |

## gRPC (Server) — Long-lived Engrams

| Variable | Description | Default |
| --- | --- | --- |
| `BUBU_GRPC_PORT` | Server port. | `9000` |
| `BUBU_SDK_CHANNEL_BUFFER_SIZE` <br/><small>(legacy `BUBU_GRPC_CHANNEL_BUFFER_SIZE`)</small> | In/out channel buffer. | `16` |
| `BUBU_SDK_HEARTBEAT_INTERVAL` <br/><small>(legacy `BUBU_GRPC_HEARTBEAT_INTERVAL`)</small> | Heartbeat cadence. | `10s` |
| `BUBU_SDK_HANG_TIMEOUT` <br/><small>(legacy `BUBU_GRPC_HANG_TIMEOUT`)</small> | Detect stale peers. | `30s` |
| `BUBU_SDK_GRACEFUL_SHUTDOWN_TIMEOUT` <br/><small>(legacy `BUBU_GRPC_GRACEFUL_SHUTDOWN_TIMEOUT`)</small> | Drain window before shutdown. | `20s` |
| `BUBU_SDK_MAX_RECV_BYTES` <br/><small>(legacy `BUBU_GRPC_MAX_RECV_BYTES`)</small> | Max inbound message size. | `10 MiB` |
| `BUBU_SDK_MAX_SEND_BYTES` <br/><small>(legacy `BUBU_GRPC_MAX_SEND_BYTES`)</small> | Max outbound message size. | `10 MiB` |
| `BUBU_GRPC_TLS_CERT_FILE` / `KEY_FILE` / `CA_FILE` | TLS material for mTLS. | Auto-generated when unset. |

## gRPC (Client) — SDK Internal

| Variable | Description | Default |
| --- | --- | --- |
| `BUBU_SDK_DIAL_TIMEOUT` <br/><small>(legacy `BUBU_GRPC_DIAL_TIMEOUT`)</small> | Connection timeout. | `10s` |
| `BUBU_SDK_MAX_RECV_BYTES` <br/><small>(legacy `BUBU_GRPC_CLIENT_MAX_RECV_BYTES`)</small> | Max inbound message size (client). | `10 MiB` |
| `BUBU_SDK_MAX_SEND_BYTES` <br/><small>(legacy `BUBU_GRPC_CLIENT_MAX_SEND_BYTES`)</small> | Max outbound message size (client). | `10 MiB` |
| `BUBU_SDK_CHANNEL_SEND_TIMEOUT` <br/><small>(legacy `BUBU_GRPC_CHANNEL_SEND_TIMEOUT`)</small> | Deadline when backpressured. | `30s` |
| `BUBU_SDK_MESSAGE_TIMEOUT` <br/><small>(legacy `BUBU_GRPC_MESSAGE_TIMEOUT`)</small> | Per-message send/receive deadline. | `30s` |
| `BUBU_SDK_RECONNECT_BASE_BACKOFF` <br/><small>(legacy `BUBU_GRPC_RECONNECT_BASE_BACKOFF`)</small> | Minimum reconnect delay. | `500ms` |
| `BUBU_SDK_RECONNECT_MAX_BACKOFF` <br/><small>(legacy `BUBU_GRPC_RECONNECT_MAX_BACKOFF`)</small> | Maximum reconnect delay. | `30s` |
| `BUBU_SDK_RECONNECT_MAX_RETRIES` <br/><small>(legacy `BUBU_GRPC_RECONNECT_MAX_RETRIES`)</small> | Retry attempts before surfacing an error. | `10` |
| `BUBU_SDK_CLIENT_BUFFER_MAX_MESSAGES` <br/><small>(legacy `BUBU_GRPC_CLIENT_BUFFER_MAX_MESSAGES`)</small> | Max buffered messages retained across reconnects. | `100` |
| `BUBU_SDK_CLIENT_BUFFER_MAX_BYTES` <br/><small>(legacy `BUBU_GRPC_CLIENT_BUFFER_MAX_BYTES`)</small> | Max total bytes buffered across reconnects. | `10 MiB` |
| `BUBU_GRPC_CLIENT_TLS` | Enable TLS using system CAs. | `false` |
| `BUBU_GRPC_CLIENT_CERT_FILE` / `CLIENT_KEY_FILE` | Client certs for mTLS. | unset |
| `BUBU_GRPC_REQUIRE_TLS` | Fail if the hub presents plaintext. | `false` |
| `BUBU_GRPC_ALLOW_INSECURE` | Opt-in to plaintext dials (set only for trusted local setups). | `false` |
| `BUBU_GRPC_STREAM_TIMEOUT` | Optional per-stream deadline. | unset |

## Hybrid Batch ↔ Stream Bridge

| Variable | Description | Default |
| --- | --- | --- |
| `BUBU_HYBRID_BRIDGE` | Send batch outputs to the transport hub after success. | `true` |
| `BUBU_HYBRID_BRIDGE_TIMEOUT` | Time budget for the bridge send. | `15s` |
| `DOWNSTREAM_HOST` / `UPSTREAM_HOST` | Override hub endpoints when running locally. | unset |

## Impulses

| Variable | Description |
| --- | --- |
| `BUBU_IMPULSE_WITH` | JSON snippet merged into `BUBU_CONFIG` before unmarshalling the impulse config (handy for operator-driven overrides). |
| `BUBU_TARGET_STORY_NAMESPACE` | Highest-precedence namespace override when an impulse triggers a Story. |
| `BUBU_TARGET_STORY_NAME` | Target Story name. |
| `BUBU_IMPULSE_NAMESPACE` | Namespace where the impulse lives; used when per-story overrides are absent. |

### Namespace resolution precedence

When the SDK constructs Kubernetes clients (for impulses or Story runs) it evaluates namespaces in this order:

1. `BUBU_TARGET_STORY_NAMESPACE`
2. `BUBU_IMPULSE_NAMESPACE`
3. `BUBU_STEPRUN_NAMESPACE`
4. `BUBU_POD_NAMESPACE`
5. `POD_NAMESPACE` (from the Downward API)
6. Fallback `default`

Documenting the precedence makes it clear which party (operator vs. impulse author) wins when multiple overrides are present.

## Observability

| Variable | Description | Default |
| --- | --- | --- |
| `BUBU_SDK_METRICS_ENABLED` | Toggles SDK metric emission; when `false` the SDK registers no-op meters but keeps the API safe to call. | `true` |
| `BUBU_SDK_TRACING_ENABLED` | Toggles SDK span emission; when `false` the SDK falls back to noop tracers. | `true` |

## Kubernetes Client (SDK Internal)

| Variable | Description | Default |
| --- | --- | --- |
| `BUBU_K8S_QPS` / `BUBU_K8S_BURST` | Rate limits for the Kubernetes client. | `20` / `40` |
| `BUBU_K8S_TIMEOUT` | Timeout per API request. | `30s` |
| `BUBU_K8S_OPERATION_TIMEOUT` | Deadline for complex operations (patching, watch). | `30s` |
| `BUBU_K8S_PATCH_MAX_RETRIES` | Conflict retry count when updating StepRuns. | `5` |
| `BUBU_K8S_USER_AGENT` | Custom user agent string. | `bubu-sdk-go` |

## Next steps

- Visit the [Go SDK documentation](../sdk/go-sdk.md) for helper usage.
- Review [CRD fields](crds.md) to see where these variables originate.
- Tune transport-level metrics in [Bobravoz operations](../transports/bobravoz.md).
