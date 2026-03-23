---
title: Bobravoz Configuration Reference
sidebar_position: 6
description: Environment variables, annotations, and Helm values for the gRPC transport.
---

# Configuration Reference

Complete reference for all bobravoz-grpc configuration options.

## Environment Variables

### gRPC Server (Hub)

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `BUBU_HUB_MAX_RECV_BYTES` | int (bytes) | `10485760` (10MB) | Maximum message size the hub will accept from engrams. |
| `BUBU_HUB_MAX_SEND_BYTES` | int (bytes) | `10485760` (10MB) | Maximum message size the hub will send to engrams. |
| `BUBU_HUB_KEEPALIVE_TIME` | duration (e.g., `30s`) | unset | Server keepalive ping interval; if unset, keepalive disabled. |
| `BUBU_HUB_KEEPALIVE_TIMEOUT` | duration (e.g., `10s`) | unset | How long to wait for keepalive ack before closing connection. |
| `BUBU_HUB_TLS_CERT_FILE` | path | - | Path to Hub TLS certificate (PEM). Required to enable TLS. |
| `BUBU_HUB_TLS_KEY_FILE` | path | - | Path to Hub TLS private key (PEM). Required with cert. |
| `BUBU_HUB_CA_FILE` | path | - | Optional. If set, Hub enforces mTLS and verifies client certs against this CA. |
| `BUBU_HUB_REQUIRE_TLS` | `true`/`false` | `false` | Enforce TLS for the Hub. When `true`, TLS cert/key must be provided; otherwise startup fails. |

**Example**:
```yaml
env:
  - name: BUBU_HUB_MAX_RECV_BYTES
    value: "52428800"  # 50MB
  - name: BUBU_HUB_MAX_SEND_BYTES
    value: "52428800"
  - name: BUBU_HUB_KEEPALIVE_TIME
    value: "30s"
  - name: BUBU_HUB_TLS_CERT_FILE
    value: "/etc/tls/hub/tls.crt"
  - name: BUBU_HUB_TLS_KEY_FILE
    value: "/etc/tls/hub/tls.key"
  - name: BUBU_HUB_CA_FILE
    value: "/etc/tls/hub/ca.crt"   # Optional: enable mTLS
```

---

### Buffer Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `BUBU_HUB_BUFFER_MAX_MESSAGES` | int | `100` | Max messages buffered per downstream engram. Once full, new messages are dropped. |
| `BUBU_HUB_BUFFER_MAX_BYTES` | int (bytes) | `10485760` (10MB) | Max total size of buffered messages per downstream. Whichever limit hits first applies. |
### SDK Client Buffer (Engrams)

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `BUBU_GRPC_CLIENT_BUFFER_MAX_MESSAGES` | int | `100` | Max messages buffered by the SDK client during transient failures until reconnect. |
| `BUBU_GRPC_CLIENT_BUFFER_MAX_BYTES` | int (bytes) | `10485760` (10MB) | Max total protobuf-encoded bytes buffered by the SDK client. |

Notes:
- SDK accounts bytes using protobuf wire size (`proto.Size(DataPacket)`).
- Messages exceeding `BUBU_GRPC_CLIENT_BUFFER_MAX_BYTES` are dropped with reason `oversize`.
- If adding a message would exceed the budget, it is dropped with reason `buffer_full`.


**Tuning Guidelines**:

| Workload | Messages | Bytes | Use Case |
|----------|----------|-------|----------|
| Low Latency | 50 | 5 MB | Fast downstream, minimal buffering |
| Standard | 100 | 10 MB | Default for most workloads |
| High Throughput | 500 | 50 MB | Sustained bursts, slower downstream |
| Extreme | 2000 | 200 MB | Very large messages or high cardinality |

**Memory Impact (protobuf-encoded accounting)**:
```
Memory per replica ≈ (Active Downstreams) × MIN(MAX_BYTES, Σ protobuf.Size(DataPacket))

Example:
  10 active downstreams
  × 100 messages
  × 10KB avg size
  = 10MB buffered

Notes:
- Hub accounts bytes using protobuf-encoded size of each `DataPacket`.
- Messages exceeding `BUBU_HUB_BUFFER_MAX_BYTES` individually are dropped with reason `oversize`.
- If adding a message would exceed the budget, it is dropped with reason `buffer_full`.
```

---

### Operator Controller
### TLS Configuration (User-Managed)

| Scope | Annotation/Env | Meaning |
|-------|-----------------|---------|
| Engram | `BUBU_GRPC_CLIENT_TLS_SECRET_NAME` (operator env) | Name of Secret in the Engram namespace containing `tls.crt`, `tls.key`, optional `ca.crt`. If set and `BUBU_HUB_REQUIRE_TLS=true`, operator mounts Secret to `/var/run/tls` and sets SDK client TLS envs. Default: `engram-tls`. |
| Hub (operator) | `BUBU_HUB_TLS_CERT_FILE`, `BUBU_HUB_TLS_KEY_FILE`, `BUBU_HUB_CA_FILE`, `BUBU_HUB_REQUIRE_TLS` | Manager Deployment envs to enable TLS/mTLS on Hub, or allow plaintext when `REQUIRE_TLS=false`. |

Secret keys:
```
tls.crt  # server/client certificate
tls.key  # private key
ca.crt   # CA chain (optional, enables client verification or server validation)
```

SDK envs set by operator for engrams (when Hub requires TLS):
```
BUBU_GRPC_CLIENT_TLS=true
BUBU_GRPC_CA_FILE=/var/run/tls/ca.crt
BUBU_GRPC_CLIENT_CERT_FILE=/var/run/tls/tls.crt   # optional mTLS client cert
BUBU_GRPC_CLIENT_KEY_FILE=/var/run/tls/tls.key    # optional mTLS client key
BUBU_GRPC_REQUIRE_TLS=true
```

Best practice: Users manage Certificate/Secret lifecycle with cert-manager or a service mesh (Istio/Linkerd). Operator mounts user-provided Secrets and injects envs; it does not issue certificates.

---

## Command-Line Flags

The controller manager accepts these flags (set via deployment args):

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--metrics-bind-address` | string | `:8443` | Address for metrics server. Use `:8080` for HTTP or `0` to disable. |
| `--metrics-secure` | bool | `true` | Serve metrics over HTTPS. Set `false` for insecure HTTP (dev only). |
| `--health-probe-bind-address` | string | `:8081` | Address for health/readiness probes. |
| `--leader-elect` | bool | `false` | Enable leader election for HA. Set `true` if running multiple manager replicas. |
| `--hub-port` | int | `9000` | Port for the gRPC hub server. Engrams must connect to this port. |

**Example Deployment Args**:
```yaml
spec:
  template:
    spec:
      containers:
        - name: manager
          args:
            - --metrics-bind-address=:8443
            - --metrics-secure=true
            - --health-probe-bind-address=:8081
            - --leader-elect=true
            - --hub-port=9000
```

---

## Resource Recommendations

### CPU & Memory

| Replica Tier | vCPU Request | Memory Request | Max Streams | Throughput |
|--------------|--------------|----------------|-------------|------------|
| **Minimal** | 100m | 128Mi | ~10 | 100 msg/s |
| **Small** | 500m | 512Mi | ~50 | 1k msg/s |
| **Medium** | 1000m | 1Gi | ~100 | 5k msg/s |
| **Large** | 2000m | 2Gi | ~200 | 10k msg/s |
| **X-Large** | 4000m | 4Gi | ~500 | 25k msg/s |

**Calculation**:
```
CPU: Base (200m) + (Active Streams × 5m) + (Msg Rate × 0.0001m)
Memory: Base (256MB) + (Active Streams × Buffer Size × Avg Msg Size)
```

### Storage

The operator does **not** require persistent storage. All state is:
- **Control plane**: Stored in Kubernetes API (StoryRun, Story CRs)
- **Data plane**: Buffered in memory (ephemeral)

---

## Limits & Quotas

### Hard Limits

| Resource | Limit | Consequence if Exceeded |
|----------|-------|-------------------------|
| Buffer messages | `BUBU_HUB_BUFFER_MAX_MESSAGES` | Messages dropped, `bobravoz_hub_messages_dropped_total` increments |
| Buffer bytes | `BUBU_HUB_BUFFER_MAX_BYTES` | Messages dropped |
| Message size | `BUBU_GRPC_MAX_RECV_BYTES` | gRPC error `ResourceExhausted`, client sees failure |
| Concurrent streams | ∞ | Limited only by system resources (file descriptors, memory) |

### Soft Limits

| Resource | Recommended Max | Consequence if Exceeded |
|----------|-----------------|-------------------------|
| Active streams per pod | 200 | Increased latency, higher memory usage |
| Message rate per pod | 10k msg/s | CPU saturation, potential drops |
| Hub replicas | 20 | Diminishing returns, increased coordination overhead |

---

## Proto Schema

### DataPacket Message

```protobuf
message DataPacket {
  // Metadata contains information about the StoryRun and the specific step this packet relates to.
  map<string, string> metadata = 1;

  // Payload is the actual data being processed.
  google.protobuf.Struct payload = 2;

  // Inputs contains the evaluated step 'with:' configuration (CEL-resolved per packet).
  google.protobuf.Struct inputs = 3;
}
```

**Metadata Fields** (set by engram client):
- `storyrun-name`: Name of the StoryRun
- `storyrun-namespace`: Namespace of the StoryRun
- `current-step-id`: Step ID of the sending engram
- `bubu-heartbeat`: `"true"` if heartbeat (not data)

**Size Accounting**:
- Hub uses protobuf wire size for `DataPacket` (equivalent to `proto.Size(packet)`).
- Hub message size limits: `BUBU_HUB_MAX_RECV_BYTES`, `BUBU_HUB_MAX_SEND_BYTES` (default 10MB). SDK has its own limits.

---

## Network & Security

### Ports

| Port | Protocol | Purpose | Exposed To |
|------|----------|---------|------------|
| 9000 | gRPC (TCP) | Hub server for streaming RPCs | Engrams (cluster-wide) |
| 8443 | HTTPS | Metrics endpoint | Prometheus (monitoring namespace) |
| 8081 | HTTP | Health/readiness probes | Kubelet |

### TLS Configuration

**Certificate Requirements**:
- **Type**: X.509 v3
- **Algorithm**: RSA 2048+ or ECDSA 256+
- **Common Name**: `bobravoz-grpc-hub.bobrapet-system.svc.cluster.local`
- **SAN (DNS)**: 
  - `bobravoz-grpc-hub`
  - `bobravoz-grpc-hub.bobrapet-system`
  - `bobravoz-grpc-hub.bobrapet-system.svc`
  - `bobravoz-grpc-hub.bobrapet-system.svc.cluster.local`
- **Key Usage**: Digital Signature, Key Encipherment
- **Extended Key Usage**: Server Authentication

**Cert-Manager Certificate Spec**:
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
spec:
  duration: 2160h     # 90 days
  renewBefore: 360h   # 15 days
  privateKey:
    algorithm: ECDSA
    size: 256
  usages:
    - digital signature
    - key encipherment
    - server auth
```

### Client Dial Behavior (SDK)

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `BUBU_GRPC_DIAL_TIMEOUT` | duration | `10s` | Timeout for establishing a gRPC connection (client); SDK uses blocking dials and fails fast on timeout. |

Notes:
- SDK uses blocking dial (`WithBlock`) to honor the dial timeout and avoid indefinite hangs.
- On timeout or transient failures, SDK retries with backoff (configurable via `BUBU_GRPC_RECONNECT_*`).

---

## Annotations

### Story Annotations

| Key | Value | Description |
|-----|-------|-------------|
| `bobravoz.bubustack.io/transport` | `grpc` | Designates bobravoz-grpc as the transport operator for this Story. Required for streaming Stories. |

**Example**:
```yaml
apiVersion: bubustack.io/v1alpha1
kind: Story
metadata:
  name: my-story
  annotations:
    bobravoz.bubustack.io/transport: grpc
spec:
  pattern: streaming
```

---

## Compatibility Matrix

| Component | Min Version | Max Version | Notes |
|-----------|-------------|-------------|-------|
| **Kubernetes** | 1.28 | 1.32+ | Requires HPA v2, ServiceMonitor |
| **bobrapet** | 0.1.0 | 1.x | Must support `pattern: streaming` |
| **bubu-sdk-go** | 0.1.0 | 1.x | Env var alignment since 0.2.0 |
| **Go** | 1.24 | 1.24+ | Build requirement |
| **Prometheus Operator** | 0.50 | 0.80+ | For ServiceMonitor CRD |
| **cert-manager** | 1.12 | 1.18+ | For TLS certificate management |

---

## Migration & Upgrades

### Env Var Changes (v0.1.0 → v1.0.0)

| Old | New | Status |
|-----|-----|--------|
| `BUBU_GRPC_MAX_MESSAGE_SIZE` | `BUBU_GRPC_MAX_RECV_BYTES`, `BUBU_GRPC_MAX_SEND_BYTES` | **Deprecated** (still works as fallback) |
| N/A | `BUBU_HUB_BUFFER_MAX_MESSAGES` | **New** (default 100) |
| N/A | `BUBU_HUB_BUFFER_MAX_BYTES` | **New** (default 10MB) |

**Migration**: Old env vars continue to work. Update to new vars for consistency with SDK.

---

## Best Practices

### Production Deployment

✅ **Do**:
- Enable TLS with cert-manager
- Set `--leader-elect=true` if running >1 replica
- Configure HPA based on drop metrics
- Set Prometheus alerts for `bobravoz_grpc_messages_dropped_total > 0`
- Use resource requests/limits
- Enable network policies

❌ **Don't**:
- Run without TLS in production
- Use single replica without HPA
- Set buffer sizes >500MB (OOM risk)
- Ignore dropped message alerts
- Mix operator and SDK env var conventions

---

## Next Steps

- [Deployment Guide](./bobravoz-deployment.md) — Apply these settings
- [Autoscaling Guide](./bobravoz-autoscaling.md) — Configure capacity management
- [Metrics Reference](./bobravoz-metrics.md) — Monitor these configurations
- [Troubleshooting](./bobravoz-troubleshooting.md) — Debug configuration issues

