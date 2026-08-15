# ⚔️ AlgoFight Backend — Version 1 Handover & State Memory

> **Document Created:** August 16, 2026  
> **Status:** Foundational Architecture & Scaffolding 100% Compiled (0 Errors across 14 workspace packages)  
> **Next Objective:** Wire the Business Logic & Event Bridges (Phases 1–5 below)

---

## 📌 Executive Summary

AlgoFight is a distributed competitive coding and real-time battle platform.  
For **Version 1 (V1)**, the scope focuses on:
1. **Core Coding Platform:** Problem management, test case execution in sandboxed Docker runners, and priority-based verdict judging.
2. **Multiplayer Battle System:** Player availability list, characteristic-based (ELO) matchmaking, custom multi-player battle rooms ($N \ge 2$), host controls, lobby ready-checks, live scoring, ranking, ELO adjustments, and real-time WebSockets.

---

## 🏗️ Monorepo Compilation & Architecture Status

The workspace is configured with Turborepo and pnpm. All 14 packages and applications build with **zero TypeScript errors, zero warnings, and zero circular dependencies** (`pnpm -r exec tsc --noEmit` passes cleanly).

### Monorepo Map:
```
apps/
├── api/            👉 Fastify REST API (Routes: /users, /players/available, /problems, /submit, /battle/rooms, /matchmaking)
├── websocket/      👉 Standalone WS Server on port 4001 (ConnectionManager, SocketHandler)
├── worker/         👉 BullMQ submission worker executing sandboxed code
└── scheduler/      👉 Background recovery and periodic tasks

packages/
├── application/    👉 Domain services (BattleRoomService, MatchmakingService, RatingService, ExecutionService, JudgeService)
├── database/       👉 Prisma Client, PostgreSQL models, and transaction-safe repositories
├── types/          👉 Shared leaf types and enums (SubmissionStatus, SystemEvent, Verdict)
├── queue/          👉 BullMQ queue definitions and workers
├── error_handling/ 👉 Custom domain errors and Fastify error plugin
├── logger/         👉 Structured Pino logger
├── config/         👉 Environment configuration
└── state-machine/  👉 Submission lifecycle transition validator
```

---

## 🔍 Detailed Audit of the 11 Core V1 Gaps

While all code is strongly typed and compiled, the **business logic bridges** connecting these layers need to be wired. Here is the verified status of each:

| # | Gap / Missing Feature | Root Cause in Codebase | What Needs to be Done |
|---|---|---|---|
| **1** | **Battle State Machine** | `PrismaBattleRoomRepository.setPlayerReady` only sets participant `isReady`, but never transitions `room.status = "READY"` in the database. `startBattle` doesn't verify if players are ready. | In `setPlayerReady`, check if all participants are ready and atomically set `room.status = "READY"`. In `startBattle`, assert status is `READY`. |
| **2** | **Battle Timer / Expiration** | `timeLimitMinutes: 15` is stored in DB, but there is no active timer checking for expired battles. | Add a job in `apps/scheduler` running every 10s to find running battles where `now > startedAt + timeLimitMinutes` and automatically finish them. |
| **3** | **Submission $\leftrightarrow$ Battle Integration** | `model Submission` lacks a `roomId` relation. Submissions during a battle are treated as standalone judge jobs. | Add `roomId String?` to `model Submission` in `schema.prisma`. Pass `roomId` in `/submit`. |
| **4** | **Judge $\rightarrow$ Battle Scoring** | When `ExecutionService` finishes with `Verdict.ACCEPTED`, it does not touch `BattleParticipant`. | In `ExecutionService`, if submission has `roomId`, record participant score (`100`) and timestamp (`solvedAt = new Date()`). |
| **5** | **Ranking & Winner Resolution** | `BattleParticipant.rank` exists, but nothing calculates final placements (1st, 2nd, etc.) when a battle ends. | In `finishBattle()`, order participants by `(solvedAt ASC, score DESC)` and assign `rank = 1, 2, ...`. |
| **6** | **ELO $\leftrightarrow$ Battle Completion** | `RatingService` exists with mathematical formulas, but `finishBattle()` never invokes `applyBattleResult()`. | In `finishBattle()`, identify Winner and Loser(s), call `ratingService.applyBattleResult()` inside a database transaction, and update ratings. |
| **7** | **WebSocket Action Bridge** | `ConnectionManager` exists, but REST actions (`createRoom`, `join`, `ready`, `start`, `submit`) do not emit socket events. | Inject/call socket emitter or Redis Pub/Sub so REST actions broadcast live events to room channels. |
| **8** | **Matchmaking Auto-Ready** | When `MatchmakingService` pairs two players, the joining player is set to `isReady: false`. | Automatically set both players to `isReady: true` on match so the battle can immediately countdown and start. |
| **9** | **Validation & Error Handling** | Routes use `req.body as {...}` type casts and raw `throw new Error(...)`. | Add Zod validation schemas for all battle/matchmaking/user endpoints and use `@algofight/error-handling` classes. |
| **10**| **Hidden-Test Leakage** | `ProblemRepository.getProblemById` includes all test cases with `include: { testCases: true }`. | Separate public problem view (`where: { isHidden: false }` or no test cases) from internal worker queries. |
| **11**| **End-to-End Automated Test** | No integration tests exist. | Write an automated test simulating: *Create Room $\rightarrow$ Join $\rightarrow$ Ready $\rightarrow$ Start $\rightarrow$ Submit Code $\rightarrow$ Solve $\rightarrow$ Finish $\rightarrow$ Verify ELO updated*. |

---

## 🎯 5-Phase Roadmap to Resume Development

When you resume, execute these 5 phases in order:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: SUBMISSION ↔ BATTLE LINKING                                                   │
│ • Update schema.prisma: add `roomId String?` and `room BattleRoom?` to `Submission`.   │
│ • Run `prisma generate` and update `CreateSubmissionInput`.                            │
│ • Update `ExecutionService`: on `Verdict.ACCEPTED`, update participant score/solvedAt. │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 2: BATTLE STATE MACHINE & ELO COMPLETION                                         │
│ • Update `setPlayerReady`: set `room.status = "READY"` when all participants ready.    │
│ • Update `startBattle`: verify status is `READY` before setting `RUNNING`.             │
│ • Update `finishBattle`: calculate ranks (1st, 2nd) and call `ratingService`.          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 3: BATTLE EXPIRATION TIMER & HIDDEN-TEST PROTECTION                              │
│ • Create `battle-expiration.job.ts` in `apps/scheduler` to auto-finish timed-out games.│
│ • Update `ProblemRepository.getProblemById`: filter out `isHidden: true` test cases.   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 4: REAL-TIME EVENT BRIDGE                                                        │
│ • Connect API actions to WebSocket `ConnectionManager` to broadcast:                   │
│   `battle.player.joined`, `battle.player.ready`, `battle.started`, `battle.finished`.  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 5: VALIDATION & AUTOMATED END-TO-END TEST                                        │
│ • Add Zod schemas to all battle/user/matchmaking routes.                               │
│ • Write an automated simulation script testing the full 1v1 battle lifecycle.          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 How to Pick Up Where You Left Off

When you return to the project:

1. **Verify environment**:
   ```bash
   pnpm -r exec tsc --noEmit
   ```
2. **Start with Phase 1**:
   * Open [`packages/database/prisma/schema.prisma`](file:///d:/AlgoFight-backend-new/packages/database/prisma/schema.prisma)
   * Add `roomId String?` to `model Submission`
   * Connect `ExecutionService` to update `BattleParticipant` on solved submissions.

*Everything is clean, organized, and ready for Phase 1!*
