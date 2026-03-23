---
id: first-workflow
title: Build Your First Workflow
sidebar_label: First Workflow
---

This guide walks through authoring, packaging, and operating a minimal bobrapet workflow using the Go SDK. You will:

1. Implement a type-safe Engram.
2. Generate the Story manifest programmatically with the SDK builder.
3. Apply the manifests to the cluster and trigger a `StoryRun`.
4. Observe execution with the SDK's watcher helper.

## Prerequisites

- Go 1.22+ toolchain.
- Access to a Kubernetes cluster with the bobrapet operator installed.
- `kubectl` configured for the target cluster.
- The `github.com/bubustack/bubu-sdk-go` module available locally.

## 1. Author the Engram

Create `main.go` in a new module, for example `hello-engram/main.go`:

```go title="main.go"
package main

import (
	"context"
	"log"
	"time"

	sdk "github.com/bubustack/bubu-sdk-go"
	"github.com/bubustack/bubu-sdk-go/engram"
)

type Config struct {
	DefaultGreeting string `mapstructure:"defaultGreeting"`
}

type Inputs struct {
	Name string `mapstructure:"name"`
}

type Greeter struct {
	greeting string
}

func (g *Greeter) Init(ctx context.Context, cfg Config, secrets *engram.Secrets) error {
	if cfg.DefaultGreeting == "" {
		g.greeting = "Hello"
		return nil
	}
	g.greeting = cfg.DefaultGreeting
	return nil
}

func (g *Greeter) Process(ctx context.Context, execCtx *engram.ExecutionContext, inputs Inputs) (*engram.Result, error) {
	logger := execCtx.Logger()
	if inputs.Name == "" {
		return nil, fmt.Errorf("input 'name' is required")
	}
	message := fmt.Sprintf("%s, %s!", g.greeting, inputs.Name)
	logger.Info("created greeting", "message", message)
	time.Sleep(250 * time.Millisecond)
	return engram.NewResultFrom(map[string]any{
		"greeting": message,
	}), nil
}

func main() {
	if err := sdk.StartBatch(context.Background(), &Greeter{}); err != nil {
		log.Fatalf("engram failed: %v", err)
	}
}
```

Build and push the container image that will back your Engram (see the main README for container build examples).

## 2. Generate the Story manifest

Use the SDK's story builder to render a `Story` manifest that references the Engram you just created. Add a small helper program (or embed it into your deployment tooling):

```go title="cmd/render-story/main.go"
package main

import (
	"encoding/json"
	"log"

	"github.com/bubustack/bobrapet/pkg/enums"
	"github.com/bubustack/bobrapet/pkg/refs"
	"github.com/bubustack/bubu-sdk-go/pkg/storybuilder"
)

func main() {
	builder := storybuilder.New("greet-users", "workflows").
		WithLabels(map[string]string{"app": "hello"}).
		Pattern(enums.BatchPattern)

	err := builder.AddEngramStep(
		"say-hello",
		refs.EngramReference{ObjectReference: refs.ObjectReference{Name: "hello-engram"}},
		nil,
		map[string]any{"defaultGreeting": "Greetings"},
	)
	if err != nil {
		log.Fatalf("add step: %v", err)
	}

	story, err := builder.Build()
	if err != nil {
		log.Fatalf("build story: %v", err)
	}

	data, err := json.MarshalIndent(story, "", "  ")
	if err != nil {
		log.Fatalf("marshal story: %v", err)
	}
	os.Stdout.Write(data)
}
```

Render the manifest and save it to `greet-story.yaml`:

```bash
go run ./cmd/render-story > greet-story.yaml
```

Create a companion `Engram` manifest (replace the image with your build):

```yaml title="hello-engram.yaml"
apiVersion: bubustack.io/v1alpha1
kind: Engram
metadata:
  name: hello-engram
  namespace: workflows
spec:
  image: ghcr.io/example/hello-engram:latest
  mode: job
  policy:
    timeout: 1m
```

Apply the resources:

```bash
kubectl apply -f hello-engram.yaml -f greet-story.yaml
```

## 3. Trigger the workflow

Create a `StoryRun` to execute the workflow:

```yaml title="greet-run.yaml"
apiVersion: runs.bubustack.io/v1alpha1
kind: StoryRun
metadata:
  generateName: greet-users-
  namespace: workflows
spec:
  storyRef:
    name: greet-users
  inputs:
    name: "Ada"
```

```bash
kubectl apply -f greet-run.yaml
```

## 4. Observe execution with the watcher helper

Inside your operational tooling, use the SDK's Kubernetes client watcher to stream status transitions and react to retries or failures:

```go title="cmd/watch-story/main.go"
package main

import (
	"context"
	"log"
	"log/slog"
	"os"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

	sdk "github.com/bubustack/bubu-sdk-go"
	"github.com/bubustack/bubu-sdk-go/k8s"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	client, err := k8s.NewClient()
	if err != nil {
		log.Fatal(err)
	}

	ctx = sdk.WithLogger(ctx, slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	events, err := client.WatchStoryRun(ctx, "greet-users-abc123")
	if err != nil {
		log.Fatal(err)
	}

	for ev := range events {
		if ev.Err != nil {
			slog.Error("storyrun watch error", "error", ev.Err)
			continue
		}
		slog.Info("storyrun event",
			"type", ev.Type,
			"phase", ev.StoryRun.Status.Phase,
			"ready", readyCondition(ev.StoryRun.Status.Conditions),
		)
	}
}

func readyCondition(conds []metav1.Condition) string {
	for _, cond := range conds {
		if cond.Type == "Ready" {
			return string(cond.Status)
		}
	}
	return "Unknown"
}
```

Run the watcher from your workstation or pipeline to receive live updates while the Story executes.

## Next steps

- Use the story builder to add additional steps or built-in primitives.
- Configure `DownstreamTargets` on `StepRun` resources for streaming handoffs.
- Explore the [`security & RBAC guide`](../operator/security) for production-grade permission sets.
