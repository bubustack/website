---
title: Roadmap
sidebar_position: 2
description: What BubuStack can do today, what's missing, and where we're headed. Help us build it faster.
---
# Roadmap

BubuStack is a working platform. You can deploy it today. But we're honest
about the gaps — and transparent about what comes next.

**Want these features sooner? Join the team.** Early contributors shape the
project. We use an open contributor ladder: Contributor → Reviewer → Maintainer.
Ship code, get recognized, grow your role. See [Get Involved](get-involved.md).

## What works today

- **Batch workflows** — DAG-based Stories with steps, conditions, parallel execution, gates, and waits.
- **Streaming workflows** — Long-lived topologies with Bobravoz gRPC transport, backpressure, flow control.
- **Reusable components** — Growing catalog of [Engrams](https://github.com/orgs/bubustack/repositories?q=engram) and [Impulses](https://github.com/orgs/bubustack/repositories?q=impulse) with versioned templates.
- **GitOps-native** — Every resource is a CRD. Deploy with Flux, Argo CD, or plain kubectl.
- **Observability** — OpenTelemetry tracing, structured errors, step-level metrics.
- **Go SDK** — Build Engrams and Impulses with testkit, conformance suites, and secrets management.
- **Storage offloading** — S3-compatible backends for large payloads.
- **Security** — RBAC, pod security defaults, cross-namespace policies, webhook validation.

## Known gaps

These are real limitations. They affect what you can build today.

| Gap | Impact | Workaround |
| --- | --- | --- |
| **No feedback loops / cycles** | Can't do "retry with LLM feedback until quality > 0.8". DAG-only by design. | Chain `executeStory` with conditions |
| **No durable execution** | Pod dies mid-workflow, no automatic replay from checkpoint. | External state store + step retries |
| **No mutable shared state** | Steps communicate only through immutable DAG edges. No shared KV store. | Pass state through step outputs |
| **No mid-execution event injection** | Can't inject events into running workflows (except gate/wait primitives). | Gate primitives for simple cases |
| **No mixed batch+streaming** | A Story is either batch OR streaming. Not both. | Separate Stories with Impulse chaining |

### Addressable gaps (contributors welcome)

| Gap | Impact | Workaround today |
| --- | --- | --- |
| Dynamic step spawning at runtime | High for AI agents | `map-reduce-adapter` Engram |
| Custom template functions | Medium | Modify `core/templating/funcs.go` |
| Plugin/extension hooks on controller | Medium | Fork bobrapet |
| State recovery across StoryRun retries | Medium | External state store |
| Pub/sub between workflows | Medium | External event bus |

## Help us improve

We welcome folks who will improve the ecosystem quality, docs, codebase,
coverage, architecture, API design — or just share ideas and be active community
members.

**Concrete areas where we need help:**

- **Test the platform** — Deploy it, break it, [open issues](https://github.com/bubustack/bobrapet/issues). Bug reports are contributions. Every issue helps us improve.
- **Improve documentation** — Fix gaps, add examples, clarify confusing sections. Good docs lower the barrier for everyone.
- **Component registry and CLI** — `bubu-registry` and the `bubu` CLI for scaffolding, publishing, and discovering components. Not built yet.
- **New testkit development** — Improve harnesses, add assertion helpers, expand conformance suites.
- **New storage backends** — GCS, Azure Blob, and beyond. The S3 interface is the current boundary.
- **New SDKs** — Python SDK, TypeScript SDK. Same ABI contract as the Go SDK.
- **New transport operators** — Community-contributed transport adapters beyond Bobravoz gRPC.
- **New Engrams and Impulses** — Expand the [catalog](https://github.com/orgs/bubustack/repositories?q=engram). Every new component makes the platform more useful.

## Release & activity signals

Track project activity from these source-of-truth pages:

- [BubuStack organization repositories](https://github.com/orgs/bubustack/repositories)
- [Examples releases](https://github.com/bubustack/examples/releases)
- [Bobrapet releases](https://github.com/bubustack/bobrapet/releases)
- [Go SDK releases](https://github.com/bubustack/bubu-sdk-go/releases)

## Vision

Where we want to take BubuStack, roughly in priority order.

### Near-term

- **Loop primitive** — Bounded iteration with exit conditions. Implemented as
  recursive `executeStory` under the hood. Doesn't violate DAG model.
- **Workflow checkpointing** — Durable execution semantics with automatic
  recovery from last checkpoint.
- **Interactive tutorial** — Time-to-first-workflow under 5 minutes.
- **Expand bubu-registry** — More Engrams, Impulses, and community templates.

### Medium-term

- **Native A2A protocol support** — Agent-to-agent negotiation as first-class
  CRDs (`AgentBinding`, `AgentTransport`). MCP was donated to the Linux
  Foundation in December 2025 ([Linux Foundation announcement](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation))
  — being the first K8s-native platform with A2A/MCP CRDs is a significant differentiator.
- **MCP gateway** — First-class BubuStack component for Model Context Protocol.
- **Python SDK** — Same ABI contract as Go SDK.

### Long-term

- **Multi-cluster federation** — Global workflows across regions.
- **Compliance primitives** — Audit trail CRDs, cost attribution, EU AI Act
  traceability.
- **Mixed batch+streaming Stories** — Single Story with both patterns.

## How to pick up work

1. Browse [open issues](https://github.com/bubustack/bobrapet/issues) tagged
   `good first issue` or `help wanted`.
2. Comment on a roadmap item in
   [GitHub Discussions](https://github.com/bubustack/bobrapet/discussions) to
   coordinate.
3. For large features, open a design discussion before writing code.
4. See [Get Involved](get-involved.md) for contribution guidelines and the
   contributor ladder.
