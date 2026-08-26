# Security & Performance Tool Execution Results

This document records the exact execution logs, tool status, errors, and alternative test methodologies for all automated scanners.

---

## 1. Pnpm Dependency Audit (`pnpm audit`)
- **Command**: `pnpm audit`
- **Exit Status**: Exit code 1 (34 advisories found)
- **Log Summary**: 
  - 2 Low, 16 Moderate, 16 High.
  - Affected paths: `@prisma/dev > @hono/node-server`, `tsx > esbuild`.
  - Classification: Development-only sub-dependencies. Zero direct production runtime risk.

---

## 2. Gitleaks Secret Scanner (`zricethezav/gitleaks:latest`)
- **Command**: `docker run --rm -v "d:/AlgoFight-backend-new:/src:ro" zricethezav/gitleaks:latest dir /src -v --report-format json`
- **Exit Status**: Exit code 1 (Leaks found: 2)
- **Scanned**: ~2.14 MB source files in 5.8s.
- **Log Summary**:
  - Found `AIzaSyDKDDmwFHNhLX3VEWOy-9pfosIX0JfMki4` in `frontend/src/firebaseConfig.js` and `frontend/dist/assets/index-BsraKqrl.js`.
  - Classification: Public Google Firebase web client identifier.

---

## 3. Semgrep Static Analysis Scanner (`semgrep/semgrep`)
- **Command**: `docker run --rm -v "${PWD}:/src:ro" semgrep/semgrep semgrep scan --config p/typescript /src/apps /src/packages`
- **Exit Status**: Exit code 1
- **Error Recorded**: `RPC subprocess did not exit within 1s; killed it.` (Docker WSL2 Windows socket communication timeout).
- **Alternative Test Used**: Performed static code analysis and AST review across `apps/api/src`, `packages/application/src/executors`, and `packages/database/src` to inspect dynamic code evaluation, raw SQL queries, and child process execution.

---

## 4. Dynamic API & WebSocket Test Suite
- **Script**: `scripts/test-suite.mjs`
- **Coverage**:
  - Unauthenticated `/submit` rejection $\rightarrow$ 401 Unauthorized (PASS)
  - Malformed Bearer token rejection $\rightarrow$ 401 Unauthorized (PASS)
  - 70KB oversized payload rejection $\rightarrow$ 400 Bad Request (PASS)
  - Excessive 25-testcase array rejection $\rightarrow$ 400 Bad Request (PASS)
  - Rate limiter burst on `/test` $\rightarrow$ 429 Too Many Requests triggered at 31st request (PASS)
  - Smoke latency: p50 = 1.60ms, p95 = 2.34ms (PASS)
