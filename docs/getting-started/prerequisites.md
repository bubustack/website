---
title: Prerequisites
sidebar_position: 1
description: What you need before installing BubuStack.
---
# Prerequisites

BubuStack runs on Kubernetes and depends on a small set of external components.
This page lists everything you need before following the [Quickstart](quickstart.md).

## Kubernetes cluster

BubuStack targets **Kubernetes 1.30+**. Any conformant cluster works:

| Option | Notes |
|--------|-------|
| [kind](https://kind.sigs.k8s.io/) | Recommended for local development. Used in the quickstart. |
| [k3s](https://k3s.io/) | Lightweight, good for edge and CI. |
| [minikube](https://minikube.sigs.k8s.io/) | Alternative local cluster. |
| EKS / GKE / AKS | Managed Kubernetes. Any conformant provider works. |
| [kubeadm](https://kubernetes.io/docs/reference/setup-tools/kubeadm/) | Bare-metal or VM-based clusters. |

## CLI tools

You need these tools installed locally:

| Tool | Version | Purpose |
|------|---------|---------|
| [kubectl](https://kubernetes.io/docs/tasks/tools/) | 1.30+ | Kubernetes CLI |
| [Helm](https://helm.sh/docs/intro/install/) | 3.x | Package manager for Kubernetes |
| [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation) | 0.20+ | Local cluster (if not using a remote cluster) |
| [Docker](https://docs.docker.com/get-docker/) | 20+ | Container runtime (required by kind) |

## System dependencies

These are installed as part of the [Quickstart](quickstart.md), but listed here for reference:

### cert-manager

BubuStack uses admission webhooks for CRD validation and mutation. Webhooks
require TLS certificates. [cert-manager](https://cert-manager.io/) automates
certificate provisioning and rotation.

**Version:** v1.19+ recommended.

### S3-compatible object storage

BubuStack offloads large payloads, outputs, and logs to object storage using the
S3 API. Any S3-compatible backend works.

**Compatible backends:**

| Backend | Notes |
|---------|-------|
| [SeaweedFS](https://github.com/seaweedfs/seaweedfs) | Lightweight, good for local/dev. Used in the quickstart. |
| [Garage](https://garagehq.deuxfleurs.fr/) | Distributed, self-hosted, geo-aware. |
| [RustFS](https://rustfs.com/) | High-performance Rust-based S3 server. |
| [CubeFS](https://cubefs.io/) | Cloud-native distributed storage. |
| [MinIO](https://min.io/) | Popular S3-compatible server. |
| AWS S3 | Native S3. |

### Storage configuration

The operator needs these settings (configured via the operator ConfigMap or Helm
values):

| Key | Description |
|-----|-------------|
| `controller.storage.s3.bucket` | Bucket name (built-in default empty; the quickstart install sets `bubu-default`) |
| `controller.storage.s3.region` | S3 region (built-in default empty; the quickstart install sets `us-east-1`) |
| `controller.storage.s3.endpoint` | S3 endpoint URL |
| `controller.storage.s3.use-path-style` | Use path-style addressing (required for most non-AWS backends) |
| `controller.storage.s3.auth-secret-name` | K8s Secret with `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` |

See [Operator Configuration](../operator/configuration.md) for the full configuration reference.

## Related docs

- [Quickstart](quickstart.md) — Step-by-step installation guide.
- [Operator Configuration](../operator/configuration.md) — Operator configuration keys and defaults.
- [Architecture](../overview/architecture.md) — System architecture and module map.
- [Roadmap](../community/roadmap.md) — What's planned and where to contribute.
