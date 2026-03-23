---
title: Bobravoz Metrics Reference
sidebar_position: 5
description: All Prometheus series emitted by the transport hub plus scraping guidance.
---

# Metrics Reference

The bobravoz-grpc hub exposes Prometheus metrics for monitoring message flow, buffer utilization, and stream health.

## Metrics Endpoint

- **URL**: `https://<pod-ip>:8443/metrics`
- **Authentication**: Bearer token (ServiceAccount)
- **TLS**: Enabled by default (cert-manager or self-signed)

## Hub Metrics

### Message Flow Metrics

#### `bobravoz_grpc_messages_received_total`

**Type**: Counter  
**Labels**: `storyrun`, `step`  
**Description**: Total number of messages received by the hub from upstream engrams.

**Use Cases**:
- Monitor ingress throughput
- Detect upstream failures (rate drops to 0)
- Capacity planning

**Example Queries**:
```promql
# Messages per second by StoryRun
rate(bobravoz_grpc_messages_received_total[1m])

# Total ingress rate
sum(rate(bobravoz_grpc_messages_received_total[1m]))

# Top 5 StoryRuns by message volume
topk(5, sum by (storyrun) (rate(bobravoz_grpc_messages_received_total[5m])))
```

---

#### `bobravoz_grpc_messages_sent_total`

**Type**: Counter  
**Labels**: `storyrun`, `step`  
**Description**: Total number of messages successfully sent by the hub to downstream engrams.

**Use Cases**:
- Monitor egress throughput
- Detect downstream failures (`egress << ingress`)
- Calculate end-to-end success rate

**Example Queries**:
```promql
# Messages per second by downstream step
rate(bobravoz_grpc_messages_sent_total[1m])

# Egress/Ingress ratio (should be ~1.0)
sum(rate(bobravoz_grpc_messages_sent_total[5m])) 
/ sum(rate(bobravoz_grpc_messages_received_total[5m]))

# Throughput delta (messages buffered or dropped)
sum(rate(bobravoz_grpc_messages_received_total[1m])) 
- sum(rate(bobravoz_grpc_messages_sent_total[1m]))
```

---

#### `bobravoz_hub_messages_dropped_total`

**Type**: Counter  
**Labels**: `storyrun`, `step`  
**Description**: Total number of messages dropped due to buffer overflow. **This should always be 0 in production.**

**Use Cases**:
- **Critical alert**: Any drops indicate capacity issues
- Trigger autoscaling
- Identify slow downstream engrams

**Alert Rule**:
```yaml
- alert: BobravozHubDroppingMessages
  expr: rate(bobravoz_hub_messages_dropped_total[5m]) > 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Hub dropping messages"
    description: "{{ $labels.storyrun }}/{{ $labels.step }}: {{ $value }} msg/s dropped"
```

**Example Queries**:
```promql
# Any drops in last 5 minutes? (should return empty)
increase(bobravoz_hub_messages_dropped_total[5m]) > 0

# Drop rate per step
rate(bobravoz_hub_messages_dropped_total[1m])

# Total drops since startup
sum(bobravoz_hub_messages_dropped_total)
```

---

### Stream Health Metrics

#### `bobravoz_grpc_requests_total`

**Type**: Counter  
**Labels**: `method`, `code`  
**Description**: Total number of streaming RPC requests completed, labeled by gRPC status code.

**Use Cases**:
- Monitor stream error rate
- Detect authentication/authorization failures
- Track connection churn

**Example Queries**:
```promql
# Successful RPCs (code="OK")
rate(bobravoz_grpc_requests_total{code="OK"}[5m])

# Error rate by status code
sum by (code) (rate(bobravoz_grpc_requests_total{code!="OK"}[5m]))

# Overall error rate
sum(rate(bobravoz_grpc_requests_total{code!="OK"}[5m])) 
/ sum(rate(bobravoz_grpc_requests_total[5m]))
```

**Common Status Codes**:
- `OK`: Stream completed successfully
- `Canceled`: Client cancelled (expected during shutdown)
- `InvalidArgument`: Missing metadata
- `DeadlineExceeded`: Operation timeout
- `Unavailable`: Server overloaded or unreachable

---

#### `bobravoz_grpc_request_duration_seconds`

**Type**: Histogram  
**Labels**: `method`  
**Buckets**: `[.1, .5, 1, 5, 10, 30, 60, 300]` seconds  
**Description**: Duration of streaming RPC calls from establishment to closure.

**Use Cases**:
- Monitor stream lifetime
- Detect stuck connections
- Capacity planning (streams * avg_duration = active streams)

**Example Queries**:
```promql
# P50 request duration
histogram_quantile(0.50, 
  rate(bobravoz_grpc_request_duration_seconds_bucket[5m])
)

# P99 request duration
histogram_quantile(0.99, 
  rate(bobravoz_grpc_request_duration_seconds_bucket[5m])
)

# Average request duration
rate(bobravoz_grpc_request_duration_seconds_sum[5m]) 
/ rate(bobravoz_grpc_request_duration_seconds_count[5m])

# Requests lasting > 60 seconds
increase(bobravoz_grpc_request_duration_seconds_bucket{le="60"}[5m])
```

---

## Controller Runtime Metrics

The hub also exposes standard controller-runtime metrics:

### `controller_runtime_reconcile_total`

**Type**: Counter  
**Labels**: `controller`, `result`  
**Description**: Total reconciliations by the TransportController.

```promql
# Reconcile rate
rate(controller_runtime_reconcile_total{controller="bobravoz-grpc"}[5m])

# Error rate
rate(controller_runtime_reconcile_total{result="error"}[5m])
```

### `workqueue_depth`

**Type**: Gauge  
**Labels**: `name`  
**Description**: Current depth of the controller's work queue.

```promql
# Work queue backlog
workqueue_depth{name="bobravoz-grpc"}
```

### `rest_client_requests_total`

**Type**: Counter  
**Labels**: `code`, `method`, `host`  
**Description**: Kubernetes API calls made by the controller.

```promql
# API call rate
rate(rest_client_requests_total[5m])

# API error rate
rate(rest_client_requests_total{code=~"5.."}[5m])
```

---

## Metric Collection Setup

### Prometheus Scrape Config

If not using ServiceMonitor:

```yaml
scrape_configs:
  - job_name: 'bobravoz-grpc'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - bobrapet-system
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_control_plane]
        action: keep
        regex: controller-manager
      - source_labels: [__meta_kubernetes_pod_name]
        target_label: pod
      - source_labels: [__meta_kubernetes_namespace]
        target_label: namespace
    scheme: https
    tls_config:
      insecure_skip_verify: true
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
```

### Grafana Dashboard JSON

Key panels for a hub dashboard:

```json
{
  "dashboard": {
    "title": "bobravoz-grpc Hub",
    "panels": [
      {
        "title": "Message Throughput",
        "targets": [
          {
            "expr": "sum(rate(bobravoz_grpc_messages_received_total[1m])) by (storyrun)",
            "legendFormat": "{{storyrun}} (ingress)"
          },
          {
            "expr": "sum(rate(bobravoz_grpc_messages_sent_total[1m])) by (storyrun)",
            "legendFormat": "{{storyrun}} (egress)"
          }
        ]
      },
      {
        "title": "Message Drops (should be 0)",
        "targets": [
          {
            "expr": "sum(rate(bobravoz_hub_messages_dropped_total[5m])) by (storyrun, step)",
            "legendFormat": "{{storyrun}}/{{step}}"
          }
        ],
        "alert": {
          "conditions": [
            {
              "evaluator": {
                "params": [0],
                "type": "gt"
              }
            }
          ]
        }
      },
      {
        "title": "Hub RPC Rate (OK)",
        "targets": [
          {
            "expr": "sum(rate(bobravoz_grpc_requests_total{code=\"OK\"}[5m]))",
            "legendFormat": "Requests/s"
          }
        ]
      },
      {
        "title": "Stream Duration Percentiles",
        "targets": [
          {
            "expr": "histogram_quantile(0.50, rate(bobravoz_grpc_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P50"
          },
          {
            "expr": "histogram_quantile(0.99, rate(bobravoz_grpc_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P99"
          }
        ]
      }
    ]
  }
}
```

---

## Metric Cardinality

**Important**: Metrics are labeled by `storyrun` and `step`. High cardinality can occur if:

- Many unique StoryRun names (e.g., UUIDs)
- Frequent StoryRun creation/deletion

**Best Practices**:
1. Use stable StoryRun names where possible
2. Set Prometheus retention to match StoryRun lifecycle
3. Use recording rules to aggregate high-cardinality metrics

**Recording Rule Example**:
```yaml
groups:
  - name: bobravoz-aggregates
    interval: 30s
    rules:
      - record: bobravoz:messages_received:rate1m
        expr: sum(rate(bobravoz_grpc_messages_received_total[1m]))
      
      - record: bobravoz:messages_dropped:rate5m
        expr: sum(rate(bobravoz_hub_messages_dropped_total[5m]))
```

---

## Metrics for HPA

### Custom Metrics API

Expose hub metrics via the Kubernetes custom metrics API:

```yaml
# prometheus-adapter ConfigMap
rules:
  - seriesQuery: 'bobravoz_grpc_messages_dropped_total'
    resources:
      overrides:
        namespace: {resource: "namespace"}
        pod: {resource: "pod"}
    name:
      matches: "^(.*)_total$"
      as: "${1}_rate"
    metricsQuery: 'rate(<<.Series>>{<<.LabelMatchers>>}[1m])'
```

### Verify Custom Metrics

```bash
# List available metrics
kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1 | jq .

# Get specific metric
kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1/namespaces/bobrapet-system/pods/*/bobravoz_grpc_messages_dropped_rate | jq .
```

---

## Next Steps

- [Autoscaling Guide](./bobravoz-autoscaling.md) — Use metrics for HPA
- [Troubleshooting](./bobravoz-troubleshooting.md) — Debug metric issues
- [Deployment Guide](./bobravoz-deployment.md) — Set up Prometheus scraping
