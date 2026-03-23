---
title: Impulses
sidebar_position: 4
description: Impulses are triggers that launch Bubustack StoryRuns from schedules, events, and external systems.
---
# Impulses

:::info Quick scan
- **Why**: Trigger Bubustack Stories from schedules, events, and external systems without embedding custom glue code.
- **When**: Configure Impulses once your Story is ready for real-world inputs or automation.
- **How**: Select an ImpulseTemplate, map payloads into the Story schema, and monitor trigger telemetry.
:::

An **Impulse** activates a Story. Impulses watch for external events—cron schedules, webhooks, queue
messages, or custom signals—and create new StoryRuns when conditions match. By keeping Impulses
separate from Stories you can reuse the same workflow across different trigger patterns and
environments.

## Impulse Anatomy

```yaml
apiVersion: bubustack.io/v1alpha1
kind: Impulse
metadata:
  name: nightly-rag-refresh
  namespace: platform
spec:
  templateRef: cron-impulse
  storyRef:
    name: refresh-search-index
  with:
    schedule: "0 2 * * *"
    payload:
      dataset: marketing-pages
```

- **`templateRef`** — Points to an `ImpulseTemplate` that describes the trigger implementation.
- **`storyRef`** — Indicates the Story to run.
- **`with`** — Configuration block validated by the template schema.

## Supported Patterns

Common Impulse templates include:

- **Cron** — Launch Stories on a schedule using standard cron expressions.
- **Webhook** — Receive HTTP callbacks and extract payloads to pass into Story inputs.
- **Queue subscribers** — Connect to event buses (e.g., SQS) via declarative templates or your own custom integrations.
- **Manual trigger** — Allow operators or other services to request a StoryRun via a CLI or API.

Because Impulses are Kubernetes resources, you can build your own templates that reflect how your
organization integrates with upstream systems.

| Template | Trigger type | Transport compatibility | Notes |
| --- | --- | --- | --- |
| `cron-impulse` | Cron schedule | Bobravoz | Emits predictable StoryRuns for maintenance jobs. |
| `sqs-impulse` | AWS SQS queue | Bobravoz | Includes dead-letter queue support. |
| `webhook-impulse` | HTTPS callback | All transports | Verifies HMAC signatures before triggering. |

## Story Payloads

Impulses can attach payloads that become `inputs` for the StoryRun. Static payloads live in the
Impulse spec, while dynamic payloads come from the triggering event (HTTP body, queue message, etc.).
Templates define how to map incoming data into the Story schema.

## Observability

- Impulse controllers emit events on success or failure.
- Status conditions capture the last trigger time, failure reasons, and backoff state.
- Metrics record trigger counts, latency, and error rates so you can plug them into your dashboards.

## Retries & Backoff

Impulse templates can implement retry policies. For example, a queue-based template may automatically
acknowledge or requeue a message, while a cron template might record the failure and wait for the
next scheduled tick. You can extend the template interface to support dead-letter queues or circuit
breakers.

## Best Practices

- Keep Impulse configuration minimal and declarative; push business logic into Stories and Engrams.
- Use separate Impulses per environment (dev, staging, prod) even if the Story is the same.
- Monitor Impulse metrics to ensure triggers are firing as expected.

## Next steps

- Continue with [Primitives](primitives.md) to model control flow inside Stories.
- Reference [Story debugging](overview.md#debugging) to monitor triggered runs.
- Propose new templates through the [community backlog](../community/roadmap.md).
