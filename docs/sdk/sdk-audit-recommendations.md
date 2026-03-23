++ 
---
title: SDK Audit Recommendations
description: Actionable follow-ups from the latest Go SDK review.
sidebar_label: Audit Recommendations
---

## Completed in this pass

- Brought the CRD validators back into the operator codebase so new bundles pick up the CEL invariants automatically.
- Hardened `StreamToWithMetadata`/hybrid bridge payload handling: non-object JSON now returns a clear, actionable error instead of silently failing.

## High-priority follow-ups

### Hybrid bridge & streaming connectivity

- **TLS or explicit opt-out is mandatory.** The SDK dials gRPC with one of the following configurations:
  - Provide `BUBU_GRPC_CLIENT_TLS=true` (mutual TLS optional).
  - Or supply `BUBU_GRPC_CA_FILE` and (optionally) `BUBU_GRPC_CLIENT_CERT_FILE` + `BUBU_GRPC_CLIENT_KEY_FILE`.
  - Otherwise set `BUBU_GRPC_ALLOW_INSECURE=true` _only_ for trusted test clusters; the SDK refuses to connect by default.
- **Endpoint wiring:** set `DOWNSTREAM_HOST` (or `UPSTREAM_HOST`) inside the step pod so the SDK can locate the hub / downstream peer. Explicit host strings override the controller-provided address.
- **Payload contract:** both the streaming client and the hybrid bridge expect each message `payload` to be a JSON object. Other JSON types (plain strings, numbers, arrays) now raise `payload must be a JSON object`. Keep command/response data wrapped, e.g.:

  ```json
  {
    "payload": {
      "event": "record.processed",
      "recordId": "abc-123",
      "latencyMs": 87
    }
  }
  ```

- **Inputs field:** when sending per-message `with:` overrides, ensure the `inputs` JSON is also an object; empty payloads should be encoded as `{}` rather than `null`.
- **Document these requirements** in the public “Streaming” and “Hybrid bridge” guides once the examples are updated.

### SDK ↔ operator skew

- Ship a bobrapet release that contains the `StepRunStatus.Manifest*` fields (required by the SDK) and update `github.com/bubustack/bobu-sdk-go` to depend on that tag. Until then `go test ./...` fails to compile.

## Medium-priority follow-ups

- Add golden tests around `storybuilder.Builder` to cover DAG permutations, retries, and edge cases (duplicate needs, missing refs).
- Provide a “storage smoke test” recipe (S3 + file) for local validation, ideally as a Kind-based guide under `docs/sdk`.
- Revisit namespace resolution defaults in `StartStory` to ensure multi-tenant clusters cannot cross namespaces without deliberate configuration.
