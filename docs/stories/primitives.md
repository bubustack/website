---
title: Primitives
sidebar_position: 5
description: Primitives offer built-in control flow so you can orchestrate complex logic without custom glue code.
---
# Primitives

:::info Quick scan
- **Why**: Use Bubustack primitives to orchestrate control flow without writing glue code.
- **When**: Reach for primitives when Stories need branching, looping, or synchronization.
- **How**: Insert the provided schemas into your Story manifests and monitor their telemetry.
:::

**Primitives** are Bubustack's built-in control-flow helpers. They behave like Engrams from the
Story's perspective but run inside the Bobrapet control plane. Use them to compose complex behavior
without writing bespoke operators or shell scripts.

## Available Primitives

| Primitive   | Purpose                                                                    |
|-------------|----------------------------------------------------------------------------|
| `parallel`  | Fan out to multiple branches and rejoin when all complete.                 |
| `condition` | Evaluate a CEL expression and run one of multiple branches.                |
| `loop`      | Iterate over items, triggering the same Engram or subgraph for each value. |
| `wait`      | Pause execution until a timeout or external signal is satisfied.           |
| `aggregate` | Combine outputs from upstream steps into a single structured payload.      |

Each primitive exposes a schema to configure behavior. For example, the `condition` primitive lets
you provide `then` and `else` branches, and the `loop` primitive accepts concurrency controls and
item chunking.

## Using a Primitive

```yaml
steps:
  - name: plan-agents
    ref: planner-engram
  - name: run-tools
    ref: parallel
    with:
      branches:
        - name: summarize
          ref: summarizer-engram
          with:
            document: "{{ steps.plan-agents.outputs.cleaned_body }}"
        - name: embed
          ref: embedder-engram
          with:
            chunks: "{{ steps.plan-agents.outputs.chunks }}"
```

In the example above, the `parallel` primitive coordinates two Engrams and rejoins once both
succeed. If either fails, the primitive bubbles up the failure to the StoryRun.

## Implementation Details

- Primitives run inside the control plane. They do not launch separate pods.
- They still emit telemetry, providing insight into branching decisions, retries, and timing.
- Primitives can trigger nested sub-Stories, allowing you to package and reuse complex flow patterns.
- Community preview: streaming primitives will integrate with future transports contributed by
  maintainers, enabling event-driven fan-out without extra wiring.

## When to Create a Custom Primitive

If you find yourself repeating the same combination of Engrams and control-flow logic across multiple
Stories, consider implementing a new primitive. Since primitives are controllers, you can build them
in Go using the same SDKs and register them via the `primitives.bubustack.io` API group.

## Next steps

- Dive into the [Engram Authoring Guide](../engrams/authoring.md) to pair primitives with custom logic.
- Explore [Story Patterns](patterns.md) for end-to-end orchestration examples.
- Track upcoming primitive releases in the [community backlog](../community/roadmap.md).
