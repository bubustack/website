---
title: Authoring Engrams
sidebar_position: 1
description: Build, harden, and publish reusable Engrams with the Bobrapet Go SDK and GitOps workflows.
---
# Authoring Engrams

:::info Quick scan
- **Why**: Build Engrams that meet Bubustack&apos;s runtime, security, and catalog expectations.
- **When**: Use this guide when you are ready to package a new capability or refactor an existing workload into an EngramTemplate.
- **How**: Scaffold the SDK project, define the template schema, version the runtime, and publish through GitOps.
:::

This guide walks through authoring a custom Engram that fetches data from an API, enriches it, and
publishes a result. You'll learn how to use the Bobrapet Go SDK, define template metadata, and
promote the Engram across environments using GitOps. The same pattern applies whether you're
building deterministic data processors, retrieval components, or AI agents.

## 1. Scaffold the Project

Create a new Go module:

```bash
mkdir -p engravings/weather-sync
cd engravings/weather-sync
go mod init github.com/your-org/weather-sync
go get github.com/bubustack/bobrapet-go-sdk@latest
```

Initialize the Engram entrypoint:

```go title="main.go"
package main

import (
	"context"
	"log"

	"github.com/bubustack/bobrapet-go-sdk/runtime"
)

type Config struct {
	City    string `json:"city"`
	Webhook string `json:"webhook"`
}

func main() {
	runtime.Run(func(ctx context.Context, env *runtime.Environment) error {
		var cfg Config
		if err := env.BindInputs(&cfg); err != nil {
			return err
		}

		weather, err := fetchWeather(ctx, cfg.City)
		if err != nil {
			return err
		}

		if err := postUpdate(ctx, cfg.Webhook, weather); err != nil {
			return err
		}

		return env.ReportOutputs(map[string]any{
			"temperature": weather.TempCelsius,
			"condition":   weather.Condition,
		})
	})
}
```

The SDK gives you:

- `Environment.BindInputs` — Reads the `with` payload supplied in the Story step.
- `Environment.ReportOutputs` — Patches the StepRun with structured results.
- Structured logging, tracing, and cancellation semantics.

## 2. Package the Container

Create a minimal `Dockerfile`:

```dockerfile title="Dockerfile"
FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/engram ./...

FROM gcr.io/distroless/base-debian12
COPY --from=build /out/engram /usr/local/bin/engram
ENTRYPOINT ["/usr/local/bin/engram"]
```

Build and push the image:

```bash
docker build -t ghcr.io/your-org/engrams/weather-sync:0.1.0 .
docker push ghcr.io/your-org/engrams/weather-sync:0.1.0
```

## 3. Define the Engram Template

Templates declare the configuration schema, runtime modes, and metadata.

```yaml title="weather-sync-template.yaml"
apiVersion: catalog.bubustack.io/v1alpha1
kind: EngramTemplate
metadata:
  name: weather-sync
spec:
  version: "0.1.0"
  description: "Fetch current weather data and post updates to a webhook."
  supportedModes: ["job"]
  schema:
    openAPIV3Schema:
      type: object
      required: ["city", "webhook"]
      properties:
        city:
          type: string
          description: "City to fetch weather for."
        webhook:
          type: string
          description: "Destination URL for updates."
  image: ghcr.io/your-org/engrams/weather-sync:0.1.0
  command: ["/usr/local/bin/engram"]
```

Apply it to your cluster:

```bash
kubectl apply -f weather-sync-template.yaml
```

## 4. Instantiate the Engram

```yaml title="weather-sync-engram.yaml"
apiVersion: bubustack.io/v1alpha1
kind: Engram
metadata:
  name: weather-sync
  namespace: automation
spec:
  templateRef: weather-sync
  with:
    city: "Berlin"
    webhook: "https://hooks.example.com/weather"
```

Once applied, the Engram controller validates the configuration and prepares it for use in Stories.

## 5. Wire the Engram into a Story

```yaml
steps:
  - name: sync-weather
    ref: weather-sync
    with:
      city: "{{ inputs.city }}"
      webhook: "{{ secrets.alert_webhook }}"
```

## 6. Version and Promote

- Tag container images with semantic versions.
- Update `spec.version` when you publish breaking changes or new features.
- Use GitOps pipelines to promote templates and Engrams across environments (dev → staging → prod).
- Document transport compatibility: Bobravoz today, plus a note that new transports will follow the
  same ABI once they are contributed and certified by the community.

## Testing Locally

- Use the `testruntime` helper from the Go SDK to simulate StepRuns end-to-end.
- Seed representative `with` payloads and secrets through the helper rather than hard-coding them.
- Assert on the reported outputs and emitted conditions to catch contract regressions before CI.
- Pair unit tests with integration tests that run Engrams inside KinD or k3d when you rely on cloud
  dependencies.

## Operational Readiness Checklist

- [ ] Container image runs as a non-root user and carries minimal attack surface.
- [ ] Probes reflect health criteria for `deployment` / `statefulset` modes.
- [ ] Prometheus metrics exported under the `bubustack_engram_*` prefix.
- [ ] Secrets injected via `mounts.secrets` rather than baked into the image.
- [ ] Story examples use semantic versioned EngramTemplates.
- [ ] Runbooks reference common failure modes (`kubectl describe engram ...`).

## Publishing to a Catalog

1. Commit the template and Engram manifests to your GitOps repo.
2. Open a pull request with contract notes (`with` schema changes, new outputs, deprecations).
3. Annotate the template with owner metadata:

   ```yaml
   metadata:
     annotations:
       bubustack.io/owner: "Automation Platform"
       bubustack.io/runbook: "https://runbooks.example.com/weather-sync"
   ```

4. Use Git tags or container digests to lock runtime images.
5. Promote through environments by updating the Engram revision or namespace overlays.

:::note Roadmap
The Python SDK enters public beta in Q2, followed by a TypeScript SDK with Bun support. Align your
templates with the ABI expectations documented in the [Go SDK reference](../sdk/go-sdk.md) so they
remain portable when new runtimes arrive.
:::

## Troubleshooting Tips

- Use `kubectl describe engram weather-sync -n automation` to inspect reconciliation events.
- Tail the controller logs (`kubectl logs deploy/bobrapet-controller-manager -n bobrapet-system`) for
  validation errors.
- Ensure your Engram image includes the Go SDK runtime and runs as a non-root user when possible.

## Next steps

- Continue with [Story Patterns](../stories/patterns.md) to orchestrate Engrams into multi-step flows.
- Explore [Impulses](../stories/impulses.md) to trigger your Engram via events or schedules.
- Share templates or request reviews through [Community contribution pathways](../community/contributing.md).
