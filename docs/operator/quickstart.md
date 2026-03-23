---
title: Bobrapet Quickstart
sidebar_position: 1
description: Install the Bobrapet operator, register your first Engram, and run a Story under GitOps control.
---
# Bobrapet Quickstart

:::info Quick scan
- **Why**: Install the Bobrapet operator and validate a full StoryRun lifecycle on a real cluster.
- **When**: Run this guide before promoting Bubustack into staging so your GitOps pipeline has a known-good baseline.
- **How**: Apply the manifests in order, capture the CLI output, and commit everything into your Git repository.
:::

This 20-minute guide walks you through installing the **Bobrapet** operator—the control plane of the
Bubustack ecosystem—registering a reusable Engram, and executing your first StoryRun. The workflow is
fully declarative so you can drop the manifests into your GitOps repo when you're ready.

## Prerequisites

- Kubernetes cluster (KinD, k3d, Minikube, or any managed service).
- `kubectl` with cluster-admin privileges.
- Git repository or local manifests directory you use for GitOps.
- Optional: `kustomize` and `helm` for more advanced overlays.

> Need a sandbox? Use `kind create cluster --name bubustack` and export `KUBECONFIG` before you start.

## 1. Install Bobrapet CRDs and Controllers

Bobrapet ships as a standard operator. Install the CRDs and controller manager manifests. You can
apply them directly or check them into your infrastructure repo.

```bash
# Apply CRDs
kubectl apply -f https://github.com/bubustack/bobrapet/releases/latest/download/crds.yaml

# Deploy the controller manager, webhooks, and supporting services
kubectl apply -f https://github.com/bubustack/bobrapet/releases/latest/download/operator.yaml
```

Confirm the control plane is healthy:

```bash
kubectl get pods -n bobrapet-system
kubectl get validatingwebhookconfigurations bobrapet-validating-webhook
```

You should see the `bobrapet-controller-manager` Deployment with all pods in `Running`.

### GitOps Tip

Copy the two URLs above into your GitOps repository under an `apps/bobrapet` directory and let your
controller (Flux, Argo CD, Faros, etc.) reconcile them. That keeps future upgrades auditable.

## 2. Publish a Sample EngramTemplate

Engrams encapsulate reusable capabilities. Templates define the contract and supported runtimes.

```yaml title="catalog/echo-template.yaml"
apiVersion: catalog.bubustack.io/v1alpha1
kind: EngramTemplate
metadata:
  name: echo-template
  annotations:
    bubustack.io/owner: platform-foundation
spec:
  version: "1.0.0"
  description: "Echoes the payload sent by the Story step."
  supportedModes: ["job"]
  schema:
    openAPIV3Schema:
      type: object
      properties:
        message:
          type: string
          description: Optional override for the greeting.
  image: bash:5.2
  args:
    - -c
    - echo "${BUBUSTACK_MESSAGE:-Hello from Bobrapet!}"
```

Apply the template:

```bash
kubectl apply -f catalog/echo-template.yaml
```

Check registration:

```bash
kubectl get engramtemplate echo-template
```

## 3. Instantiate an Engram

```yaml title="clusters/dev/engrams/echo.yaml"
apiVersion: bubustack.io/v1alpha1
kind: Engram
metadata:
  name: quickstart-echo
  namespace: automation
spec:
  templateRef: echo-template
  with:
    message: "Declarative automation for everyone."
```

Apply it and verify status:

```bash
kubectl create namespace automation
kubectl apply -f clusters/dev/engrams/echo.yaml
kubectl get engram quickstart-echo -n automation -o wide
```

## 4. Declare a Story

```yaml title="clusters/dev/stories/hello.yaml"
apiVersion: bubustack.io/v1alpha1
kind: Story
metadata:
  name: hello-bubustack
  namespace: automation
  annotations:
    bubustack.io/owner: automation-team
spec:
  steps:
    - name: greet
      ref: quickstart-echo
      with:
        message: "{{ inputs.message | default('Hello, Bubustack!') }}"
```

Apply the Story and confirm it appears:

```bash
kubectl apply -f clusters/dev/stories/hello.yaml
kubectl get stories -n automation
```

## 5. Trigger Your First Run

Stories remain dormant until a `StoryRun` resource is created. Create one manually to kick things
off. Later you'll wire Impulses or external transports.

```yaml title="clusters/dev/storyruns/hello.yaml"
apiVersion: runs.bubustack.io/v1alpha1
kind: StoryRun
metadata:
  name: hello-bubustack-001
  namespace: automation
spec:
  storyRef:
    name: hello-bubustack
  inputs:
    message: "Bubustack loves GitOps."
```

Apply and watch the run:

```bash
kubectl apply -f clusters/dev/storyruns/hello.yaml
kubectl get storyrun hello-bubustack-001 -n automation -o yaml
kubectl get stepruns -n automation --selector=bubustack.io/story=hello-bubustack
```

Fetch the step logs:

```bash
kubectl logs job/steprun-hello-bubustack-001-greet -n automation
```

You should see the greeting echoed from the Engram container.

:::tip Transport preview
Bobravoz is the default Story transport today. When new transports land via community contributions,
you can add `spec.transport.variant` to the Story without changing Engram manifests.
:::

## 6. Wire It into GitOps

- Commit the manifests under `catalog/`, `clusters/dev/engrams/`, and `clusters/dev/stories/`.
- Configure your GitOps controller to watch those directories.
- Use overlays for staging and production to adjust annotations, namespaces, or Engram versions.

## 7. Clean Up

```bash
kubectl delete -f clusters/dev/storyruns/hello.yaml
kubectl delete -f clusters/dev/stories/hello.yaml
kubectl delete -f clusters/dev/engrams/echo.yaml
kubectl delete -f catalog/echo-template.yaml
kubectl delete -f https://github.com/bubustack/bobrapet/releases/latest/download/operator.yaml
kubectl delete -f https://github.com/bubustack/bobrapet/releases/latest/download/crds.yaml
```

## Next steps

- Move into [Day-2 Operations](day-two-operations.md) to scale and secure the control plane.
- Learn how the control plane works in [Ecosystem Architecture](../ecosystem/architecture.md).
- Explore transport tuning in [Bobravoz operations](../transports/bobravoz.md) ahead of streaming workloads.
- Wire declarative triggers in [Impulses](../stories/impulses.md) and deepen orchestration with
  [Story Patterns](../stories/patterns.md).
