# AlgoFight Backend

A scalable, event-driven backend for code submission execution with resilient queueing, sandboxed workers, and end-to-end observability. This repository is a pnpm and Turborepo monorepo that separates API, workers, and shared packages.

## Table of contents

- [Architecture overview](#architecture-overview)
- [High-level system architecture](#high-level-system-architecture)
- [Submission lifecycle and state machine](#submission-lifecycle-and-state-machine)
- [Worker internal architecture](#worker-internal-architecture)
- [Design patterns used](#design-patterns-used)
- [Reliability and recovery](#reliability-and-recovery)
- [Observability and monitoring](#observability-and-monitoring)
- [Scalability and coordination](#scalability-and-coordination)
- [Security and sandbox](#security-and-sandbox)
- [Event-driven architecture](#event-driven-architecture)
- [Cross-cutting concerns](#cross-cutting-concerns)
- [Monorepo layout](#monorepo-layout)
- [Changelog](#changelog)

## Architecture overview

![System architecture overview](development%20docs/Architectural%20diagram.png)

The diagram summarizes the execution flow from API intake to worker execution, including queueing, state transitions, reliability strategies, and observability.

## High-level system architecture

- Gateway layer handles auth, rate limiting, routing, and request validation.
- API layer controls submissions, result retrieval, and user profile APIs.
- Redis cluster provides queues, coordination, locks, and pub/sub.
- Database stores execution metadata, submission state, and recovery data.
- Execution sandbox enforces strict resource limits and isolation.

## Submission lifecycle and state machine

States and outcomes are modeled as an explicit state machine:

- Created: submission accepted and persisted.
- Queued: job is enqueued for execution.
- Processing: worker is executing the job.
- Completed: successful execution and result stored.
- Failed: execution failed with error recorded.
- Retrying: recovery or retry after failure or stale detection.
- Stale: heartbeat expired, job reclaimed for retry.

Transitions are atomic and idempotent to avoid double-processing.

## Worker internal architecture

- Job classifier separates light and heavy queues.
- Scheduler and heartbeat service track execution health.
- Executor runs sandboxed workloads with resource limiters.
- Result publisher sends completion events.
- Adaptive concurrency considers CPU, queue depth, and latency.

## Design patterns used

- State pattern for submission lifecycle.
- Strategy pattern for execution policy selection.
- Factory pattern for sandbox and executor creation.
- Observer pattern for event emission and monitoring.
- Command pattern for standardized job execution.
- Circuit breaker and retry patterns for resilience.
- Repository pattern for persistence access.

## Reliability and recovery

- Idempotent workers and atomic state transitions.
- Heartbeats and stale job detection.
- Retry with exponential backoff and max retry limits.
- Dead letter queue for exhausted retries.
- Recovery scheduler re-queues stalled jobs.

## Observability and monitoring

- Metrics collection across queues, workers, DB, Redis, sandbox, and network.
- Aggregation via metrics store, tracing, and log pipelines.
- Visualization with dashboards and alerting rules.
- Notifications to on-call and audit reports.

## Scalability and coordination

- Queue-based scaling for independent worker pools.
- Distributed coordination using locks, pub/sub, and counters.
- Adaptive scheduling and dynamic worker scaling.

## Security and sandbox

- Sandbox factory creates isolated execution environments.
- CPU, memory, time, and filesystem limits enforced.
- Network isolation and policy-driven access control.
- Strategy-based execution for compiled, interpreted, or custom runtimes.

## Event-driven architecture

- Event sources: submissions, workers, queues, recovery services.
- Event bus for dispatch and fan-out.
- Consumers for metrics, alerts, notifications, and analytics.

## Cross-cutting concerns

- Centralized config and feature flags.
- Data retention, archival, and backup policies.
- CI/CD, automated tests, and quality gates.
- Governance, audit logging, and access control.

## Monorepo layout

| Area | Description |
| --- | --- |
| apps/api | API service for submission lifecycle and results |
| apps/worker | Execution worker and sandbox coordination |
| apps/scheduler | Recovery and scheduling services |
| apps/websocket | Real-time status updates |
| packages/application | Core application contracts and services |
| packages/database | Prisma schema and repositories |
| packages/queue | Queue and worker utilities |
| packages/logger | Shared logging utilities |

## Changelog

See [development docs/CHANGELOG.md](development%20docs/CHANGELOG.md) for the full history.
