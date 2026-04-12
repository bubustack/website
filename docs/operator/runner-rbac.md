---
title: Managed Runner RBAC
sidebar_position: 3
description: Default permissions for controller-managed Impulse and StoryRun runner identities, plus how to extend them safely.
---
# Managed Runner RBAC

Bobrapet creates namespaced `ServiceAccount`, `Role`, and `RoleBinding`
objects when it manages workload identity for you. This page explains the
default permission model and the supported ways to extend it.

## When the operator manages runner RBAC

The operator manages runner RBAC in two common cases:

- **Impulse workloads** use a controller-managed ServiceAccount when
  `spec.execution.serviceAccountName` is unset or resolves to `default`. The
  ServiceAccount is named `<impulse>-impulse-runner`.
- **Story step workloads** use a controller-managed ServiceAccount when no
  custom `serviceAccountName` resolves for the step. The ServiceAccount is
  named `<storyrun>-engram-runner`.

If you set a custom `serviceAccountName`, the operator does **not** manage the
Role or RoleBinding for that workload. You own the permissions for that
ServiceAccount.

## SDK helper minimum permissions

These are the minimum Kubernetes permissions required by the common SDK helper
paths:

| Helper / behavior | Required permissions |
| --- | --- |
| `sdk.StartStory(...)` / `sdk.StartStoryWithToken(...)` | `storytriggers` `create`,`get`; `storyruns` `get` |
| `sdk.StopStory(...)` | `storyruns` `get`; `storyruns/status` `patch` |
| Impulse trigger metrics and throttle counters | `impulses` `get`; `impulses/status` `patch` |
| Component-specific Impulse metadata updates | Usually `impulses` `patch` on the owning `Impulse` |

The SDK returns a resolved `StoryRun`, but the durable admission object is
`StoryTrigger`. In other words, trigger-capable clients should be permissioned
for `StoryTrigger` submission first, then `StoryRun` readback.

## Controller-managed defaults

### Managed Impulse runners

A controller-managed Impulse runner Role is intended to cover the common SDK
trigger path:

- submit `StoryTrigger` requests
- read the resolved `StoryRun`
- stop a `StoryRun` when the trigger workload calls `sdk.StopStory(...)`
- patch `Impulse.status` for trigger counters and throttling telemetry

If your Impulse writes extra metadata to the parent `Impulse` object, add that
explicitly with `execution.rbac.rules`.

### Managed Story step runners

A controller-managed Story runner Role covers the baseline step-runtime control
plane:

- `stepruns` `get`,`watch`
- `stepruns/status` `patch`,`update`
- `effectclaims` `get`,`create`,`update`
- `transportbindings` `get`,`list`,`watch`
- `transportbindings/status` `get`,`patch`,`update`

For Story step runners, extra permissions should stay narrow and namespaced.
Prefer resource-name-scoped reads such as a single `ConfigMap` or `Secret`.

## How to extend the defaults

Runner RBAC is extended in two layers:

- **Template defaults**
  - `EngramTemplate.spec.execution.rbac.rules`
  - `ImpulseTemplate.spec.execution.rbac.rules`
- **Instance-level additions**
  - `Engram.spec.overrides.rbac.rules`
  - `Impulse.spec.execution.rbac.rules`

These rules should be treated as **additive** to the controller-managed
baseline, not a replacement for it.

### Example: add a named ConfigMap read to an Engram

```yaml
apiVersion: bubustack.io/v1alpha1
kind: Engram
metadata:
  name: summarizer
spec:
  templateRef:
    name: openai-chat
  overrides:
    rbac:
      rules:
        - apiGroups: [""]
          resources: ["configmaps"]
          resourceNames: ["summarizer-prompts"]
          verbs: ["get"]
```

### Example: add Impulse metadata patch access

```yaml
apiVersion: bubustack.io/v1alpha1
kind: Impulse
metadata:
  name: livekit-webhook
spec:
  templateRef:
    name: livekit-webhook
  storyRef:
    name: livekit-voice-assistant
  execution:
    rbac:
      rules:
        - apiGroups: ["bubustack.io"]
          resources: ["impulses"]
          resourceNames: ["livekit-webhook"]
          verbs: ["get", "patch"]
```

## Custom ServiceAccounts

If you set `serviceAccountName` explicitly:

- the operator will not create or update the runner Role
- the operator will not create or update the runner RoleBinding
- you must grant the minimum SDK permissions yourself

Use the table above as the contract for custom identities.

## Practical guidance

- Prefer controller-managed runner identities unless you already have a
  namespace policy that requires a pre-provisioned ServiceAccount.
- Prefer `resourceNames`-scoped rules over broad reads.
- Keep Impulse trigger permissions focused on `StoryTrigger` submission and
  `StoryRun` readback.
- Keep component-specific permissions in the template or instance that needs
  them, not in cluster-wide shared Roles.

## Related docs

- [Go SDK](../sdk/go-sdk.md)
- [StoryTrigger](../api/story-trigger.md)
- [Core Concepts](../overview/core.md)
- [Operator Configuration](configuration.md)
