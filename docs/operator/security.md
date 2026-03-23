---
id: security
title: Security & RBAC
sidebar_label: Security & RBAC
---

This guide outlines recommended permissions and operational guardrails for running bobrapet in multi-tenant and production environments.

## Service account least privilege

Each workload that interacts with bobrapet resources should run under a dedicated service account restricted to the namespaces it manages.

### Triggering StoryRuns

Automation such as Impulses or external controllers only needs to create `StoryRun` resources and observe status:

```yaml title="rbac/storyrun-trigger.yaml"
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: storyrun-trigger
  namespace: workflows
rules:
  - apiGroups: ["runs.bubustack.io"]
    resources: ["storyruns"]
    verbs: ["get", "list", "watch", "create"]
  - apiGroups: ["runs.bubustack.io"]
    resources: ["storyruns/status"]
    verbs: ["get", "watch"]
```

Bind the role to the service account used by your Impulse or automation:

```yaml
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: storyrun-trigger-binding
  namespace: workflows
subjects:
  - kind: ServiceAccount
    name: impulse-sa
roleRef:
  kind: Role
  name: storyrun-trigger
  apiGroup: rbac.authorization.k8s.io
```

### Updating StepRun status

SDK-driven Engrams need to patch only the `status` subresource of `StepRun` objects plus read their spec:

```yaml title="rbac/steprun-writer.yaml"
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: steprun-writer
  namespace: workflows
rules:
  - apiGroups: ["runs.bubustack.io"]
    resources: ["stepruns"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["runs.bubustack.io"]
    resources: ["stepruns/status"]
    verbs: ["get", "patch", "update"]
```

Combine this role with the standard pod identity (e.g., via `RoleBinding`) so Engram pods can access only the StepRuns they own.

### Observability-only tooling

Dashboards or alerting components typically need read-only access:

```yaml
rules:
  - apiGroups: ["runs.bubustack.io"]
    resources: ["storyruns", "storyruns/status", "stepruns", "stepruns/status"]
    verbs: ["get", "list", "watch"]
```

Avoid granting write verbs to monitoring systems.

## Namespace and tenancy boundaries

- Create separate namespaces per team or environment and scope each service account's role bindings accordingly.
- Disable cross-namespace story references unless explicitly required; when needed, bind RBAC in both namespaces.
- The SDK's `WatchStoryRun` helper respects the client's namespace by default. Running it with a cluster-scoped service account can observe all story executions—limit its bindings to avoid information leakage.

## Network and secret hygiene

- Use the SDK's secrets expansion (`engram.NewSecrets`) for file or prefix mounted secrets; the runtime warns when secret material is missing.
- Ensure Engram pods mount only the secrets listed in the Story's step definition.
- Prefer mTLS or private networking for streaming (`StreamToWithMetadata`). The SDK logs whenever connections fall back to plaintext transport, allowing you to alert on insecure configurations.

## Operational policies

- Set `BUBU_GRPC_RECONNECT_MAX_RETRIES=0` (default) for resilient streaming runners; override with a finite number only when backpressure is required.
- Configure `StoryPolicy` timeouts and retries at the Story level so Engram code stays simple and consistent.
- Monitor the emitted Kubernetes conditions: the CRD enforces presence of a `Ready` condition, and the SDK writes descriptive `lastTransitionTime` values for troubleshooting.

Refer to the [First Workflow tutorial](../sdk/first-workflow) for a full end-to-end example that combines these RBAC roles with the Go SDK.
