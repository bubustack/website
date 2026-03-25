---
title: Quickstart
sidebar_position: 2
description: Get BubuStack running on a local cluster and deploy your first workflow.
---
# Quickstart

Get BubuStack running on a local cluster and deploy your first workflow in
under 10 minutes.

**Before you start**, make sure you have the [prerequisites](prerequisites.md)
installed: [kubectl](https://kubernetes.io/docs/tasks/tools/),
[Helm](https://helm.sh/docs/intro/install/),
[kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation), and
[Docker](https://docs.docker.com/get-docker/).

## Overview

```
1. Create a local cluster         (kind)
2. Install cert-manager           (webhook TLS)
3. Install S3 storage             (payload offloading)
4. Install BubuStack controllers  (bobrapet + bobravoz-grpc)
5. Deploy an example              (start experimenting)
```

## Step 1: Create a cluster

```bash
kind create cluster --name bubustack
```

Verify the cluster is running:

```bash
kubectl cluster-info
```

## Step 2: Install cert-manager

BubuStack admission webhooks require TLS certificates.
[cert-manager](https://cert-manager.io/) handles provisioning and rotation.

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.19.2/cert-manager.yaml
```

Wait for cert-manager to become ready:

```bash
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/instance=cert-manager \
  -n cert-manager --timeout=300s
```

## Step 3: Install SeaweedFS (S3 storage)

BubuStack offloads large payloads to S3-compatible storage. The quickstart uses
[SeaweedFS](https://github.com/seaweedfs/seaweedfs) — a lightweight S3 server.

### Add the Helm repo

```bash
helm repo add seaweedfs https://seaweedfs.github.io/seaweedfs/helm
helm repo update
```

### Create the namespace and anonymous-access config

```bash
kubectl create namespace seaweedfs --dry-run=client -o yaml | kubectl apply -f -
```

```bash
kubectl create secret generic seaweedfs-s3-anon-config -n seaweedfs \
  --from-literal='seaweedfs_s3_config={"identities":[{"name":"anonymous","actions":["Read","Write","List","Tagging","Admin"]}]}' \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Install SeaweedFS via Helm

```bash
helm upgrade --install seaweedfs -n seaweedfs \
  seaweedfs/seaweedfs \
  --set filer.s3.enabled=false \
  --set s3.enabled=true \
  --set s3.replicas=1 \
  --set s3.port=8333 \
  --set s3.enableAuth=true \
  --set s3.existingConfigSecret=seaweedfs-s3-anon-config \
  --set 's3.createBuckets[0].name=bubu-default' \
  --set 's3.createBuckets[0].ttl=7d' \
  --set 's3.createBuckets[0].objectLock=true' \
  --set 's3.createBuckets[0].versioning=Enabled'
```

This creates a `bubu-default` bucket with 7-day TTL and object locking enabled.

### Verify storage is running

```bash
kubectl get pods -n seaweedfs
# All pods should be Running/Ready
```

## Step 4: Install BubuStack

Install the two core controllers via Helm:

```bash
# Add the Helm repo
helm repo add bubustack https://bubustack.github.io/helm-charts
helm repo update

# Install the workflow operator
helm install bobrapet bubustack/bobrapet

# Install the streaming transport hub
helm install bobravoz-grpc bubustack/bobravoz-grpc
```

Optionally, install the web console:

```bash
helm install bubuilder bubustack/bubuilder
```

### Verify controllers are running

```bash
kubectl get pods -l app.kubernetes.io/part-of=bubustack
# bobrapet-controller-manager and bobravoz-grpc-controller-manager should be Running
```

### Verify CRDs are installed

```bash
kubectl api-resources | grep bubustack
# Should list: stories, storyruns, stepruns, engrams, impulses, transports, etc.
```

## Step 5: Deploy an example

Each example in the [examples repository](https://github.com/bubustack/examples)
follows the same pattern:

```bash
git clone https://github.com/bubustack/examples.git
cd examples
```

Expected:
- `examples/batch/` and `examples/realtime/` directories exist.

```
bootstrap.yaml   Namespace, secrets, RBAC, transport definitions
engrams.yaml     Engram instances (component deployments)
story.yaml       Workflow definition (DAG of steps)
impulse.yaml     Trigger (webhook, cron, or Kubernetes event)
```

### Batch example: GitHub PR Review

```bash
cd examples/batch/github-pr-review

# 1. Edit bootstrap.yaml to add your API keys
#    (OpenAI key, GitHub token)

# 2. Apply in order
kubectl apply -f bootstrap.yaml
kubectl apply -f engrams.yaml
kubectl apply -f story.yaml
kubectl apply -f impulse.yaml
```

### Real-time example: Pod Crash Notifier

```bash
cd examples/realtime/pod-crash-notifier

kubectl apply -f bootstrap.yaml
kubectl apply -f engrams.yaml
kubectl apply -f story.yaml
kubectl apply -f impulse.yaml
```

### Verify your workflow

```bash
# Check that Engrams are ready
kubectl get engrams -A
# Expected: Engram objects are listed in your target namespace.

# Check that the Story is registered
kubectl get stories -A
# Expected: Story resources are present and accepted by the API server.

# Watch for StoryRuns (triggered by the Impulse)
kubectl get storyruns -A --watch
# Expected: a StoryRun appears once the trigger condition is met.
```

## What's next

- Read the example's `README.md` for detailed configuration options.
- Explore other examples in the [examples repository](https://github.com/bubustack/examples).
- See [Core](../overview/core.md) for the full workflow model.
- See [Building Engrams](../sdk/building-engrams.md) to build your own components.
- See [Lifecycle Hooks](../streaming/lifecycle-hooks.md) for streaming lifecycle events.

## Related docs

- [Prerequisites](prerequisites.md) — CLI tools and system dependencies.
- [Architecture](../overview/architecture.md) — System architecture and module map.
- [Operator Configuration](../operator/configuration.md) — Operator configuration keys and defaults.
- [Component Ecosystem](../overview/component-ecosystem.md) — Building custom Engrams and Impulses.
- [Roadmap](../community/roadmap.md) — What's planned and where to contribute.
- [Get Involved](../community/get-involved.md) — Join the community.
