---
title: API Reference
sidebar_position: 1
description: Reference for the primary Bubustack Custom Resource Definitions.
---
# API Reference

:::info Quick scan
- **Why**: Quickly locate the Bubustack CRD fields you configure most often.
- **When**: Consult this reference while authoring manifests or debugging reconciliation issues.
- **How**: Use the tables as a field cheat sheet, then inspect CRDs with `kubectl explain` for full schemas.
:::

This section summarizes the most commonly used Custom Resource Definitions (CRDs) in Bubustack. Refer
to the OpenAPI schemas installed with the CRDs for exhaustive specs; the tables below highlight the
fields you work with most often.

## Story (`bubustack.io/v1alpha1`)

| Field                           | Type          | Description                                                                 |
|---------------------------------|---------------|-----------------------------------------------------------------------------|
| `spec.inputsSchema`             | JSON Schema   | Validates payloads passed to StoryRuns.                                    |
| `spec.steps[].name`             | string        | Unique step name used for dependency references.                           |
| `spec.steps[].ref`              | string        | Engram or Primitive to execute.                                            |
| `spec.steps[].if`               | CEL string    | Conditional expression that controls execution and dependencies.           |
| `spec.steps[].with`             | object        | Arbitrary configuration passed to the Engram.                              |
| `spec.rollout.parallelism`      | integer       | Limits concurrent StepRuns.                                                |
| `spec.rollout.backoff.attempts` | integer       | Maximum retry count per StepRun.                                           |
| `status.state`                  | enum          | Overall StoryRun lifecycle (`Pending`, `Running`, `Succeeded`, `Failed`).  |
| `status.steps`                  | map           | Per-step status including phase, outputs, and timestamps.                  |

## StoryRun (`runs.bubustack.io/v1alpha1`)

| Field            | Type   | Description                                                          |
|------------------|--------|----------------------------------------------------------------------|
| `spec.storyRef`  | object | Name/namespace of the Story to execute.                              |
| `spec.inputs`    | object | Payload validated against the Story's `inputsSchema`.                |
| `spec.impulseRef`| object | (Optional) Reference to the triggering Impulse.                      |
| `status.phase`   | enum   | One of `Pending`, `Running`, `Succeeded`, `Failed`, `Canceled`.      |
| `status.timeline`| list   | Chronological events (submitted, started, completed, etc.).          |
| `status.steps[]` | object | Mirrors StepRun status for quick inspection.                         |

## StepRun (`runs.bubustack.io/v1alpha1`)

| Field               | Type    | Description                                                     |
|---------------------|---------|-----------------------------------------------------------------|
| `spec.storyRunRef`  | object  | Parent StoryRun metadata.                                       |
| `spec.stepName`     | string  | Name of the associated step in the Story.                       |
| `status.phase`      | enum    | `Pending`, `Starting`, `Running`, `Succeeded`, `Failed`.        |
| `status.outputs`    | object  | Structured data published by the Engram.                        |
| `status.conditions[]`| list   | Progress indicators (`Ready`, `WaitingOnDependency`, etc.).     |
| `status.runtimeRef` | object  | Reference to created Kubernetes Job/Deployment (if applicable). |

## Engram (`bubustack.io/v1alpha1`)

| Field                  | Type     | Description                                                                |
|------------------------|----------|----------------------------------------------------------------------------|
| `spec.templateRef`     | string   | Name of the EngramTemplate to instantiate.                                |
| `spec.mode`            | enum     | `job`, `deployment`, or `statefulset`. Defaults to template capabilities. |
| `spec.with`            | object   | Configuration payload validated by the template schema.                    |
| `spec.mounts.secrets[]`| list     | Secret references injected into the runtime.                               |
| `status.phase`         | enum     | `Pending`, `Ready`, `Error`.                                               |
| `status.conditions[]`  | list     | Observability signals such as `RuntimeHealthy`.                            |

## EngramTemplate (`catalog.bubustack.io/v1alpha1`)

| Field                 | Type        | Description                                                           |
|-----------------------|-------------|-----------------------------------------------------------------------|
| `spec.version`        | string      | SemVer identifier used for compatibility checks.                      |
| `spec.description`    | string      | Human-readable summary.                                               |
| `spec.supportedModes` | []string    | Allowed runtime modes (`job`, `deployment`, `statefulset`).           |
| `spec.schema`         | JSON Schema | Describes the shape of the `with` configuration block.                |
| `spec.image`          | string      | Default container image pulled by the controller.                     |
| `spec.command/args`   | []string    | Overrides runtime command/arguments if necessary.                     |

## Impulse (`bubustack.io/v1alpha1`)

| Field                 | Type     | Description                                                      |
|-----------------------|----------|------------------------------------------------------------------|
| `spec.templateRef`    | string   | Name of the ImpulseTemplate to use.                              |
| `spec.storyRef`       | object   | Story target to run when triggered.                              |
| `spec.with`           | object   | Template-specific configuration (cron schedule, queue URL, etc). |
| `status.lastTrigger`  | string   | Timestamp of the most recent successful trigger.                 |
| `status.conditions[]` | list     | Health signals (`Ready`, `Throttled`, `Failed`).                 |

## ImpulseTemplate (`catalog.bubustack.io/v1alpha1`)

| Field              | Type        | Description                                                     |
|--------------------|-------------|-----------------------------------------------------------------|
| `spec.schema`      | JSON Schema | Validates the `with` payload on Impulses.                       |
| `spec.description` | string      | Human-readable explanation of the trigger.                      |
| `spec.parameters`  | object      | Template-specific tuning knobs (e.g., retry policy defaults).   |

## Webhook Configuration

When the operator is installed with admission webhooks enabled, two webhook configurations are
registered:

- `validatingwebhookconfiguration/bobrapet-validating-webhook` — Ensures CRDs meet schema constraints.
- `mutatingwebhookconfiguration/bobrapet-defaulting-webhook` — Applies defaults like runtime labels
  or image pull policies.

## Client Libraries

- **Go SDK** — Official SDK for building Engrams. See [Go SDK](../sdk/go-sdk.md).
- **REST / kubectl** — All CRDs are accessible via the Kubernetes API. Use standard tools for
  automation.

For the authoritative schema definitions, inspect the CRD manifests shipped with each release or run:

```bash
kubectl explain stories.bubustack.io.spec
kubectl explain engramtemplates.catalog.bubustack.io.spec
```

## Next steps

- Review the detailed [CRD tables](/docs/reference/crds) for extended field coverage.
- Map config values to runtime variables via [Runtime configuration](/docs/reference/config).
- Observe the metrics exposed per resource in [Metrics reference](/docs/reference/metrics).
