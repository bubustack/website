---
title: SDK Troubleshooting
sidebar_position: 8
description: Error lookups and diagnostics for bubu-sdk-go applications.
---

# bubu-sdk-go: Troubleshooting Guide

Common errors, diagnostics, and remediation steps.

---

## Quick Diagnosis Table

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| `failed to load execution context` | Missing env vars | Check operator injected `BUBU_*` vars |
| `failed to unmarshal BUBU_INPUTS` | Invalid JSON | Validate JSON syntax in Story inputs |
| `failed to create k8s client` | RBAC or kubeconfig | Check ServiceAccount permissions |
| `failed to get StepRun ... for status patch` | Wrong namespace or RBAC | Verify namespace and `stepruns.get` permission |
| `failed to put object ... to s3 bucket` | S3 permissions or config | Check AWS credentials and bucket policy |
| `engram does not support streaming mode` | Mode mismatch | Implement `StreamingEngram` interface |
| `context deadline exceeded` | Timeout too short | Increase `BUBU_K8S_TIMEOUT` or operation timeout |
| `rpc error: code = ResourceExhausted` | Message too large | Increase `BUBU_GRPC_MAX_*_BYTES` |
| `connection refused` (gRPC) | Port mismatch or pod not ready | Check `BUBU_GRPC_PORT` and pod status |

---

## Environment & Configuration Errors

### Error: `failed to load execution context`

**Full Message:**
```
failed to load execution context: failed to unmarshal BUBU_INPUTS: invalid character...
```

**Cause:** Invalid JSON in `BUBU_INPUTS` environment variable.

**Diagnosis:**
```bash
# Check the actual value
kubectl exec <pod-name> -- env | grep BUBU_INPUTS

# Validate JSON
echo $BUBU_INPUTS | jq .
```

**Fix:**
- Ensure Story YAML inputs are valid JSON
- Check for unescaped quotes or special characters
- Operator should validate inputs before injection

---

### Error: `failed to decode map into target struct`

**Full Message:**
```
failed to unmarshal config: failed to decode map into target struct: 'timeout' expected a duration, got string
```

**Cause:** Type mismatch between config value and struct field.

**Example:**
```go
type Config struct {
    Timeout time.Duration `mapstructure:"timeout"`
}
```
```yaml
# Engram YAML
with:
  timeout: "not-a-duration"  # Should be "30s"
```

**Fix:**
- Use duration format: `"5s"`, `"1m"`, `"1h30m"`
- Check mapstructure tags match YAML keys
- Enable weak typing for numeric conversions

---

### Error: Missing secret key

**Full Message:**
```
impulse initialization failed: DB_PASSWORD secret required
```

**Cause:** Secret not mounted or wrong descriptor format.

**Diagnosis:**
```bash
# Check secret exists
kubectl get secret api-credentials -n <namespace>

# Check pod has volume mount
kubectl describe pod <pod-name> | grep -A5 Mounts

# Check files in mount
kubectl exec <pod-name> -- ls -la /var/secrets/api-credentials
```

**Fix:**
```yaml
# Ensure Engram YAML has secretRef
secretRefs:
  - name: api-credentials
    key: DB_PASSWORD

# Operator should inject:
# BUBU_SECRET_DB_PASSWORD=file:/var/secrets/api-credentials
```

---

## Kubernetes Client Errors

### Error: `failed to create kubernetes client`

**Cause:** Missing kubeconfig (local dev) or ServiceAccount token (in-cluster).

**Local Development:**
```bash
# Set KUBECONFIG
export KUBECONFIG=~/.kube/config

# Or use default
ls ~/.kube/config
```

**In-Cluster:**
```bash
# Check ServiceAccount token exists
kubectl exec <pod-name> -- ls /var/run/secrets/kubernetes.io/serviceaccount/token

# Check RBAC
kubectl auth can-i create storyruns --as=system:serviceaccount:<namespace>:<sa-name>
```

**Fix:**
```yaml
# Ensure pod has serviceAccountName
spec:
  template:
    spec:
      serviceAccountName: engram-sa
```

---

### Error: `failed to get StepRun 'xyz' in namespace 'default' for status patch`

**Cause:** Wrong namespace or missing RBAC permissions.

**Diagnosis:**
```bash
# Check StepRun exists
kubectl get stepruns xyz -n <namespace>

# Check which namespace SDK is using
kubectl logs <pod-name> | grep namespace

# Check RBAC
kubectl auth can-i get stepruns --as=system:serviceaccount:<namespace>:<sa-name>
kubectl auth can-i patch stepruns/status --as=system:serviceaccount:<namespace>:<sa-name>
```

**Fix:**
```yaml
# Ensure Role has permissions
rules:
  - apiGroups: ["runs.bubustack.io"]
    resources: ["stepruns"]
    verbs: ["get"]
  - apiGroups: ["runs.bubustack.io"]
    resources: ["stepruns/status"]
    verbs: ["patch"]
```

---

### Error: `failed to create storyrun: ... is forbidden`

**Cause:** Missing `storyruns.create` permission.

**Diagnosis:**
```bash
kubectl auth can-i create storyruns --as=system:serviceaccount:<namespace>:<sa-name>
```

**Fix:**
```yaml
rules:
  - apiGroups: ["runs.bubustack.io"]
    resources: ["storyruns"]
    verbs: ["create"]
```

---

## Storage Errors

### Error: `failed to put object 'outputs/...' to s3 bucket`

**Full Message:**
```
failed to put object 'outputs/steprun-123/output.json' to s3 bucket 'my-bucket': AccessDenied
```

**Cause:** Missing S3 permissions or invalid credentials.

**Diagnosis:**
```bash
# Check AWS credentials
kubectl exec <pod-name> -- env | grep AWS

# Test S3 access
aws s3 ls s3://my-bucket/outputs/ --region us-west-2

# Check bucket policy
aws s3api get-bucket-policy --bucket my-bucket
```

**Fix:**
```yaml
# Ensure Secret has valid credentials
apiVersion: v1
kind: Secret
metadata:
  name: aws-credentials
stringData:
  AWS_ACCESS_KEY_ID: AKIA...
  AWS_SECRET_ACCESS_KEY: ...
  AWS_REGION: us-west-2
```

```yaml
# Bucket policy should allow PutObject
{
  "Effect": "Allow",
  "Action": ["s3:PutObject", "s3:GetObject"],
  "Resource": "arn:aws:s3:::my-bucket/outputs/*"
}
```

---

### Error: `failed to read offloaded data from 's3://...'`

**Cause:** Object doesn't exist or wrong bucket/key.

**Diagnosis:**
```bash
# Check object exists
aws s3 ls s3://my-bucket/outputs/steprun-123/

# Check SDK is using correct bucket
kubectl logs <pod-name> | grep BUBU_STORAGE_S3_BUCKET
```

**Fix:**
- Ensure previous step completed successfully and uploaded data
- Check `BUBU_STORAGE_S3_BUCKET` matches Story config
- Verify object wasn't deleted by lifecycle policy

---

### Error: `storage path '/mnt/storage' provided but does not exist`

**Cause:** File storage path not mounted or wrong path.

**Diagnosis:**
```bash
kubectl exec <pod-name> -- ls -la /mnt/storage
```

**Fix:**
```yaml
# Ensure volume is mounted
spec:
  template:
    spec:
      volumes:
        - name: shared-storage
          persistentVolumeClaim:
            claimName: engram-storage
      containers:
        - volumeMounts:
            - name: shared-storage
              mountPath: /mnt/storage
        env:
          - name: BUBU_STORAGE_FILE_PATH
            value: /mnt/storage
```

---

## gRPC Streaming Errors

### Error: `connection refused` (gRPC)

**Cause:** Port mismatch, pod not ready, or network policy blocking traffic.

**Diagnosis:**
```bash
# Check pod is running
kubectl get pod <engram-pod> -o wide

# Check port
kubectl logs <engram-pod> | grep "gRPC server listening"

# Check service
kubectl get svc <engram-svc> -o yaml

# Test connectivity
kubectl port-forward <engram-pod> 8080:8080
grpcurl -plaintext localhost:8080 list
```

**Fix:**
- Ensure `BUBU_GRPC_PORT` matches Service `targetPort`
- Check pod has readiness probe passing
- Verify no NetworkPolicy blocking traffic

---

### Error: `rpc error: code = ResourceExhausted desc = grpc: received message larger than max`

**Cause:** Message exceeds `BUBU_GRPC_MAX_RECV_BYTES` or `BUBU_GRPC_MAX_SEND_BYTES`.

**Diagnosis:**
```bash
# Check current limits
kubectl exec <pod-name> -- env | grep BUBU_GRPC_MAX

# Estimate message size
echo $payload | wc -c
```

**Fix:**
```bash
# Increase limits (e.g., 50 MiB)
BUBU_GRPC_MAX_RECV_BYTES=52428800
BUBU_GRPC_MAX_SEND_BYTES=52428800
```

Or split large payloads into smaller chunks.

---

### Error: `error receiving from gRPC stream: EOF`

**Cause:** Server closed stream prematurely or network issue.

**Diagnosis:**
```bash
# Check server logs
kubectl logs <server-pod>

# Check for context cancellation
kubectl logs <client-pod> | grep "context"
```

**Fix:**
- Ensure server handles `ctx.Done()` gracefully
- Add retries with backoff on client side
- Check network stability

---

## Runtime Errors

### Error: `engram does not support streaming mode, but execution mode is 'streaming'`

**Cause:** Engram only implements `BatchEngram` but operator set `BUBU_EXECUTION_MODE=streaming`.

**Fix:**
Implement `StreamingEngram` interface:
```go
func (e *MyEngram) Stream(ctx context.Context, in <-chan []byte, out chan<- []byte) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case data, ok := <-in:
            if !ok {
                return nil
            }
            // Process and send to out
        }
    }
}
```

Or use batch mode in Engram CRD.

---

### Error: `panic: Engram failed: ...`

**Cause:** User code called `panic()` or SDK detected fatal error.

**Diagnosis:**
```bash
# Check logs for stack trace
kubectl logs <pod-name> | grep -A20 "panic:"
```

**Fix:**
- Batch engrams: SDK panics to ensure non-zero exit code for K8s Job
- Impulses/Streaming: Avoid panics; return errors from `Run`/`Stream`

---

## Performance Issues

### Symptom: Slow input hydration (minutes)

**Cause:** Large S3 objects or slow network.

**Diagnosis:**
```bash
# Check object sizes
aws s3 ls s3://my-bucket/outputs/steprun-123/ --human-readable

# Check SDK logs for timing
kubectl logs <pod-name> | grep "hydrat"
```

**Fix:**
- Use faster S3 region (same as cluster)
- Increase `BUBU_MAX_INLINE_SIZE` to avoid offloading small data
- Use S3 Transfer Acceleration for cross-region

---

### Symptom: High memory usage (OOM kills)

**Cause:** Large payloads buffered in memory.

**Diagnosis:**
```bash
# Check pod memory
kubectl top pod <pod-name>

# Check limits
kubectl describe pod <pod-name> | grep -A2 Limits
```

**Fix:**
- Decrease `BUBU_MAX_INLINE_SIZE` to offload more
- Increase pod memory limits
- Stream large files instead of loading entirely

---

### Symptom: gRPC stream stuttering

**Cause:** Channel buffer too small or slow processing.

**Diagnosis:**
```bash
# Check buffer size
kubectl exec <pod-name> -- env | grep BUBU_GRPC_CHANNEL_BUFFER_SIZE
```

**Fix:**
```bash
# Increase buffer (default 16)
BUBU_GRPC_CHANNEL_BUFFER_SIZE=64
```

Or optimize `Stream()` implementation to process faster.

---

## Security Issues

### Error: Secret logged in plaintext

**Cause:** User code logged `secrets.Raw()` or individual secret values.

**Fix:**
```go
// ❌ DON'T
log.Printf("Secrets: %+v", secrets.Raw())
log.Printf("Password: %s", password)

// ✅ DO
log.Printf("Using secret: API_KEY")
// Or use redacted version
log.Printf("Secrets available: %v", secrets.GetAll())
```

---

### Error: TLS certificate verification failed

**Cause:** Invalid CA cert or hostname mismatch.

**Diagnosis:**
```bash
# Check cert validity
openssl x509 -in /var/tls/server.crt -text -noout

# Check hostname
kubectl exec <pod-name> -- nslookup <hostname>
```

**Fix:**
- Ensure cert CN/SAN matches hostname
- Use correct CA cert in `BUBU_GRPC_CA_FILE`
- For dev: disable verification (not recommended for prod)

---

## Debugging Tips

### Enable Debug Logging

```go
import "log/slog"

logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
    Level: slog.LevelDebug,
}))
ctx := sdk.WithLogger(context.Background(), logger)
sdk.Start(ctx, engram)
```

### Inspect Environment Variables

```bash
kubectl exec <pod-name> -- env | grep BUBU
```

### Check Operator Events

```bash
kubectl get events --sort-by=.lastTimestamp | grep <engram-name>
```

### Dump StepRun Status

```bash
kubectl get steprun <name> -o jsonpath='{.status}' | jq .
```

### Test S3 Access

```bash
kubectl run -it --rm aws-cli --image=amazon/aws-cli --restart=Never -- \
  s3 ls s3://my-bucket/ --region us-west-2
```

### Test gRPC Connectivity

```bash
kubectl run -it --rm grpcurl --image=fullstorydev/grpcurl --restart=Never -- \
  -plaintext <engram-svc>:8080 list
```

---

## Common Misconfigurations

### 1. Wrong Namespace

**Symptom:** SDK can't find K8s resources

**Check:**
```bash
kubectl logs <pod-name> | grep "resolved namespace"
```

**Fix:** Ensure operator injects correct `BUBU_POD_NAMESPACE`.

---

### 2. Port Conflict

**Symptom:** `bind: address already in use`

**Check:**
```bash
kubectl exec <pod-name> -- netstat -tuln | grep 8080
```

**Fix:** Change `BUBU_GRPC_PORT` or use different port for other services.

---

### 3. S3 Region Mismatch

**Symptom:** `PermanentRedirect` errors from S3

**Check:**
```bash
aws s3api get-bucket-location --bucket my-bucket
```

**Fix:** Set `BUBU_STORAGE_S3_REGION` to match bucket region.

---

## Getting Help

1. **Check Logs:**
   ```bash
   kubectl logs <pod-name>
   kubectl logs <pod-name> --previous  # If crashed
   ```

2. **Describe Pod:**
   ```bash
   kubectl describe pod <pod-name>
   ```

3. **Check Operator Logs:**
   ```bash
   kubectl logs -n bubu-system deployment/bobrapet-controller-manager
   ```

4. **Enable Verbose Logging:**
   Add `--log-level=debug` to operator flags

5. **Community Support:**
   - GitHub Issues: https://github.com/bubustack/bubu-sdk-go/issues
   - Slack: #bobrapet-sdk

---

For configuration reference, see the [Runtime configuration reference](../reference/config.md).
