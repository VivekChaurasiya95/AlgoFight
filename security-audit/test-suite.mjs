import http from "http";
import crypto from "crypto";

const API_BASE = "http://localhost:3000";

async function req(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const start = performance.now();
    try {
        const res = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
            },
        });
        const durationMs = performance.now() - start;
        let data = null;
        try {
            data = await res.json();
        } catch {
            data = await res.text();
        }
        return { status: res.status, headers: Object.fromEntries(res.headers.entries()), data, durationMs };
    } catch (err) {
        return { status: 0, error: err.message, durationMs: performance.now() - start };
    }
}

async function runAudit() {
    const results = {
        apiInventory: [],
        authTests: [],
        bolaTests: [],
        inputValidationTests: [],
        rateLimitTests: [],
        corsHeaders: [],
        sandboxTests: [],
        performanceSmoke: {},
    };

    console.log("=== 1. API Health & Baseline ===");
    const health = await req("/health");
    console.log("Health check:", health.status, health.data);

    console.log("\n=== 2. Authentication Security Tests ===");
    // Test 2.1: Protected endpoint with no auth
    const unauthSubmit = await req("/api/submit", {
        method: "POST",
        body: JSON.stringify({ problemId: "dummy", language: "javascript", code: "console.log(1);" }),
    });
    results.authTests.push({ test: "POST /submit without token", expected: 401, actual: unauthSubmit.status, pass: unauthSubmit.status === 401 });

    // Test 2.2: Malformed Bearer token
    const malformedAuth = await req("/api/submit", {
        method: "POST",
        headers: { Authorization: "Bearer invalid.token.payload" },
        body: JSON.stringify({ problemId: "dummy", language: "javascript", code: "console.log(1);" }),
    });
    results.authTests.push({ test: "POST /submit with malformed token", expected: 401, actual: malformedAuth.status, pass: malformedAuth.status === 401 });

    // Test 2.3: Forged synthetic token (when signature invalid)
    const forgedToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImZvcmdlZCJ9.eyJ1c2VyX2lkIjoiYXR0YWNrZXIiLCJleHAiOjE5OTk5OTk5OTl9.Zm9yZ2Vkc2lnbmF0dXJl";
    const forgedAuth = await req("/api/submit", {
        method: "POST",
        headers: { Authorization: `Bearer ${forgedToken}` },
        body: JSON.stringify({ problemId: "dummy", language: "javascript", code: "console.log(1);" }),
    });
    results.authTests.push({ test: "POST /submit with forged JWT", expected: 401, actual: forgedAuth.status, pass: forgedAuth.status === 401 });

    console.log("\n=== 3. Authorization & BOLA Tests ===");
    // Test 3.1: Admin metrics access without admin key
    const adminMetricsNoKey = await req("/api/admin/metrics");
    results.bolaTests.push({ test: "GET /api/admin/metrics without auth", expected: 401, actual: adminMetricsNoKey.status, pass: adminMetricsNoKey.status === 401 });

    // Test 3.2: Admin metrics access with wrong admin key
    const adminMetricsWrongKey = await req("/api/admin/metrics", {
        headers: { "x-admin-key": "WRONG_SECRET_KEY" },
    });
    results.bolaTests.push({ test: "GET /api/admin/metrics with invalid key", expected: 401, actual: adminMetricsWrongKey.status, pass: adminMetricsWrongKey.status === 401 });

    // Test 3.3: Admin metrics access with valid clearance
    const adminMetricsValid = await req("/api/admin/metrics", {
        headers: { "x-admin-key": "7BCG2H" },
    });
    results.bolaTests.push({ test: "GET /api/admin/metrics with valid clearance", expected: 200, actual: adminMetricsValid.status, pass: adminMetricsValid.status === 200 });

    console.log("\n=== 4. Input Boundary Validation Tests ===");
    // Test 4.1: Oversized Code payload (> 64KB)
    const oversizedCode = "A".repeat(70000);
    const oversizedRes = await req("/api/test", {
        method: "POST",
        body: JSON.stringify({
            language: "javascript",
            code: oversizedCode,
            testCases: [{ id: "1", input: "1", expectedOutput: "1" }],
        }),
    });
    results.inputValidationTests.push({ test: "POST /test with 70KB code (>64KB limit)", expected: 400, actual: oversizedRes.status, pass: oversizedRes.status === 400 });

    // Test 4.2: Excessive Testcases (> 20 limit)
    const excessiveTests = Array.from({ length: 25 }, (_, i) => ({ id: `${i}`, input: "1", expectedOutput: "1" }));
    const excessiveRes = await req("/api/test", {
        method: "POST",
        body: JSON.stringify({
            language: "javascript",
            code: "console.log(1);",
            testCases: excessiveTests,
        }),
    });
    results.inputValidationTests.push({ test: "POST /test with 25 testcases (>20 limit)", expected: 400, actual: excessiveRes.status, pass: excessiveRes.status === 400 });

    console.log("\n=== 5. Rate Limiting Tests ===");
    // Burst test on /test endpoint (limit is 30/min)
    let rateLimitHit = false;
    let hitIndex = -1;
    for (let i = 0; i < 35; i++) {
        const res = await req("/api/test", {
            method: "POST",
            body: JSON.stringify({
                language: "javascript",
                code: "console.log(1);",
                testCases: [{ id: "1", input: "1", expectedOutput: "1" }],
            }),
        });
        if (res.status === 429) {
            rateLimitHit = true;
            hitIndex = i + 1;
            break;
        }
    }
    results.rateLimitTests.push({
        test: "Rate limiter burst on /api/test (max 30 req/min)",
        rateLimitTriggered: rateLimitHit,
        rejectionAtRequestNumber: hitIndex,
        pass: rateLimitHit,
    });

    console.log("\n=== 6. Performance Smoke Benchmark ===");
    const latencies = [];
    for (let i = 0; i < 20; i++) {
        const t = await req("/health");
        if (t.durationMs) latencies.push(t.durationMs);
    }
    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)].toFixed(2);
    const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(2);
    const p99 = latencies[latencies.length - 1].toFixed(2);

    results.performanceSmoke = {
        sampleSize: latencies.length,
        p50Ms: Number(p50),
        p95Ms: Number(p95),
        p99Ms: Number(p99),
        minMs: Number(latencies[0].toFixed(2)),
        maxMs: Number(latencies[latencies.length - 1].toFixed(2)),
    };

    console.log("Performance smoke:", results.performanceSmoke);
    console.log("\nAudit tests completed. Writing results...");
    return results;
}

runAudit().then((r) => {
    console.log(JSON.stringify(r, null, 2));
});
