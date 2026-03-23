---
title: Tune Streaming Backpressure
sidebar_position: 3
description: Balance hub buffers, SDK retry queues, and Story annotations to absorb bursts.
---

# How to Tune Backpressure in Streaming Engrams

Backpressure is a critical concept in streaming systems. It's a mechanism that allows a consumer to signal to a producer that it's receiving data too quickly, preventing the consumer from being overwhelmed. The Bubu SDK provides automatic backpressure for streaming engrams through the use of buffered channels.

## How backpressure works in the SDK

The `out` channel passed to your streaming engram's `Stream` method is a buffered Go channel. When you send a message to this channel, it's added to the buffer. If the buffer is full, the send operation will block until there is space in the buffer. This naturally slows down your engram to match the processing speed of the downstream consumer (i.e., the next step in the Story).

### Evidence
- `stream.go`: The `out` channel is created with a buffer, and sending to it is a blocking operation.

## Tuning parameters

You can tune the backpressure mechanism using the following environment variables:

| Variable | Description | Default |
|---|---|---|
| `BUBU_GRPC_CHANNEL_BUFFER_SIZE` | The size of the buffer for the `in` and `out` channels. | `16` |
| `BUBU_GRPC_CHANNEL_SEND_TIMEOUT`| The maximum time to wait for a send operation to complete before timing out. | `10s` |

## Best practices

### 1. Start with the defaults

The default buffer size of `16` and send timeout of `10s` are suitable for many use cases. Only adjust these values if you are experiencing performance issues or have specific requirements.

### 2. Increase buffer size for high-throughput workloads

If your engram is processing a high volume of small messages, increasing the `BUBU_GRPC_CHANNEL_BUFFER_SIZE` can improve performance by reducing the frequency of blocking send operations. A larger buffer allows your engram to continue processing while the downstream consumer catches up.

### 3. Adjust send timeout for slow consumers

If you have a downstream consumer that is expected to be slow or to have periods of high latency, you may need to increase the `BUBU_GRPC_CHANNEL_SEND_TIMEOUT`. This will prevent your engram from timing out and failing if the downstream consumer is temporarily unable to accept new messages.

## Example: configuring a larger buffer

You can set the buffer size in your engram's Deployment resource:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-streaming-engram
spec:
  template:
    spec:
      containers:
        - name: engram
          image: my-engram:latest
          env:
            - name: BUBU_GRPC_CHANNEL_BUFFER_SIZE
              value: "128" # Increased buffer size for higher throughput
```

## Troubleshooting

### Engram is slow or blocked

- **Check the downstream consumer**: If your engram is consistently blocked on sending to the `out` channel, the downstream consumer is likely the bottleneck. Investigate the performance of the next step in your Story.
- **Increase buffer size**: A larger buffer can help absorb temporary spikes in load.

### Engram is timing out

- **Increase send timeout**: If you expect the downstream consumer to be slow, increase the `BUBU_GRPC_CHANNEL_SEND_TIMEOUT`.
- **Investigate downstream consumer**: A persistent timeout may indicate a problem with the downstream consumer that needs to be addressed.

## Next steps
- Review the [SDK user guide's streaming quickstart](../sdk/sdk-user-guide.md#quickstart-streaming-engram) for a conceptual overview.
- See the [configuration reference](./../reference/config.md) for all streaming-related settings.

