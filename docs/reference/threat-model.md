---
title: SDK Threat Model
sidebar_position: 8
description: STRIDE analysis for bubu-sdk-go and related transports.
---

# bubu-sdk-go: Threat Model

**Framework:** STRIDE  
**Last Updated:** October 2, 2025

---

## Trust Boundaries

1. **Kubernetes API** — SDK trusts ServiceAccount & RBAC
2. **gRPC** — Streaming engrams accept connections (TLS optional)
3. **S3/Storage** — Shared buckets, object keys may encode metadata
4. **Environment** — Operator-injected vars (trusted); user code can read all

---

## STRIDE Analysis

### 1. Environment Variables (`runtime/context.go`)

| Threat | Scenario | Impact | Status |
|--------|----------|--------|--------|
| **Info Disclosure** | User logs `secrets.Raw()` | Secret leakage | 🟧 User responsibility |
| **DoS** | `BUBU_INPUTS` = 10GB JSON | OOM crash | 🟥 No size limit |

**Fix:** Add 10 MiB limit before unmarshal.

---

### 2. Kubernetes Client (`k8s/client.go`)

| Threat | Scenario | Impact | Status |
|--------|----------|--------|--------|
| **Info Disclosure** | SDK logs `stepRunName` with PII | Compliance violation | 🟥 Fix needed |
| **DoS** | Impulse triggers infinite StoryRuns | Cluster exhaustion | 🟧 No rate limit |

**Fix:** Redact names in logs; add rate limiter.

---

### 3. gRPC Streaming (`stream.go`)

| Threat | Scenario | Impact | Status |
|--------|----------|--------|--------|
| **Spoofing** | Attacker pod dials engram | Unauthorized data injection | 🟥 No auth |
| **Tampering** | MITM alters packets | Data corruption | 🟥 Plaintext default |
| **Info Disclosure** | Network sniffing | Sensitive data theft | 🟧 TLS optional |
| **DoS** | 1000 idle streams | Goroutine leak | 🟥 No conn limit |

**Fixes:**
1. Mandatory mutual TLS
2. Connection limit (`BUBU_GRPC_MAX_CONNECTIONS`)
3. Stream timeout

---

### 4. Storage (`storage/`)

| Threat | Scenario | Impact | Status |
|--------|----------|--------|--------|
| **Tampering** | Attacker modifies S3 object | Tampered data | 🟧 No integrity check |
| **Info Disclosure** | S3 keys logged with PII | Compliance violation | 🟥 Critical |
| **DoS** | Slow S3; no timeout | Infinite hang | 🟥 Critical |

**Fixes:**
1. Redact S3 keys in logs
2. Add 30s timeout on S3 ops
3. SHA-256 integrity checks

---

### 5. Secrets (`engram/client.go`)

| Threat | Scenario | Impact | Status |
|--------|----------|--------|--------|
| **Info Disclosure** | User logs `Raw()` | Secret leak | 🟧 Cannot prevent |
| **Info Disclosure** | World-readable secret files | Pod-wide access | 🟧 Operator config |

**Fix:** Document `defaultMode: 0400` for Secret mounts.

---

### 6. Unmarshal (`runtime/context.go`)

| Threat | Scenario | Impact | Status |
|--------|----------|--------|--------|
| **Tampering** | Deeply nested JSON (100 levels) | Stack overflow | 🟥 No depth limit |
| **DoS** | 1 GB string in input | OOM | 🟥 No size check |

**Fixes:**
1. Reject input > 10 MiB
2. Fuzz tests for unmarshal

---

## Risk Matrix

| Component | Overall Risk |
|-----------|--------------|
| gRPC Streaming | 🟥 **Critical** (no auth, DoS) |
| Storage | 🟥 **Critical** (log leaks, no timeout) |
| Unmarshal | 🟥 **High** (DoS, no limits) |
| K8s Client | 🟧 **Medium** (log PII) |
| Secrets | 🟧 **Medium** (user bypass) |
| Env Vars | 🟧 **Medium** (DoS) |

**Legend:** 🟥 Critical/High | 🟧 Medium | 🟨 Low | ✅ Mitigated

---

## Priority Fixes

### 🟥 Now (Critical)
1. Add gRPC mutual TLS
2. Redact S3 keys and StepRun names in logs
3. Add S3 operation timeouts (30s)
4. Limit gRPC connections
5. Validate input size (10 MiB max)

### 🟧 Next (High)
6. Parse `DataPacket.Metadata` for tracing
7. SHA-256 integrity checks for S3
8. Rate limit `TriggerStory` (10/sec)
9. Fuzz tests

### 🟨 Later
10. Client-side encryption for S3
11. Stream idle timeout (5 min)
12. Secret file count limit (100)

---

For security best practices, see the [SDK User Guide](../sdk/sdk-user-guide.md).
