---
title: Stories
sidebar_position: 3
description: Stories are declarative DAGs that describe how Engrams, Primitives, and transports collaborate inside Bubustack.
---
# Stories

:::info Quick scan
- **Why**: Model end-to-end automation as declarative Stories that the Bobrapet operator can reconcile reliably.
- **When**: Start here once you understand Engrams and need to connect them into customer-facing flows.
- **How**: Use the manifest blueprint, execution model, and promotion checklist to design resilient Stories.
:::

A **Story** is the central workflow resource in Bubustack. It is a declarative Directed Acyclic Graph
(DAG) stored as a Kubernetes Custom Resource and reconciled by the Bobrapet operator. Stories let you
express complex automations with explicit dependencies, rich data passing, and production-ready
guardrails—without the trade-offs of no-code builders.

## Anatomy of a Story

```yaml
apiVersion: bubustack.io/v1alpha1
kind: Story
metadata:
  name: website-health-check
  namespace: monitoring
spec:
  inputsSchema:
    type: object
    properties:
      url:
        type: string
        description: "Target URL to probe."
  steps:
    - name: check-website
      ref: http-client-engram
      with:
        method: GET
        url: "{{ inputs.url }}"
    - name: notify-on-failure
      if: "steps.check-website.outputs.status != 200"
      ref: slack-notifier-engram
      with:
        message: "Website {{ inputs.url }} is down"
```

- **Inputs schema** — Optional JSON Schema document that validates incoming payloads and drives
  tooling.
- **Steps** — Ordered list of work units referencing Engrams or Primitives.
- **`if` expressions** — CEL expressions that create explicit dependencies and conditional logic.
- **`with`** — Arbitrary configuration blob passed to the underlying Engram (validated by the
  template schema).

## Execution Model

- Steps with no dependencies run in parallel by default.
- When an `if` expression references the output of another step, the controller automatically enforces
  ordering.
- Fan-out is as simple as referencing the same upstream step from multiple follow-on steps.
- Fan-in uses Primitives like `aggregate` or by reading the outputs of multiple steps within an `if`
  expression.

## Outputs & Context

Each step exposes a structured payload under `steps.<name>.outputs`. For batch Engrams this is
returned via the StepRun status. For long-lived Engrams, the Go SDK exposes downstream targets and
transport metadata (Bobravoz today, additional connectors when contributed) for cooperative scheduling.

:::note Transport extensions
When community adapters land, you can add `spec.transport.variant` and per-step overrides to stream
payloads without changing Story logic.
:::

## Version Control and Promotion

Because Stories are YAML, you manage them like any other infrastructure-as-code artifact:

- Store them in Git repositories.
- Apply them with GitOps controllers such as Argo CD or Flux.
- Promote changes across environments by updating the manifest and bumping Engram versions.

### GitOps promotion checklist

- [ ] Story manifest committed with owner annotations (`bubustack.io/owner`).
- [ ] Engram versions pinned or range-validated per environment.
- [ ] Transport variant documented (`bobravoz` now; note future adapters once they exist).
- [ ] Observability dashboards linked in PR description.
- [ ] Replay plan captured (StoryRun sample inputs stored securely).

## Debugging

The StoryRun resource surfaces execution history:

```bash
kubectl get storyrun website-health-check -o yaml
```

- Inspect `status.steps` for lifecycle state, latency, and outputs.
- Follow `status.timeline` to understand when each step started and finished.
- Retrieve associated logs via StepRun pods or transport spans.

Stories form the backbone of any Bubustack deployment.

## Next steps

- Continue with [Impulses](impulses.md) to trigger Stories declaratively.
- Dive into [Primitives](primitives.md) for control-flow helpers.
- Explore advanced orchestration in [Story Patterns](patterns.md).
