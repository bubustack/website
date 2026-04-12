---
title: Durable Semantics
description: Delivery guarantees, retry boundaries, and idempotency expectations.
---
# Durable Semantics

This document defines the current durability guarantees and limits in BubuStack.
It is a contract for operators, SDK users, and workflow authors.

## Who this is for

- Operators who need to understand durability and recovery guarantees.
- Workflow authors who care about retries and idempotency.
- [SDK](https://github.com/bubustack/bubu-sdk-go)/component authors implementing correct behavior on failures.

## What you'll get

- The exact delivery guarantees and failure boundaries.
- How retries, redrive, and cleanup behave.
- The constraints you must design around for correctness.

---

## Delivery model (current)

- External trigger admission now uses a durable `StoryTrigger` request object.
  The SDK no longer creates `StoryRun`s directly from the trigger helper path.
- Each logical submission must reuse the same
  `StoryTrigger.spec.deliveryIdentity.submissionId` across retries. The
  controller owns the durable decision and records `Pending`, `Created`,
  `Reused`, or `Rejected` on `StoryTrigger.status.decision`.
- When trigger dedupe mode is `token` or `key`, the request identity includes a
  stable business key plus canonical `inputHash`. Reusing the key with
  different inputs is rejected.
- When trigger dedupe mode is `none`, BubuStack is still at-least-once at the
  event level, but one logical SDK submission chain no longer fans out into
  multiple `StoryRun`s because retries reuse the same `submissionId`.
- [Impulses](https://github.com/orgs/bubustack/repositories?q=impulse) can
  configure dedupe, retry, and throttling via `spec.deliveryPolicy` and
  `spec.throttle`. The SDK enforces the client-side submission behavior and the
  controller owns the final trigger resolution.
- StepRun creation is idempotent for [Engram](https://github.com/orgs/bubustack/repositories?q=engram)-backed steps because controllers derive
  deterministic StepRun names from StoryRun name and step name.
- Step execution is at-least-once. A StepRun may execute multiple times because
  retries and job recreation can re-run the same step.
- Side-effect reservation uses durable `EffectClaim` objects. The SDK renews,
  recovers, and completes those claims across workers while mirroring summaries
  into `StepRun.status.effects`.

Published durability follow-up for this area lives in
[bubu-sdk-go#68](https://github.com/bubustack/bubu-sdk-go/issues/68),
[bubu-sdk-go#70](https://github.com/bubustack/bubu-sdk-go/issues/70),
[bubu-sdk-go#71](https://github.com/bubustack/bubu-sdk-go/issues/71), and
[RFC #76](https://github.com/orgs/bubustack/discussions/76).

## Explicit delivery guarantees (current)

The guarantees below are the explicit contract boundaries for BubuStack today.

- **Trigger admission**
  - **Durable per `StoryTrigger` request**. Retries for the same logical
    submission resolve through one request object.
  - **At-least-once across distinct events** when no stable business key is
    supplied.
  - **Idempotent for identical inputs** when `token` or `key` dedupe mode is
    used and the same business key + input hash are reused.
- **StoryRun creation**
  - Controller-owned and driven from the resolved `StoryTrigger` decision.
- **StepRun creation**
  - **Idempotent per step** for Engram-backed steps: StepRun names are derived
    deterministically from StoryRun name + step name.
- **Step execution**
  - **At-least-once**. Retries and Job recreation can re-run the same step.
- **Effects**
  - **Single active owner per effect key** via `EffectClaim`.
  - Completed claims suppress re-execution across workers.
  - External systems should still use stable business idempotency keys where
    available to protect against crash-after-side-effect-before-claim-complete
    windows.
- **Signals**
  - **Best-effort** delivery. No ordering or replay guarantee unless signal
    sequences are used and persisted in the StepRun status.
- **Streaming transport** ([bobravoz-grpc](https://github.com/bubustack/bobravoz-grpc))
  - **Best-effort by default**. When `delivery.semantics=at_least_once` and replay
    is enabled, the hub provides at-least-once delivery with replay on reconnect.
    Completion is tracked when the downstream Engram finishes a packet, not when
    the SDK first reads it. In-memory buffers can still drop messages on overflow
    in best-effort modes. See [Transport Settings](../streaming/transport-settings.md).

Published replay and packet-contract hardening for streaming lives in
[bobravoz-grpc#44](https://github.com/bubustack/bobravoz-grpc/issues/44),
[bobravoz-grpc#45](https://github.com/bubustack/bobravoz-grpc/issues/45),
[bubu-sdk-go#73](https://github.com/bubustack/bubu-sdk-go/issues/73),
[bubu-sdk-go#74](https://github.com/bubustack/bubu-sdk-go/issues/74), and
[RFC #77](https://github.com/orgs/bubustack/discussions/77).

---

## Delivery matrix (current)

| Operation | Guarantee | Notes |
| --- | --- | --- |
| StoryTrigger submission (`dedupe.mode=none`) | Durable per submission, at-least-once across events | Retries reuse one submission ID; distinct events should use distinct submission IDs. |
| StoryTrigger submission (`dedupe.mode=token` or `key`) | Idempotent for identical inputs | Reusing the same key with different inputs is rejected. |
| StoryRun creation | Controller-owned from `StoryTrigger` resolution | Returns `Created`, `Reused`, or `Rejected` through the request object. |
| StepRun creation (Engram-backed step) | Idempotent per step | Deterministic names prevent duplicate StepRuns for the same step. |
| Step execution | At-least-once | Retries and job recreation can re-run steps. |
| Effect execution via `ExecuteEffectOnce` | One active owner per effect key | `EffectClaim` prevents concurrent duplicate execution and supports stale recovery. |
| Signals | Best-effort | No ordering or replay guarantees. |
| Streaming transport (default) | Best-effort | At-least-once when delivery semantics + replay are enabled; replayed sequenced packets are suppressed only after downstream completion. |

---

## Trigger delivery policy

[Impulse](https://github.com/orgs/bubustack/repositories?q=impulse) delivery
policy controls how triggers dedupe and retry durable `StoryTrigger`
submission. It is configured
on `ImpulseTemplate.spec.deliveryPolicy` and can be overridden per
`Impulse.spec.deliveryPolicy`.

Dedupe modes:
- `none`: no cross-event deduplication; distinct events should use distinct
  `submissionId` values.
- `token`: a trigger token must be provided; the SDK uses it as the durable
  business key.
- `key`: the SDK derives a durable business key from `dedupe.keyTemplate`.

Key templates are evaluated deterministically with the SDK template engine. The
template can reference:
- `inputs` (trigger payload map)
- `story.name` and `story.namespace`
- `impulse.name` and `impulse.namespace`

Retry schedule (trigger delivery, not step execution):
- `maxAttempts`: total attempts including the first.
- `baseDelay`: initial retry delay (Go duration string).
- `maxDelay`: cap for computed delays.
- `backoff`: `exponential`, `linear`, or `constant`.

Retries are only attempted for retryable Kubernetes API errors. Repeated
attempts for the same logical submission reuse the same `StoryTrigger`
identity. For `token` / `key` modes the controller compares the stable business
key and canonical `inputHash`; if inputs differ, the request is rejected.

Custom clients that do not use the [SDK](https://github.com/bubustack/bubu-sdk-go)
must implement the same behavior to respect the policy.

---

## Retry and idempotency expectations

- Retries are controlled by StepRun retry policies and can re-execute steps.
- Trigger delivery retries are separate from StepRun retries and only govern
  `StoryTrigger` submission and controller resolution.
- Safe retry requires idempotent external side effects or external idempotency keys.
- Use stable identifiers derived from StoryRun and StepRun identity for idempotency keys.
- Preserve the original trigger identity at the event source and reuse it for
  retries so replays resolve to the same `StoryTrigger` and `StoryRun`.

---

## Effects, idempotency, and `EffectClaim`

BubuStack now provides a first-class effect reservation authority:

- `EffectClaim` is the durable claim object for one StepRun + effect key
- `sdk.ExecuteEffectOnce(...)` creates, renews, recovers, and completes that claim
- `StepRun.status.effects` remains the append-only summary and audit mirror

What this gives you:

- no concurrent duplicate execution for the same effect key across workers
- stale reservation recovery after crashed workers
- renewal for long-running effects so active work is not taken over spuriously

What it does **not** magically guarantee:

- a non-idempotent external system can still duplicate work if a process
  completes the side effect and crashes before the claim is completed
- step execution itself remains at-least-once

Recommended pattern:

1. Generate a stable business idempotency key from StoryRun / StepRun identity.
2. Use `sdk.ExecuteEffectOnce(...)` for the reservation, renewal, and recovery path.
3. Pass the same business idempotency key to the external system when it
   supports it.
4. Treat `StepRun.status.effects` as the run-history mirror, not the lock.

---

## SDK usage patterns

The following examples use [bubu-sdk-go](https://github.com/bubustack/bubu-sdk-go).
See [Go SDK](../sdk/go-sdk.md) for the full API reference.

Example: durable trigger submission with a stable identity.

```go
ctx := sdk.WithTriggerToken(ctx, "source-event-id-123")
run, err := sdk.StartStory(ctx, "my-story", inputs)
```

Example: stable idempotency keys for external side effects.

```go
key := fmt.Sprintf("storyrun/%s/step/%s", run.Name, stepID)
```

Example: reserve and complete an effect once per effect key.

```go
result, already, err := sdk.ExecuteEffectOnce(ctx, "provider.call", func(effectCtx context.Context) (any, error) {
	return provider.Do(effectCtx, request)
})
if errors.Is(err, sdk.ErrEffectAlreadyRecorded) || already {
	return
}
_ = result
```

---

## Recovery rules (current)

- On [bobrapet](https://github.com/bubustack/bobrapet) controller restart, StoryRun reconciliation rehydrates StepState from existing
  StepRuns and merges terminal phases without clobbering completed steps.
- StepRun reconciliation reattaches to the Job by name when it exists.
- If a Job is missing while a StepRun is still non-terminal, a new Job is created
  and the step is re-executed.
- Resume vs restart rules:
  - **Resume**: if the Job exists, the controller resumes monitoring and sets the StepRun to `Running`
    when it was still `Pending`.
  - **Restart**: if the Job is missing after a prior execution, the controller recreates the Job and
    records restart metadata on the StepRun.
  - Restart metadata is tracked via annotations:
    - `runs.bubustack.io/job-uid` (last observed Job UID)
    - `runs.bubustack.io/restart-count` (monotonic restart counter)
    - `runs.bubustack.io/restarted-at` (RFC3339 timestamp)
- `gate` and `wait` steps remain paused until their conditions are satisfied or
  timeouts apply; gate decisions live in StoryRun status.
- StoryRun redrive is annotation-driven: set `storyrun.bubustack.io/redrive-token`
  to a new value. The controller deletes child StepRuns/StoryRuns, clears step
  timers, resets StoryRun status, and re-runs with the same spec/inputs. StoryRun
  spec remains immutable; redrive uses metadata only. The controller records the
  last processed token in `storyrun.bubustack.io/redrive-observed`.
- Partial rerun-from-step is also annotation-driven: set
  `storyrun.bubustack.io/redrive-from-step` to `<step-name>:<token>`. The
  controller records the last processed value in
  `storyrun.bubustack.io/redrive-from-step-observed`.

---

## Timers and schedules

- Story timeouts are enforced by the DAG reconciler.
- `wait` and `gate` support poll intervals and timeouts.
- `sleep` uses a durable timer persisted on the StoryRun (annotation-backed) and
  pauses execution until the deadline is reached.
- Timer precision is bounded by reconcile cadence and controller requeue delays.
- Cron/schedules are implemented as an external impulse (see
  [cron-impulse](https://github.com/bubustack/cron-impulse) for implementation details).

---

## State persistence and history

- Durable request and execution state is stored across `StoryTrigger`,
  `StoryRun`, `StepRun`, and `EffectClaim`.
- Large payloads are stored via storage references instead of inline status data.
- There is no durable event history log today; retention is managed by StoryRun
  retention settings and controller cleanup.
- Status updates are eventually consistent at the object level and follow a
  last-writer-wins model.
- Operational visibility relies on Kubernetes Events (best-effort, not durable,
  not replayable). BubuStack does not persist a workflow event history log.
- Resource size guardrails are intentional: signals/effects are bounded lists,
  signal payloads are capped, and large payloads must be offloaded to storage
  refs. Avoid writing large aggregates to status.

---

## Signals and events

- Step-level signals are written to StepRun status and merged into step context.
- Signal delivery is best-effort. `status.signals` stores a compact latest-value summary,
  not the raw emitted payload.
- Signal **events** are appended to `status.signalEvents` with a monotonic sequence
  number for replay. The list is bounded; older events may be trimmed.
- The SDK exposes a replay helper that reads `status.signalEvents` and returns
  events after a given sequence number.
- Ordering is by `signalEvents[].seq` when available. The `status.signals` map is
  last-writer-wins and is intended for “latest value” lookups over summarized state.
- Streaming transport buffers ([bobravoz-grpc](https://github.com/bubustack/bobravoz-grpc)) are in-memory and can drop messages on overflow.
- Kubernetes Events are used for operational diagnostics (e.g., retries, restarts,
  blocked templates) and should not be treated as a durable signal channel.

---

## External side effects guidance

- Write durable state before invoking external side effects when possible.
- Use idempotency keys derived from StoryRun or StepRun identity for external calls.
- Use `EffectClaim` as the durable reservation / completion authority and treat
  StepRun `status.effects` as the append-only observability mirror.
- Prefer transactional outbox patterns or external systems that provide exactly-once
  guarantees when needed.
- [SDK](https://github.com/bubustack/bubu-sdk-go) helper for effect dedupe:

```go
result, already, err := sdk.ExecuteEffectOnce(ctx, key, func(ctx context.Context) (any, error) {
	// perform side effect, return safe details for the effect ledger
	return map[string]any{"providerId": "abc"}, nil
})
if errors.Is(err, sdk.ErrEffectAlreadyRecorded) || already {
	// effect already recorded; skip duplicate side effects
}
_ = result
```

---

## Related references

- [Core](core.md) — Core resources and execution flow.
- [Architecture](architecture.md) — Module map and dependency graph.
- [Component Ecosystem](component-ecosystem.md) — SDK usage, contracts, and component catalog.
- [Primitives](../runtime/primitives.md) — Step semantics and gate/wait behavior.
- [Lifecycle](../runtime/lifecycle.md) — Phase and terminal rules.
- [Inputs](../runtime/inputs.md) and [Payloads](../runtime/payloads.md) — Size limits and storage refs.
- [CRD Design](../api/crd-design.md) — Resource model and policy resolution chains.
- [Error Contract](../api/errors.md) — Structured error contract for StepRuns.
- [Go SDK](../sdk/go-sdk.md) — SDK entry points and usage patterns.
- [Streaming Contract](../streaming/streaming-contract.md) — Streaming message rules.
- [Transport Settings](../streaming/transport-settings.md) — Backpressure, routing, replay, and delivery semantics.
- [Operator Configuration](../operator/configuration.md) — Controller defaults and scheduling keys.
- [Roadmap](../community/roadmap.md) — Durable execution and checkpointing are on the roadmap.
