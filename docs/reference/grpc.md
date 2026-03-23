---
title: Streaming gRPC Contract
sidebar_position: 7
description: Message schemas and semantics for the Bobravoz gRPC hub and SDK streaming clients.
---

# gRPC Reference

This document provides a reference for the gRPC contract used by streaming engrams and the bobrapet operator's gRPC Hub.

### Evidence
- `bobravoz-grpc/proto/v1/hub.proto`

## Service: Hub

The `Hub` service is the central component for managing real-time data flow in streaming stories.

### `rpc Process(stream DataPacket) returns (stream DataPacket)`

This is a bidirectional streaming RPC that forms the backbone of streaming engrams.

- **Server (gRPC Hub)**: The Hub exposes `HubService` and accepts client connections from engrams. It receives `DataPacket`s, may evaluate primitives, and forwards to the next step.
- **Client (Streaming Engram)**: Your engram dials the Hub and opens a stream, then receives and sends `DataPacket` messages.

## Message: DataPacket

The `DataPacket` is the unit of data exchanged between the Hub and a streaming engram.

| Field | Type | Description |
|---|---|---|
| `metadata` | `map<string, string>` | Contains metadata about the `StoryRun` and the current step, essential for tracing and context propagation. |
| `payload` | `google.protobuf.Struct` | The actual data payload to be processed. This is analogous to the `output` of a previous step in a batch engram. |
| `inputs` | `google.protobuf.Struct`| The resolved inputs for the current step, analogous to the `input` of a `StepRun` in a batch engram. |

## Streaming Semantics

- **Connection Lifecycle**: The gRPC connection is established by the Hub and remains open for the duration of the `StoryRun` (for `PerStoryRun` strategy) or the lifetime of the `Story` (for `PerStory` strategy).
- **Message Ordering**: While gRPC guarantees message ordering within a single stream, the overall ordering of messages across multiple steps depends on the Story's structure.
- **Backpressure**: The Bubu SDK provides automatic backpressure. See the [how-to guide on tuning backpressure](./../howto/tune-backpressure.md) for details.

## Deadlines and Cancellation

The `Process` RPC is cancellable. The context passed to the engram's `Stream` method will be cancelled if:
- The `StoryRun` is cancelled.
- The connection between the Hub and the engram is lost.
- The Hub initiates a graceful shutdown.

Your engram should respect the context cancellation to ensure a clean shutdown.

## Error Model

- **gRPC Errors**: Standard gRPC status codes are used to indicate connection-level errors. For example, `UNAVAILABLE` may be returned if the engram is not reachable.
- **Application Errors**: Errors that occur within the engram's `Stream` method should be handled by the engram itself (e.g., by logging the error and skipping the message). The `Process` RPC is not intended for application-level error signaling.

## Next steps
- Review the [SDK user guide's streaming quickstart](../sdk/sdk-user-guide.md#quickstart-streaming-engram) for a conceptual overview.
- See the [how-to on enabling TLS](../howto/enable-transport-tls.md) to secure your gRPC communication.

