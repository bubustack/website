---
title: Webhook Reference
sidebar_position: 5
description: Understand the admission webhooks Bobrapet registers and how to operate them.
---

# Webhooks Reference

Validating/Mutating webhooks enforce invariants and protect the API server from oversized objects.

## Story (Validating/Defaulting)

- Enforces total object size &lt; 1 MiB.
- Enforces `spec.output` size &lt;= operator limit.
- Validates step uniqueness, ref/type exclusivity, and dependency existence.

Evidence:
```go title="internal/webhook/v1alpha1/story_webhook.go#L152-L178"
const maxTotalStorySizeBytes = 1 * 1024 * 1024 // 1 MiB
...
if story.Spec.Output != nil && len(story.Spec.Output.Raw) > maxSize { ... }
```

## Engram (Validating/Defaulting)

- Requires `spec.templateRef.name`.
- `spec.with` must be a JSON object; size &lt;= operator `DefaultMaxInlineSize`.
- Validates `with` against the template's `configSchema` when present.

```go title="internal/webhook/v1alpha1/engram_webhook.go#L168-L174"
maxBytes := v.Config.Engram.EngramControllerConfig.DefaultMaxInlineSize
if len(engram.Spec.With.Raw) > maxBytes { ... }
```

## Impulse (Validating/Defaulting)

- Requires `spec.templateRef.name` and `spec.storyRef.name`.
- `spec.with` and `spec.mapping` must be JSON objects; size &lt;= operator limit.
- `spec.workload.mode` must not be `job`.

```go title="internal/webhook/v1alpha1/impulse_webhook.go#L167-L226"
if len(impulse.Spec.With.Raw) > maxBytes { ... }
if impulse.Spec.Workload != nil && impulse.Spec.Workload.Mode == "job" { ... }
```

## StepRun (Validating)

- Requires `spec.storyRunRef.name` and `spec.stepId`.
- `spec.input` must be a JSON object; size &lt;= operator limit.
- `status.output` size &lt;= operator limit on updates.
- Total object size &lt; 1 MiB.

```go title="internal/webhook/runs/v1alpha1/steprun_webhook.go#L118-L161"
if sr.Spec.Input != nil && len(sr.Spec.Input.Raw) > 0 { ... }
if sr.Status.Output != nil && len(sr.Status.Output.Raw) > maxBytes { ... }
const maxTotalStepRunSizeBytes = 1 * 1024 * 1024
```
