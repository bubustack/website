# BubuStack Documentation

Welcome to the BubuStack docs. This index gives you a fast path into the core
workflow model, component ecosystem, and reliability semantics, with deep dives
by topic. The docs are grouped by themes to keep navigation simple.

---

## Quick routes

- **Building components**: `/docs/overview/component-ecosystem.md`, `/docs/runtime/inputs.md`, `/docs/api/errors.md`.
- **Operating the platform**: `/docs/operator/configuration.md`, `/docs/runtime/lifecycle.md`, `/docs/observability/overview.md`.
- **Streaming-first systems**: `/docs/streaming/streaming-contract.md`, `/docs/streaming/transport-settings.md`.

## System pillars

These pillars describe the full BubuStack platform. Each entry links to the best
starting docs for that area.

- **System Architecture** (Module structure, dependencies, runtime topology): `/docs/overview/architecture.md`
- **Workflow Foundations** (Core workflow model): `/docs/overview/core.md`, `/docs/api/crd-design.md`
- **Execution Engine** (Runs, scheduling, primitives): `/docs/runtime/primitives.md`, `/docs/runtime/lifecycle.md`
- **Durable Semantics** (Delivery guarantees, idempotency): `/docs/overview/durable-semantics.md`
- **Eventing and Triggers** (Impulses, triggers, dispatch): `/docs/overview/component-ecosystem.md`, `/docs/api/errors.md`
- **Engram Ecosystem** (SDKs, contracts, registry): `/docs/overview/component-ecosystem.md`, `/docs/runtime/inputs.md`
- **Streaming and Real-Time Workflows** (Transport contract + settings): `/docs/streaming/streaming-contract.md`, `/docs/streaming/transport-settings.md`
- **Observability and Debugging** (Tracing, metrics, logs): `/docs/observability/overview.md`
- **Security, Governance, Multi-Tenancy** (Scoping, versioning, policies): `/docs/api/scoping.md`, `/docs/api/versioning.md`
- **Operations and Lifecycle** (Operator config, upgrades, run lifecycle): `/docs/operator/configuration.md`, `/docs/runtime/lifecycle.md`, `/docs/api/migration.md`

## Recommended path (start to finish)

1. `/docs/overview/architecture.md` - System architecture, module map, and dependency rules.
2. `/docs/overview/core.md` - The workflow model, key resources, and execution flow.
3. `/docs/overview/component-ecosystem.md` - SDKs, contracts, registry patterns, and reliability semantics.
4. `/docs/overview/durable-semantics.md` - Delivery guarantees, recovery rules, and idempotency expectations.
5. `/docs/operator/configuration.md` - Operator configuration keys and defaults.
6. `/docs/api/crd-design.md` - Resource model, scopes, and relationships.
7. `/docs/runtime/primitives.md` - Step types, cleanup blocks, and batch-only primitives.
8. `/docs/runtime/expressions.md` - Templates, contexts, determinism, and materialization.
9. `/docs/runtime/inputs.md` - Schema defaults and validation rules.
10. `/docs/runtime/payloads.md` - Payload storage, size limits, and storage references.
11. `/docs/runtime/caching.md` - Output caching keys, modes, and TTLs.
12. `/docs/runtime/lifecycle.md` - StoryRun/StepRun lifecycle, phases, and reason codes.
13. `/docs/observability/overview.md` - Tracing, metrics, logs, and debugging flows.
14. `/docs/api/scoping.md` - Namespace boundaries and reference rules.
15. `/docs/api/versioning.md` - Version pinning behavior and compatibility.
16. `/docs/api/migration.md` - CRD version lifecycle, upgrade procedures, and conversion webhook plan.
17. `/docs/api/errors.md` - Structured error contract for StepRuns.
18. `/docs/streaming/streaming-contract.md` - Streaming data contract and message rules.
19. `/docs/streaming/transport-settings.md` - Streaming backpressure, flow control, and delivery settings.

---

## Streaming-focused path

If you're building real-time pipelines, use this shorter path:

1. `/docs/streaming/streaming-contract.md` - Message contract, ordering, and control semantics.
2. `/docs/streaming/transport-settings.md` - Backpressure, routing, replay, partitioning, and recording.
3. `/docs/observability/overview.md` - Streaming metrics, traces, and debugging tips.
4. `/docs/overview/durable-semantics.md` - Delivery guarantees and replay expectations.

---

## Docs layout (by folder)

- `/docs/overview/` - The conceptual model and durable semantics.
- `/docs/operator/` - Operator configuration and runtime knobs.
- `/docs/api/` - CRD design, scoping, versioning, and error contracts.
- `/docs/runtime/` - Step semantics, expressions, inputs, payloads, caching, and lifecycle.
- `/docs/streaming/` - Streaming contract and transport configuration.
- `/docs/observability/` - Tracing, metrics, logs, and debugging workflows.

---

## By topic

| Topic | Start here | What you'll learn |
| --- | --- | --- |
| System architecture | `/docs/overview/architecture.md` | Module map, dependency graph, runtime topology, import rules. |
| Workflow model | `/docs/overview/core.md` | Core resources, DAG execution, batch vs streaming. |
| Component ecosystem | `/docs/overview/component-ecosystem.md` | SDKs, contracts, registry patterns, reliability semantics. |
| Durable semantics | `/docs/overview/durable-semantics.md` | Delivery guarantees, recovery rules, and idempotency expectations. |
| Operator configuration | `/docs/operator/configuration.md` | Config keys, defaults, and why they exist. |
| CRD design | `/docs/api/crd-design.md` | Resource scopes, relationships, and contracts. |
| Error contract | `/docs/api/errors.md` | Structured error payloads and retry classifications. |
| Step semantics | `/docs/runtime/primitives.md` | Built-in steps, cleanup flow, batch-only primitives. |
| Expressions | `/docs/runtime/expressions.md` | Template engine, allowed contexts, determinism rules. |
| Inputs & schemas | `/docs/runtime/inputs.md` | Defaults, validation, schema application. |
| Payloads | `/docs/runtime/payloads.md` | Inline vs storage refs, size limits, offload rules. |
| Caching | `/docs/runtime/caching.md` | Output cache keys, modes, and TTLs. |
| Lifecycle | `/docs/runtime/lifecycle.md` | Phases, reasons, and terminal semantics. |
| Observability | `/docs/observability/overview.md` | Tracing, metrics, logs, and debugging workflows. |
| Scoping | `/docs/api/scoping.md` | Namespace rules and cross-namespace policy. |
| Versioning | `/docs/api/versioning.md` | Version pinning and migration strategy. |
| CRD migration | `/docs/api/migration.md` | API version lifecycle, upgrade procedures, conversion webhooks. |
| Streaming contract | `/docs/streaming/streaming-contract.md` | Streaming message contract and termination rules. |
| Transport settings | `/docs/streaming/transport-settings.md` | Streaming backpressure, flow control, and delivery settings. |

---

## Docs style guide

- `/docs/style-guide.md` - Writing conventions for BubuStack docs.

---

If you're new, start with `/docs/overview/core.md` and move down the recommended path.
