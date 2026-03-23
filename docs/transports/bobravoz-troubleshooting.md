---
title: Bobravoz Troubleshooting
sidebar_position: 7
description: Diagnose message drops, TLS issues, and reconnection loops in the transport hub.
---

# Troubleshooting Guide

Common issues and solutions for the bobravoz-grpc transport operator.

## Message Drops

### Symptom

```promql
bobravoz_hub_messages_dropped_total > 0
```

Logs show:
```
Buffer full, dropping message bufferedCount=100 bufferedBytes=10485760 droppedTotal=42
```

### Root Causes

1. **Downstream engram is slow**
   - Processing takes longer than message arrival rate
   - CPU/memory throttling
   - Blocking I/O operations

2. **Insufficient hub capacity**
   - Too few hub replicas for throughput
   - Buffer size too small for burst handling
   - Pod resource limits too low

3. **Network issues**
   - High latency to downstream
   - Packet loss causing retries
   - DNS resolution delays

### Diagnosis

```bash
# Check drop rate by step
kubectl port-forward -n bobrapet-system svc/bobravoz-grpc-controller-manager-metrics-service 8443:8443
TOKEN=$(kubectl create token bobravoz-grpc-controller-manager -n bobrapet-system --duration=10m)
curl -k -H "Authorization: Bearer $TOKEN" https://localhost:8443/metrics | \
  grep bobravoz_hub_messages_dropped_total

# Check downstream engram health
kubectl get pods -n <namespace> -l bubustack.io/engram=<engram-name>
kubectl logs -n <namespace> <engram-pod> --tail=100

# Check hub logs for errors
kubectl logs -n bobrapet-system deployment/bobravoz-grpc-controller-manager | \
  grep -E "Buffer full|Failed to send"
```

### Resolution

**Immediate (stop bleeding)**:
```bash
# Scale up hub manually
kubectl scale deployment/bobravoz-grpc-controller-manager \
  --replicas=5 -n bobrapet-system

# Increase buffer size
kubectl set env deployment/bobravoz-grpc-controller-manager \
  BUBU_HUB_BUFFER_MAX_MESSAGES=500 \
  BUBU_HUB_BUFFER_MAX_BYTES=52428800 \
  -n bobrapet-system
```

**Short-term (stabilize)**:
1. Investigate slow downstream engram
2. Add HPA if not present (see [Autoscaling Guide](./bobravoz-autoscaling.md))
3. Review resource limits on hub and engrams

**Long-term (prevent recurrence)**:
1. Implement autoscaling based on drop metrics
2. Optimize downstream engram processing
3. Add Prometheus alerts for early warning
4. Conduct load testing to determine capacity limits

---

## High Stream Duration

### Symptom

```promql
histogram_quantile(0.99, rate(bobravoz_grpc_stream_duration_seconds_bucket[5m])) > 300
```

Streams staying open for hours or days.

### Root Causes

1. **Intended behavior** (long-lived streaming workflows)
2. **Stuck connections** (client not closing gracefully)
3. **Slow message processing** (throughput < 1 msg/min)

### Diagnosis

```bash
# Check active streams
kubectl logs -n bobrapet-system deployment/bobravoz-grpc-controller-manager | \
  grep "New stream established" | tail -20

# Check for hung connections
kubectl logs -n bobrapet-system deployment/bobravoz-grpc-controller-manager | \
  grep "Connection hang detected"

# Check message rate per stream
# Low rate + long duration = potential issue
```

### Resolution

**If streams are stuck**:
```bash
# Restart hub (gracefully drains streams)
kubectl rollout restart deployment/bobravoz-grpc-controller-manager -n bobrapet-system

# Check engram logs for errors
kubectl logs -n <namespace> <engram-pod> | grep -i error
```

**If intentional long-lived streams**:
- Increase `BUBU_GRPC_HANG_TIMEOUT` if hang detection triggers falsely
- Adjust `BUBU_GRPC_KEEPALIVE_TIME` to detect dead connections faster
- Configure alerts to only fire on P99 > expected duration

---

## TLS Errors

### Symptom

Engrams fail to connect to hub:
```
Error: rpc error: code = Unavailable desc = connection error: 
  desc = "transport: authentication handshake failed: 
  x509: certificate signed by unknown authority"
```

### Root Causes

1. **CA certificate mismatch** between hub and engrams
2. **Certificate expired**
3. **Wrong certificate mounted**
4. **TLS disabled on hub but enabled on client**

### Diagnosis

```bash
# Check hub TLS status
kubectl logs -n bobrapet-system deployment/bobravoz-grpc-controller-manager | \
  grep -i "TLS enabled\|TLS disabled"

# Expected: "TLS enabled for gRPC server" certFile="/etc/tls/hub/tls.crt"

# Verify certificate is mounted
kubectl exec -n bobrapet-system deployment/bobravoz-grpc-controller-manager -- \
  ls -la /etc/tls/hub/

# Check certificate expiry
kubectl exec -n bobrapet-system deployment/bobravoz-grpc-controller-manager -- \
  openssl x509 -in /etc/tls/hub/tls.crt -noout -dates
```

### Resolution

**Certificate expired**:
```bash
# Delete cert to trigger renewal (cert-manager)
kubectl delete certificate bobravoz-grpc-hub-tls -n bobrapet-system

# Wait for renewal (check with)
kubectl get certificate -n bobrapet-system
```

**Wrong CA on engrams**:
```bash
# Get hub CA certificate
kubectl get secret bobravoz-ca-secret -n bobrapet-system -o json | \
  jq -r '.data."ca.crt"' | base64 -d > hub-ca.crt

# Create ConfigMap for engrams
kubectl create configmap bobravoz-hub-ca \
  --from-file=ca.crt=hub-ca.crt \
  -n <engram-namespace>

# Mount in engram deployment and set BUBU_GRPC_CA_FILE
```

**Disable TLS for testing** (dev only):
```bash
# Remove TLS env vars from hub
kubectl set env deployment/bobravoz-grpc-controller-manager \
  BUBU_HUB_TLS_CERT_FILE- \
  BUBU_HUB_TLS_KEY_FILE- \
  -n bobrapet-system

# Set engrams to plaintext
# In engram deployment: BUBU_GRPC_CLIENT_TLS=false
```

---

## Metrics Not Appearing

### Symptom

```bash
kubectl get --raw /apis/custom.metrics.k8s.io/v1beta1 | jq .
# Returns: empty or missing bobravoz metrics
```

HPA shows `<unknown>` for custom metrics.

### Root Causes

1. **Prometheus not scraping hub**
2. **ServiceMonitor misconfigured**
3. **prometheus-adapter not running**
4. **Metrics API registration failed**

### Diagnosis

```bash
# Check if Prometheus is scraping
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090
# Navigate to: http://localhost:9090/targets
# Look for: bobrapet-system/bobravoz-grpc

# Check ServiceMonitor
kubectl get servicemonitor -n bobrapet-system

# Check prometheus-adapter
kubectl get pods -n monitoring -l app.kubernetes.io/name=prometheus-adapter
kubectl logs -n monitoring deployment/prometheus-adapter

# Test metrics endpoint directly
kubectl port-forward -n bobrapet-system svc/bobravoz-grpc-controller-manager-metrics-service 8443:8443
TOKEN=$(kubectl create token bobravoz-grpc-controller-manager -n bobrapet-system --duration=10m)
curl -k -H "Authorization: Bearer $TOKEN" https://localhost:8443/metrics | \
  grep bobravoz_grpc_
```

### Resolution

**Prometheus not scraping**:
```yaml
# Ensure ServiceMonitor has correct labels
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  labels:
    prometheus: kube-prometheus  # Match your Prometheus selector
```

**prometheus-adapter misconfigured**:
```bash
# Update adapter ConfigMap with hub metrics
kubectl edit configmap prometheus-adapter -n monitoring

# Add to rules:
- seriesQuery: 'bobravoz_grpc_messages_dropped_total'
  resources:
    overrides:
      namespace: {resource: "namespace"}
      pod: {resource: "pod"}
  name:
    matches: "^(.*)_total$"
    as: "${1}_rate"
  metricsQuery: 'rate(<<.Series>>{<<.LabelMatchers>>}[1m])'

# Restart adapter
kubectl rollout restart deployment/prometheus-adapter -n monitoring
```

---

## K8s API Timeout Errors

### Symptom

Logs show:
```
Failed to get story and run storyRun="my-run" error="context deadline exceeded"
```

Messages dropped even though downstream is healthy.

### Root Causes

1. **API server overloaded** (high latency)
2. **Network issues** to API server
3. **Insufficient RBAC permissions** (slow authorization)

### Diagnosis

```bash
# Check API server latency
kubectl get --raw /metrics | grep apiserver_request_duration_seconds

# Check hub API call duration
kubectl logs -n bobrapet-system deployment/bobravoz-grpc-controller-manager | \
  grep "Failed to get story"

# Test API responsiveness
time kubectl get storyrun -n <namespace> <storyrun-name>
```

### Resolution

**Increase timeout**:
```go
// Default is 5s; increase if API server is slow
// This requires code change, not runtime config
apiCtx, apiCancel := context.WithTimeout(stream.Context(), 10*time.Second)
```

**Improve API server performance**:
- Scale up API server replicas
- Add API priority and fairness rules
- Use field selectors to reduce API load

**Cache StoryRun/Story in hub** (future enhancement):
- Implement in-memory cache with TTL
- Watch for StoryRun/Story changes
- Reduce API calls from O(messages) to O(changes)

---

## Engram Not Connecting to Hub

### Symptom

Engram logs show:
```
Error: failed to dial hub: connection refused
```

Or:
```
Error: failed to resolve host: bobravoz-grpc-hub.bobrapet-system.svc.cluster.local
```

### Root Causes

1. **Hub Service doesn't exist**
2. **Wrong DNS name** (namespace mismatch)
3. **Network policy blocking** traffic
4. **Hub pod not running**

### Diagnosis

```bash
# Check hub pod status
kubectl get pods -n bobrapet-system -l control-plane=controller-manager

# Check Service exists
kubectl get svc -n bobrapet-system | grep hub

# Test DNS resolution from engram namespace
kubectl run -it --rm debug --image=busybox --restart=Never -n <engram-namespace> -- \
  nslookup bobravoz-grpc-hub.bobrapet-system.svc.cluster.local

# Test connectivity
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -n <engram-namespace> -- \
  nc -zv bobravoz-grpc-hub.bobrapet-system.svc.cluster.local 9000
```

### Resolution

**Service missing**:
```bash
# Hub uses controller manager Service, not separate hub Service
# Check correct Service name:
kubectl get svc -n bobrapet-system bobravoz-grpc-controller-manager-metrics-service

# Hub port is typically 9000, not 8443 (metrics port)
# Verify in deployment args:
kubectl get deployment bobravoz-grpc-controller-manager -n bobrapet-system -o yaml | \
  grep hub-port
```

**Network policy blocking**:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-hub-ingress
  namespace: bobrapet-system
spec:
  podSelector:
    matchLabels:
      control-plane: controller-manager
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector: {}  # Allow from all namespaces
      ports:
        - protocol: TCP
          port: 9000
```

---

## High Memory Usage

### Symptom

Hub pod OOM killed or memory usage growing unbounded.

### Root Causes

1. **Too many buffered messages** (high cardinality * large buffers)
2. **Memory leak** in long-lived streams
3. **Large message payloads** (>1MB)

### Diagnosis

```bash
# Check memory usage
kubectl top pod -n bobrapet-system -l control-plane=controller-manager

# Check buffer configuration
kubectl exec -n bobrapet-system deployment/bobravoz-grpc-controller-manager -- \
  env | grep BUBU_HUB_BUFFER

# Estimate memory usage:
# Memory ≈ (Active Streams) * (Buffer Size) * (Avg Message Size)
# Example: 100 streams * 100 messages * 10KB = 100MB

# Check for leaks (requires pprof)
kubectl port-forward -n bobrapet-system deployment/bobravoz-grpc-controller-manager 6060:6060
go tool pprof http://localhost:6060/debug/pprof/heap
```

### Resolution

**Reduce buffer size**:
```bash
kubectl set env deployment/bobravoz-grpc-controller-manager \
  BUBU_HUB_BUFFER_MAX_MESSAGES=50 \
  BUBU_HUB_BUFFER_MAX_BYTES=5242880 \
  -n bobrapet-system
```

**Increase memory limits**:
```yaml
resources:
  requests:
    memory: 2Gi
  limits:
    memory: 4Gi
```

**Offload large payloads**:
- Use storage offloading in engrams (see [SDK storage offloading guide](../sdk/storage-offloading.md))
- Set `BUBU_MAX_INLINE_SIZE=1024` to offload payloads >1KB

---

## Getting Help

If issues persist:

1. **Collect diagnostics**:
   ```bash
   kubectl logs -n bobrapet-system deployment/bobravoz-grpc-controller-manager --tail=500 > hub.log
   kubectl get events -n bobrapet-system --sort-by='.lastTimestamp' > events.log
   kubectl describe deployment bobravoz-grpc-controller-manager -n bobrapet-system > deploy.txt
   ```

2. **Check GitHub Issues**: [bubustack/bobravoz-grpc/issues](https://github.com/bubustack/bobravoz-grpc/issues)

3. **Join Community**: [Discord](https://discord.gg/bubustack) or [Discussions](https://github.com/bubustack/bobravoz-grpc/discussions)

## Next Steps

- [Metrics Reference](./bobravoz-metrics.md) — Understand all available metrics
- [Autoscaling Guide](./bobravoz-autoscaling.md) — Prevent capacity issues
- [Deployment Guide](./bobravoz-deployment.md) — Review configuration options
