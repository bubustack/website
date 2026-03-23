---
title: Error Reference
sidebar_position: 6
description: Common Bobrapet, SDK, and transport error types with remediation steps.
---

# Error Handling Reference

This document explains the error handling mechanisms in the Bubu SDK, including the error taxonomy, how errors affect retryability, and guidance on idempotency.

## Error taxonomy

Errors in the Bubu SDK can be categorized into two main types:

1.  **Terminal Errors**: These are non-recoverable errors that should not be retried. Examples include:
    - Invalid input data.
    - Missing or invalid configuration.
    - Business logic errors that are guaranteed to fail again.

2.  **Transient Errors**: These are temporary errors that may be resolved by retrying the operation. Examples include:
    - Network connectivity issues.
    - Temporary unavailability of an external service.
    - Timeouts.

## Exit codes and retryability

The Bubu SDK for batch engrams uses exit codes to signal the outcome of an execution to the bobrapet operator, which then determines whether to retry the step based on the `Story`'s retry policy.

| Exit Code | Meaning | Retryable? | Description |
|---|---|---|---|
| `0` | Success | No | The engram completed successfully. |
| `1` | Terminal Error| No | A non-recoverable error occurred. The step will be marked as `Failed`. |
| `124` | Timeout | Yes | The engram exceeded its execution timeout. The step may be retried. |
| _Other_ | Transient Error| Yes | Any other non-zero exit code is considered a transient, retryable error. |

### Evidence
- `batch.go`: The logic for handling panics and errors from `Init` and `Process` maps them to the appropriate exit codes.

## Idempotency guidance

Since engrams can be retried, it is crucial to design them to be **idempotent**. An idempotent operation is one that can be performed multiple times without changing the result beyond the initial application.

### Best practices for idempotency

- **Check for existing state**: Before performing an operation, check if it has already been completed. For example, if you are creating a resource in an external system, check if a resource with the same unique identifier already exists.
- **Use transactions**: When interacting with databases, use transactions to ensure that a series of operations is either fully completed or fully rolled back.
- **Unique identifiers**: Pass a unique identifier (e.g., the `StoryRunID` or `StepRunName` from the `ExecutionContext`) to external systems. This allows you to use the external system's idempotency mechanisms (e.g., idempotency keys in an API).

### Example: Idempotent engram

```go
func (e *MyEngram) Process(ctx context.Context, ec *engram.ExecutionContext, inputs Inputs) (*engram.Result, error) {
    // Use the StepRunName as a unique key for the operation.
    idempotencyKey := ec.StoryInfo().StepRunName

    // Check if the operation has already been completed.
    if result, err := e.externalAPI.GetOperation(idempotencyKey); err == nil {
        // Operation already completed, return the existing result.
        return engram.NewResultFrom(result.Data), nil
    }

    // Perform the operation.
    result, err := e.externalAPI.PerformOperation(idempotencyKey, inputs.Data)
    if err != nil {
        // A transient error occurred, the step will be retried.
        return nil, err
    }

    return engram.NewResultFrom(result.Data), nil
}
```

## Backoff guidance

The retry behavior is configured in the `Story` resource. You can specify the `maxRetries`, the `delay` between retries, and the `backoff` strategy (`constant`, `linear`, or `exponential`).

When designing your retry strategy, consider the nature of the errors you expect. For transient network issues, an exponential backoff is often a good choice. For rate limiting, you may need a longer, constant backoff.

## Next steps
- Review the [CRDs reference](./crds.md) for details on configuring retry policies in a `Story`.
- See the [Troubleshooting Playbook](../operator/troubleshooting.md) for step-by-step fixes.

