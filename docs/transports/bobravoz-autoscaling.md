---
title: Bobravoz Autoscaling
sidebar_position: 4
description: Scale the hub with Prometheus metrics so streaming payloads never drop.
---

# Autoscaling Guide

The bobravoz-grpc hub is designed for **horizontal autoscaling**. This guide shows how to scale based on operational metrics to prevent message drops and maintain throughput.

## Why Autoscaling?

The hub buffers messages when downstream engrams are slow. Once the buffer fills (default: 100 messages or 10MB per downstream), **new messages are dropped**. Autoscaling prevents drops by adding capacity before buffers saturate.

**Key Principle**: Scale on **drop rate** and **buffer utilization**, not just CPU/memory.

## HPA Configuration

### Prerequisites

- Kubernetes 1.23+ (HPA v2)
- metrics-server installed
- Prometheus Adapter (for custom metrics)

### Install Prometheus Adapter

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus-adapter prometheus-community/prometheus-adapter \
  --namespace monitoring \
  --set prometheus.url=http://prometheus-operated.monitoring.svc \
  --set prometheus.port=9090
```

### Configure Custom Metrics

Create a ConfigMap for the adapter:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-adapter-config
  namespace: monitoring
data:
  config.yaml: |
    rules:
      - seriesQuery: 'bobravoz_hub_messages_dropped_total'
        resources:
          overrides:
            namespace: {resource: "namespace"}
            pod: {resource: "pod"}
        name:
          matches: "^bobravoz_hub_messages_dropped_total$"
          as: "bobravoz_hub_messages_dropped_rate"
        metricsQuery: 'rate(bobravoz_hub_messages_dropped_total[1m])'
      
      - seriesQuery: 'bobravoz_grpc_messages_received_total'
        resources:
          overrides:
            namespace: {resource: "namespace"}
            pod: {resource: "pod"}
        name:
          matches: "^bobravoz_grpc_messages_received_total$"
          as: "bobravoz_grpc_messages_received_rate"
        metricsQuery: 'rate(bobravoz_grpc_messages_received_total[1m])'
```

### HPA Manifest

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: bobravoz-grpc-hub
  namespace: bobrapet-system
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: bobravoz-grpc-controller-manager
  minReplicas: 2
  maxReplicas: 10
  metrics:
    # Primary metric: Scale up immediately if dropping messages
    - type: Pods
      pods:
        metric:
          name: bobravoz_hub_messages_dropped_rate
        target:
          type: AverageValue
          averageValue: "0.1"  # Scale up if ANY pod drops >0.1 msg/sec
    
    # Secondary metric: Proactive scaling on throughput
    - type: Pods
      pods:
        metric:
          name: bobravoz_grpc_messages_received_rate
        target:
          type: AverageValue
          averageValue: "1000"  # Scale at 1000 msg/sec per pod
    
    # Tertiary metric: CPU-based scaling as fallback
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 80
  
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
        - type: Percent
          value: 100  # Double pod count
          periodSeconds: 15
        - type: Pods
          value: 2    # Add 2 pods
          periodSeconds: 15
      selectPolicy: Max  # Use most aggressive policy
    
    scaleDown:
      stabilizationWindowSeconds: 300  # 5 min cooldown
      policies:
        - type: Percent
          value: 50   # Cut pod count in half
          periodSeconds: 60
      selectPolicy: Min  # Use most conservative policy
```

## Capacity Planning

### Calculate Required Replicas

**Formula**:
```
Required Replicas = (Peak Throughput * Buffer Window) / (Buffer Size * Availability Factor)
```

**Example**:
- Peak throughput: 10,000 msg/sec
- Desired buffer window: 5 seconds (absorb 5s of backpressure)
- Buffer size per pod: 100 messages
- Availability factor: 0.7 (allow 30% headroom)

```
Required Replicas = (10,000 * 5) / (100 * 0.7)
                  = 50,000 / 70
                  ≈ 715 replicas
```

**Reality Check**: This is unrealistic! Instead:

1. **Increase buffer size**: Set `BUBU_HUB_BUFFER_MAX_MESSAGES=1000`
   ```
   Required Replicas = (10,000 * 5) / (1000 * 0.7) ≈ 72 replicas
   ```

2. **Reduce buffer window**: Accept 1s burst absorption
   ```
   Required Replicas = (10,000 * 1) / (1000 * 0.7) ≈ 15 replicas
   ```

3. **Optimize downstream**: Make engrams faster (reduce backpressure)

### Buffer Sizing Guidelines

| Workload | Messages | Bytes | Use Case |
|----------|----------|-------|----------|
| **Low Latency** | 50 | 5 MB | Fast downstream, rare bursts |
| **Standard** (default) | 100 | 10 MB | Moderate bursts, mixed workloads |
| **High Throughput** | 500 | 50 MB | Sustained load, slow downstream |
| **Extreme** | 2000 | 200 MB | Large messages, heavy bursts |

**Set via env vars**:
```yaml
env:
  - name: BUBU_HUB_BUFFER_MAX_MESSAGES
    value: "500"
  - name: BUBU_HUB_BUFFER_MAX_BYTES
    value: "52428800"  # 50 MB
```

### Resource Sizing per Replica

| Replica Capacity | CPU Request | Memory Request | Max Concurrent Streams |
|------------------|-------------|----------------|------------------------|
| **Small** | 500m | 512Mi | ~50 streams |
| **Medium** | 1000m | 1Gi | ~100 streams |
| **Large** | 2000m | 2Gi | ~200 streams |
| **X-Large** | 4000m | 4Gi | ~500 streams |

**Memory Calculation**:
```
Memory = (Concurrent Streams * Buffer Size * Message Size) + Overhead

Example (Medium):
= (100 streams * 100 msg * 10KB) + 256MB overhead
= 100MB + 256MB
≈ 512MB (use 1GB for headroom)
```

## Alert Rules

Deploy these PrometheusRule resources:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: bobravoz-grpc-alerts
  namespace: bobrapet-system
spec:
  groups:
    - name: bobravoz-hub-critical
      interval: 30s
      rules:
        - alert: BobravozHubDroppingMessages
          expr: rate(bobravoz_hub_messages_dropped_total[5m]) > 0
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "Hub {{ $labels.pod }} dropping messages ({{ $labels.storyrun }}/{{ $labels.step }})"
            description: "Drop rate: {{ $value | humanize }} msg/s. Scale up immediately or increase buffer size."
            runbook_url: "https://bubustack.io/docs/transport/troubleshooting#message-drops"
        
        - alert: BobravozHubHighBufferPressure
          expr: |
            (sum by (pod, storyrun, step) (bobravoz_grpc_messages_buffered_current) 
            / on() group_left() max(bobravoz_hub_buffer_max_messages_config)) > 0.8
          for: 2m
          labels:
            severity: warning
          annotations:
            summary: "Hub buffer >80% full ({{ $labels.storyrun }}/{{ $labels.step }})"
            description: "Buffer utilization: {{ $value | humanizePercentage }}. Proactive scale-up recommended."
        
        - alert: BobravozHubSlowDownstream
          expr: |
            rate(bobravoz_grpc_messages_sent_total[5m]) 
            / rate(bobravoz_grpc_messages_received_total[5m]) < 0.9
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Downstream {{ $labels.step }} processing slower than ingress"
            description: "Egress/Ingress ratio: {{ $value | humanizePercentage }}. Check downstream engram health."
    
    - name: bobravoz-hub-performance
      interval: 60s
      rules:
        - alert: BobravozHubHighStreamDuration
          expr: |
            histogram_quantile(0.99, 
              rate(bobravoz_grpc_request_duration_seconds_bucket[5m])
            ) > 300
          for: 5m
          labels:
            severity: info
          annotations:
            summary: "Hub stream P99 duration >5 minutes"
            description: "Long-lived streams detected. P99: {{ $value | humanizeDuration }}. Review engram lifecycle."
        
        - alert: BobravozHubHighErrorRate
          expr: |
            sum(rate(bobravoz_grpc_stream_requests_total{code!="OK"}[5m])) 
            / sum(rate(bobravoz_grpc_stream_requests_total[5m])) > 0.05
          for: 3m
          labels:
            severity: warning
          annotations:
            summary: "Hub error rate >5%"
            description: "Error rate: {{ $value | humanizePercentage }}. Check logs for failure patterns."
```

## Testing Autoscaling

### 1. Deploy with Low Limits

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bobravoz-grpc-controller-manager
spec:
  replicas: 1  # Start with 1 replica
  template:
    spec:
      containers:
        - name: manager
          env:
            - name: BUBU_HUB_BUFFER_MAX_MESSAGES
              value: "10"  # Small buffer for testing
```

### 2. Create Load Generator

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: load-generator
spec:
  containers:
    - name: load
      image: ghcr.io/bubustack/load-generator:latest
      env:
        - name: TARGET_HOST
          value: "bobravoz-grpc-hub.bobrapet-system.svc.cluster.local:9000"
        - name: MESSAGE_RATE
          value: "1000"  # 1000 msg/sec
```

### 3. Watch Scaling

```bash
# Watch HPA status
watch kubectl get hpa -n bobrapet-system

# Watch pod count
watch kubectl get pods -n bobrapet-system -l control-plane=controller-manager

# Watch metrics
kubectl port-forward -n bobrapet-system svc/bobravoz-grpc-controller-manager-metrics-service 8443:8443
# Query: rate(bobravoz_hub_messages_dropped_total[1m])
```

**Expected Behavior**:
1. Buffer fills → HPA sees metric increase
2. Drops start → Alert fires
3. HPA scales up 2x (within 30s)
4. New pods handle load → Drops stop
5. After 5min cooldown, HPA scales down gradually

## Advanced Patterns

### Multi-Dimensional Scaling

Scale different replicas for different workloads:

```yaml
# Separate deployments per workload class
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bobravoz-grpc-high-throughput
spec:
  replicas: 5
  selector:
    matchLabels:
      workload: high-throughput
  template:
    spec:
      containers:
        - name: manager
          env:
            - name: BUBU_HUB_BUFFER_MAX_MESSAGES
              value: "2000"
          resources:
            requests:
              cpu: 2000m
              memory: 2Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bobravoz-grpc-low-latency
spec:
  replicas: 3
  selector:
    matchLabels:
      workload: low-latency
  template:
    spec:
      containers:
        - name: manager
          env:
            - name: BUBU_HUB_BUFFER_MAX_MESSAGES
              value: "50"
          resources:
            requests:
              cpu: 500m
              memory: 512Mi
```

Use Service selector to route appropriately.

### Predictive Scaling (KEDA)

Use KEDA for event-driven autoscaling:

```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: bobravoz-grpc-scaledobject
spec:
  scaleTargetRef:
    name: bobravoz-grpc-controller-manager
  minReplicaCount: 2
  maxReplicaCount: 20
  triggers:
    - type: prometheus
      metadata:
        serverAddress: http://prometheus-operated.monitoring.svc:9090
        metricName: bobravoz_message_rate
        query: sum(rate(bobravoz_grpc_messages_received_total[1m]))
        threshold: "5000"  # Scale up if >5000 msg/s total
```

## Troubleshooting Autoscaling

### HPA Not Scaling

**Symptom**: `kubectl get hpa` shows "unknown" metrics

**Diagnosis**:
```bash
# Check if metrics are available
kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1/namespaces/bobrapet-system/pods/*/bobravoz_grpc_messages_dropped_rate

# Check prometheus-adapter logs
kubectl logs -n monitoring deployment/prometheus-adapter
```

**Resolution**:
- Verify Prometheus is scraping the hub metrics
- Check prometheus-adapter configuration
- Ensure ServiceMonitor is active

### Flapping (Rapid Scale Up/Down)

**Symptom**: Pods constantly added and removed

**Diagnosis**: Stabilization windows too short

**Resolution**:
```yaml
behavior:
  scaleUp:
    stabilizationWindowSeconds: 60  # Increase from 30
  scaleDown:
    stabilizationWindowSeconds: 600  # Increase from 300
```

### Slow Scale-Up

**Symptom**: Drops occur before new pods ready

**Diagnosis**: Scale-up policy too conservative

**Resolution**:
```yaml
behavior:
  scaleUp:
    policies:
      - type: Percent
        value: 200  # Triple instead of double
        periodSeconds: 15
```

## Next Steps

- [Metrics Reference](./bobravoz-metrics.md) — All available metrics for HPA
- [Troubleshooting](./bobravoz-troubleshooting.md) — Debug autoscaling issues
- [Reference: Environment Variables](./bobravoz-reference.md) — Tuning buffer sizes

