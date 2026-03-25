---
title: Component Ecosystem Overview
description: SDK contracts, component catalog, and packaging patterns.
---
# Component Ecosystem Overview

This document summarizes how BubuStack's component ecosystem fits together,
including SDK usage, contracts, packaging/registry patterns, and reliability
semantics. It links to the detailed docs and repo references you'll use day-to-day.

## Who this is for

- Component authors building [Engrams](https://github.com/orgs/bubustack/repositories?q=engram) and [Impulses](https://github.com/orgs/bubustack/repositories?q=impulse).
- SDK users wiring triggers, inputs, and outputs.
- Platform operators packaging and distributing components.

## What you'll get

- Where the SDKs live and what they cover.
- The core contracts that define inputs, outputs, and errors.
- How components are packaged and discovered.
- The reliability guarantees you must design around.

---

## The rule: do one thing and do it well

An Engram does one job. A "fetch-and-summarize" Engram is two Engrams. A
"summarize-and-notify" Engram is two Engrams. If you can describe what it does
with "and", split it.

Stories compose Engrams into pipelines. This is the same principle as Unix: `curl`
fetches, `jq` transforms, `notify-send` alerts. Each program is small, testable,
and reusable. The shell (Story) wires them together.

Impulses follow the same rule. A [cron-impulse](https://github.com/bubustack/cron-impulse)
fires on a schedule. A [github-webhook-impulse](https://github.com/bubustack/github-webhook-impulse)
fires on GitHub events. A [kubernetes-impulse](https://github.com/bubustack/kubernetes-impulse)
fires on cluster events. Each trigger does one thing.

When you follow this, every component becomes independently testable, swappable,
and reusable across Stories. When you don't, you get monoliths with implicit
coupling that break when requirements change.

---

## Quick start: authoring flow

1. Create a component repo (see [Building Engrams](../sdk/building-engrams.md) for structure).
2. Implement an Engram or Impulse using [bubu-sdk-go](https://github.com/bubustack/bubu-sdk-go).
3. Define schemas in `EngramTemplate` or `ImpulseTemplate`.
4. Validate with `bubu-sdk-go/testkit` and `bubu-sdk-go/conformance`.
5. Build a Docker image and deploy by referencing the template in a Story.

---

## Repo map (where to look)

| Repository | Purpose |
| --- | --- |
| [tractatus](https://github.com/bubustack/tractatus) | Protobuf contracts for gRPC transport. |
| [core](https://github.com/bubustack/core) | Shared runtime contracts, templating engine, transport connector runtime. |
| [bobrapet](https://github.com/bubustack/bobrapet) | CRDs, controllers, webhooks, and the runtime contract docs. |
| [bubu-sdk-go](https://github.com/bubustack/bubu-sdk-go) | Go SDK, testkit, and conformance helpers. |
| [bobravoz-grpc](https://github.com/bubustack/bobravoz-grpc) | Streaming transport operator: gRPC hub, topology analysis, connector lifecycle. |
| [bubuilder](https://github.com/bubustack/bubuilder) | Web console and REST API server. |
| bubu-registry *(planned)* | Git-backed registry and `bubu` CLI. See [Roadmap](../community/roadmap.md). |
| [engrams/*](https://github.com/orgs/bubustack/repositories?q=engram) | Engram implementations (batch and streaming data processors). |
| [impulses/*](https://github.com/orgs/bubustack/repositories?q=impulse) | Impulse implementations (event-driven workflow triggers). |
| [examples](https://github.com/bubustack/examples) | Sample Stories and workflows. |

For the full module dependency graph and layering rules, see
[Architecture](architecture.md).

---

## Component SDKs

The [Go SDK](https://github.com/bubustack/bubu-sdk-go) is the primary authoring
surface for components. It provides three entry points:

| Entry point | Use case | Kubernetes workload |
| --- | --- | --- |
| `sdk.StartBatch[C, I]` | Finite tasks with clear start/end | Job |
| `sdk.StartStreaming[C]` | Continuous processing with gRPC bidirectional streaming | Deployment |
| `sdk.RunImpulse[C]` | Long-running trigger that creates StoryRuns from external events | Deployment |

The SDK also provides:

- **[testkit](https://github.com/bubustack/bubu-sdk-go)** — Local harness for
  testing component behavior without a cluster (`testkit.BatchHarness`,
  `testkit.StreamHarness`).
- **[conformance](https://github.com/bubustack/bubu-sdk-go)** — Contract test
  suites that all components should pass (`conformance.BatchSuite`,
  `conformance.StreamSuite`).

Use the SDK to:

- Parse runtime context (story, run, step, transport settings).
- Emit outputs, logs, and structured errors.
- Integrate with streaming transports when enabled.
- Handle storage ref resolution (automatic for inputs; transparent offloading for large outputs).

For a full development guide with interfaces, code examples, testing patterns,
and template definitions, see [Building Engrams](../sdk/building-engrams.md)
and [Go SDK](../sdk/go-sdk.md).

---

## Available components

### Engrams (data processors)

Engrams process data — they receive inputs, execute logic, and produce outputs.

| Engram | Pattern | Description |
| --- | --- | --- |
| [http-request-engram](https://github.com/bubustack/http-request-engram) | Batch | HTTP requests with pagination, retries, and response parsing |
| [json-filter-engram](https://github.com/bubustack/json-filter-engram) | Batch | Filter JSON payloads (inline or offloaded) with JSONPath |
| [map-reduce-adapter-engram](https://github.com/bubustack/map-reduce-adapter-engram) | Batch | Dynamic fan-out with child StoryRuns and result aggregation |
| [materialize-engram](https://github.com/bubustack/materialize-engram) | Batch | Evaluate Go templates with Sprig against a provided context |
| [mcp-adapter-engram](https://github.com/bubustack/mcp-adapter-engram) | Both | Model Context Protocol adapter (streamable HTTP and stdio) |
| [openai-chat-engram](https://github.com/bubustack/openai-chat-engram) | Both | OpenAI chat completions (batch and streaming) |
| [openai-stt-engram](https://github.com/bubustack/openai-stt-engram) | Streaming | OpenAI speech-to-text with real-time transcription events |
| [openai-tts-engram](https://github.com/bubustack/openai-tts-engram) | Streaming | OpenAI text-to-speech with audio chunk streaming |
| [silero-vad-engram](https://github.com/bubustack/silero-vad-engram) | Streaming | Voice activity detection using Silero ONNX models |
| [livekit-bridge-engram](https://github.com/bubustack/livekit-bridge-engram) | Streaming | LiveKit room participant bridge for audio/data channels |
| [livekit-turn-detector-engram](https://github.com/bubustack/livekit-turn-detector-engram) | Streaming | Conversational turn detection for voice pipelines |

### Impulses (event triggers)

Impulses trigger workflows — they listen for external events and create StoryRuns.

| Impulse | Trigger source | Description |
| --- | --- | --- |
| [cron-impulse](https://github.com/bubustack/cron-impulse) | Cron schedule | Time-based triggers with cron expressions |
| [github-webhook-impulse](https://github.com/bubustack/github-webhook-impulse) | GitHub webhooks | PR, push, issue, and other GitHub events |
| [kubernetes-impulse](https://github.com/bubustack/kubernetes-impulse) | Kubernetes events | Pod crashes, deployments, resource changes |
| [livekit-webhook-impulse](https://github.com/bubustack/livekit-webhook-impulse) | LiveKit webhooks | Room and participant lifecycle events |

Browse all components:
[Engrams](https://github.com/orgs/bubustack/repositories?q=engram) ·
[Impulses](https://github.com/orgs/bubustack/repositories?q=impulse)

---

## Contracts and schemas

Contracts live in two places:

- **CRD schemas** define the API surface for Stories, Runs, Engrams, and Impulses.
  These are authored in [bobrapet/api/](https://github.com/bubustack/bobrapet)
  and documented in [CRD Design](../api/crd-design.md).
- **Runtime contracts** define environment variables, labels, annotations, and
  structured error payloads for SDKs. See [core/contracts](https://github.com/bubustack/core)
  and [Error Contract](../api/errors.md).

Streaming components also follow the streaming message contract:

- [Streaming Contract](../streaming/streaming-contract.md) — Message rules and data flow.
- [Transport Settings](../streaming/transport-settings.md) — Backpressure, routing, and replay.

---

## Packaging and registry *(planned)*

A Git-backed component registry (`bubu-registry`) and CLI (`bubu`) for
scaffolding, publishing, and discovering components are on the
[Roadmap](../community/roadmap.md). Today, components are shared as container
images and `EngramTemplate`/`ImpulseTemplate` YAML files applied directly to
the cluster.

---

## Reliability semantics

Reliability guarantees are defined in [Durable Semantics](durable-semantics.md).
Key themes:

- StoryRun and StepRun creation are idempotent when deterministic IDs are used.
- Step execution is at-least-once; components must handle retries.
- Redrive and rerun behavior is driven by annotations and controller logic.

When designing components, assume retries, partial failure, and replays.
Use idempotency keys and structured errors to preserve correctness.

---

## Related reading

- [Core](core.md) — Workflow model and execution flow.
- [Architecture](architecture.md) — Module map, dependency graph, and runtime topology.
- [Durable Semantics](durable-semantics.md) — Delivery guarantees, recovery, and idempotency.
- [Error Contract](../api/errors.md) — Structured error contract for StepRuns.
- [CRD Design](../api/crd-design.md) — Resource model and relationships.
- [Primitives](../runtime/primitives.md) — Step types and cleanup blocks.
- [Go SDK](../sdk/go-sdk.md) — SDK entry points and usage patterns.
- [Building Engrams](../sdk/building-engrams.md) — Step-by-step component development guide.
- [Streaming Contract](../streaming/streaming-contract.md) — Streaming message rules.
- [Observability](../observability/overview.md) — Metrics, tracing, and debugging.
- [Quickstart](../getting-started/quickstart.md) — Get running in under 10 minutes.
- [Roadmap](../community/roadmap.md) — What's planned, what needs help.
