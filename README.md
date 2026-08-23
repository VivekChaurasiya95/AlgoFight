# AlgoFight

AlgoFight is a highly scalable, real-time platform for competitive algorithmic battles. Compete in live coding duels, challenge online players, host private multiplayer rooms, and execute code in a secure, sandboxed environment.

## 🚀 Features

- **Live Code Battles:** Real-time multiplayer rooms using WebSockets for instantaneous gameplay.
- **3D Interactive Interface:** Immersive UI built with React Three Fiber, Three.js, and Framer Motion.
- **Secure Execution Engine:** Sandboxed workers to safely compile and run user-submitted code with strict resource constraints.
- **Resilient Architecture:** Event-driven backend with robust queueing, auto-retries, and dead-letter queues.
- **Comprehensive Observability:** End-to-end monitoring across API, workers, and queues.

---

## 🏗 System Architecture

The platform operates as a modern monorepo containing both the frontend client and the distributed backend services.

### Frontend
- **Frameworks:** React 19, Vite, Tailwind CSS v4.
- **3D & Animations:** Three.js, `@react-three/fiber`, Framer Motion, Rapier for physics.
- **State & Real-time:** Zustand, Socket.io client.
- **Auth:** Firebase Authentication.

### Backend & Execution
- **Gateway & API:** Handles authentication, rate limiting, request validation, and user profiles.
- **Real-time Server (Websocket):** Manages multiplayer rooms, state synchronization, and live battle events.
- **Execution Workers:** A robust worker pool running sandboxed environments with hard limits on CPU, Memory, Time, and File System access.
- **State & Queueing:** Redis cluster powers job queues, distributed locks, pub/sub, and coordination.
- **Database:** Prisma ORM for storing execution metadata, user records, and match history.

---

## 🔄 Submission Lifecycle & State Machine

Every code submission flows through a deterministic state machine:
1. **Created:** Submission accepted and persisted.
2. **Queued:** Job enqueued for execution.
3. **Processing:** Sandboxed worker evaluates the job.
4. **Completed / Failed:** Outcome recorded and broadcasted back to the players.
5. **Retrying / Stale:** Fault-tolerance loops recover stuck or failed jobs automatically.

---

## 📂 Monorepo Layout

| Area | Description |
| --- | --- |
| `frontend/` | The React web application and interactive 3D arena |
| `apps/api/` | Main API service for submission lifecycle and results |
| `apps/worker/` | Execution worker and sandbox coordination |
| `apps/scheduler/` | Recovery and scheduling services |
| `apps/websocket/` | Real-time state synchronization and rooms |
| `packages/application/` | Core application contracts and services |
| `packages/database/` | Prisma schema and repositories |
| `packages/error_handling/`| Shared error types and response helpers |
| `packages/queue/` | Queue and worker utilities |
| `packages/logger/` | Shared logging utilities |

---

## 🛡 Security & Reliability

- **Isolation:** Execution Sandbox runs via secure factory implementations preventing host system access.
- **Idempotency:** Atomic state transitions prevent double execution of code submissions.
- **Resilience:** Circuit breakers, exponential backoff retries, and dead-letter queues ensure no job is silently dropped.

---

## 📜 Changelog

See [`development docs/CHANGELOG.md`](development%20docs/CHANGELOG.md) for the full history of the backend evolution.
