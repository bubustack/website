---
title: StoryTrigger
description: Durable trigger-admission request for external events.
---
# StoryTrigger

`StoryTrigger` is the durable admission object for external trigger delivery.
Impulses and other trusted SDK clients submit `StoryTrigger` requests; the
controller validates the request, creates or reuses the target `StoryRun`, and
records the durable decision in status.

If the accepted trigger payload is larger than
`storyrun.max-inline-inputs-size`, the controller offloads the resulting
`StoryRun.spec.inputs` to shared storage before creating the run. Large
trigger-driven workflows therefore still require Bobrapet shared storage
(`controller.storage.*`) even when the trigger request itself is accepted.

## Why it exists

Before `StoryTrigger`, the SDK created `StoryRun` objects directly from trigger
helpers. That made ambiguous create failures hard to reason about and pushed too
much trigger-idempotency logic into the client.

`StoryTrigger` moves the durable boundary earlier:

1. client submits a durable request
2. controller decides `Created`, `Reused`, or `Rejected`
3. client reads back the resolved `StoryRun`

## Shape

```yaml
apiVersion: runs.bubustack.io/v1alpha1
kind: StoryTrigger
metadata:
  name: github-pr-review-trigger-b9876960c1879825
  namespace: github-pr-review
spec:
  storyRef:
    name: pr-review-assistant
  deliveryIdentity:
    mode: token
    key: github:pull_request:37
    inputHash: 4f530b2d9b7fce9bc9f0dd0f7fd0d7f47b4f0ab6d7bcf9c5880aa9d75ab0d9b6
    submissionId: github:pull_request:37
  inputs:
    event: pull_request
    action: opened
status:
  decision: Created
  storyRunRef:
    name: pr-review-assistant-abc123
```

## Key fields

| Field | Meaning |
| --- | --- |
| `spec.storyRef` | Target Story to execute. |
| `spec.deliveryIdentity.mode` | `none`, `token`, or `key`. |
| `spec.deliveryIdentity.key` | Stable business identity when dedupe is required. |
| `spec.deliveryIdentity.inputHash` | Canonical input hash paired with the business key. |
| `spec.deliveryIdentity.submissionId` | Logical submission-chain identifier reused across retries. |
| `status.decision` | Controller-owned durable result: `Pending`, `Created`, `Reused`, or `Rejected`. |
| `status.storyRunRef` | Resolved `StoryRun` once the request completes. |

## Naming rule

`metadata.name` is deterministic. It is derived from:

- story namespace
- story name
- `deliveryIdentity.key` when present
- otherwise `deliveryIdentity.submissionId`

This allows retries to find the same durable request instead of creating
multiple admission objects.

## Decision meanings

| Decision | Meaning |
| --- | --- |
| `Pending` | Controller has not finished resolving the request yet. |
| `Created` | Controller created a new `StoryRun`. |
| `Reused` | A matching existing `StoryRun` was found and reused. |
| `Rejected` | The request identity conflicted or failed validation. |

## SDK behavior

The Go SDK trigger helpers submit `StoryTrigger` and wait for resolution:

```go
ctx = sdk.WithTriggerToken(ctx, "github:pull_request:37")
run, err := sdk.StartStory(ctx, "pr-review-assistant", inputs)
```

The helper still returns a `StoryRun`, but the durable admission authority is
the `StoryTrigger`.

## Client RBAC

Trusted clients that submit `StoryTrigger` requests need:

- `storytriggers` `create`,`get`
- `storyruns` `get`

If the same client also stops active stories through the SDK, it additionally
needs:

- `storyruns/status` `patch`

Managed Impulse runner identities should cover this baseline automatically.
Custom ServiceAccounts must bind these permissions explicitly. See
[Managed Runner RBAC](../operator/runner-rbac.md).

## Debugging

```bash
kubectl get storytrigger -n <namespace>
kubectl get storytrigger <name> -n <namespace> -o yaml
kubectl get storyrun <name> -n <namespace> -o yaml
```

Look at:

- `status.decision`
- `status.reason`
- `status.message`
- `status.storyRunRef`

## Related docs

- [Managed Runner RBAC](../operator/runner-rbac.md)
- [Durable Semantics](../overview/durable-semantics.md)
- [CRD Design](./crd-design.md)
- [Go SDK](../sdk/go-sdk.md)
