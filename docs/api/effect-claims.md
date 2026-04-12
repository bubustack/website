---
title: EffectClaim
description: Durable reservation and completion authority for step side effects.
---
# EffectClaim

`EffectClaim` is the durable authority for one StepRun side effect. It gives
the SDK a first-class reservation object for:

- cross-process duplicate suppression
- stale-owner recovery
- long-running effect renewal
- durable completion state

`StepRun.status.effects` remains the append-only observability mirror. It is not
the lock.

## Why it exists

Exactly-once side effects cannot be solved by step status alone. `EffectClaim`
adds a dedicated compare-and-swap object so one worker can reserve, renew, and
complete an effect while other workers see the same durable state.

## Shape

```yaml
apiVersion: runs.bubustack.io/v1alpha1
kind: EffectClaim
metadata:
  name: pr-review-assistant-abc123-review-code-eff-89abcdef01234567
  namespace: github-pr-review
spec:
  stepRunRef:
    name: pr-review-assistant-abc123-review-code
    uid: 11111111-2222-3333-4444-555555555555
  effectKey: github.review.comment
  idempotencyKey: storyrun/pr-review-assistant-abc123/step/review-code/github.review.comment
  holderIdentity: pod/pr-review-runner-0
  leaseDurationSeconds: 600
  completionStatus: completed
status:
  phase: Completed
```

## Key fields

| Field | Meaning |
| --- | --- |
| `spec.stepRunRef` | Owning StepRun identity. |
| `spec.effectKey` | Stable effect key within the StepRun. |
| `spec.idempotencyKey` | Optional business idempotency key mirrored from the step. |
| `spec.holderIdentity` | Current reservation owner. |
| `spec.acquireTime` / `spec.renewTime` | Reservation timing used for stale recovery. |
| `spec.leaseTransitions` | Count of stale takeovers. |
| `spec.completionStatus` | `completed`, `released`, or `abandoned`. |
| `status.phase` | Canonical summary: `Reserved`, `Completed`, `Released`, `Abandoned`. |

## Lifecycle

1. SDK creates the `EffectClaim` to reserve the effect key.
2. While the effect is running, the SDK renews the claim.
3. On success, the SDK marks the claim completed.
4. On failure, the SDK releases the claim so a retry can acquire it later.
5. If a worker dies and the claim becomes stale, another worker can recover it.

## SDK behavior

Use `sdk.ExecuteEffectOnce(...)` for the full reservation flow:

```go
result, already, err := sdk.ExecuteEffectOnce(ctx, "provider.call", func(effectCtx context.Context) (any, error) {
    return provider.Do(effectCtx, request)
})
```

This prevents concurrent duplicate execution for the same effect key across
workers, but you should still pass stable business idempotency keys to the
external provider when it supports them.

## Retention

`EffectClaim` follows `StepRun` retention:

- it carries an owner reference to the StepRun
- normal garbage collection removes it with the StepRun
- orphaned or UID-drifted claims are cleaned by the controller

## Debugging

```bash
kubectl get effectclaim -n <namespace>
kubectl get effectclaim <name> -n <namespace> -o yaml
kubectl get steprun <name> -n <namespace> -o yaml
```

Look at:

- `spec.holderIdentity`
- `spec.renewTime`
- `spec.completionStatus`
- `status.phase`

## Related docs

- [Durable Semantics](../overview/durable-semantics.md)
- [CRD Design](./crd-design.md)
- [Go SDK](../sdk/go-sdk.md)
