---
title: Streaming Contract
description: Message validity, ordering, replay, and control-stream behavior.
---
# Streaming Contract (Engrams + Connectors)

This document defines the runtime contract for streaming Engrams, transport connectors,
and the hub. It complements the gRPC transport protos in `tractatus/proto/transport/v1/transport.proto`.

## Who this is for

- Engram authors implementing streaming components.
- Connector authors implementing transport drivers.
- Operators debugging real-time pipelines.

## What you'll get

- The message validity rules and required fields.
- Ordering, termination, and error envelope semantics.
- How hubs, connectors, and Engrams coordinate.

## At a glance

- `InboundMessage` is the SDK-facing inbound type for streaming Engrams. It wraps `StreamMessage` and adds `Done()` to signal successful processing.
- Outbound messages still use plain `StreamMessage`.
- The hub/connector data plane uses `DataPacket` + `StreamEnvelope` on gRPC streams.
- Ordering, replay, and flow control are negotiated through transport settings.
- The control plane uses `ControlRequest` / `ControlResponse` with `ControlAction`; pause/resume backpressure uses `FlowControl.signal`.

## Key types (where to look)

- SDK message contract: `bubu-sdk-go/engram/client.go` (`InboundMessage`, `StreamMessage`)
- Transport gRPC types: `tractatus/proto/transport/v1/transport.proto`
- Hub data plane types: `tractatus/proto/transport/v1/hub.proto`

## 1) Message validity

A streaming message is valid only when at least one of the following is present:

- Audio (`StreamMessage.Audio`)
- Video (`StreamMessage.Video`)
- Binary payload (`StreamMessage.Binary`)
- JSON payload (`StreamMessage.Payload`)
- JSON inputs (`StreamMessage.Inputs`)
- Transport descriptors (`StreamMessage.Transports`)

Metadata-only messages are **invalid**. When publishing, the SDK returns an error if
no audio, video, binary, payload, inputs, or transports are present.

## 2) Error envelope

Streaming errors are conveyed as standard `StreamMessage` payloads:

- `StreamMessage.Kind` must be `error`.
- `StreamMessage.Payload` must contain a JSON-encoded `StructuredError` (v1).
- Error messages **still** must satisfy message validity (payload required).

Error envelopes propagate downstream like any other message. They do not trigger
automatic retries; operators and downstream Engrams should decide how to react.

## 3) Envelope vs raw binary

If a message has `Payload`, `Inputs`, or `Transports`, the SDK wraps it into a transport
**Envelope** and sends it as a Binary frame with MIME type:

- `application/vnd.bubu.packet+json`

Use raw binary bypass only for opaque bytes. In that case, populate
`StreamMessage.Binary` and leave `Payload`, `Inputs`, and `Transports` empty.

For structured JSON packets, keep the JSON shape in `Payload` and mirror the
same bytes into `Binary` with MIME type `application/json`. This preserves the
structured step output contract for downstream templating while still letting
transport connectors carry one binary frame on the wire.

Messages that include `Inputs` or `Transports` are never treated as raw binary,
even when `Binary` is also populated.

The remaining pre-release ABI cleanup for this area is tracked by
[bubu-sdk-go#72](https://github.com/bubustack/bubu-sdk-go/issues/72),
[bubu-sdk-go#73](https://github.com/bubustack/bubu-sdk-go/issues/73),
[bubu-sdk-go#74](https://github.com/bubustack/bubu-sdk-go/issues/74), and
[RFC #77](https://github.com/orgs/bubustack/discussions/77). Treat the latest
rules above as the intended contract; do not add compatibility fallbacks for
older packet shapes.

## 4) Chunked binary frames

Large binary payloads may be split across multiple frames. Chunking uses
`StreamEnvelope` fields:

- `chunk_id`: unique identifier for the logical message within a stream.
- `chunk_index`: zero-based index of this chunk.
- `chunk_count`: total number of chunks for the message.
- `chunk_bytes`: optional size of this chunk's payload.
- `total_bytes`: optional total size after reassembly.

Rules:

- Only `BinaryFrame` payloads may be chunked.
- `stream_id` and `chunk_id` are required when chunking.
- All chunks for a message must share the same `stream_id`, `partition`, and
  metadata/envelope fields (except the `chunk_*` fields).
- Chunks may arrive out of order; the SDK and hub buffer and reassemble before
  delivering the message to Engrams.
- Invalid chunk metadata causes a publish/subscribe error. If chunks are missing,
  the reassembly entry can expire and the message is dropped.

## 5) Ordering and delivery

- Messages are sent on a single gRPC stream.
- Ordering is preserved **as sent** by the SDK.
- The SDK does not reorder or batch frames unless explicitly configured by the component.
- Default transport delivery is `ordering=none`, `semantics=best_effort`, and
  `replay.mode=none`. In that mode packets may have no transport sequence and
  the transport layer does not dedupe them.
- When ordering is enabled or `delivery.semantics=at_least_once`, the hub assigns
  downstream-local `stream_id` / `sequence` values and tracks acknowledgements.
- The SDK dedupes completed ordered packets by `stream_id + partition + sequence`.
  For unsequenced traffic, the SDK only dedupes packets that carry an explicit
  `MessageID` (including hub lifecycle hooks, which use stable message IDs).
- For sequenced packets, `Done()` is the completion boundary. If the connector
  disconnects before the Engram calls `Done()`, the packet may be replayed after
  reconnect. If the packet was already completed, the SDK suppresses the replay
  and resends the completion receipt upstream.
- SDK-to-connector completion receipts travel on the control stream as custom
  action `downstream.delivered`. The connector converts those receipts into hub
  or P2P flow acknowledgements.
- Flow control and acknowledgements between connectors and the hub travel over
  the hub `Process` stream via `FlowControl` (in `ProcessRequest` /
  `ProcessResponse`).

## 6) Backpressure and timeouts

- Outgoing messages are buffered in a bounded channel (`BUBU_GRPC_CHANNEL_BUFFER_SIZE`).
- Sends respect `BUBU_GRPC_CHANNEL_SEND_TIMEOUT`. If a send blocks longer than this timeout,
  the publish loop fails and the session is reconnected.
- Incoming reads use `BUBU_GRPC_MESSAGE_TIMEOUT`. The SDK treats prolonged inactivity as
  an error and will reconnect according to the reconnect policy.
- If `BUBU_GRPC_HANG_TIMEOUT` is set, the SDK cancels the session when no control or
  data traffic is observed within the timeout window.

## 7) Termination semantics

- The SDK closes the **input** channel passed to `StreamingEngram.Stream` when the connector
  subscription ends.
- The SDK closes the **output** channel when the Engram returns from `Stream`.
- Engrams must respect context cancellation and return promptly on `ctx.Done()`.
- Engrams receive `InboundMessage` values on the input channel and should call
  `Done()` after successful handling or intentional drop. For best-effort
  traffic this is a no-op; for sequenced traffic it drives replay / dedupe state.
- When emitting structured JSON in a streaming Engram, prefer:
  - `Payload`: canonical JSON for downstream step templating
  - `Binary`: the same bytes with `MimeType: application/json`
  - raw `Binary` without `Payload`: only for opaque media or non-JSON blobs

## 8) Control channel

- The connector control stream is `TransportConnectorService.Control(stream ControlRequest) returns (stream ControlResponse)`.
- Standard lifecycle, capability, heartbeat, and handoff events travel as `ControlAction` values.
- Pause/resume backpressure travels in `FlowControl.signal` on `ControlRequest` / `ControlResponse`, not as action names.
- Engrams may optionally implement `ControlDirectiveHandler`; the SDK maps inbound connector control responses onto that higher-level directive API.
- Heartbeats are emitted by the connector and the SDK monitors liveness based on control
  traffic and configured timeouts.
- Internal ordered-delivery receipts use custom action `downstream.delivered`.
  Engram authors do not send these directly; the SDK emits them after `Done()`
  for sequenced packets.
- The control stream includes a protocol version header via gRPC metadata key
  `bubu-transport-protocol` (current `1.0.0`). Connectors may reject incompatible versions.
- Hub registration and processing streams also require gRPC metadata key
  `connector-generation` with a positive integer from the active binding.
  Missing or invalid values are rejected by the hub.
- Transport bindings embed `BindingInfo.protocol_version` (current `1.0.0`); connectors validate it at startup.

Published Bobravoz hardening for identity binding and superseded-connector
fencing lives in
[bobravoz-grpc#44](https://github.com/bubustack/bobravoz-grpc/issues/44) and
[bobravoz-grpc#45](https://github.com/bubustack/bobravoz-grpc/issues/45).

### Startup handshake

The latest contract requires an explicit startup gate on the control stream:

- `connector.ready` is mandatory before the SDK starts the Engram stream loop.
- `connector.ready` must declare `startup.capabilities=required|none`.
- If `startup.capabilities=required`, the SDK waits for the first
  `connector.capabilities` snapshot before treating the session as established.
- Missing or malformed `startup.capabilities` metadata is a startup error.
- Startup ACKs are terminal; peers do not recursively ACK an ACK.
- The hub passively observes the same startup-capability declaration for logs
  and metrics, but it does not gate readiness.

Common connector actions surfaced by the SDK:

- `handoff.draining`: connector is draining or losing hub connectivity; engrams should quiesce sends.
- `handoff.cutover`: connector has reconnected and traffic may resume.
- `handoff.ready`: connector is in steady state after handoff (optional).

## 9) Retry and reconnect

- Connector sessions are retried with exponential backoff according to
  `BUBU_GRPC_RECONNECT_BASE_BACKOFF`, `BUBU_GRPC_RECONNECT_MAX_BACKOFF`, and
  `BUBU_GRPC_RECONNECT_MAX_RETRIES`.
- When retries are exhausted, the SDK returns an error and the workload terminates.

## 10) Replay observability

- The hub exports replay checkpoint metrics:
  `bobravoz_hub_replay_last_ack` (last acked sequence) and
  `bobravoz_hub_replay_unacked_current` (current unacked count).

## 11) Lifecycle hooks

The hub emits lifecycle hook packets when streaming steps reach readiness milestones:

- **`steprun.ready`** -- Fired when an individual streaming step connects to the hub.
- **`storyrun.ready`** -- Fired when all streaming steps in the Story have connected.

Steps consume hooks via `if` conditions that match on `packet.type`:

```yaml
if: '{{ eq (default "" packet.type) "storyrun.ready" }}'
```

Hooks are delivered as standard `DataPacket` messages with hook metadata
(`kind=hook`, `type=<event>`, `hook.event`, `hook.source`) and a structured
hook payload. Each hook fires at most once per StoryRun per step combination.

See [Lifecycle Hooks](lifecycle-hooks.md) for the full hook packet structure,
consumption patterns, and debugging tips.

## 12) Transport settings

Streaming backpressure, flow control, and delivery policies are configured through
`Transport.spec.streaming` and `Story.spec.transports[].streaming`. See
[Transport Settings](transport-settings.md) for the full schema and examples.
