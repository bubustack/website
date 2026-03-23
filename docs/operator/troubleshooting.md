---
title: Troubleshooting Playbook
sidebar_position: 4
description: Diagnose common Story, Engram, transport, and SDK issues with quick fixes.
---

# Troubleshooting

This guide provides diagnostics and fixes for common issues you may encounter when using the Bubu SDK.

## Batch Engram Issues

### Symptom: StepRun is stuck in `Pending` phase

- **Diagnostics**:
    - Check the `StepRun` events for messages about missing dependencies: `kubectl describe steprun <steprun-name>`.
    - Verify that all `needs` dependencies in your `Story` are correctly defined.
- **Fix**: Correct any invalid `needs` references in your `Story` definition.

### Symptom: StepRun is `Blocked` with reference not found

- **Diagnostics**:
    - `kubectl describe steprun <name>` shows condition reason `ReferenceNotFound`.
    - The referenced `Engram` or `EngramTemplate` is missing.
- **Fix**: Create the missing resource or correct the reference name/namespace.

### Symptom: Engram Pod is crash-looping

- **Diagnostics**:
    - Check the Pod's logs for panics or fatal errors: `kubectl logs <pod-name>`.
    - Common causes include nil pointer dereferences, invalid type assertions, or misconfigured clients.
- **Fix**:
    - Add defensive checks in your `Init` and `Process` methods.
    - Ensure your `Config` and `Inputs` structs correctly match the data being passed.

### Symptom: StepRun fails with exit code 1 (Terminal Error)

- **Diagnostics**:
    - Check the `StepRun`'s status for a detailed error message.
    - Examine the engram's logs for the specific error that was returned from `Process`.
- **Fix**: This indicates a non-recoverable error in your engram's logic. Debug the specific error reported in the logs.

## Streaming Engram Issues

### Symptom: Engram is slow or blocked

- **Diagnostics**:
    - The engram may be experiencing backpressure. Check the logs for messages about slow sends or full buffers.
    - Investigate the performance of the downstream consumer (the next step in the Story).
- **Fix**:
    - Tune backpressure by increasing the `BUBU_GRPC_CHANNEL_BUFFER_SIZE`.
    - See the [how-to guide on tuning backpressure](../howto/tune-backpressure.md).

### Symptom: gRPC connection fails or is frequently retried

- **Diagnostics**:
    - Check the logs of the gRPC Hub (in the operator Pod) and your engram for connection errors.
    - Verify that the engram's Service is correctly configured and that network policies are not blocking traffic.
    - If using TLS, ensure certificates are valid and correctly configured.
- **Fix**:
    - Correct any Service or NetworkPolicy misconfigurations.
    - Debug TLS certificate issues. See the [how-to guide on enabling TLS](../howto/enable-transport-tls.md).
    - If TLS is required by the Hub, ensure engram Pods have `BUBU_GRPC_CLIENT_TLS=true` and CA/client certs are mounted; see operator TLS annotations.

## Storage and Large Payload Issues

### Symptom: `etcd` request size limit exceeded

- **Diagnostics**: This error appears in the bobrapet operator logs when a `StepRun` or `StoryRun` resource is too large.
- **Fix**:
    - Enable storage offloading by setting `BUBU_STORAGE_PROVIDER`.
    - Lower the `BUBU_MAX_INLINE_SIZE` to force more data to be offloaded.
    - See the [how-to guide on handling large payloads](../howto/handle-large-payloads.md).

### Symptom: Hydration/dehydration failures

- **Diagnostics**: Check the `StepRun` status and engram logs for errors related to storage operations.
- **Fix**:
    - **Permissions**: Ensure your engram's Pod has the necessary permissions (e.g., IAM roles for S3) to access the storage provider.
    - **Configuration**: Verify that the storage configuration (e.g., bucket name, endpoint) is correct.
    - **Timeouts**: For very large files, you may need to increase `BUBU_STORAGE_TIMEOUT`.

## General Configuration Issues

### Symptom: Engram fails to start with "missing configuration" error

- **Diagnostics**: The engram's `Init` method is likely returning an error due to missing or invalid configuration.
- **Fix**:
    - Check the `with` block in your `Engram` or `Impulse` resource.
    - Ensure your `Config` struct in your Go code has the correct `mapstructure` tags to match the keys in your YAML configuration.
    - Verify that all required secrets are correctly mapped and mounted.

## Still stuck?
- See the Support and Security docs in the operator repository.

## Known Issues

### `go vet` error in `stream.go`

There is a known issue with `go vet` reporting `req.Inputs undefined` in `stream.go`. This appears to be a dependency issue with the `bobravoz-grpc` module that persists even after updating dependencies. This issue needs further investigation by a developer.

