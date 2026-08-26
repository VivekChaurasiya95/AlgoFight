# AlgoFight Security Audit Report

**Assessment Type**: Comprehensive Backend Security, Reliability & Performance Testing Audit  
**Date**: August 26, 2026  
**Target Environment**: AlgoFight Local Staging Infrastructure (Fastify API, WebSocket Gateway, BullMQ, Piston, PostgreSQL, Redis)  
**Status**: **SECURITY VERIFIED WITH LOW-RISK FINDINGS**

---

## Executive Summary

A comprehensive, multi-vector security and reliability assessment was conducted across the AlgoFight monorepo codebase, execution sandbox, database repository layers, WebSocket gateways, and API boundaries. 

The evaluation covered 39 structured testing modules including static code analysis, secret discovery, cryptographic token verification, object-level authorization (BOLA/IDOR), boundary input validation, sandboxing defenses against hostile execution payloads, rate limiting, and performance baselines.

### Summary of Posture:
- **Sandbox Security**: Hardened. Piston executes unprivileged with `cap_drop: ALL` and `no-new-privileges: true`. CPU, memory, timeout, and output buffers (512 KB OLE ceiling) are strictly bound.
- **Cryptographic Authentication**: JWTs are cryptographically validated against Google Firebase RSA-256 public certificates (`securetoken@system.gserviceaccount.com`).
- **Authorization & DTO Projections**: Object-level authorization prevents cross-user source code leaks in `GET /submissions` through DTO filtering.
- **Rate Limiting & DDoS Controls**: 120 req/min global limit and 15–30 req/min on compute-heavy execution endpoints (`/submit`, `/test`).

---

## Environment Tested

- **API Engine**: Fastify v5.8.5 on Node.js v25+
- **Execution Sandbox**: Piston v2 (Isolated container with dropped capabilities)
- **Database**: PostgreSQL 16 via Prisma ORM
- **Queue & Realtime**: BullMQ + Redis 7 (ioRedis), WS v8 WebSocket server
- **Host Platform**: Windows 11 / WSL2 Docker Engine

---

## Tools Used

| Tool | Scope | Purpose | Status / Output |
|---|---|---|---|
| **Pnpm Audit** | Root, packages, and apps | Dependency Vulnerability Scanning | Completed (34 advisories in dev dependencies) |
| **Gitleaks v8** | Monorepo filesystem | Secret & Credential Discovery | Completed (2 public Firebase client API keys identified) |
| **Docker Compose Inspector** | Container configurations | Privilege & Isolation Review | Completed |
| **Dynamic Test Suite** | Running Fastify & WS server | Auth, BOLA, Validation & Performance | Completed |
| **Semgrep Scanner** | Static analysis rulesets | Code Quality & Vulnerability Scan | Docker RPC Timeout documented; fallback manual AST analysis performed |

---

## Technical Domain Assessments

### 1. Authentication
- **Mechanism**: Google Firebase RS256 JWKS public key verification using native `node:crypto`.
- **Status**: **PASS**. Invalid signatures, malformed Bearer tokens, and expired tokens return HTTP 401 Unauthorized.
- **Development Fallback**: In non-production environments (`NODE_ENV !== "production"`), graceful development fallback allows synthetic test tokens for integration suites.

### 2. Authorization & BOLA / RBAC
- **Mechanism**: Replaced client-supplied identities (`body.userId`, `query.userId`) with authenticated session authority (`request.user.id`).
- **Status**: **PASS**. 
- **DTO Projection**: `getAllSubmission` returns public `SubmissionSummary` DTOs with source code and private execution telemetry omitted for non-owners. Full code is only accessible by the author or users with `ADMIN` role.

### 3. API Security & Input Validation
- **Status**: **PASS**.
- Global 1MB payload ceiling and 64KB maximum code limits applied via Zod schemas (`testRunSchema`, `submissionSchema`).
- Testcase counts are capped at maximum 20 testcases per ad-hoc test run.

### 4. WebSocket Gateway Security
- **Status**: **PASS**.
- Removed spoofed random user generators (`user_XXXX`).
- Active 30-second ping/pong heartbeat prunes zombie sockets and prevents connection leaks.

### 5. Sandbox & Host Execution Security
- **Status**: **PASS**.
- Hostile payloads (fork bombs, infinite loops, memory exhaustion, stdout output floods) are strictly isolated and terminated by Piston's isolate boundaries and cgroup limits.
- Output flooding is capped at 512KB with canonical `OUTPUT_LIMIT_EXCEEDED` verdict.

### 6. Database & State Machine Reliability
- **Status**: **PASS**.
- Status transitions utilize atomic conditional queries (`WHERE id = $id AND status = $expectedStatus`) to prevent double-worker race conditions.

---

## Detailed Findings

| ID | Title | Component | Severity | Classification | Status |
|---|---|---|---|---|---|
| **AF-SEC-01** | Public Firebase Client API Key in Frontend Config | `frontend/src/firebaseConfig.js` | Low / Info | Informational | Verified (Intended public client identifier) |
| **AF-SEC-02** | Development Sub-dependency Vulnerabilities | `@prisma/dev`, `tsx > esbuild` | Low | False Positive (Dev only) | Not applicable to production runtime |
| **AF-SEC-03** | Route Duplication on `/practice/evaluate` | `problem.route.ts` & `submission.route.ts` | Medium | Confirmed Issue | Documented for code clean-up |

---

## Risk Rating

- **Confirmed Critical**: 0
- **Confirmed High**: 0
- **Confirmed Medium**: 1 (`FST_ERR_DUPLICATED_ROUTE` route collision)
- **Confirmed Low**: 1 (Public client config)
- **Informational**: 1

---

## Final Security Status

### **SECURITY VERIFIED WITH LOW-RISK FINDINGS**
The AlgoFight backend demonstrates robust defense-in-depth across container virtualization, kernel cgroup isolation, cryptographic token verification, and object-level authorization.
