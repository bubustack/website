---
title: SDK User Guide
sidebar_position: 6
description: Build batch, streaming, and impulse components with the Go SDK.
---

# bubu-sdk-go: SDK User Guide

Complete guide for building engrams and impulses with the bobrapet SDK.

---

## Table of Contents

1. [Concepts](#concepts)
2. [Quickstart: Batch Engram](#quickstart-batch-engram)
3. [Quickstart: Streaming Engram](#quickstart-streaming-engram)
4. [Quickstart: Impulse](#quickstart-impulse)
5. [Lifecycle & Execution Modes](#lifecycle--execution-modes)
6. [Configuration & Secrets](#configuration--secrets)
7. [Storage Offloading](#storage-offloading)
8. [Kubernetes Integration](#kubernetes-integration)
9. [Security Best Practices](#security-best-practices)
10. [Testing Your Components](#testing-your-components)

---

## Concepts

### Component Types

**Engrams** — Stateless, single-purpose components that execute specific tasks
- **BatchEngram**: Runs to completion (K8s Job). Examples: API call, data transform, ML inference
- **StreamingEngram**: Long-running, real-time processing (K8s Deployment). Examples: message routing, filtering

**Impulses** — Long-running services that listen for external events and trigger StoryRuns
- Examples: Webhook listeners, message queue consumers, scheduled triggers

### Execution Model

```
Operator (bobrapet)
   ↓ Injects BUBU_EXECUTION_MODE
SDK (sdk.Start)
   ↓ Auto-detects
RunBatch or StartStreamServer
   ↓ Calls user code
BatchEngram.Process or StreamingEngram.Stream
```

---

## Quickstart: Batch Engram

### Step 1: Define Types

```go
// pkg/types/types.go
package types

type Config struct {
    APIKey     string `mapstructure:"apiKey"`
    MaxRetries int    `mapstructure:"maxRetries"`
}

type Inputs struct {
    UserID   string `mapstructure:"userId"`
    Action   string `mapstructure:"action"`
}
```

### Step 2: Implement Engram

```go
// pkg/engram/engram.go
package engram

import (
    "context"
    "fmt"
    sdk "github.com/bubustack/bubu-sdk-go/engram"
    "my-engram/pkg/types"
)

type MyEngram struct {
    apiKey string
}

func New() *MyEngram { return &MyEngram{} }

func (e *MyEngram) Init(ctx context.Context, cfg types.Config, secrets *sdk.Secrets) error {
    e.apiKey = cfg.APIKey
    if e.apiKey == "" {
        // Try loading from secrets
        key, ok := secrets.Get("API_KEY")
        if !ok {
            return fmt.Errorf("API_KEY not found in config or secrets")
        }
        e.apiKey = key
    }
    return nil
}

func (e *MyEngram) Process(ctx context.Context, execCtx *sdk.ExecutionContext, inputs types.Inputs) (*sdk.Result, error) {
    log := execCtx.Logger()
    log.Info("Processing", "userId", inputs.UserID, "action", inputs.Action)
    
    // Your business logic here
    result := fmt.Sprintf("Processed %s for user %s", inputs.Action, inputs.UserID)
    
    return &sdk.Result{
        Data: map[string]any{
            "status": "success",
            "message": result,
        },
    }, nil
}
```

### Step 3: Main Entry Point

```go
// main.go
package main

import (
    "context"
    "fmt"
    "os"
    sdk "github.com/bubustack/bubu-sdk-go"
    "my-engram/pkg/engram"
)

func main() {
    if err := sdk.Start(context.Background(), engram.New()); err != nil {
        fmt.Fprintf(os.Stderr, "Fatal: %v\n", err)
        os.Exit(1)
    }
}
```

### Step 4: Kubernetes YAML

```yaml
apiVersion: bubustack.io/v1alpha1
kind: Engram
metadata:
  name: my-engram
spec:
  image: my-registry/my-engram:latest
  with:
    maxRetries: 3
  secretRefs:
    - name: api-credentials
      key: API_KEY
```

---

## Quickstart: Streaming Engram

```go
// main.go
package main

import (
    "context"
    "encoding/json"
    sdk "github.com/bubustack/bubu-sdk-go"
    sengen "github.com/bubustack/bubu-sdk-go/engram"
)

type Config struct {
    FilterKeyword string `mapstructure:"filterKeyword"`
}

type StreamFilter struct {
    keyword string
}

func (s *StreamFilter) Init(ctx context.Context, cfg Config, _ *sengen.Secrets) error {
    s.keyword = cfg.FilterKeyword
    return nil
}

func (s *StreamFilter) Stream(ctx context.Context, in <-chan []byte, out chan<- []byte) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case data, ok := <-in:
            if !ok {
                return nil // Input closed
            }
            
            var msg map[string]any
            if err := json.Unmarshal(data, &msg); err != nil {
                continue // Skip malformed
            }
            
            // Filter logic
            if text, ok := msg["text"].(string); ok && contains(text, s.keyword) {
                out <- data // Pass through
            }
        }
    }
}

func main() {
    sdk.Start(context.Background(), &StreamFilter{})
}
```

---

## Quickstart: Impulse

```go
// main.go
package main

import (
    "context"
    "net/http"
    sdk "github.com/bubustack/bubu-sdk-go"
    sengen "github.com/bubustack/bubu-sdk-go/engram"
)

type Config struct {
    WebhookPort int    `mapstructure:"webhookPort"`
    StoryName   string `mapstructure:"storyName"`
}

type WebhookImpulse struct {
    cfg Config
}

func (w *WebhookImpulse) Init(ctx context.Context, cfg Config, _ *sengen.Secrets) error {
    w.cfg = cfg
    return nil
}

func (w *WebhookImpulse) Run(ctx context.Context, kc *sdk.Client) error {
    http.HandleFunc("/webhook", func(rw http.ResponseWriter, req *http.Request) {
        // Parse webhook payload
        var payload map[string]any
        json.NewDecoder(req.Body).Decode(&payload)
        
        // Trigger story
        storyRun, err := sdk.StartStory(ctx, w.cfg.StoryName, payload)
        if err != nil {
            http.Error(rw, err.Error(), 500)
            return
        }
        json.NewEncoder(rw).Encode(map[string]string{"storyRunId": storyRun.Name})
    })
    
    return http.ListenAndServe(fmt.Sprintf(":%d", w.cfg.WebhookPort), nil)
}

func main() {
    sdk.RunImpulse(context.Background(), &WebhookImpulse{})
}
```

---

## Lifecycle & Execution Modes

### Batch Mode

1. `sdk.Start` detects `BUBU_EXECUTION_MODE=batch`
2. SDK loads inputs, config, secrets from env
3. Calls `engram.Init(config, secrets)`
4. Hydrates inputs (fetches from S3 if offloaded)
5. Calls `engram.Process(ctx, execCtx, inputs)`
6. Dehydrates outputs (offloads to S3 if large)
7. Patches StepRun status with result
8. Pod exits with code 0 (success) or 1 (failure)

### Streaming Mode

1. `sdk.Start` detects `BUBU_EXECUTION_MODE=streaming`
2. SDK loads config, secrets
3. Calls `engram.Init(config, secrets)`
4. Starts gRPC server on `BUBU_GRPC_PORT`
5. On each connection, spawns 3 goroutines:
   - Reader: gRPC → in channel
   - Writer: out channel → gRPC
   - Handler: `engram.Stream(ctx, in, out)`
6. Runs until context canceled (pod deleted)

### Impulse Mode

1. `sdk.RunImpulse` loads config, merges `BUBU_IMPULSE_WITH`
2. Calls `impulse.Init(config, secrets)`
3. Creates K8s client
4. Calls `impulse.Run(ctx, client)` (blocks)
5. User listens for events, calls `sdk.StartStory(...)` to trigger runs
6. Runs until context canceled

---

## Configuration & Secrets

### Config Sources (Merged in Order)

1. Engram/Impulse YAML `with` block
2. `BUBU_CONFIG_*` env vars (operator-injected)
3. `BUBU_IMPULSE_WITH` JSON (impulses only)

Example:
```yaml
# Engram YAML
with:
  host: "api.example.com"
  port: 443
```

```go
// Operator injects: BUBU_CONFIG_timeout=30s
// SDK merges to:
type Config struct {
    Host    string        `mapstructure:"host"`    // "api.example.com"
    Port    int           `mapstructure:"port"`    // 443
    Timeout time.Duration `mapstructure:"timeout"` // 30s
}
```

### Secrets

**Three Formats:**

1. **Literal:** `BUBU_SECRET_API_KEY=abc123`
   ```go
   key, _ := secrets.Get("API_KEY") // "abc123"
   ```

2. **File Mount:** `BUBU_SECRET_db_creds=file:/var/secrets/db`
   ```
   /var/secrets/db/
     ├── username
     └── password
   ```
   ```go
   user, _ := secrets.Get("username")
   pass, _ := secrets.Get("password")
   ```

3. **Env Prefix:** `BUBU_SECRET_aws=env:AWS_`
   ```
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   ```
   ```go
   keyId, _ := secrets.Get("ACCESS_KEY_ID")
   secret, _ := secrets.Get("SECRET_ACCESS_KEY")
   ```

**⚠️ Security:**
- NEVER log `secrets.Raw()`
- Use `secrets.Get(key)` instead of indexing `Raw()`
- `secrets.GetAll()` returns redacted map

---

## Storage Offloading

**When:** Data exceeds `BUBU_MAX_INLINE_SIZE` (default 32 KiB)

**How It Works:**

**Inputs (Hydration):**
```json
{
  "largeData": {
    "$bubuStorageRef": "s3://bucket/outputs/steprun-123/largeData.json"
  }
}
```
SDK automatically fetches from S3 before passing to `Process`.

**Outputs (Dehydration):**
```go
return &sdk.Result{
    Data: map[string]any{
        "hugeFile": string(10 * 1024 * 1024), // 10 MB
    },
}, nil
```
SDK detects size, uploads to S3, replaces with `$bubuStorageRef`.

**Configuration:**
```yaml
# Story YAML
storage:
  s3:
    bucket: my-bucket
    region: us-west-2
```

---

## Kubernetes Integration

### Triggering Stories

```go
func (i *MyImpulse) Run(ctx context.Context, kc *k8s.Client) error {
    storyRun, err := sdk.StartStory(ctx, "data-pipeline", map[string]any{
        "userId": "user-123",
        "timestamp": time.Now(),
    })
    if err != nil {
        return err
    }
    log.Printf("Triggered: %s", storyRun.Name)
    return nil
}
```

### RBAC Requirements

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: engram-role
rules:
  - apiGroups: ["runs.bubustack.io"]
    resources: ["storyruns"]
    verbs: ["create", "get"]
  - apiGroups: ["runs.bubustack.io"]
    resources: ["stepruns/status"]
    verbs: ["patch"]
```

### Health Probes (Streaming/Impulse)

```yaml
livenessProbe:
  tcpSocket:
    port: 8080  # gRPC port
  initialDelaySeconds: 10
readinessProbe:
  tcpSocket:
    port: 8080
  periodSeconds: 5
```

---

## Security Best Practices

### 1. Secret Management

✅ **DO:**
```go
dbPass, ok := secrets.Get("DB_PASSWORD")
if !ok {
    return fmt.Errorf("DB_PASSWORD required")
}
db := connectDB(cfg.Host, dbPass)
```

❌ **DON'T:**
```go
log.Printf("Secrets: %+v", secrets.Raw()) // NEVER
log.Printf("Password: %s", dbPass)        // NEVER
```

### 2. Input Validation

```go
func (e *MyEngram) Process(ctx context.Context, execCtx *sdk.ExecutionContext, inputs types.Inputs) (*sdk.Result, error) {
    if inputs.Email == "" {
        return nil, fmt.Errorf("email is required")
    }
    if !isValidEmail(inputs.Email) {
        return nil, fmt.Errorf("invalid email format")
    }
    // ... proceed
}
```

### 3. Context Timeouts

```go
func (e *MyEngram) Process(ctx context.Context, execCtx *sdk.ExecutionContext, inputs types.Inputs) (*sdk.Result, error) {
    ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
    defer cancel()
    
    result, err := externalAPI.Call(ctx, inputs)
    // ...
}
```

### 4. Error Wrapping

```go
if err := validateInput(inputs); err != nil {
    return nil, fmt.Errorf("input validation failed: %w", err)
}
```

---

## Testing Your Components

### Unit Test (Batch Engram)

```go
func TestMyEngram_Process(t *testing.T) {
    e := engram.New()
    cfg := types.Config{APIKey: "test-key"}
    secrets := &sdk.Secrets{} // Mock
    
    err := e.Init(context.Background(), cfg, secrets)
    require.NoError(t, err)
    
    inputs := types.Inputs{UserID: "u123", Action: "create"}
    execCtx := &sdk.ExecutionContext{} // Mock
    
    result, err := e.Process(context.Background(), execCtx, inputs)
    require.NoError(t, err)
    assert.Equal(t, "success", result.Data["status"])
}
```

### Integration Test (with SDK)

```go
func TestBatchExecution(t *testing.T) {
    os.Setenv("BUBU_STORY_NAME", "test-story")
    os.Setenv("BUBU_STEPRUN_NAME", "test-step")
    os.Setenv("BUBU_INPUTS", `{"userId":"u123"}`)
    
    mockK8s := &k8s.MockClient{}
    mockK8s.On("PatchStepRunStatus", mock.Anything, mock.Anything, mock.Anything).Return(nil)
    
    // Test with mock clients...
}
```

---

## Next Steps

- See the [Runtime configuration reference](../reference/config.md) for all env vars
- See the [SDK Integration Guide](./sdk-integration-guide.md) for operator integration
- See the [SDK Troubleshooting](./sdk-troubleshooting.md) guide for common errors

**Examples:** [engrams/ directory in main repo](https://github.com/bubustack/engrams)
