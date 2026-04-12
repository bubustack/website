---
title: Inputs, Schemas, and Defaults
description: Input validation, defaulting precedence, and size constraints.
---
# Inputs, Schemas, and Defaults

This document covers StoryRun inputs: schema validation, defaults, and precedence.

## Who this is for

- Workflow authors defining inputs and schemas.
- Operators setting size limits and defaults.

## What you'll get

- How inputs are validated and defaulted.
- The precedence rules for input evaluation.
- Size limits and when to use storage refs.

## Schema validation

Stories can declare `spec.inputsSchema` as a JSON Schema. The admission webhook:

- Validates that the schema itself is well-formed JSON Schema.
- Validates StoryRun `spec.inputs` against the schema on create/update.

The StoryRun controller revalidates resolved inputs at runtime as a safety net
(for cases where webhooks are bypassed).

Schemas should describe the logical hydrated payload shape, not transport
wrappers like `$bubuStorageRef`, `$bubuConfigMapRef`, or `$bubuSecretRef`.
Those wrappers are accepted implicitly at admission time and are resolved before
runtime validation.

## StepRun inputs

StepRun inputs are resolved from Story `steps[].with` templates and upstream
outputs at runtime by the StepRun controller. When the referenced
EngramTemplate defines `spec.inputSchema`, the controller:

- Applies JSON Schema defaults to the resolved inputs.
- Validates the resolved inputs after templating.

If validation fails, the StepRun is marked Failed with reason
`InputSchemaFailed`.

Schema refs are also propagated to status when available:

- `StoryRun.status.inputSchemaRef` points to the Story inputs schema.
- `StepRun.status.inputSchemaRef` points to the EngramTemplate input schema.

## Defaults

Defaults are applied from JSON Schema `default` fields:

- Defaults are applied only when a field is missing.
- Defaults never override explicitly provided inputs.
- Defaults are applied recursively to nested objects when nested defaults exist.
- No type coercion is performed (e.g., `"1"` does not become `1`).

Precedence:

1. StoryRun `spec.inputs`
2. JSON Schema defaults from `spec.inputsSchema`

## Size limits

StoryRun inputs are subject to the inline size limit:

- `storyrun.max-inline-inputs-size` (operator config)

For larger payloads, use storage references (see [Payloads](payloads.md)).

- Direct API clients must offload oversized StoryRun inputs themselves and pass
  storage refs.
- SDK trigger helpers may offload oversized trigger/input payloads for you, but
  that only works when Bobrapet is configured with shared storage via
  `controller.storage.*`.
- When a `StoryTrigger` resolves into a `StoryRun`, the controller also applies
  `storyrun.max-inline-inputs-size` and offloads oversized `StoryRun.spec.inputs`
  before create. That path uses the same shared storage backend.

Installing an S3-compatible service in the cluster is not enough by itself. The
operator must also be configured to use that backend so it can hydrate and
resolve offloaded inputs later.

If those offloaded inputs are deeply nested, the controller may also need a
higher recursion budget. Use the global operator default
`engram.default-max-recursion-depth`, or raise it per workflow with
`spec.policy.execution.maxRecursionDepth`.

## JSON Schema support

Schema validation uses the `gojsonschema` library. Refer to that project for the
exact draft support and constraints.
