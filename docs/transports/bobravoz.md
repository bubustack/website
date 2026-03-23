---
title: Bobravoz gRPC
sidebar_position: 2
description: Configure and operate the Bobravoz gRPC transport for low-latency streaming between Engrams.
---
# Bobravoz gRPC Transport

:::info Quick scan
- **Why**: Operate the Bobravoz transport for low-latency Story streaming across Engrams.
- **When**: Enable Bobravoz once your Stories handle real-time payloads or require backpressure-aware routing.
- **How**: Install the operator, annotate Stories, tune annotations, and monitor hub metrics.
:::

Bobravoz is the first transport in the Bubustack ecosystem. It provides a low-latency gRPC hub that
connects streaming Engrams, evaluates primitives in-flight, and exposes rich observability for data
meshes. This guide covers installation, configuration, and day-2 operations.

## Capabilities

- **Intelligent topology** — Picks peer-to-peer links when Stories connect Engrams directly and
  switches to hub-and-spoke routing when primitives require inline evaluation.
- **Active data plane** — Runs a hub server that can transform, filter, and enrich payloads using CEL
  expressions defined in your Story.
- **Resilient streaming** — Provides buffering, flow control, and retry semantics while preserving
  ordering guarantees.
- **Observability out of the box** — Emits Prometheus metrics (`bobravoz_streams_inflight`,
  `bobravoz_messages_processed_total`, `bobravoz_backpressure_events_total`) and structured logs with
  Story and Step context.
- **Secure by default** — Generates per-Story mTLS certificates so Engrams authenticate the hub and
  each other without manual secret management.

## Architecture at a Glance

The transport operator runs both a Kubernetes controller (control plane) and an active hub (data
plane). Engrams connect to the hub over gRPC, and the hub evaluates primitives, buffers payloads,
and relays data downstream.

```
┌─────────────────────────────────────────────────────────────┐
│                      Kubernetes Cluster                     │
│  ┌──────────────────────────┐      ┌──────────────────────┐ │
│  │ TransportController      │─────▶│ Configure Engrams    │ │
│  │ (Control Plane)          │      │ (env vars, services) │ │
│  └──────────────────────────┘      └──────────────────────┘ │
│                ▲                                   │        │
│                │                   gRPC             │        │
│  ┌─────────────┴────────────┐   connections   ┌─────▼──────┐│
│  │ Hub Server (Data Plane)  │◀────────────────▶ Bobravoz Hub││
│  └─────────────▲────────────┘                 └────────────┘│
│                │                                           ││
│      ┌─────────┴─────────┐         ┌─────────┴─────────┐   ││
│      │ Engram A (source) │────────▶│ Engram B (sink)   │   ││
│      └───────────────────┘         └───────────────────┘   ││
└─────────────────────────────────────────────────────────────┘
```

The controller inspects each Story to decide whether to provision peer-to-peer (direct) links or
route traffic through the hub for primitive evaluation and buffering.

## Connection Topologies

Bobravoz automatically chooses the optimal topology:

- **Peer-to-peer** — Lowest latency path where Engrams connect directly. The controller selects this
  when Stories simply chain Engrams without inline primitives.
- **Hub-and-spoke** — Default when Stories mix Engrams with `transform`, `filter`, or other CEL
  primitives. Payloads flow through the hub so primitives run in-flight, buffering absorbs
  downstream slowdowns, and autoscaling keeps pace with spikes.

Use the `bobravoz.bubustack.io/topology` annotation to override auto-detection per Story or per
Engram when you already know the optimal mode.

## When to Use Bobravoz

Reach for this transport when:

- Story `spec.pattern` is `streaming`.
- You need sub-second latency or inline primitive evaluation between Engrams.
- Buffering and backpressure must be enforced centrally instead of in every Engram.
- You want the hub to emit Prometheus metrics and Grafana-ready dashboards for stream health.

Batch-only Stories can continue to rely on the default StepRun Job orchestration—no transport
required.

## Quick Start (Streaming Story)

1. Install the operator:

   ```bash
   kubectl apply -f https://github.com/bubustack/bobravoz-grpc/releases/latest/download/install.yaml
   ```

2. Declare a streaming Story with the transport annotation:

   ```yaml title="clusters/dev/stories/streaming.yaml"
   apiVersion: bubustack.io/v1alpha1
   kind: Story
   metadata:
     name: my-streaming-pipeline
     annotations:
       bobravoz.bubustack.io/transport: grpc
   spec:
     pattern: streaming
     steps:
       - name: ingest
         ref:
           name: ingest-source
       - name: transform
         type: transform
         with:
           expr: '{"processed": true, "data": payload}'
       - name: sink
         ref:
           name: analytics-sink
   ```

3. Trigger a run (or wire an Impulse). The operator configures Engram env vars, establishes hub
   endpoints, and evaluates primitives in-flight without further YAML.

## Installation

Apply the latest transport bundle or add it to your GitOps repo:

```bash
kubectl apply -f https://github.com/bubustack/bobravoz-grpc/releases/latest/download/install.yaml
```

Verify the deployment:

```bash
kubectl get pods -n bobravoz-system
kubectl logs deploy/bobravoz-controller-manager -n bobravoz-system | tail
```

The namespace hosts both the controller (control plane) and hub Deployment (data plane). Scale each
independently based on load.

## Annotate a Story

```yaml title="clusters/dev/stories/streaming.yaml"
apiVersion: bubustack.io/v1alpha1
kind: Story
metadata:
  name: streaming-pipeline
  namespace: realtime
  annotations:
    bubustack.io/transport: bobravoz-grpc
spec:
  pattern: streaming
  steps:
    - name: ingest
      ref: log-ingestor
    - name: transform
      ref: transform
      type: primitive
      with:
        expr: '{"message": payload.message, "tenant": payload.meta.account}'
    - name: store
      ref: analytics-sink
```

The annotation signals Bobrapet to request Bobravoz endpoints. During reconciliation Bobravoz
provisions gRPC targets for each StepRun and injects them through the SDK.

## Transport Configuration

Fine-tune behaviour through annotations:

| Annotation                                  | Effect                                                          |
|---------------------------------------------|-----------------------------------------------------------------|
| `bobravoz.bubustack.io/topology`            | Force `p2p` or `hub` routing instead of auto detection.         |
| `bobravoz.bubustack.io/max-buffer-messages` | Configure per-stream buffering (default: 1024).                 |
| `bobravoz.bubustack.io/hub-service`         | Pin a hub Service when running multiple hubs per environment.   |

TLS is now controlled through the Engram spec (`spec.transport.tls`). Set `secretRef` for a custom
Secret or `useDefaultTLS: true` to use the shared operator default.

Apply annotations on Stories or individual Engrams depending on scope.

## Controller defaults

The Bobrapet controller now reads transport defaults from its configuration ConfigMap. These keys
let you target non-default namespaces or override the hub endpoint without modifying code:

```yaml title="bobrapet-system/config/operator-config.yaml"
data:
  controller.transport.provider: grpc
  controller.transport.grpc.hub-service: bobravoz-grpc-hub
  controller.transport.grpc.hub-namespace: realtime-transports
  controller.transport.grpc.hub-cluster-domain: svc.cluster.local
  controller.transport.grpc.hub-port: "9000"
  controller.transport.grpc.hub-endpoint: ""        # optional, takes precedence when set
  controller.transport.grpc.enable-downstream-targets: "true"
```

- `controller.transport.provider` selects the transport binder (`grpc` today, future transports plug
  in without changing controller code).
- You can point to a hub running in a different namespace or even a separate cluster by setting
  `hub-namespace`, `hub-service`, and `hub-endpoint`.
- Set `enable-downstream-targets` to `false` when you do not want Bobrapet to pre-compute
  downstream gRPC endpoints for StepRuns (e.g., when another transport operator owns the wiring).

If you deploy multiple transports side-by-side, keep these defaults focussed on Bobravoz and supply
Story-level annotations to select other adapters as they become available.

## Observability

Scrape the hub Deployment for metrics and add dashboards:

```bash
kubectl -n bobravoz-system port-forward deploy/bobravoz-hub 9090:9090
curl localhost:9090/metrics
```

Recommended alerts:

- `bobravoz_backpressure_events_total > 0` over 5 minutes.
- `rate(bobravoz_stream_reconnects_total[5m])` above expected thresholds.
- 99th percentile latency from `bobravoz_stream_latency_seconds`.

Logs include Story name, Engram step, stream ID, and retry attempts—index them alongside your
application telemetry.

## Scaling

- **Hub replicas** — Scale `bobravoz-hub` horizontally; each replica handles disjoint stream
  partitions.
- **Controller replicas** — Run at least two copies of `bobravoz-controller-manager` for availability.
- **Autoscaling** — Enable the provided HorizontalPodAutoscaler using `streams_inflight` as a custom
  metric.

## Troubleshooting

| Symptom                          | Action                                                            |
|----------------------------------|-------------------------------------------------------------------|
| Streams stuck in `Connecting`    | Check TLS secrets, ensure Engrams have the right service account. |
| High buffering latency           | Increase hub replicas or reduce `max-buffer-messages`.            |
| CEL primitive evaluation errors  | Tail hub logs; invalid expressions are surfaced with context.     |
| Dropped messages                 | Inspect `bobravoz_dropped_messages_total` and StepRun conditions. |

## Next steps

- Share adapter requests and extensions via the [community backlog](../community/roadmap.md).
- Instrument Engrams with the [Go SDK transport helpers](../sdk/go-sdk.md#transport-targets).
- Contribute adapters or features via the [community pathways](../community/contributing.md).
