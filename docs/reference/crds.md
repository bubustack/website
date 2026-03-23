---
id: reference-crds
title: CRD Reference
sidebar_position: 2
description: Field-by-field reference for Bubustack Custom Resource Definitions across Stories, Engrams, Impulses, and runtime resources.
slug: /reference/crds
---
# Custom Resource Definitions

:::info Quick scan
- **Why**: Reference the most important Bubustack CRD fields without trawling full manifests.
- **When**: Use this table when reviewing PRs or implementing Stories, Engrams, and Impulses.
- **How**: Scan the per-resource tables and drill deeper with `kubectl explain` when needed.
:::

This reference summarises the key fields for the Bubustack Custom Resource Definitions (CRDs).
Inspect the published CRD manifests for exhaustive schemas; the tables below highlight the knobs you
will configure most often.

## Story (`bubustack.io/v1alpha1`)

| Field | Type | Description |
| --- | --- | --- |
| `spec.pattern` | `string` | Execution model: `batch` (default) or `streaming`. |
| `spec.inputsSchema` | JSON Schema | Validates inputs supplied to StoryRuns. |
| `spec.steps[].name` | `string` | Unique step identifier used for dependencies. |
| `spec.steps[].ref` | `string` or object | Engram or Primitive to execute. |
| `spec.steps[].if` | CEL string | Conditional guard; creates dependencies automatically. |
| `spec.steps[].with` | `object` | Arbitrary configuration forwarded to the Engram. |
| `spec.rollout.parallelism` | `integer` | Max concurrent StepRuns. |
| `spec.rollout.backoff` | `object` | Retry policy (`attempts`, `factor`, `jitter`). |
| `spec.transport` | `object` | Transport-specific overrides when using streaming operators. |
| `status.timeline[]` | `list` | Chronological events (submitted, started, completed). |
| `status.steps` | `map` | Per-step phase, outputs, latency, error context. |

:::tip Validations
- Step names must be unique.
- `steps[].needs` can only reference steps declared earlier in the list (no DAG cycles).
- Apply the SDK overlay in `config/crd/overlays/validators` to enforce the rules via CEL when installing the CRDs.
:::

## Engram (`bubustack.io/v1alpha1`)

| Field | Type | Description |
| --- | --- | --- |
| `spec.templateRef` | `string` | Name of the EngramTemplate to instantiate. |
| `spec.mode` | `string` | Runtime mode: `job`, `deployment`, or `statefulset`. |
| `spec.with` | `object` | Configuration payload validated by the template schema. |
| `spec.mounts.secrets[]` | `list` | Secrets mounted into the pod. |
| `spec.executionPolicy.timeouts.step` | `string` | Per-step timeout override. |
| `spec.resources` | `object` | CPU/memory requests and limits for long-lived modes. |
| `status.phase` | `string` | `Pending`, `Ready`, or `Error`. |
| `status.conditions[]` | `list` | Reconciliation signals like `RuntimeHealthy`. |

## EngramTemplate (`catalog.bubustack.io/v1alpha1`)

| Field | Type | Description |
| --- | --- | --- |
| `spec.version` | `string` | Semantic version for compatibility checks. |
| `spec.description` | `string` | Human-readable summary. |
| `spec.supportedModes` | `[]string` | Allowed runtime modes. |
| `spec.schema` | JSON Schema | Validates `with` payloads for Engram instances. |
| `spec.image` | `string` | Default container image (tag or digest). |
| `spec.command/args` | `[]string` | Entrypoint overrides. |

## Impulse (`bubustack.io/v1alpha1`)

| Field | Type | Description |
| --- | --- | --- |
| `spec.templateRef` | `string` | Selected ImpulseTemplate. |
| `spec.storyRef` | `object` | Namespace and name of the Story to trigger. |
| `spec.with` | `object` | Template-specific configuration (queue URL, cron, etc.). |
| `spec.mapping` | `object` | CEL expressions mapping events to Story inputs. |
| `status.conditions[]` | `list` | Health and throttle signals. |
| `status.lastTrigger` | `string` | Timestamp of most recent trigger. |

## StoryRun (`runs.bubustack.io/v1alpha1`)

| Field | Type | Description |
| --- | --- | --- |
| `spec.storyRef` | `object` | Story metadata for this run. |
| `spec.inputs` | `object` | Payload validated by the Story schema. |
| `spec.impulseRef` | `object` | Optional impulse that fired this run. |
| `status.phase` | `string` | `Pending`, `Running`, `Succeeded`, `Failed`, `Canceled`. |
| `status.timeline[]` | `list` | Event log (submitted, scheduled, finished). |
| `status.steps` | `map` | Mirrors StepRun status for quick inspection. |

## StepRun (`runs.bubustack.io/v1alpha1`)

| Field | Type | Description |
| --- | --- | --- |
| `spec.storyRunRef` | `object` | Parent StoryRun metadata. |
| `spec.stepName` | `string` | Name of the associated step. |
| `spec.runtimeRef` | `object` | Kubernetes Job/Deployment reference when applicable. |
| `status.phase` | `string` | Lifecycle state of the step. |
| `status.outputs` | `object` | Structured data returned by the Engram. |
| `status.conditions[]` | `list` | Signals such as `WaitingOnDependency`, `Ready`. |

:::tip Validation
`spec.downstreamTargets[]` must set exactly one destination (`grpc` or `terminate`). The overlay shipped with the SDK enforces this via CEL.
:::

## ImpulseTemplate (`catalog.bubustack.io/v1alpha1`)

| Field | Type | Description |
| --- | --- | --- |
| `spec.schema` | JSON Schema | Validates `with` payload. |
| `spec.description` | `string` | Description for Story authors. |
| `spec.parameters` | `object` | Defaults for retries, backoff, or secret references. |

For full schemas, run:

```bash
kubectl explain stories.spec
kubectl explain engramtemplates.spec
kubectl explain storyruns.status
```

Consult the [API Reference](api-reference.md) for samples and CLI tips, and the
[Go SDK docs](../sdk/go-sdk.md) for binding these fields inside Engrams.

## Next steps

- Map configuration keys to environment variables in [Runtime configuration](config.md).
- Explore cluster metrics in [Metrics reference](metrics.md).
- Put fields into practice via the [Bobrapet Quickstart](../operator/quickstart.md).
