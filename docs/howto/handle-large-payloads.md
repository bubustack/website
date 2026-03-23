---
title: Handle Large Payloads
sidebar_position: 2
description: Triage etcd size errors by tuning storage policies and inline limits.
---

# How to Handle Large Payloads

This guide provides best practices and focused recipes for managing large data payloads with the Bubu SDK's storage offloading feature.

## When to focus on large payloads

- When your engram's inputs or outputs regularly exceed 1 MiB.
- When you encounter `etcd` request size limit errors.
- When you need to pass large artifacts, such as files or images, between steps in a Story.

## Best practices

### 1. Configure a Storage Policy on your Story

The most robust and recommended way to handle large payloads is to define a `StoragePolicy` at the `Story` level. This provides a centralized configuration for all steps in the workflow.

The operator will automatically use this policy to configure all Engrams and Impulses with the correct S3 settings.

```yaml
# In your Story resource definition
apiVersion: bubustack.io/v1alpha1
kind: Story
metadata:
  name: my-large-payload-story
spec:
  policy:
    storage:
      s3:
        bucket: "my-bubu-storage-bucket"
        region: "us-east-1"
        authentication:
          # Recommended for cloud: use IAM roles for Service Accounts (e.g., IRSA on EKS)
          serviceAccountAnnotations:
            eks.amazonaws.com/role-arn: "arn:aws:iam::123456789012:role/BubuEngramS3Access"
          # Alternative for local dev or on-prem: use a Kubernetes secret
          # secretRef:
          #   name: my-s3-credentials
  steps:
    - name: process-large-file
      ref: { name: my-large-payload-engram }
```

### 2. Tune the inline size & recursion thresholds

The operator sets sensible defaults (`BUBU_MAX_INLINE_SIZE=1024`, `BUBU_MAX_RECURSION_DEPTH=64`, `BUBU_STORAGE_TIMEOUT=300s`). Override them only when necessary:

- Adjust the cluster-wide default via the operator ConfigMap (e.g., `engram.default-max-inline-size`).
- Override a specific Engram by adding env vars in the spec.

### 3. (Optional) Override storage settings per Engram

For special cases, you can still override the storage configuration by setting environment variables directly on an `Engram`. This is useful if a specific Engram needs to write to a different bucket or S3-compatible endpoint (SeaweedFS, Garage, MinIO, etc.).

```yaml
# In your Engram resource definition
apiVersion: bubustack.io/v1alpha1
kind: Engram
metadata:
  name: my-special-engram
spec:
  image: my-engram:latest
  env:
    - name: BUBU_STORAGE_S3_BUCKET
      value: "project-x-bucket"
    - name: BUBU_STORAGE_S3_ENDPOINT
      value: "http://seaweedfs-s3.storage.svc:8333"
    - name: BUBU_MAX_INLINE_SIZE
      value: "2048"
    - name: BUBU_MAX_RECURSION_DEPTH
      value: "64"
```

## Troubleshooting

### `etcd` request size limit exceeded

If you see an error in your operator logs similar to `etcdserver: request is too large`, it means a resource object has exceeded the Kubernetes APIServer's size limit (typically ~1.5 MiB). This can happen in two ways with `bobrapet`:

1.  **A single, large payload**: A single step's input or output is very large and storage offloading is either disabled or the `BUBU_MAX_INLINE_SIZE` is set too high.
2.  **Too many step outputs**: A `Story` has a very large number of steps. The operator used to collect all step outputs into the `StoryRun.status` field, which could cause the `StoryRun` object itself to become too large, even if each individual output was small.

**Solutions**:

- **For single, large payloads**: Ensure you have configured a `StoragePolicy` on your `Story`. The SDK running in your Engram will then automatically offload any inputs or outputs that exceed the inline size threshold.
- **For too many step outputs**: This issue is resolved in recent versions of `bobrapet` by no longer aggregating outputs in the `StoryRun`. If you are on an older version and cannot upgrade, the only solution is to break your large `Story` into smaller sub-workflows using the `executeStory` primitive.

### Hydration/dehydration failures

- **Check credentials**: Ensure your `StoragePolicy` is configured with the correct authentication method (IAM roles via `serviceAccountAnnotations` or a `secretRef`).
- **Check bucket/path existence**: Verify that the configured S3 bucket or file path exists and is accessible.
- **Increase timeouts**: For very large payloads, you may need to increase the `BUBU_STORAGE_TIMEOUT` (default: 300s). You can set this via an `env` var on your `Engram`.

## Example: processing a large file

This example shows an engram that reads a large file, processes it, and returns a summary. The SDK handles the storage interaction automatically based on the `StoragePolicy` from the `Story` that runs this engram.

```go
package main

import (
	"context"
	"io"
	"log"

	sdk "github.com/bubustack/bubu-sdk-go"
	"github.com/bubustack/bubu-sdk-go/engram"
	"github.com/bubustack/bubu-sdk-go/storage"
)

// Inputs contains the large file as a byte slice. The SDK will automatically
// hydrate this from the storage provider.
type Inputs struct {
	LargeFile []byte `mapstructure:"largeFile"`
}

// FileProcessorEngram processes the large file.
type FileProcessorEngram struct{}

func NewFileProcessor() *FileProcessorEngram {
	return &FileProcessorEngram{}
}

func (e *FileProcessorEngram) Init(ctx context.Context, cfg struct{}, secrets *engram.Secrets) error {
	return nil
}

func (e *FileProcessorEngram) Process(ctx context.Context, ec *engram.ExecutionContext, inputs Inputs) (*engram.Result, error) {
	fileSize := len(inputs.LargeFile)
	summary := "File processed successfully"

	// The result will be offloaded if it exceeds the size threshold.
	return engram.NewResultFrom(map[string]any{
		"fileSize": fileSize,
		"summary":  summary,
	})
}

func main() {
	if err := sdk.StartBatch(context.Background(), NewFileProcessor()); err != nil {
		log.Fatalf("Engram failed: %v", err)
	}
}
```

## Next steps
- Review the [Storage offloading guide](../sdk/storage-offloading.md) for a conceptual overview.
- See the [configuration reference](./../reference/config.md) for all storage-related settings.
