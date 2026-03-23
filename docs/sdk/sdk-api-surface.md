---
title: SDK API Surface
sidebar_position: 9
description: Snapshot of the exported functions, interfaces, and environment variables in bubu-sdk-go.
---

# bubu-sdk-go: API Surface Documentation

**Generated:** October 2, 2025

---

## Package: `github.com/bubustack/bubu-sdk-go`

### Entry Points

| Function | Source | Purpose |
|----------|--------|---------|
| `Start[C any](ctx, engram) error` | `sdk.go:88` | Universal engram entry; auto-detects batch/streaming mode |
| `RunBatch[C,I any](ctx, engram) error` | `batch.go:22` | Explicit batch execution with full lifecycle |
| `RunImpulse[C any](ctx, impulse) error` | `impulse.go:24` | Long-running event listener entry point |
| `StartStreamServer[C any](ctx, engram) error` | `stream.go:143` | Starts gRPC server for streaming engrams |
| `StartStory(ctx, name, inputs) (*StoryRun, error)` | `sdk.go:66` | Triggers new StoryRun; used from impulses |
| `StreamTo(ctx, target, in, out) error` | `stream.go:216` | Client-side gRPC streaming to downstream |

### Utilities

| Function | Source | Purpose |
|----------|--------|---------|
| `WithLogger(ctx, logger) context.Context` | `sdk.go:24` | Injects custom slog logger into context |
| `LoggerFromContext(ctx) *slog.Logger` | `sdk.go:32` | Retrieves logger from context (never nil) |

### Interfaces

| Interface | Methods | Purpose |
|-----------|---------|---------|
| `K8sClient` | `TriggerStory`, `PatchStepRunStatus` | Mockable K8s ops for testing |
| `StorageManager` | `Hydrate`, `Dehydrate` | Mockable storage offloading |

---

## Package: `github.com/bubustack/bubu-sdk-go/engram`

### Core Interfaces

| Interface | Methods | Purpose |
|-----------|---------|---------|
| `Engram[C]` | `Init(ctx, config, secrets) error` | Base initialization contract |
| `BatchEngram[C,I]` | `Init`, `Process(ctx, execCtx, inputs) (*Result, error)` | Single-task jobs (K8s Job) |
| `StreamingEngram[C]` | `Init`, `Stream(ctx, in, out) error` | Real-time stream processing (Deployment) |
| `Impulse[C]` | `Init`, `Run(ctx, k8sClient) error` | Event listener (Deployment) |

### Data Types

| Type | Fields/Methods | Purpose |
|------|----------------|---------|
| `ExecutionContext` | `StoryInfo()`, `Logger()`, `Tracer()` | Execution metadata + SDK services |
| `StoryInfo` | `StoryName`, `StoryRunID`, `StepName`, `StepRunID` | Current execution context |
| `Secrets` | `Get(key)`, `GetAll()`, `Raw()` | Sandboxed secret access with redaction |
| `Result` | `Data any` | Batch engram output |

---

## Package: `github.com/bubustack/bubu-sdk-go/k8s`

| Symbol | Source | Purpose |
|--------|--------|---------|
| `type Client struct` | `k8s/client.go:35` | Wrapper around controller-runtime client |
| `func NewClient() (*Client, error)` | `k8s/client.go:41` | Creates client with in-cluster or kubeconfig |
| `func GetConfig() (*rest.Config, error)` | `k8s/client.go:62` | Returns REST config with SDK defaults (QPS=20, Burst=40) |
| `func (c *Client) GetNamespace() string` | `k8s/client.go:121` | Returns resolved namespace from env vars |
| `func (c *Client) TriggerStory(...)` | `k8s/client.go:136` | Creates StoryRun resource |
| `func (c *Client) PatchStepRunStatus(...)` | `k8s/client.go:167` | Updates StepRun status subresource |

---

## Package: `github.com/bubustack/bubu-sdk-go/runtime`

| Symbol | Source | Purpose |
|--------|--------|---------|
| `type ExecutionContextData struct` | `runtime/context.go:19` | Data from operator (inputs, config, secrets, storyInfo) |
| `func LoadExecutionContextData() (*ExecutionContextData, error)` | `runtime/context.go:29` | Parses env vars set by bobrapet controller |
| `func UnmarshalFromMap[T any](data) (T, error)` | `runtime/context.go:78` | Type-safe map→struct conversion with mapstructure |

---

## Package: `github.com/bubustack/bubu-sdk-go/storage`

| Symbol | Source | Purpose |
|--------|--------|---------|
| `type StorageManager struct` | `storage/manager.go:55` | Orchestrates hydrate/dehydrate logic |
| `func NewManager(ctx) (*StorageManager, error)` | `storage/manager.go:69` | Creates manager with S3/file backend from env |
| `type Store interface` | `storage/store.go:10` | Generic backend (Write, Read methods) |
| `type S3Store struct` | `storage/s3_store.go:21` | S3-compatible backend with SSE support |
| `func NewS3Store(ctx) (*S3Store, error)` | `storage/s3_store.go:47` | Initializes S3 client from AWS env vars |
| `type FileStore struct` | `storage/file_store.go:12` | Local filesystem backend with atomic writes |
| `func NewFileStore(basePath) (*FileStore, error)` | `storage/file_store.go:18` | Initializes file store at base path |

---

## Constants

### Stream

- `DefaultChannelBufferSize = 16` (`stream.go:28`)
- `DefaultGRPCPort = "50051"` (`stream.go`)
- `DefaultMaxMessageSize = 10 MiB` (`stream.go:35`)

### Storage

- `DefaultMaxInlineSize = 32 KiB` (`storage/manager.go:14`)
- `DefaultMaxRecursionDepth = 10` (`storage/manager.go:15`)

---

## Environment Variables (Summary)

See the [Runtime configuration reference](../reference/config.md) for the full list of supported
environment variables and overrides.

| Category | Key Vars | Count |
|----------|----------|-------|
| **Execution** | `BUBU_EXECUTION_MODE`, `BUBU_STORY_NAME`, `BUBU_INPUTS` | 7 |
| **Kubernetes** | `BUBU_K8S_QPS`, `BUBU_K8S_BURST`, `BUBU_K8S_TIMEOUT` | 4 |
| **gRPC** | `BUBU_GRPC_PORT`, `BUBU_GRPC_MAX_*_BYTES`, `BUBU_GRPC_TLS_*` | 9 |
| **Storage** | `BUBU_STORAGE_PROVIDER`, `BUBU_MAX_INLINE_SIZE`, `BUBU_STORAGE_S3_*` | 10+ |
| **Config/Secrets** | `BUBU_CONFIG_*`, `BUBU_SECRET_*` | Dynamic |

---

## Symbol Counts

| Package | Types | Functions | Interfaces |
|---------|-------|-----------|------------|
| `sdk` | 2 | 7 | 2 |
| `engram` | 4 | 3 | 4 |
| `k8s` | 1 | 2 | 0 |
| `runtime` | 1 | 2 | 0 |
| `storage` | 4 | 3 | 1 |
| **Total** | **12** | **17** | **7** |

---

For detailed usage, see the [SDK User Guide](./sdk-user-guide.md).
