---
id: sdk-storage-offloading
title: Storage Offloading
description: Understand when the Go SDK hydrates or dehydrates payloads, how to configure storage backends, and what failure signals to expect.
sidebar_position: 3.5
slug: /sdk/storage-offloading
---

# Storage Offloading

The Go SDK automatically decides when to keep payloads inline and when to place them in external
storage so that StepRuns stay small and Kubernetes remains responsive. This guide explains what the
runtime does under the hood and how to tune it for your platform.

## Inline vs. external payloads

- **Inline** – Structures under **1 KiB** (the `DefaultMaxInlineSize`) are kept directly on the
  StepRun so CEL expressions and quick inspections remain fast.
- **External** – Larger objects are written to the configured storage backend and replaced with
  `$bubuStorageRef` pointers (see `storage/manager.go:24`).
- **Hydration** – Before your Engram’s `Process` method runs, the SDK resolves any storage
  references back into the original structure (`storage/manager.go:200`).
- **Dehydration** – After `Process` returns, outputs are inspected and offloaded when they cross the
  threshold (`storage/manager.go:275`).

The inline limit is controllable through `BUBU_MAX_INLINE_SIZE`; setting it higher increases API
server pressure while setting it lower pushes more traffic through your storage backend.

## Configuring storage

Set `BUBU_STORAGE_PROVIDER` to select a backend:

| Provider | Key variables | Notes |
| --- | --- | --- |
| `s3` | `BUBU_S3_BUCKET`, `BUBU_S3_REGION`, `BUBU_S3_ENDPOINT`, `BUBU_S3_FORCE_PATH_STYLE` <br/><small>(legacy `BUBU_STORAGE_S3_*` aliases still recognised)</small> | Retries, multipart uploads, and SSE defaults are handled automatically (`storage/s3_store.go`). |
| `file` | `BUBU_STORAGE_PATH` | Useful for local development or single-node clusters. |
| unset / `none` | — | Everything remains inline; payloads larger than the inline limit cause StepRun failures. |

Fine-tune S3 behaviour with `BUBU_S3_TIMEOUT`, `BUBU_S3_MAX_PART_SIZE`, `BUBU_S3_CONCURRENCY`, `BUBU_S3_MAX_RETRIES`, and `BUBU_S3_SSE(_KMS_KEY)`. Each has a legacy `BUBU_STORAGE_S3_*` alias for older manifests.

Timeouts (`BUBU_STORAGE_TIMEOUT`) and prefixes (`BUBU_STORAGE_OUTPUT_PREFIX`,
`BUBU_STORAGE_INPUT_PREFIX`) apply to any provider.

To diagnose offloading, enable OTel exporters and watch:

- `bubu.storage.dehydration.size_bytes`
- `bubu.storage.hydration.size_bytes`

These metrics are emitted whenever the SDK moves data in or out of storage (`pkg/metrics/metrics.go:19`).

## Failure signals

When storage is disabled and the payload is bigger than the inline limit, the SDK fails the
StepRun with a terminal error (`storage/manager.go:241`). The StepRun status shows:

- `status.phase = Failed`
- `status.exitClass = terminal`
- `status.lastFailureMsg` containing the inline limit error

Retries are bounded by the new CEL validations (`config/crd/bases/runs.bubustack.io_stepruns.yaml:476`),
so pathological retry loops are rejected before they impact the control plane.

If hydration fails (e.g., the object was deleted), the StepRun is marked Failed and the error is
recorded in `status.lastFailureMsg` (`batch.go:404`).

## Best practices

1. **Pin a provider in production** – Always set `BUBU_STORAGE_PROVIDER` and related credentials in
   your Engram templates. Storage-disabled deployments only work for very small payloads.
2. **Right-size the threshold** – Keep `BUBU_MAX_INLINE_SIZE` low enough to protect the API server,
   but high enough to keep the most common responses inline (~1–4 KiB works well for JSON APIs).
3. **Watch manifest size** – The StepRun CRD now enforces limits on `status.manifest` and
   `status.manifestWarnings`, preventing unbounded metadata growth (`config/crd/bases/runs.bubustack.io_stepruns.yaml:469`).
4. **Treat storage errors as infrastructure incidents** – The SDK never silently falls back to
   inline mode; if storage is unavailable, StepRuns fail so that operators can respond.
5. **Use the bridge responsibly** – When `BUBU_HYBRID_BRIDGE=true`, successful batch outputs are
   forwarded to the transport hub; keep the payload light or rely on storage references (`batch.go:199`).

## See also

- [Runtime configuration reference](../reference/config.md#storage-offloading)
- [Hybrid streaming observability](./streaming-observability.md)
- [Go SDK execution lifecycle](./go-sdk.md)
