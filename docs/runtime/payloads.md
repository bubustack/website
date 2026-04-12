---
title: Payloads and Storage References
description: Inline payload limits, storage refs, and offload guidance.
---
# Payloads and Storage References

This document defines the payload contract for StoryRun inputs/outputs and step data.

## Who this is for

- Workflow authors managing large inputs or outputs.
- Operators controlling storage policies and limits.

## What you'll get

- When payloads are inline vs offloaded.
- How storage references are structured.
- Size limits and recommended patterns.

## Inline payloads

Small payloads are stored inline as JSON objects in:

- `StoryRun.spec.inputs`
- `StepRun.spec.input`
- `StoryRun.status.output`
- `StepRun.status.output`

Inline payloads are subject to size limits (see "Size limits" below).

## Storage references

Large payloads can be offloaded to storage and referenced with a storage ref map.

Required field:

- `$bubuStorageRef` (string): storage path or key.

Optional fields:

- `$bubuStoragePath` (string): sub-path within the referenced object.
- `$bubuStorageContentType` (string): MIME type (for example `application/json`).
- `$bubuStorageSchema` (string): schema identifier.
- `$bubuStorageSchemaVersion` (string): schema version.

Storage refs created by the platform include `"$bubuStorageContentType"` and
may include schema metadata when available.

Schema metadata defaults:

- StoryRun inputs: `"$bubuStorageSchema": "bubu://story/<namespace>/<story>/inputs"`,
  `"$bubuStorageSchemaVersion": <story.spec.version>` when set.
- Step outputs: `"$bubuStorageSchema": "bubu://engram/<namespace>/<engram>/output"` (fallback:
  `bubu://story/<namespace>/<story>/steps/<step>/output`), and
  `"$bubuStorageSchemaVersion": <engram.spec.version>` (fallback to `story.spec.version`).

If you offload StepRun inputs yourself, use:

- `"$bubuStorageSchema": "bubu://engram/<namespace>/<engram>/input"` (fallback:
  `bubu://story/<namespace>/<story>/steps/<step>/input`), and
- `"$bubuStorageSchemaVersion": <engram.spec.version>` (fallback to `story.spec.version`).

## Schema refs in status

When schemas are defined, controllers propagate schema refs to run status:

- `StoryRun.status.inputSchemaRef` / `StoryRun.status.outputSchemaRef`
- `StepRun.status.inputSchemaRef` / `StepRun.status.outputSchemaRef`

Each ref includes a `ref` (schema ID) and optional `version` that align with
`$bubuStorageSchema` and `$bubuStorageSchemaVersion` values.

Example:

```json
{
  "$bubuStorageRef": "outputs/story-123/output.json",
  "$bubuStorageContentType": "application/json",
  "$bubuStorageSchema": "com.example.report",
  "$bubuStorageSchemaVersion": "v1"
}
```

## Step logs

Step logs are published by the SDK/Engram, not the controller. When storage is enabled,
the SDK may upload logs and store a storage ref map in `StepRun.status.logs`.
If storage is disabled, logs are omitted.

## Size limits

The following limits apply:

- StoryRun inputs: `storyrun.max-inline-inputs-size` (operator config)
- Engram payloads: `maxInlineSize` (per-step or operator default)
- StoryRun final output: 1 MiB cap (fails to store in status, run still succeeds).
  The controller does **not** auto-offload StoryRun final output to storage.

Use storage references when payloads exceed these limits.

## Shared operator storage

Offloading is not just an SDK concern. If a client or SDK offloads Story
trigger inputs, StoryRun inputs, or large step payloads, the workflow operator
must be configured with shared storage (`controller.storage.*`) so it can
hydrate and resolve those refs later.

The same applies when a durable `StoryTrigger` request resolves into a
`StoryRun`. If the accepted trigger payload is larger than
`storyrun.max-inline-inputs-size`, the controller offloads `StoryRun.spec.inputs`
before create. That controller-side offload path uses the same shared storage
backend and will fail if `controller.storage.*` is unset.

If shared storage is not configured:

- direct API clients must stay within inline limits or submit storage refs that
  the operator can already resolve;
- SDK helpers that try to offload oversized payloads will fail before the
  StoryTrigger or StoryRun is admitted.
- `StoryTrigger` requests with oversized accepted inputs can be persisted, but
  controller-side resolution into a `StoryRun` will fail because the controller
  cannot offload the resulting `StoryRun.spec.inputs`.

Running an S3-compatible service in-cluster is not enough on its own. Bobrapet
must be pointed at that backend.

When those offloaded payloads are deeply nested, hydration is also bounded by a
recursion budget. The global default comes from
`engram.default-max-recursion-depth`, and individual Stories can raise it with
`spec.policy.execution.maxRecursionDepth`.

## Large aggregates (user responsibility)

The controller does **not** auto-offload oversized Step inputs or StoryRun final
outputs. If a payload grows beyond the configured limits, you must avoid
building that data inline.
For map/loop-style fan-out, use specialized Engrams that handle storage refs and
aggregation; the controller will not perform storage actions on your behalf.

Recommended patterns:

- Offload at the source by setting `execution.maxInlineSize: 0` (or a low value)
  on upstream steps so outputs become storage refs early.
- Pass a manifest of storage refs instead of raw data.
- Use an aggregation Engram that reads refs, streams/combines data, and writes a
  single `$bubuStorageRef` output.

If you attempt to inline large aggregates, admission validation or status size
limits will reject or drop the payload.

## Templates and offloaded data

Templates can reference step outputs that are offloaded to storage. When a template touches an
object containing `$bubuStorageRef`, the engine treats it as offloaded data:

- Default behavior (`templating.offloaded-data-policy=error`): evaluation fails with a clear error.
- Injection behavior (`templating.offloaded-data-policy=inject`): a materialize StepRun/engram is created
  to hydrate the data and resolve the template, then execution continues.
- Controller behavior (`templating.offloaded-data-policy=controller`): the
  controller hydrates the offloaded data in-process and resolves the template
  without creating a materialize StepRun.

The materialize engram name is configured by `templating.materialize-engram`
(commonly set to `materialize`) and is only used for `inject`.

## Redaction rules

Do not store secrets in inline payloads or status fields. Use:

- `$bubuSecretRef` for secrets
- `$bubuConfigMapRef` for non-sensitive configuration
- Storage references for large or sensitive blobs

Inline payloads are stored in etcd; treat them as non-sensitive.

## ConfigMap / Secret references

ConfigMap and Secret references can appear anywhere a payload is accepted.
References must be well-formed (string form `name:key` or object form with
`name`/`key` fields); malformed refs are rejected by admission validation.

## Current runtime delivery

Today, resolved runtime payloads are still delivered through a mix of StepRun
fields, storage refs, and pod environment variables. That contract works, but
it is env-heavy for complex workloads. A planned operator improvement will move
large evaluated runtime payloads toward artifact-backed delivery instead of
inline env expansion. See the [Roadmap](../community/roadmap.md).
