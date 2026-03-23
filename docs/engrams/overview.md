---
title: Engrams
sidebar_position: 2
description: Learn how Engrams encapsulate reusable, portable units of execution inside Bubustack.
---
# Engrams

:::info Quick scan
- **Why**: Understand how Engrams encapsulate reusable automation capabilities inside the Bubustack ecosystem.
- **When**: Read this before authoring your first EngramTemplate or promoting Engrams across environments.
- **How**: Follow the lifecycle diagrams, mode matrix, and publishing workflow to standardise Engrams.
:::

An **Engram** is the executable building block of a Bubustack Story. Think of it as a containerized
capability with a clear contract: inputs, outputs, transport expectations, and telemetry behavior.
Engrams are instantiated from **EngramTemplates**, which define metadata, supported modes, and
configuration schemas.

## Lifecycle

1. **Template registration** — Platform teams publish EngramTemplates to the cluster. Templates live
   in the `catalog.bubustack.io` API group and include validation schemas for the `with` payload.
2. **Instantiation** — Application teams create Engrams by referencing a template and supplying
   configuration values. This creates a namespace-scoped Engram resource.
3. **Reconciliation** — The Engram controller reconciles runtime infrastructure. For `job` mode it
   prepares container specs; for `deployment` or `statefulset` modes it creates long-lived workloads
   and Services.
4. **Execution** — When a StoryRun references an Engram, the StepRun controller launches the runtime,
   wires up environment variables, and configures transport targets (Bobravoz gRPC today, with new
   connectors following the same pattern when contributed).

## Modes

| Mode        | Description                                                                 | Use cases                                  |
|-------------|-----------------------------------------------------------------------------|-------------------------------------------|
| `job`       | Executes to completion via a Kubernetes Job.                               | ETL stages, batch inference, data export. |
| `deployment`| Runs continuously behind a Service. StepRuns route traffic via Bobravoz or HTTP. | Retrieval APIs, tool endpoints, agents.   |
| `statefulset` | Maintains identity per replica, ideal for sharded or stateful processes. | Vector databases, caches, durable agents. |

Each mode inherits Kubernetes primitives such as PodDisruptionBudgets, HorizontalPodAutoscalers, and
network policies.

## Inputs and Outputs

Engrams interact with Bobrapet through a well-defined ABI:

- Inputs are exposed via environment variables and mounted files.
- Outputs are reported by patching the StepRun status using the SDK helper.
- Secrets and ConfigMaps can be referenced by name, respecting namespace boundaries.

Example portion of an Engram spec:

```yaml
spec:
  templateRef: text-embedder
  mode: job
  with:
    modelRef: bge-large
    maxBatchSize: 32
  mounts:
    secrets:
      - name: openai-credentials
```

## Versioning & Promotion

Templates and Engrams can carry semantic versions. Stories can pin exact versions or accept ranges,
which enables progressive delivery and automated promotion flows. Because Engrams are Kubernetes
resources, they can be promoted via GitOps pipelines or fleet management tools.

| Strategy | When to use it | Notes |
| --- | --- | --- |
| Exact pin (`spec.templateRef: my-template@1.2.0`) | Critical workloads needing repeatability | Update Stories via PRs to roll forward. |
| Range pin (`>=1.2.0 <2.0.0`) | Rapid iteration with backward-compatible changes | Watch the Engram working group changelog for new releases. |
| Channel labels (`stable`, `beta`) | Multi-team catalogs with staged adoption | Map channels to Git branches or directories in your repo. |

## Best Practices

- Keep Engram images minimal and instrumented. Export Prometheus-friendly metrics.
- Use readiness and liveness probes for long-lived modes.
- Provide meaningful `with` schema defaults so Story authors can reuse Engrams safely.
- Surface contract changes with template version bumps and documentation updates.
- Track SDK compatibility: Go is GA; requests for additional language SDKs are documented on the
  community board and ship as contributors deliver them.

## Catalog Publishing Workflow

1. **Draft the template** — Start from `examples/engram-template.yaml` in the SDK repo. Fill out
   supported modes, schema, and annotations like `bubustack.io/owner`.
2. **Run linting** — Execute `bubuctl template lint` (bundled with the Go SDK) to validate schema and
   transport compatibility.
3. **Submit for review** — Open a PR in your GitOps repo. Tag the Engram working group if you want
   a public catalog review.
4. **Promote with GitOps** — Merge to staging, observe StoryRuns, then promote to production via PR.
5. **Publish metadata** — Update the catalog entry with release notes, telemetry dashboards, and
   policy requirements.

:::tip Checklist
- [ ] Template validated with SDK tooling
- [ ] Telemetry exported (metrics, logs, traces)
- [ ] Transport compatibility documented (Bobravoz today; note that new adapters follow once available)
- [ ] Versioning strategy agreed with consumers
:::

## Next steps

- Deep-dive on authoring specifics in the [Engram Authoring Guide](authoring.md).
- Map Engram usage into declarative flows via [Stories overview](../stories/overview.md).
- Contribute templates or improvements through [Community contribution pathways](../community/contributing.md).
