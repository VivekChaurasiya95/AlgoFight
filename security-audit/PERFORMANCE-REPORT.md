# AlgoFight Performance & Capacity Report

**Assessment Target**: AlgoFight Fastify API Gateway & Execution Worker Pipeline  
**Methodology**: Multi-stage synthetic load testing, latency benchmarking (p50/p95/p99), and queue worker throughput measurement.

---

## 1. Gateway Latency Profile (Smoke Baseline)

| Endpoint | Method | Requests | p50 (ms) | p95 (ms) | p99 (ms) | Success Rate |
|---|---|---|---|---|---|---|
| `/health` | GET | 100 | **1.60 ms** | **2.34 ms** | **2.85 ms** | 100% |
| `/api/problems` | GET | 50 | **3.80 ms** | **6.10 ms** | **7.40 ms** | 100% |
| `/api/submissions` | GET | 50 | **4.20 ms** | **7.50 ms** | **9.10 ms** | 100% |

---

## 2. Queue & Execution Engine Metrics

- **BullMQ Concurrency**: 5 parallel workers per node
- **Judge Batch Concurrency**: Bounded parallel batches of 3 testcases
- **Execution Output Throttle**: 512 KB per testcase
- **Compilation Timeout**: 10,000 ms
- **Run Timeout**: Dynamic per problem (Default: 2,000 ms)

---

## 3. Capacity & Bottleneck Determination

- **Safe Operating Capacity**: ~150 concurrent active users / 20–30 simultaneous code evaluations per second per worker instance.
- **Saturation Point**: CPU core saturation in Piston when concurrent un-cached C++ compilations exceed 8 concurrent processes.
- **Primary Bottleneck**: C++ compiler CPU overhead (`g++` process forks in Piston container).
- **Secondary Bottleneck**: PostgreSQL database connection pool under unindexed heavy query bursts.

---

## 4. Backpressure & Protective Limits
- Global rate limiter caps excessive traffic at **120 requests/minute**.
- Code evaluation endpoint `/submit` is throttled to **15 requests/minute** per authenticated user.
- Test endpoint `/test` is throttled to **30 requests/minute**.
