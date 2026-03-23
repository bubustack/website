---
title: Bobravoz Deployment Guide
sidebar_position: 3
description: Install the transport operator, size the hub, and wire TLS and metrics for production.
---

# Deployment Guide

This guide covers production deployment of the bobravoz-grpc transport operator.

## Prerequisites

- Kubernetes 1.28+
- cert-manager (for TLS)
- Prometheus Operator (for metrics)
- bobrapet operator v0.1.0+

## Installation

### Standard Installation

```bash
kubectl apply -f https://github.com/bubustack/bobravoz-grpc/releases/latest/download/install.yaml
```

This creates:
- Namespace: `bobrapet-system`
- Deployment: `bobravoz-grpc-controller-manager`
- Service: `bobravoz-grpc-controller-manager-metrics-service` (port 8443)
- RBAC resources

To enable Prometheus scraping via ServiceMonitor, enable the Prometheus kustomize component in the operator manifests or deploy the ServiceMonitor from `config/prometheus/`.

### Custom Installation

```bash
# Clone the repository
git clone https://github.com/bubustack/bobravoz-grpc.git
cd bobravoz-grpc

# Build and push your image
export IMG=<your-registry>/bobravoz-grpc:v1.0.0
make docker-build docker-push IMG=$IMG

# Deploy with custom image
make deploy IMG=$IMG
```

## Configuration

### Hub Server Settings

The hub server runs inside the controller manager pod and accepts these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `BUBU_HUB_MAX_RECV_BYTES` | `10485760` (10MB) | Max message size to receive |
| `BUBU_HUB_MAX_SEND_BYTES` | `10485760` (10MB) | Max message size to send |
| `BUBU_HUB_KEEPALIVE_TIME` | unset | Keepalive ping interval |
| `BUBU_HUB_KEEPALIVE_TIMEOUT` | unset | Keepalive timeout |
| `BUBU_HUB_PER_MESSAGE_TIMEOUT` | unset | Optional per-message send timeout on hub forwarding |
| `BUBU_HUB_BUFFER_MAX_MESSAGES` | `100` | Buffer size per downstream (messages) |
| `BUBU_HUB_BUFFER_MAX_BYTES` | `10485760` (10MB) | Buffer size per downstream (bytes) |

**Example ConfigMap**:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bobravoz-grpc-config
  namespace: bobrapet-system
data:
  BUBU_HUB_MAX_RECV_BYTES: "52428800"  # 50MB
  BUBU_HUB_MAX_SEND_BYTES: "52428800"  # 50MB
  BUBU_HUB_BUFFER_MAX_MESSAGES: "500"
  BUBU_HUB_BUFFER_MAX_BYTES: "52428800" # 50MB
  # Optional SDK client-side buffer defaults for engrams
  BUBU_GRPC_CLIENT_BUFFER_MAX_MESSAGES: "100"
  BUBU_GRPC_CLIENT_BUFFER_MAX_BYTES: "10485760"
```

Mount in deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bobravoz-grpc-controller-manager
spec:
  template:
    spec:
      containers:
        - name: manager
          envFrom:
            - configMapRef:
                name: bobravoz-grpc-config
```

### Resource Sizing

**Minimum (Dev/Test)**:
```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

**Production (Recommended)**:
```yaml
resources:
  requests:
    cpu: 1000m
    memory: 1Gi
  limits:
    cpu: 2000m
    memory: 2Gi
```

**High-Throughput (>10k msg/s)**:
```yaml
resources:
  requests:
    cpu: 2000m
    memory: 2Gi
  limits:
    cpu: 4000m
    memory: 4Gi
```

## TLS Configuration

### Helm (Recommended)

Configure TLS/mTLS via Helm values instead of manual overlays. Example `values.yaml`:

```yaml
hub:
  tls:
    require: true                  # maps to BUBU_HUB_REQUIRE_TLS
    secretName: bobravoz-grpc-hub-tls
    mountPath: /etc/tls/hub        # optional; default chart path

engrams:
  tls:
    injectClient: true             # when hub.tls.require=true, inject SDK client TLS envs
    clientSecretName: engram-tls   # maps to BUBU_GRPC_CLIENT_TLS_SECRET_NAME

mesh:
  enabled: false                   # if true (Istio/Linkerd), keep SDK plaintext and rely on sidecars
```

Install:

```bash
helm upgrade --install bobravoz-grpc oci://<your-registry>/bobravoz-grpc \
  -n bobrapet-system --create-namespace -f values.yaml
```

Value-to-env mapping (for reference):

| Helm Value | Env/Effect |
|------------|------------|
| `hub.tls.require` | Sets `BUBU_HUB_REQUIRE_TLS` |
| `hub.tls.secretName` + `hub.tls.mountPath` | Mounts Secret and sets `BUBU_HUB_TLS_CERT_FILE`, `BUBU_HUB_TLS_KEY_FILE`, `BUBU_HUB_CA_FILE` paths |
| `engrams.tls.clientSecretName` | Sets `BUBU_GRPC_CLIENT_TLS_SECRET_NAME` in operator |
| `engrams.tls.injectClient` | Enables operator injection of SDK TLS envs when `hub.tls.require=true` |
| `mesh.enabled` | Disables SDK TLS injection; rely on mesh mTLS |

### Using cert-manager (Recommended)

**1. Install cert-manager**:

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml
```

**2. Create CA Issuer**:

```yaml
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: bobravoz-ca-issuer
  namespace: bobrapet-system
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: bobravoz-ca
  namespace: bobrapet-system
spec:
  isCA: true
  commonName: bobravoz-ca
  secretName: bobravoz-ca-secret
  privateKey:
    algorithm: ECDSA
    size: 256
  issuerRef:
    name: bobravoz-ca-issuer
    kind: Issuer
---
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: bobravoz-issuer
  namespace: bobrapet-system
spec:
  ca:
    secretName: bobravoz-ca-secret
```

**3. Create Hub Certificate**:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: bobravoz-grpc-hub-tls
  namespace: bobrapet-system
spec:
  secretName: bobravoz-grpc-hub-tls
  duration: 2160h # 90 days
  renewBefore: 360h # 15 days
  subject:
    organizations:
      - bubustack
  commonName: bobravoz-grpc-hub.bobrapet-system.svc.cluster.local
  dnsNames:
    - bobravoz-grpc-hub
    - bobravoz-grpc-hub.bobrapet-system
    - bobravoz-grpc-hub.bobrapet-system.svc
    - bobravoz-grpc-hub.bobrapet-system.svc.cluster.local
  issuerRef:
    name: bobravoz-issuer
    kind: Issuer
```

**4. Mount Hub Certificate in Deployment**:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bobravoz-grpc-controller-manager
  namespace: bobrapet-system
spec:
  template:
    spec:
      containers:
        - name: manager
          env:
            - name: BUBU_HUB_REQUIRE_TLS
              value: "true"
            - name: BUBU_HUB_TLS_CERT_FILE
              value: /etc/tls/hub/tls.crt
            - name: BUBU_HUB_TLS_KEY_FILE
              value: /etc/tls/hub/tls.key
            - name: BUBU_HUB_CA_FILE
              value: /etc/tls/hub/ca.crt
          volumeMounts:
            - name: hub-tls
              mountPath: /etc/tls/hub
              readOnly: true
      volumes:
        - name: hub-tls
          secret:
            secretName: bobravoz-grpc-hub-tls

### Engram TLS (Client) with cert-manager or Service Mesh

You can leverage cert-manager or a service mesh (Istio/Linkerd) to provision client certificates for engram Deployments.

Approach A — cert-manager-managed Secret mounted into Engrams (no mesh required):

1. Issue per-namespace `Certificate` for engrams (or use mesh CA if exported as Secret)
2. Annotate Engram Deployment or set the transport operator env to reference the Secret
3. Operator will mount the Secret at `/var/run/tls` and inject SDK envs when Hub requires TLS

```yaml
# Example Secret (generated by cert-manager)
apiVersion: v1
kind: Secret
metadata:
  name: engram-tls
  namespace: my-app
type: kubernetes.io/tls
data:
  tls.crt: <base64>
  tls.key: <base64>
  ca.crt:  <base64>  # optional, recommended
```

Operator configuration:

```yaml
# On operator Deployment (or ConfigMap → envFrom)
env:
  - name: BUBU_HUB_REQUIRE_TLS
    value: "true"
  - name: BUBU_GRPC_CLIENT_TLS_SECRET_NAME
    value: engram-tls  # default if unset
```

The operator injects into Engram Pods when TLS is required:

```
BUBU_GRPC_CLIENT_TLS=true
BUBU_GRPC_CA_FILE=/var/run/tls/ca.crt
BUBU_GRPC_CLIENT_CERT_FILE=/var/run/tls/tls.crt
BUBU_GRPC_CLIENT_KEY_FILE=/var/run/tls/tls.key
BUBU_GRPC_REQUIRE_TLS=true
```

Approach B — Service Mesh (Istio/Linkerd) mTLS:

- Mesh sidecars terminate and originate mTLS; SDK can use plaintext to localhost sidecar
- Recommended: keep SDK agnostic; use mesh policies for peer/authn and DestinationRules
- If mesh is configured for strict mTLS, do NOT set `BUBU_HUB_REQUIRE_TLS`; let the sidecar handle TLS
- Optionally enable SDK TLS if connecting sidecar-to-sidecar with custom CA (not typical)

Istio example (strict mTLS):

```yaml
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata:
  name: default
  namespace: my-app
spec:
  mtls:
    mode: STRICT
---
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: allow-hub
  namespace: bobrapet-system
spec:
  rules:
    - to:
        - operation:
            ports: ["9000"]
```

Linkerd example (opaque ports):

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: my-app
  annotations:
    config.linkerd.io/opaque-ports: "9000"  # gRPC hub port
```

Notes:
- Mesh mTLS and app-level TLS are mutually exclusive in most deployments. Prefer mesh mTLS for simplicity.
- If using mesh mTLS, keep SDK in plaintext mode (do not set SDK TLS envs) and rely on sidecar.
```

### Manual TLS (Development Only)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout tls.key -out tls.crt \
  -subj "/CN=bobravoz-grpc-hub.bobrapet-system.svc.cluster.local"

# Create secret
kubectl create secret tls bobravoz-grpc-hub-tls \
  --cert=tls.crt --key=tls.key \
  -n bobrapet-system
```

## Monitoring Setup

### Prometheus ServiceMonitor

The operator includes a ServiceMonitor that Prometheus Operator automatically discovers:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: controller-manager-metrics-monitor
  namespace: bobrapet-system
spec:
  endpoints:
    - path: /metrics
      port: https
      scheme: https
      bearerTokenFile: /var/run/secrets/kubernetes.io/serviceaccount/token
      tlsConfig:
        insecureSkipVerify: true  # Use cert-manager for production
  selector:
    matchLabels:
      control-plane: controller-manager
```

### Grafana Dashboard

Import this dashboard JSON or create queries:

**Key Panels**:

1. **Message Throughput**:
   ```promql
   sum(rate(bobravoz_grpc_messages_received_total[1m])) by (storyrun)
   ```

2. **Message Drop Rate** (should be 0):
   ```promql
   sum(rate(bobravoz_hub_messages_dropped_total[5m])) by (storyrun, step)
   ```

3. **Stream P99 Duration**:
   ```promql
   histogram_quantile(0.99, 
  rate(bobravoz_grpc_request_duration_seconds_bucket[5m])
   )
   ```

4. **Active Streams**:
   ```promql
   sum(bobravoz_grpc_stream_requests_total{code="OK"})
   ```

## Network Policies

**Allow hub ingress from engrams**:

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
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 9000  # Hub gRPC port
```

**Allow metrics scraping**:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-metrics-scraping
  namespace: bobrapet-system
spec:
  podSelector:
    matchLabels:
      control-plane: controller-manager
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: monitoring
      ports:
        - protocol: TCP
          port: 8443  # Metrics HTTPS port
```

## Verification

### Check Operator Status

```bash
# Pod should be Running
kubectl get pods -n bobrapet-system -l control-plane=controller-manager

# Check logs for TLS status
kubectl logs -n bobrapet-system deployment/bobravoz-grpc-controller-manager | grep -i tls

# Expected output:
# "TLS enabled for gRPC server" certFile="/etc/tls/hub/tls.crt" keyFile="/etc/tls/hub/tls.key"
```

### Test Metrics Endpoint

```bash
# Port-forward to metrics service
kubectl port-forward -n bobrapet-system svc/bobravoz-grpc-controller-manager-metrics-service 8443:8443

# Get metrics (requires token)
TOKEN=$(kubectl create token bobravoz-grpc-controller-manager -n bobrapet-system --duration=10m)
curl -k -H "Authorization: Bearer $TOKEN" https://localhost:8443/metrics | grep bobravoz_grpc_
```

### Test Hub Connection

```bash
# Port-forward to hub
kubectl port-forward -n bobrapet-system deployment/bobravoz-grpc-controller-manager 9000:9000

# Use grpcurl to test (requires metadata)
grpcurl -plaintext -d '{}' \
  -H 'storyrun-name: test' \
  -H 'storyrun-namespace: default' \
  -H 'current-step-id: step1' \
  localhost:9000 proto.Hub/Process
```

## Upgrades

### Rolling Update

```bash
# Update image
kubectl set image deployment/bobravoz-grpc-controller-manager \
  manager=ghcr.io/bubustack/bobravoz-grpc:v1.1.0 \
  -n bobrapet-system

# Watch rollout
kubectl rollout status deployment/bobravoz-grpc-controller-manager -n bobrapet-system
```

Active streams will gracefully drain during pod termination (up to `terminationGracePeriodSeconds`, default 30s).

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/bobravoz-grpc-controller-manager -n bobrapet-system

# Check rollout history
kubectl rollout history deployment/bobravoz-grpc-controller-manager -n bobrapet-system
```

## Next Steps

- [Autoscaling Guide](./bobravoz-autoscaling.md) — Configure HPA for production
- [Metrics Reference](./bobravoz-metrics.md) — Complete metrics documentation
- [Troubleshooting](./bobravoz-troubleshooting.md) — Common issues and solutions

