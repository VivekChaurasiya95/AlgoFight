# AlgoFight Security Regression Test Plan

This plan establishes the automated security regression test suite to be integrated into continuous integration (CI) pipelines.

---

## 1. Automated Security Regression Test Suite

### 1.1 Authentication & Token Integrity
- **Test AUTH-01**: Request `/api/submit` without Authorization header $\rightarrow$ Expect `401`.
- **Test AUTH-02**: Request `/api/submit` with expired JWT $\rightarrow$ Expect `401`.
- **Test AUTH-03**: Request `/api/submit` with invalid RS256 signature $\rightarrow$ Expect `401`.
- **Test AUTH-04**: Request `/api/submit` with empty Bearer header $\rightarrow$ Expect `401`.

### 1.2 Authorization & BOLA (Object-Level Access)
- **Test BOLA-01**: User A requests `GET /api/submissions/:userBSubmissionId` $\rightarrow$ Expect sanitized `SubmissionSummary` DTO (source code omitted).
- **Test BOLA-02**: User A requests `GET /api/submissions/:userASubmissionId` $\rightarrow$ Expect full `SubmissionOwnerView` DTO (source code included).
- **Test RBAC-01**: Non-admin user requests `GET /api/admin/metrics` $\rightarrow$ Expect `401` / `403`.
- **Test RBAC-02**: Admin user with valid clearance requests `GET /api/admin/metrics` $\rightarrow$ Expect `200`.

### 1.3 Input Boundary & Size Restrictions
- **Test INP-01**: Submit code payload > 64KB $\rightarrow$ Expect `400` Bad Request.
- **Test INP-02**: Submit testcase array with > 20 items $\rightarrow$ Expect `400` Bad Request.
- **Test INP-03**: Submit single testcase input > 32KB $\rightarrow$ Expect `400` Bad Request.

### 1.4 Rate Limiting & Throttling
- **Test RATE-01**: Send 16 requests within 1 minute to `/api/submit` $\rightarrow$ 16th request returns `429 Too Many Requests`.
- **Test RATE-02**: Send 31 requests within 1 minute to `/api/test` $\rightarrow$ 31st request returns `429 Too Many Requests`.

### 1.5 Execution Sandbox Hostile Program Suite
- **Test SANDBOX-01 (CPU Hang)**: `while(true) {}` $\rightarrow$ Terminates within 2000ms with `TIME_LIMIT_EXCEEDED`.
- **Test SANDBOX-02 (Memory Bomb)**: Allocate 5GB RAM in C++/Python $\rightarrow$ Kills process with `MEMORY_LIMIT_EXCEEDED`.
- **Test SANDBOX-03 (Output Flood)**: Print 50MB of text $\rightarrow$ Caps at 512KB with `OUTPUT_LIMIT_EXCEEDED`.
- **Test SANDBOX-04 (Fork Bomb)**: `while(1) fork();` $\rightarrow$ Terminated by process ceiling without host exhaustion.
- **Test SANDBOX-05 (Filesystem Isolation)**: Attempt to read `/etc/shadow` $\rightarrow$ Blocked by container filesystem jail.

### 1.6 WebSocket Gateway Integrity
- **Test WS-01**: Connect socket and send duel challenge without authentication handshake $\rightarrow$ Returns error event.
- **Test WS-02**: Connect socket and send `ping` $\rightarrow$ Responds with `pong` within 5s.
