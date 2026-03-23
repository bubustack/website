---
title: Story Syntax
sidebar_position: 1
description: Learn the Story language used by the Bobrapet operator to model workflows as declarative DAGs.
---
# Story Syntax

:::info Quick scan
- **Why**: Share a single, readable Story language between operators and builders.
- **When**: Use this page when authoring new Stories or reviewing Story changes in Git.
- **How**: Follow the syntax outline, step rules, and creation flow below.
:::

Stories are YAML Custom Resources that define a workflow as a directed acyclic graph (DAG). This
page focuses on the syntax and mechanics. For the conceptual overview, see [Stories](overview.md).

## Syntax at a glance

```yaml
apiVersion: bubustack.io/v1alpha1
kind: Story
metadata:
  name: website-health-check
  namespace: monitoring
spec:
  pattern: batch
  inputsSchema:
    type: object
    required: ["url"]
    properties:
      url:
        type: string
  steps:
    - name: check-website
      ref: http-client-engram
      with:
        url: "{{ inputs.url }}"
    - name: notify-on-failure
      if: "steps.check-website.outputs.status != 200"
      ref: slack-notifier-engram
      with:
        message: "Website {{ inputs.url }} is down"
```

## Top-level blocks

| Field | Purpose |
| --- | --- |
| `metadata` | Story identity used by StoryRuns and cross references. |
| `spec.pattern` | Execution model: `batch` (default) or `streaming`. |
| `spec.inputsSchema` | JSON Schema for validating incoming StoryRun inputs. |
| `spec.outputsSchema` | JSON Schema for validating final Story output. |
| `spec.output` | Optional expression that shapes the final Story output. |
| `spec.steps` | Ordered list of Engram or Primitive steps. |
| `spec.transports` | Optional named transport bindings for streaming steps. |
| `spec.policy` | Optional defaults for retries, timeouts, resources, and storage. |

## Step blocks

Each entry in `spec.steps` defines a node in the DAG.

| Field | Purpose |
| --- | --- |
| `name` | Unique identifier used in `steps.<name>.outputs` references. |
| `ref` | Engram (or built-in primitive) to run for this step. |
| `type` | Optional primitive type when you want to be explicit. |
| `with` | Configuration payload passed into the Engram or primitive. |
| `needs` | Explicit upstream dependencies by step name. |
| `if` | CEL expression that gates execution. |
| `runtime` | Streaming-only, per-packet config for realtime steps. |
| `transport` | Named transport binding for streaming steps. |
| `execution` | Per-step overrides (timeouts, retries, storage, security). |
| `secrets` | Overrides for template secret bindings. |

:::tip Validation rules
- Step names must be unique.
- Each step must set exactly one of `ref` or `type`.
- `with` must be a JSON object (not an array or primitive).
:::

## Logic and data flow

- Steps with no dependencies run in parallel.
- `needs` lists explicit dependencies when you want to force ordering.
- `if` expressions both gate execution and create implicit dependencies based on references.
- Step outputs are available under `steps.<name>.outputs`, and Story inputs are under `inputs`.

Example dependency logic:

```yaml
steps:
  - name: fetch
    ref: http-client-engram
    with:
      url: "{{ inputs.url }}"
  - name: transform
    needs: ["fetch"]
    ref: html-to-text
    with:
      body: "{{ steps.fetch.outputs.body }}"
  - name: notify
    if: "steps.fetch.outputs.status != 200"
    ref: slack-notifier-engram
    with:
      message: "URL failed: {{ inputs.url }}"
```

## Available operations (primitives)

Stories support built-in operations for common control flow. Use primitives when you need branching,
parallelism, waits, data shaping, or nested Story execution without writing custom controllers. The
catalog evolves with each operator release, so refer to [Primitives](primitives.md) for the current
list and schemas.

## Creating a Story

1. Model the input schema with `spec.inputsSchema`.
2. Add Engram and primitive steps under `spec.steps`.
3. Wire dependencies with `needs` or `if` expressions.
4. Apply the Story manifest via GitOps or `kubectl apply -f`.

To run it, create a StoryRun:

```yaml
apiVersion: runs.bubustack.io/v1alpha1
kind: StoryRun
metadata:
  name: website-health-check-001
  namespace: monitoring
spec:
  storyRef:
    name: website-health-check
  inputs:
    url: "https://example.com"
```

You can also generate Story YAML with the Go SDK story builder. See
[First Workflow](../sdk/first-workflow.md) for an end-to-end example.

## Next steps

- Explore [Story patterns](patterns.md) for production workflows.
- Review [Impulses](impulses.md) to trigger Stories from events and schedules.
- Dive into [Primitives](primitives.md) for control flow helpers.
