---
title: Enable Transport TLS
sidebar_position: 1
description: Enforce TLS or mTLS between streaming Engrams and the Bobravoz hub with annotations or Helm toggles.
---

# How to Enable TLS for Streaming Engrams

This guide explains how to enable and configure Transport Layer Security (TLS) for your streaming engrams to secure the gRPC communication between the bobrapet operator's gRPC Hub and your engram.

## When to enable TLS

You should enable TLS for all production deployments of streaming engrams to ensure the confidentiality and integrity of the data in transit.

## How it works

- The Hub (inside the transport operator) is a gRPC server. TLS/mTLS on the Hub is controlled by Hub envs.
- Each streaming Engram runs the SDK which exposes a gRPC server (for P2P) and also acts as a gRPC client (dialing downstream or the Hub). TLS for Engrams is controlled by SDK envs.
- In mesh setups (Istio/Linkerd), app-level TLS can be disabled and you rely on sidecar mTLS.

### Evidence
- SDK server TLS: `bubu-sdk-go/stream.go` → `StartStreamServer` reads `BUBU_GRPC_TLS_CERT_FILE`, `BUBU_GRPC_TLS_KEY_FILE`.
- SDK client TLS: `bubu-sdk-go/stream.go` → `StreamToWithMetadata` reads `BUBU_GRPC_CLIENT_TLS`, `BUBU_GRPC_CA_FILE`, `BUBU_GRPC_CLIENT_CERT_FILE`, `BUBU_GRPC_CLIENT_KEY_FILE`, `BUBU_GRPC_REQUIRE_TLS`.
- Hub TLS: `bobravoz-grpc/internal/hub/server.go` reads `BUBU_HUB_TLS_CERT_FILE`, `BUBU_HUB_TLS_KEY_FILE`, `BUBU_HUB_CA_FILE`, `BUBU_HUB_REQUIRE_TLS`.

## Configuration

You can configure TLS using the following environment variables:

| Variable | Description | Default |
|---|---|---|
| `BUBU_GRPC_TLS_CERT_FILE` | Engram server TLS certificate path (SDK server). | unset (TLS disabled) |
| `BUBU_GRPC_TLS_KEY_FILE` | Engram server TLS private key path. | unset (TLS disabled) |
| `BUBU_GRPC_CA_FILE` | SDK client CA file to validate server (Hub/peer) or enable mTLS with client certs. | unset |
| `BUBU_GRPC_CLIENT_CERT_FILE` | SDK client certificate for mTLS to servers requiring client auth. | unset |
| `BUBU_GRPC_CLIENT_KEY_FILE` | SDK client private key for mTLS. | unset |
| `BUBU_GRPC_CLIENT_TLS` | `true` to enable TLS with system roots (no custom CA). | `false` |
| `BUBU_GRPC_REQUIRE_TLS` | `true` to forbid insecure fallback in the SDK client. | `false` |

Hub (operator) TLS envs:

| Variable | Description | Default |
|---|---|---|
| `BUBU_HUB_TLS_CERT_FILE` | Hub server TLS certificate path. | unset |
| `BUBU_HUB_TLS_KEY_FILE` | Hub server TLS private key path. | unset |
| `BUBU_HUB_CA_FILE` | Optional CA to require and verify client certs (mTLS). | unset |
| `BUBU_HUB_REQUIRE_TLS` | `true` to require TLS; `false` allows plaintext. | `false` |

## Steps to enable TLS

### 1. Generate TLS certificates (dev) or use cert-manager (prod)

First, you need to generate a server certificate and private key. For production, you should use a trusted Certificate Authority (CA). For development, you can use a self-signed certificate.

Dev self-signed example (for quick testing) using `openssl`:
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 365 -nodes -subj "/CN=my-engram.default.svc"
```

### 2. Create a Kubernetes Secret (engram server TLS)

Store the certificate and key in a Kubernetes Secret so you can securely mount them into your engram's Pod.

```bash
kubectl create secret tls my-engram-tls --cert=cert.pem --key=key.pem
```

### 3. Mount the Secret and configure environment variables (engram server TLS)

In your engram's Deployment resource, mount the secret as a volume and set the environment variables to point to the certificate and key files.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-streaming-engram
spec:
  template:
    spec:
      containers:
        - name: engram
          image: my-engram:latest
          env:
            - name: BUBU_GRPC_TLS_CERT_FILE
              value: "/etc/tls/tls.crt"
            - name: BUBU_GRPC_TLS_KEY_FILE
              value: "/etc/tls/tls.key"
          volumeMounts:
            - name: tls-volume
              mountPath: "/etc/tls"
              readOnly: true
      volumes:
        - name: tls-volume
          secret:
            secretName: my-engram-tls
```

## Enabling Mutual TLS (mTLS) and Hub TLS

There are two places you can enable TLS/mTLS:

1) Hub server (operator pod)

```yaml
# In operator Deployment
env:
  - name: BUBU_HUB_REQUIRE_TLS
    value: "true"              # set to true to require TLS on Hub
  - name: BUBU_HUB_TLS_CERT_FILE
    value: "/etc/tls/hub/tls.crt"
  - name: BUBU_HUB_TLS_KEY_FILE
    value: "/etc/tls/hub/tls.key"
  - name: BUBU_HUB_CA_FILE
    value: "/etc/tls/hub/ca.crt"  # optional: enables mTLS (client cert verification)
volumeMounts:
  - name: hub-tls
    mountPath: /etc/tls/hub
    readOnly: true
volumes:
  - name: hub-tls
    secret:
      secretName: bobravoz-grpc-hub-tls  # provisioned by cert-manager
```

2) Engram client → Hub (SDK client TLS)

- Non-mesh (recommended with cert-manager): Operator can inject SDK TLS envs and mount a Secret per namespace.

```yaml
# Operator env (once)
env:
  - name: BUBU_HUB_REQUIRE_TLS
    value: "true"
  - name: BUBU_GRPC_CLIENT_TLS_SECRET_NAME
    value: engram-tls  # default if unset
```

When the Hub requires TLS, the operator mounts `/var/run/tls` into engram Pods and sets:

```
BUBU_GRPC_CLIENT_TLS=true
BUBU_GRPC_CA_FILE=/var/run/tls/ca.crt
BUBU_GRPC_CLIENT_CERT_FILE=/var/run/tls/tls.crt   # optional for mTLS
BUBU_GRPC_CLIENT_KEY_FILE=/var/run/tls/tls.key    # optional for mTLS
BUBU_GRPC_REQUIRE_TLS=true
```

Tip: set the TLS secret directly on the Engram spec so the operator wires mounts/env automatically:

```yaml
apiVersion: bubustack.io/v1alpha1
kind: Engram
spec:
  transport:
    tls:
      secretRef:
        name: engram-tls
```

When `spec.transport.tls.secretRef` is present, the operator mounts `/var/run/tls` and sets
`BUBU_GRPC_TLS_CERT_FILE`, `BUBU_GRPC_TLS_KEY_FILE`, `BUBU_GRPC_CA_FILE`, plus client cert envs for
mTLS if provided. Set `transport.tls.useDefaultTLS: true` to fall back to the operator-configured
default secret.

- Service mesh (Istio/Linkerd): Prefer mesh mTLS; keep SDK plaintext. Do not set SDK TLS envs. Configure mesh policies instead.

Istio example:

```yaml
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata:
  name: default
  namespace: my-app
spec:
  mtls:
    mode: STRICT
```

Linkerd example:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: my-app
  annotations:
    config.linkerd.io/opaque-ports: "9000"
```

## Provisioning certificates with cert-manager (recommended)

Declare an Issuer/Certificate; cert-manager creates/renews the Secret automatically.

```yaml
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: engram-issuer
  namespace: my-app
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: engram-tls
  namespace: my-app
spec:
  secretName: engram-tls
  duration: 2160h
  renewBefore: 360h
  commonName: engram-client
  usages: ["digital signature","key encipherment","client auth"]
  issuerRef:
    name: engram-issuer
    kind: Issuer
```

For Hub server certificate examples, see the Deployment Guide TLS section.

## Disable TLS (development only)

- Hub: set `BUBU_HUB_REQUIRE_TLS=false` and do not mount any certs.
- SDK client: do not set TLS envs. The SDK will use plaintext; if `BUBU_GRPC_REQUIRE_TLS=true` is set, remove it to allow plaintext.

## Next steps
- Review the [SDK user guide's streaming quickstart](../sdk/sdk-user-guide.md#quickstart-streaming-engram) for a conceptual overview.
- See the [Transport Reference](../transports/bobravoz-reference.md#tls-configuration-user-managed) for all TLS-related settings.

## Helm integration

Prefer Helm to configure TLS toggles at install time:

```yaml
# values.yaml
hub:
  tls:
    require: true
    secretName: bobravoz-grpc-hub-tls
engrams:
  tls:
    injectClient: true
    clientSecretName: engram-tls
mesh:
  enabled: false
```

Apply:

```bash
helm upgrade --install bobravoz-grpc oci://<your-registry>/bobravoz-grpc \
  -n bobrapet-system --create-namespace -f values.yaml
```
