---
title: Installing Engrams and Impulses
sidebar_position: 3
description: How to install Engram and Impulse templates into your BubuStack cluster.
---
# Installing Engrams and Impulses

BubuStack ships a growing catalog of ready-made components. This guide shows
how to install them directly into your cluster from GitHub-hosted template YAMLs.

[`bubu-registry`](https://github.com/bubustack/bubu-registry) and the `bubu`
CLI already exist for registry-backed discovery, install, and publishing
workflows. This page documents the direct `kubectl apply` path because it is
the universal baseline that works for every published component today.

**Before you start**, make sure you have
[BubuStack installed](quickstart.md) and the CRDs registered
(`kubectl api-resources | grep bubustack`).

---

## How components are distributed

Each component lives in its own GitHub repository under the
[bubustack](https://github.com/bubustack) organization:

- **Engrams** — data-processing steps (`*-engram` repos).
- **Impulses** — event-driven triggers (`*-impulse` repos).

Every repository contains:

| File | Purpose |
|------|---------|
| `Engram.yaml` or `Impulse.yaml` | Cluster-scoped template manifest |
| `Dockerfile` | Container image build |
| `README.md` | Configuration reference, inputs, outputs |

Pre-built container images are published to
`ghcr.io/bubustack/<component-name>:<version>`.

---

## Step 1: Install an EngramTemplate

EngramTemplates are **cluster-scoped** resources. They register the component
so that Stories can reference it.

### From a GitHub release (recommended)

```bash
# Example: install the openai-chat-engram template
kubectl apply -f https://raw.githubusercontent.com/bubustack/openai-chat-engram/main/Engram.yaml
```

### From a local clone

```bash
git clone https://github.com/bubustack/openai-chat-engram.git
kubectl apply -f openai-chat-engram/Engram.yaml
```

### Verify the template is registered

```bash
kubectl get engramtemplates
# NAME           VERSION   MATURITY       AGE
# openai-chat    0.1.0     experimental   5s
```

---

## Step 2: Create an Engram instance

An Engram is a **namespaced** resource that references a template and supplies
configuration for a specific Story.

```yaml
apiVersion: bubustack.io/v1alpha1
kind: Engram
metadata:
  name: my-chat
  namespace: my-app
spec:
  templateRef:
    name: openai-chat          # must match EngramTemplate metadata.name
  with:                         # config values (see component README)
    defaultModel: gpt-4o
    defaultTemperature: 0.7
  secretRefs:
    - name: openai-credentials  # Kubernetes Secret with API keys
```

```bash
kubectl apply -f my-engram.yaml
kubectl get engrams -n my-app
```

---

## Step 3: Install an ImpulseTemplate

ImpulseTemplates follow the same pattern.

```bash
# Example: install the cron-impulse template
kubectl apply -f https://raw.githubusercontent.com/bubustack/cron-impulse/main/Impulse.yaml
```

```bash
kubectl get impulsetemplates
# NAME   VERSION   MATURITY       AGE
# cron   0.1.0     experimental   5s
```

---

## Step 4: Create an Impulse instance

```yaml
apiVersion: bubustack.io/v1alpha1
kind: Impulse
metadata:
  name: nightly-run
  namespace: my-app
spec:
  templateRef:
    name: cron                  # must match ImpulseTemplate metadata.name
  storyRef:
    name: my-story
  with:
    schedules:
      - name: nightly
        cron: "0 2 * * *"
```

```bash
kubectl apply -f my-impulse.yaml
kubectl get impulses -n my-app
```

---

## Available components

### Engrams

| Component | Pattern | Install |
|-----------|---------|---------|
| [conversation-memory-engram](https://github.com/bubustack/conversation-memory-engram) | Batch | `kubectl apply -f https://raw.githubusercontent.com/bubustack/conversation-memory-engram/main/Engram.yaml` |
| [http-request-engram](https://github.com/bubustack/http-request-engram) | Batch | `kubectl apply -f https://raw.githubusercontent.com/bubustack/http-request-engram/main/Engram.yaml` |
| [json-filter-engram](https://github.com/bubustack/json-filter-engram) | Batch | `kubectl apply -f https://raw.githubusercontent.com/bubustack/json-filter-engram/main/Engram.yaml` |
| [map-reduce-adapter-engram](https://github.com/bubustack/map-reduce-adapter-engram) | Batch | `kubectl apply -f https://raw.githubusercontent.com/bubustack/map-reduce-adapter-engram/main/Engram.yaml` |
| [materialize-engram](https://github.com/bubustack/materialize-engram) | Batch | `kubectl apply -f https://raw.githubusercontent.com/bubustack/materialize-engram/main/Engram.yaml` |
| [mcp-adapter-engram](https://github.com/bubustack/mcp-adapter-engram) | Both | `kubectl apply -f https://raw.githubusercontent.com/bubustack/mcp-adapter-engram/main/Engram.yaml` |
| [openai-chat-engram](https://github.com/bubustack/openai-chat-engram) | Both | `kubectl apply -f https://raw.githubusercontent.com/bubustack/openai-chat-engram/main/Engram.yaml` |
| [openai-stt-engram](https://github.com/bubustack/openai-stt-engram) | Streaming | `kubectl apply -f https://raw.githubusercontent.com/bubustack/openai-stt-engram/main/Engram.yaml` |
| [openai-tts-engram](https://github.com/bubustack/openai-tts-engram) | Streaming | `kubectl apply -f https://raw.githubusercontent.com/bubustack/openai-tts-engram/main/Engram.yaml` |
| [silero-vad-engram](https://github.com/bubustack/silero-vad-engram) | Streaming | `kubectl apply -f https://raw.githubusercontent.com/bubustack/silero-vad-engram/main/Engram.yaml` |
| [livekit-bridge-engram](https://github.com/bubustack/livekit-bridge-engram) | Streaming | `kubectl apply -f https://raw.githubusercontent.com/bubustack/livekit-bridge-engram/main/Engram.yaml` |
| [livekit-turn-detector-engram](https://github.com/bubustack/livekit-turn-detector-engram) | Streaming | `kubectl apply -f https://raw.githubusercontent.com/bubustack/livekit-turn-detector-engram/main/Engram.yaml` |
| [text-emitter-engram](https://github.com/bubustack/text-emitter-engram) | Batch | `kubectl apply -f https://raw.githubusercontent.com/bubustack/text-emitter-engram/main/Engram.yaml` |

### Impulses

| Component | Trigger | Install |
|-----------|---------|---------|
| [cron-impulse](https://github.com/bubustack/cron-impulse) | Cron schedule | `kubectl apply -f https://raw.githubusercontent.com/bubustack/cron-impulse/main/Impulse.yaml` |
| [github-webhook-impulse](https://github.com/bubustack/github-webhook-impulse) | GitHub events | `kubectl apply -f https://raw.githubusercontent.com/bubustack/github-webhook-impulse/main/Impulse.yaml` |
| [kubernetes-impulse](https://github.com/bubustack/kubernetes-impulse) | K8s events | `kubectl apply -f https://raw.githubusercontent.com/bubustack/kubernetes-impulse/main/Impulse.yaml` |
| [livekit-webhook-impulse](https://github.com/bubustack/livekit-webhook-impulse) | LiveKit events | `kubectl apply -f https://raw.githubusercontent.com/bubustack/livekit-webhook-impulse/main/Impulse.yaml` |

---

## Bulk install (all components)

To install every available template at once:

```bash
# Engrams
for repo in conversation-memory-engram http-request-engram json-filter-engram \
  map-reduce-adapter-engram materialize-engram mcp-adapter-engram \
  openai-chat-engram openai-stt-engram openai-tts-engram \
  silero-vad-engram livekit-bridge-engram livekit-turn-detector-engram \
  text-emitter-engram; do
  kubectl apply -f "https://raw.githubusercontent.com/bubustack/$repo/main/Engram.yaml"
done

# Impulses
for repo in cron-impulse github-webhook-impulse kubernetes-impulse \
  livekit-webhook-impulse; do
  kubectl apply -f "https://raw.githubusercontent.com/bubustack/$repo/main/Impulse.yaml"
done
```

---

## Configuring secrets

Components that connect to external services (OpenAI, LiveKit, GitHub) require
Kubernetes Secrets. Each component's README documents the expected secret keys.

```bash
# Example: OpenAI credentials for openai-chat-engram
kubectl create secret generic openai-credentials \
  -n my-app \
  --from-literal=OPENAI_API_KEY=sk-...
```

Reference the secret in your Engram instance:

```yaml
spec:
  secretRefs:
    - name: openai-credentials
```

---

## Verifying installations

```bash
# List all registered templates
kubectl get engramtemplates
kubectl get impulsetemplates

# List all instances
kubectl get engrams -A
kubectl get impulses -A

# Describe a specific template for schema details
kubectl describe engramtemplate openai-chat
```

---

## Upgrading components

To upgrade a component to a newer version, re-apply the template from the
target release tag:

```bash
kubectl apply -f https://raw.githubusercontent.com/bubustack/openai-chat-engram/v0.2.0/Engram.yaml
```

Existing Engram instances referencing the template will pick up the new image
on their next reconciliation cycle.

---

## What's next

- [`bubu-registry`](https://github.com/bubustack/bubu-registry) and the `bubu`
  CLI already cover Git-backed search, install, and publishing workflows. The
  public catalog breadth, SemVer-aware resolution, and supply-chain metadata
  remain active roadmap work.
- Until then, browse all components on GitHub:
  [Engrams](https://github.com/orgs/bubustack/repositories?q=engram) |
  [Impulses](https://github.com/orgs/bubustack/repositories?q=impulse)
- To build your own, see [Building Engrams](../sdk/building-engrams.md).

## Related docs

- [Quickstart](quickstart.md) — Install BubuStack on a local cluster.
- [Component Ecosystem](../overview/component-ecosystem.md) — SDK contracts and catalog overview.
- [Building Engrams](../sdk/building-engrams.md) — Author custom components.
- [CRD Cheatsheet](../api/crd-cheatsheet.md) — Quick reference for all BubuStack resources.
- [Roadmap](../community/roadmap.md) — What's next for the registry, Bubuilder, and the wider platform.
