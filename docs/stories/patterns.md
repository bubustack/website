---
title: Building Stories
sidebar_position: 2
description: Compose Engrams, Impulses, and Primitives into production-ready automation workflows.
---
# Building Stories

:::info Quick scan
- **Why**: Compose multi-step Stories that combine Engrams, Primitives, and Impulses into production workflows.
- **When**: Apply these patterns once your catalog includes reusable Engrams and you need end-to-end orchestration.
- **How**: Model input schemas, connect Engrams with CEL expressions, branch using Primitives, and trigger runs via Impulses.
:::

In this guide you'll assemble a multi-step Story that ingests support tickets, enriches them with an
LLM, and routes high-priority issues to the right on-call channel. You'll see how to wire Engrams
together, pass data between steps, and use Primitives for control flow while keeping everything under
GitOps.

## Scenario

We will build the `triage-support-ticket` Story. It expects a ticket payload, performs three actions,
and conditionally escalates urgent tickets:

1. Normalize the ticket payload.
2. Summarize the issue using a language model Engram.
3. Detect sentiment and urgency.
4. Use a `condition` primitive to decide whether to escalate.

## 1. Define Inputs

Start by describing the expected input schema. This gives you validation and better tooling.

```yaml
apiVersion: bubustack.io/v1alpha1
kind: Story
metadata:
  name: triage-support-ticket
  namespace: ops
spec:
  inputsSchema:
    type: object
    required: ["ticketId", "subject", "body"]
    properties:
      ticketId:
        type: string
      subject:
        type: string
      body:
        type: string
      customerTier:
        type: string
        enum: ["free", "pro", "enterprise"]
```

## 2. Add Engram Steps

```yaml
  steps:
    - name: normalize
      ref: ticket-normalizer
      with:
        customerTier: "{{ inputs.customerTier | default('free') }}"

    - name: summarize
      ref: llm-summarizer
      with:
        prompt: |
          Summarize this support ticket in 3 bullet points:
          {{ steps.normalize.outputs.cleaned_body }}

    - name: score-sentiment
      ref: sentiment-analyzer
      with:
        text: "{{ steps.normalize.outputs.cleaned_body }}"
```

- The `normalize` Engram cleans up the ticket body.
- The `summarize` Engram uses a multi-turn LLM call with the cleaned text.
- The `score-sentiment` Engram returns metrics like `sentiment` and `urgency`.

## 3. Branch with a Primitive

```yaml
    - name: escalate
      ref: condition
      with:
        if: >
          steps.score-sentiment.outputs.urgency == "high" ||
          (inputs.customerTier == "enterprise" &&
           steps.score-sentiment.outputs.sentiment == "negative")
        then:
          ref: pagerduty-notifier
          with:
            ticketId: "{{ inputs.ticketId }}"
            summary: "{{ steps.summarize.outputs.summary }}"
        else:
          ref: crm-updater
          with:
            ticketId: "{{ inputs.ticketId }}"
            notes: "{{ steps.summarize.outputs.summary }}"
```

The `condition` primitive selects a branch based on the sentiment score and customer tier. Both
branches reuse data from prior steps.

## 4. Add Metadata and Policies

Stories can define annotations and rollout policies:

```yaml
  rollout:
    parallelism: 5
    backoff:
      attempts: 3
      factor: 1.5
  annotations:
    bubustack.io/owner: "Support Platform Team"
    bubustack.io/runbook: "https://runbooks.example.com/support-triage"
```

## 5. Trigger the Story

Create an Impulse to launch the Story when new tickets arrive—e.g. an SQS subscriber template:

```yaml
apiVersion: bubustack.io/v1alpha1
kind: Impulse
metadata:
  name: ticket-created
  namespace: ops
spec:
  templateRef: sqs-impulse
  storyRef:
    name: triage-support-ticket
  with:
    queueUrl: https://sqs.us-east-1.amazonaws.com/123456789/tickets
```

:::note Transport extensions
Impulses route payloads over Bobravoz today. Future adapters reuse the same declarative `storyRef`
contract, so no Story changes are required when contributors add them.
:::

## 6. Observe the Run

When tickets flow in, monitor them:

```bash
kubectl get storyrun -n ops
kubectl get steprun -n ops --selector=storyName=triage-support-ticket
```

Tail logs:

```bash
kubectl logs job/steprun-<run>-summarize -n ops
```

### Inspect StoryRuns {#inspect-storyruns}

- Use `kubectl describe storyrun <name>` to examine `status.timeline` and pinpoint latency.
- Export StepRun outputs via `kubectl get steprun <name> -o jsonpath='{.status.outputs}'` for quick checks.
- Replay payloads by capturing `spec.inputs` and re-submitting through a new StoryRun in staging.

## Tips for Production

- Define alerts based on the `StoryRun` latency histogram.
- Capture redacted copies of step inputs for auditing with `env.ReportArtifact`.
- Use namespaces per environment (e.g., `ops-dev`, `ops-prod`) and promote Stories via GitOps.

With this Story in place, your support platform has a repeatable, observable automation.

## Next steps

- Explore [Story debugging techniques](../stories/overview.md#debugging) to harden telemetry.
- Define declarative triggers in [Impulses](impulses.md).
- Discover additional control-flow helpers in [Primitives](primitives.md).
