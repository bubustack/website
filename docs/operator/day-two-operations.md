---
title: Day-2 Operations
sidebar_position: 2
description: Operate the Bobrapet control plane with confidence—observability, scaling, security, and upgrade strategies.
---
# Day-2 Operations

:::info Quick scan
- **Why**: Operate the Bobrapet control plane with the observability, scaling, and security guardrails production teams expect.
- **When**: Reach for these runbooks once your first Stories are live and you need to harden SLAs across clusters.
- **How**: Instrument controller metrics, tune transports, and manage upgrades through GitOps pipelines.
:::

Bobrapet is designed to feel like any other Kubernetes-native operator, but a few patterns help you
run it at scale. This guide covers observability hooks, scaling levers, security hardening, and
upgrade tactics so your Stories stay reliable across clusters.

## Control Plane Observability

- **Controller metrics** — Scrape `bobrapet-controller-manager` via the `/metrics` endpoint. Key
  series include `bobustack_story_runs_inflight`, `bobustack_step_runs_restarts_total`, and
  reconciliation latency histograms.
- **Structured events** — The controller emits Kubernetes events for validation failures,
  reconciliation retries, and template drift. Tail them with
  `kubectl get events -n bobrapet-system --field-selector involvedObject.kind=StoryRun`.
- **Tracing** — When OpenTelemetry is configured (see Helm chart values), every StepRun emits spans
  with the Story name, Engram, and transport metadata. Forward spans to Tempo, Jaeger, or Datadog.
- **Audit trail** — StoryRuns record a `status.timeline`. Ship it to your data warehouse to correlate
  cluster behaviour with business SLAs.

## Scaling and Resilience

- **Controller replicas** — Scale the controller Deployment horizontally. Only one leader processes
  reconciliation at a time, but extra replicas reduce failover time.
- **Story throughput** — Use `spec.rollout.parallelism` on Stories to control concurrency without
  writing glue code. Pair it with Kubernetes ResourceQuotas per namespace.
- **Step retries** — Configure `spec.rollout.backoff` to tune retry attempts, exponential delay, and
  jitter. It integrates cleanly with the Engram SDK’s idempotency helpers.
- **Transport elasticity** — For Bobravoz gRPC, enable the HorizontalPodAutoscaler using the built-in
  `bobravoz_streams_inflight` metric. Buffering and backpressure signals propagate through the hub.
- **Batch vs streaming** — Prefer `job` mode for finite work; switch to `deployment` or
  `statefulset` for long-running Engrams that need persistent connections.
- **Community extensions** — Additional transports follow the same autoscale metrics once they are
  contributed and validated by the community.

## Security & Multi-Tenancy

- Install Bobrapet in a dedicated namespace (`bobrapet-system`) with restricted PodSecurity
  standards.
- Scope API permissions through the provided ClusterRoles; avoid granting cluster-admin to end
  users. Namespace-level RBAC and impersonation cover most scenarios.
- Use `spec.mounts.secrets` and Kubernetes Secrets for credentials. The controller automatically
  injects them as volume mounts.
- Enable validating webhooks (default) to block Engrams or Stories that violate policy, such as
  disallowed images or missing annotations.
- Separate teams by namespace and pair them with LimitRanges + ResourceQuotas. Stories reference
  Engrams in the same namespace by default.

## Upgrades & GitOps

1. **Pin versions** — Reference Bobrapet and transport operator manifests by digest or semantic tag
   in your Git repository.
2. **Stage changes** — Apply new controller images in staging clusters first; StoryRuns remain
   backward compatible thanks to the stable ABI.
3. **Schema drift** — Compare CRD versions with `kubectl diff -f <crd.yaml>` before applying. The
   admission webhook blocks incompatible manifests.
4. **Zero-downtime upgrades** — Scale the Deployment to two replicas, update the image, and drain the
   old pod only after the new version becomes leader.
5. **Automated promotion** — Use pipeline jobs to open PRs bumping the manifest references across
   environments once smoke tests pass.

## Runbooks & SLOs

- **Slow Stories** — Check `status.timeline` for long poles, then drill into StepRun logs. Investigate
  Engram resource requests or transport congestion.
- **Failed StoryRuns** — The `status.conditions` array includes reason codes. Use `kubectl describe
  storyrun <name>` for event context.
- **Transport alerts** — Configure alerts around Bobravoz metrics: message drop rate, active stream
  count, and reconnection attempts.
- **Capacity planning** — Track Engram CPU/memory usage with your existing observability tooling.
  Right-size requests and configure autoscalers for long-lived runtimes.
- **Disaster recovery** — Because the system is declarative, rehydrate the control plane by applying
  manifests in a new cluster. Persist StoryRun history by shipping telemetry to external storage.

## Next steps

- Learn to craft reusable units in the [Engram Authoring Guide](../engrams/authoring.md).
- Explore transport tuning in [Bobravoz Operations](../transports/bobravoz.md).
- Share improvements or incident learnings with the community via
  [Contribution Pathways](../community/contributing.md).
