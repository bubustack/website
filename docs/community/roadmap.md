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
- **Go SDK** — Build Engrams and Impulses with testkit, conformance suites, secrets management, and the latest-only `StoryTrigger` / `EffectClaim` contract. Mounted runtime bundles, durability tightening, and streaming ABI consolidation are published follow-on tracks, not hidden backlog.
- **Storage offloading** — S3-compatible backends for large payloads.
- **Security** — RBAC, pod security defaults, guarded cross-namespace policies, and webhook validation. One manager-role reduction is still on the roadmap.

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
| Plugin/extension hooks on controller | Medium | Extended Story Hooks (planned near-term) |
| State recovery across StoryRun retries | Medium | External state store |
| Pub/sub between workflows | Medium | Extended Story Hooks + CloudEvents (planned near-term) |

### Operator maintenance backlog

| Item | Why it matters | Status |
| --- | --- | --- |
| **Transport streaming type consolidation** | Transport streaming settings are duplicated across `api/v1alpha1` and `api/transport/v1alpha1` (~530 LOC). Consolidating to a single source reduces maintenance burden and eliminates the adapter layer in `pkg/transport/settings.go`. | Backlogged — CRD schema change required |
| **Deprecated API cleanup** | Remove no-op legacy controllers (`internal/controller/transport/`), migrate `GetEventRecorderFor` to `GetEventRecorder` (6 controllers), clean stale nolint suppressions. | Backlogged — low effort, safe |

### Operator hardening backlog (current tree)

One verified architectural item remains in the operator:

| Item | Why it matters | Current safety posture | What remains |
| --- | --- | --- | --- |
| **Manager RBAC redesign for Secrets and runner identities** | The manager still needs cluster-wide `create/get/patch` on `Secret` and `ServiceAccount` objects to reconcile managed runner identities, trigger-data Secrets, and authorized cross-namespace S3 auth copies. | Runtime collision guards already refuse unmanaged or mismatched objects, so the current path no longer blindly adopts or overwrites existing names. | Redesign ownership and namespace boundaries so secret propagation and managed runner identity keep working without a broad cluster-scoped mutation grant. |

## Help us improve

We welcome folks who will improve the ecosystem quality, docs, codebase,
coverage, architecture, API design — or just share ideas and be active community
members.

**Concrete areas where we need help:**

- **Test the platform** — Deploy it, break it, and open issues in the owning repo. Runtime/platform bugs belong in [bobrapet](https://github.com/bubustack/bobrapet/issues); docs/site bugs belong in [website](https://github.com/bubustack/website/issues). Bug reports are contributions. Every issue helps us improve.
- **Improve documentation** — Fix gaps, add examples, clarify confusing sections. Good docs lower the barrier for everyone.
- **Component registry and CLI** — `bubu-registry` and the `bubu` CLI for scaffolding, publishing, and discovering components. Not built yet.
- **Operator security model hardening** — Redesign manager ownership/RBAC so secret propagation and managed runner identities keep working without broad cluster-wide `Secret` / `ServiceAccount` mutation grants.
- **New testkit development** — Improve harnesses, add assertion helpers, expand conformance suites.
- **New storage backends** — GCS, Azure Blob, and beyond. The S3 interface is the current boundary.
- **New SDKs** — Python SDK, TypeScript SDK. Same ABI contract as the Go SDK.
- **New transport operators** — Community-contributed transport adapters beyond Bobravoz gRPC. The Agentic Ingress Layer will provide a framework for pluggable protocol drivers.
- **New Engrams and Impulses** — Expand the [catalog](https://github.com/orgs/bubustack/repositories?q=engram). Every new component makes the platform more useful.
- **Ingress protocol drivers** — SIP, WebRTC, MQTT, and other inbound protocol adapters for the Agentic Ingress Layer.

### SDK contributor backlog (latest contract only)

The Go SDK now follows the latest-only trigger and effect contracts, but the
pre-release hardening backlog is still real. The items below are already
published and should be treated as the active SDK work queue, not as vague
future ideas.

Current pre-release rules:

- Optimize for the latest contract and the simplest correct implementation.
- Do not add backward-compatibility layers unless there is an explicit upgrade
  promise to protect.
- Keep `StoryTrigger` as the trigger-admission path and `EffectClaim` as the
  effect-reservation path until there is a deliberate contract change.
- Remove deprecated or transitional behavior instead of preserving it for
  hypothetical users.

#### Active SDK repo work

| Item | Why it matters | Current track |
| --- | --- | --- |
| **`ExecuteEffectOnce` completion ordering** | A completed `EffectClaim` must not outrun the `StepRun` mirror or replay semantics become ambiguous. | [bubu-sdk-go#68](https://github.com/bubustack/bubu-sdk-go/issues/68) |
| **Trigger admission and status-write pressure** | High-rate impulses still create avoidable API churn through polling and hot status patches. | [bubu-sdk-go#66](https://github.com/bubustack/bubu-sdk-go/issues/66), [bubu-sdk-go#67](https://github.com/bubustack/bubu-sdk-go/issues/67), [bubu-sdk-go#69](https://github.com/bubustack/bubu-sdk-go/issues/69), [RFC #78](https://github.com/orgs/bubustack/discussions/78) |
| **Durable replay state for effects and signals** | Bounded status rings are not the right durable authority for replay and dedupe decisions. | [bubu-sdk-go#70](https://github.com/bubustack/bubu-sdk-go/issues/70), [bubu-sdk-go#71](https://github.com/bubustack/bubu-sdk-go/issues/71), [RFC #76](https://github.com/orgs/bubustack/discussions/76) |
| **Streaming packet ABI cleanup** | The latest contract must settle raw-binary versus structured-envelope behavior before other SDKs are added. | [bubu-sdk-go#72](https://github.com/bubustack/bubu-sdk-go/issues/72), [bubu-sdk-go#73](https://github.com/bubustack/bubu-sdk-go/issues/73), [bubu-sdk-go#74](https://github.com/bubustack/bubu-sdk-go/issues/74), [RFC #77](https://github.com/orgs/bubustack/discussions/77) |
| **Runtime-bundle adoption** | The SDK needs a deliberate mounted-bundle loading path for the artifact-backed runtime plan. | [bobrapet#39](https://github.com/bubustack/bobrapet/issues/39) |
| **Docs, Godoc, and low-risk helper cleanup** | Small clarity fixes are still welcome as long as they do not widen contracts or reintroduce legacy behavior. | Start in `docs/sdk/go-sdk.md`, exported APIs, and targeted tests. |

#### Bobravoz transport hardening backlog

Bobravoz gRPC is a first-class transport surface in the published roadmap.
These are the active latest-only hardening tracks for the hub and connector
runtime.

| Item | Why it matters | Current track |
| --- | --- | --- |
| **Hub identity binding and connector supersession fencing** | The hub must trust workload identity, not caller metadata, and it must stop superseded connectors from continuing to influence live streams. | [bobravoz-grpc#44](https://github.com/bubustack/bobravoz-grpc/issues/44), [bobravoz-grpc#45](https://github.com/bubustack/bobravoz-grpc/issues/45) |
| **Buffer sizing and watch-driven completion tracking** | Default hub limits and polling-based completion loops still create unnecessary memory and API pressure. | [bobravoz-grpc#46](https://github.com/bubustack/bobravoz-grpc/issues/46), [bobravoz-grpc#47](https://github.com/bubustack/bobravoz-grpc/issues/47), [bobravoz-grpc#52](https://github.com/bubustack/bobravoz-grpc/issues/52) |
| **Telemetry and endpoint derivation cleanup** | High-cardinality metrics and hardcoded endpoint derivation make production rollouts harder to reason about and scale. | [bobravoz-grpc#48](https://github.com/bubustack/bobravoz-grpc/issues/48), [bobravoz-grpc#49](https://github.com/bubustack/bobravoz-grpc/issues/49), [RFC #78](https://github.com/orgs/bubustack/discussions/78) |
| **Admission availability posture** | The current fail-closed webhook stance needs either high availability or an explicitly different operational posture. | [bobravoz-grpc#50](https://github.com/bubustack/bobravoz-grpc/issues/50) |
| **Test harness isolation** | Bobravoz e2e work must stop depending on ambient kube state and broad cleanup outside owned resources. | [bobravoz-grpc#51](https://github.com/bubustack/bobravoz-grpc/issues/51) |

#### Contribution guardrails for SDK work

- Prefer additive tests first, then small code changes.
- Prefer removing pre-release complexity over adding compatibility shims.
- Do not reintroduce removed paths such as direct client-created `StoryRun`
  admission, legacy binding env payloads, or `Secrets.Raw()` unless the roadmap
  explicitly calls for a supported migration path.
- If a path only exists to preserve an unreleased older shape, delete it
  instead of adding another shim.
- Do not widen schemas or transport behavior “for compatibility” unless there
  is a real user-facing upgrade contract to preserve.
- If a change touches streaming or trigger/effect semantics, include exact
  failure mode and verification steps in the PR.
- If a change needs cross-repo coordination (`core`, `bobravoz-grpc`,
  `bobrapet`), open a design discussion before implementation.

## Release & activity signals

Track project activity from these source-of-truth pages:

- [BubuStack organization repositories](https://github.com/orgs/bubustack/repositories)
- [Examples releases](https://github.com/bubustack/examples/releases)
- [Bobrapet releases](https://github.com/bubustack/bobrapet/releases)
- [Go SDK releases](https://github.com/bubustack/bubu-sdk-go/releases)

## Vision

Where we want to take BubuStack, roughly in priority order.

### Near-term

- **Manager RBAC redesign** ([#38](https://github.com/bubustack/bobrapet/issues/38)) — Preserve secret propagation and managed runner identities without broad cluster-wide `Secret` / `ServiceAccount` mutation grants.
- **Artifact-backed runtime payload delivery** ([#39](https://github.com/bubustack/bobrapet/issues/39)) — Replace env-heavy runtime payload injection with mounted runtime bundles backed by `Secret`, `ConfigMap`, or shared storage depending on sensitivity and size. This should reduce pod-template churn, simplify SDK/runtime loading, and make large evaluated configs easier to inspect. It also requires companion SDK support so components can load runtime context from mounted files instead of only env vars.
- **Unified runtime durability contract** ([RFC #76](https://github.com/orgs/bubustack/discussions/76)) — Settle where signals, effects, and Bobravoz replay store durable truth so `StepRun.status` stays the summary mirror and replay decisions remain correct across restarts.
- **Canonical streaming ABI** ([RFC #77](https://github.com/orgs/bubustack/discussions/77)) — Finalize raw-binary versus structured-envelope rules, authoritative `MessageID` / `TimestampMs` fields, and packet-shape constraints across `tractatus`, Bobravoz, and the Go SDK before additional language SDKs ship.
- **Runtime telemetry offload path** ([RFC #78](https://github.com/orgs/bubustack/discussions/78)) — Move high-rate signal, effect, impulse, and streaming-runtime activity off hot CRD status writes while keeping useful operator observability.
- **Extended Story Hooks** ([#40](https://github.com/bubustack/bobrapet/issues/40)) — Inject events into running workflows from impulses,
  controllers, or external systems. Extends the existing lifecycle hook mechanism
  (`steprun.ready`, `storyrun.ready`) with external hook injection via the
  transport hub. Solves mid-execution event injection and enables feedback loops,
  cross-workflow pub/sub, and plugin hooks — without forking the operator.
- **Loop primitive** ([#41](https://github.com/bubustack/bobrapet/issues/41)) — Bounded iteration with exit conditions. Implemented as
  recursive `executeStory` under the hood. Doesn't violate DAG model.
- **Workflow checkpointing** ([#42](https://github.com/bubustack/bobrapet/issues/42)) — Durable execution semantics with automatic
  recovery from last checkpoint.
- **CloudEvents adoption** ([#43](https://github.com/bubustack/bobrapet/issues/43)) — Standardize impulse and hook events as
  [CloudEvents](https://cloudevents.io/) for interop with the CNCF ecosystem
  (Knative Eventing, Argo Events, Tekton Triggers). Low effort, high strategic
  value. This is also the boundary future SDK helpers and external runtimes
  should target instead of repo-local event wrappers.
- **Expand bubu-registry** — More Engrams, Impulses, and community templates.

### Medium-term

- **External integration architecture** ([RFC](https://github.com/orgs/bubustack/discussions/49)) — Agentic Ingress Layer
  (SIP, Twilio, WebRTC, MQTT, HTTP SSE), production MCP Gateway (session routing,
  circuit breakers, health monitoring), and Native A2A protocol support (AgentCard
  CRD for agent discovery). See the [RFC discussion](https://github.com/orgs/bubustack/discussions/49)
  for the full architecture proposal. Part of this work is clarifying whether
  Bobravoz-style external runtimes are samples or first-class ingress surfaces,
  plus how they attach correlation/session metadata to the transport layer.
- **Transport type consolidation** ([#44](https://github.com/bubustack/bobrapet/issues/44)) — Merge duplicated streaming settings
  across `api/v1alpha1` and `api/transport/v1alpha1` (~530 LOC).
- **Storage backend expansion** ([#45](https://github.com/bubustack/bobrapet/issues/45)) — Add GCS and Azure Blob drivers
  alongside existing S3-compatible backends.
- **Python SDK** ([RFC](https://github.com/orgs/bubustack/discussions/50)) — Same ABI contract as Go SDK. CloudEvents adoption makes the
  event contract language-agnostic, reducing SDK-specific code, but the
  transport/config ABI in `tractatus` and `core` also needs to converge on more
  typed contracts than today's flexible map-shaped transport config. It also
  depends on the canonical packet contract in [RFC #77](https://github.com/orgs/bubustack/discussions/77).
- **TypeScript SDK** ([RFC](https://github.com/orgs/bubustack/discussions/51)) — Same ABI contract as Go SDK. Like the Python SDK, this
  depends on tightening the shared transport/config ABI instead of carrying
  map-shaped transport descriptors into every new SDK. It also depends on the
  canonical packet contract in [RFC #77](https://github.com/orgs/bubustack/discussions/77).

### Long-term

- **Multi-cluster federation** ([#46](https://github.com/bubustack/bobrapet/issues/46)) — Global workflows across regions. CloudEvents
  and Agentic Ingress provide the cross-cluster event transport layer.
- **Compliance primitives** ([#47](https://github.com/bubustack/bobrapet/issues/47)) — Audit trail CRDs, cost attribution, EU AI Act
  traceability. CloudEvents envelope provides standardized provenance fields.
- **Mixed batch+streaming Stories** ([#48](https://github.com/bubustack/bobrapet/issues/48)) — Single Story with both patterns. Extended
  Hooks provides the data bridge between batch and streaming steps within a
  StoryRun.

## How to pick up work

1. Browse [operator/runtime issues](https://github.com/bubustack/bobrapet/issues),
   [Bobravoz transport issues](https://github.com/bubustack/bobravoz-grpc/issues),
   [Go SDK issues](https://github.com/bubustack/bubu-sdk-go/issues), or
   [website/docs issues](https://github.com/bubustack/website/issues),
   especially anything tagged `good first issue` or `help wanted`.
2. Comment on a roadmap item in
   [GitHub Discussions](https://github.com/bubustack/bobrapet/discussions) to
   coordinate.
3. For large features, open a design discussion before writing code.
4. See [Get Involved](get-involved.md) for contribution guidelines and the
   contributor ladder.
