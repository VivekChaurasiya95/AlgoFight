# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

---

# [Unreleased]

## Added

### Project Documentation

* Added README with project overview and architecture references.
* Added development documentation directory.
* Added architecture diagrams and project structure references.
* Added centralized changelog for tracking project evolution.
* Added Prettier ignore configuration for generated artifacts.

### Monorepo Foundation

* Established pnpm workspace-based monorepo architecture.
* Added Turborepo configuration for package orchestration and task execution.
* Added shared TypeScript base configuration.
* Added package-based architecture separating application concerns.

### Database Layer

* Added Prisma ORM integration.
* Added PostgreSQL datasource configuration.
* Added database client package.
* Added Submission model.

#### Submission Schema

Added support for:

* Submission identifiers
* Programming language tracking
* Source code storage
* Execution status tracking
* Standard output storage
* Standard error storage
* Execution time tracking
* Retry count tracking
* Created and updated timestamps

### Submission Lifecycle

Added submission status system:

* CREATED
* QUEUED
* PROCESSING
* COMPLETED
* FAILED
* RETRYING
* STALE

### Queue Infrastructure

Added BullMQ integration.

Implemented:

* Redis-backed queue infrastructure
* Submission queue
* Queue constants
* Queue job payload types
* Queue job producers
* Queue workers

### Redis Infrastructure

Added centralized Redis connection management.

Features:

* Shared connection configuration
* Retry strategy
* Production-friendly connection reuse

### Logging Infrastructure

Added centralized logger package.

Implemented structured logging support across services.

### Error Handling

Added centralized error-handling package.

Implemented:

* Base AppError abstraction with layer metadata
* ErrorCode and ErrorLayer enums
* Domain, validation, application, and infrastructure error types
* Error response factory and package exports

### Worker Infrastructure

Added dedicated worker application.

Responsibilities:

* Consume queued submissions
* Delegate execution to application layer
* Handle asynchronous execution workflows

### Application Layer

Added application package.

Implemented:

* Service layer architecture
* Execution orchestration
* Execution contracts
* Executor abstraction

### Execution Contracts

Added:

```txt
CodeExecutor
```

contract.

Purpose:

* Decouple execution orchestration from execution implementation.
* Enable future executor implementations without modifying business logic.

### Mock Execution Engine

Added:

```txt
MockExecutor
```

implementation.

Purpose:

* Simulate execution flow during early development.
* Validate architecture before introducing Docker sandbox execution.

### Repository Contracts

Added:

```txt
SubmissionRepository
```

contract.

Purpose:

* Decouple application layer from Prisma.
* Introduce abstraction boundary between business logic and persistence.

### Submission Result Flow

Added:

```txt
SubmissionResult
```

type.

Purpose:

* Standardize execution result transfer.
* Prevent repositories from generating execution data internally.
* Prepare architecture for real code execution engines.

### Domain Entities

Added:

```txt
SubmissionEntity
```

domain entity.

Purpose:

* Represent submission records independently from repository implementations.
* Prepare future transition toward richer domain-driven architecture.

---

## Changed

### Dependency Injection

Refactored:

```txt
ExecutionService
```

to receive dependencies through constructor injection.

Previous:

```txt
ExecutionService
    └── created PrismaSubmissionRepository internally
```

Current:

```txt
ExecutionService
    └── receives SubmissionRepository
```

Benefits:

* Improved testability
* Reduced coupling
* Better separation of concerns

### Repository Implementation

Renamed:

```txt
SubmissionRepository
```

implementation to:

```txt
PrismaSubmissionRepository
```

Reason:

* Clearly distinguish abstraction from implementation.
* Improve readability and maintainability.

### Execution Flow

Refactored execution pipeline.

Previous:

```txt
Worker
    ↓
ExecutionService
    ↓
Prisma Repository
```

Current:

```txt
Worker
    ↓
ExecutionService
    ↓
CodeExecutor
    ↓
SubmissionRepository
    ↓
PrismaSubmissionRepository
```

Benefits:

* Clear separation of responsibilities.
* Easier future integration of Docker execution.
* Better architectural scalability.

### Submission Completion Flow

Previous:

Repository generated fake execution results:

```txt
stdout = Hello AlgoFight
executionTime = 3000
```

Current:

```txt
Executor
    ↓
SubmissionResult
    ↓
Repository
```

Benefits:

* Repository only persists data.
* Executor owns execution result generation.
* Cleaner domain boundaries.

### Error Handling

Enhanced:

```txt
ExecutionService
```

with structured failure handling.

Added:

* Error logging
* Submission failure status updates
* Error propagation to worker layer

Benefits:

* Improved observability
* More reliable job processing
* Better production readiness

### Build System Hardening

Added missing TypeScript configuration files across packages.

Standardized:

```txt
packages/*/tsconfig.json
```

structure.

Added package-level build scripts.

Validated successful workspace compilation using Turborepo.

### Development Tooling

Expanded:

```txt
.gitignore
```

to include:

* Build artifacts
* Cache directories
* Generated files
* Operating system files
* IDE/editor files

---

## Architecture Milestone

Current execution architecture:

```txt
API
    ↓
Submission Job
    ↓
BullMQ Queue
    ↓
Worker
    ↓
ExecutionService
    ↓
CodeExecutor
    ↓
SubmissionRepository
    ↓
PrismaSubmissionRepository
    ↓
PostgreSQL
```

Current status:

* Queue architecture established.
* Worker architecture established.
* Repository abstraction established.
* Executor abstraction established.
* Dependency injection established.
* Build system validated.
* Ready for Docker-based execution engine integration.

---

# [2026-05-31] - Initial Snapshot

## Added

* Monorepo scaffold with pnpm workspaces and Turborepo.
* Applications: api, scheduler, websocket, worker.
* Packages: application, config, database, events, logger, queue, sandbox, state-machine, telemetry, types.
* Initial Prisma schema and migrations.
* Shared TypeScript configuration.
* Workspace tooling and repository scripts.
* Docker and infrastructure placeholders.
* Environment template configuration.
