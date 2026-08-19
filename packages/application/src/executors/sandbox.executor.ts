import { CodeExecutor, ExecutionPayload } from "../contracts/code-executor";
import { SubmissionResult } from "@algofight/database";
import { JudgeService } from "../judge/services/judge.service";
import { SubmissionStatus, Verdict } from "@algofight/types";
import { logger } from "@algofight/logger";

const PISTON_URL = process.env.PISTON_URL || "http://localhost:2000";

type SandboxResult = {
    stdout: string;
    stderr: string;
    exitCode: number;
    timedOut: boolean;
    compilationError: boolean;
};

export class SandboxExecutor implements CodeExecutor {
    private readonly judgeService = new JudgeService();

    async execute(payload: ExecutionPayload): Promise<SubmissionResult> {
        const startTime = Date.now();

        const {
            submissionId,
            language,
            code,
            testCases,
            timeLimit = 2000,
        } = payload;

        logger.info(
            {
                submissionId,
                language,
                testCasesCount: testCases.length,
            },
            "Dispatching code to self-hosted sandbox",
        );

        const judgeInputs = [];

        let combinedStdout = "";
        let combinedStderr: string | null = null;
        let anyError = false;

        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];

            const res = await this.executeInSandbox(
                language,
                code,
                tc.input,
                timeLimit,
            );

            if (i === 0) {
                combinedStdout = res.stdout;
            }

            if (res.stderr && !combinedStderr) {
                combinedStderr = res.stderr;
            }

            if (
                res.exitCode !== 0 ||
                res.timedOut ||
                res.compilationError
            ) {
                anyError = true;
            }

            judgeInputs.push({
                testcaseId: `tc-${i + 1}`,
                expectedOutput: tc.expectedOutput,
                actualOutput:
                    res.exitCode === 0 &&
                        !res.timedOut &&
                        !res.compilationError
                        ? res.stdout
                        : "",
                executionTime: 0,
                memoryUsed: 0,
                exitCode: res.exitCode,
                timeLimitExceededError: res.timedOut,
                runtimeError:
                    res.exitCode !== 0 &&
                    !res.timedOut &&
                    !res.compilationError,
                compilationError: res.compilationError,
            });

        }

        const judgeResult = this.judgeService.judge({
            testcases: judgeInputs,
        });

        const totalExecutionTime = Date.now() - startTime;

        const isAccepted =
            judgeResult.verdict === Verdict.ACCEPTED;

        logger.info(
            {
                submissionId,
                verdict: judgeResult.verdict,
                passed: judgeResult.passedCount,
                total: testCases.length,
            },
            "Sandbox judging completed",
        );

        return {
            stdout:
                combinedStdout ||
                (isAccepted
                    ? "All test cases passed successfully!"
                    : "Output mismatch on testcase."),

            stderr: combinedStderr,

            executionTime: totalExecutionTime,

            exitCode: anyError ? 1 : 0,

            status: SubmissionStatus.COMPLETED,

            passedCount: judgeResult.passedCount,

            failedCount: judgeResult.failedCount,
        };
    }

    private async executeInSandbox(
        language: string,
        code: string,
        stdinInput: string,
        timeoutMs: number,
    ): Promise<SandboxResult> {
        const langMap: Record<string, string> = {
            javascript: "javascript",
            js: "javascript",
            python: "python",
            py: "python",
            cpp: "c++",
            "c++": "c++",
            java: "java",
        };

        const targetLang = langMap[language.toLowerCase()];

        if (!targetLang) {
            throw new Error(
                `Unsupported language: ${language}`,
            );
        }

        const requestBody = {
            language: targetLang,
            version: "*",
            files: [
                {
                    content: this.wrapCodeForLanguage(
                        targetLang,
                        code,
                    ),
                },
            ],
            stdin: stdinInput,
            run_timeout: timeoutMs,
        };

        try {
            const res = await fetch(
                `${PISTON_URL}/api/v2/execute`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                    signal: AbortSignal.timeout(
                        timeoutMs + 2000,
                    ),
                },
            );

            if (!res.ok) {
                const errorText = await res
                    .text()
                    .catch(() => "");

                throw new Error(
                    `Sandbox service error (${res.status}): ${errorText}`,
                );
            }

            const data = (await res.json()) as any;

            /*
             * Compilation failure
             */
            if (data.compile?.status) {
                return {
                    stdout: "",
                    stderr:
                        data.compile.message ||
                        data.compile.stderr ||
                        "Compilation error",
                    exitCode: 1,
                    timedOut: false,
                    compilationError: true,
                };
            }

            const run = data.run || {};

            const timedOut = run.status === "TO";

            const runtimeError =
                run.status === "RE" ||
                run.status === "SG";

            return {
                stdout: (run.stdout || "").trim(),

                stderr: (run.stderr || "").trim(),

                exitCode:
                    run.code ??
                    (runtimeError ? 1 : 0),

                timedOut,

                compilationError: false,
            };
        } catch (err: any) {
            logger.error(
                {
                    error: err.message,
                    PISTON_URL,
                    language: targetLang,
                },
                "Sandbox execution failed",
            );

            /*
             * Do NOT execute user code outside the sandbox.
             * Let the queue/recovery layer handle this failure.
             */
            throw new Error(
                `Execution sandbox unavailable: ${err.message}`,
            );
        }
    }

    private wrapCodeForLanguage(
        language: string,
        rawCode: string,
    ): string {
        if (language === "javascript") {
            return `
const fs = require("fs");

const input = fs.readFileSync(0, "utf-8");

${rawCode}

if (typeof solution === "function") {
    const raw = input.trim();

    const lines = raw
        .split("\\n")
        .map(l => l.trim())
        .filter(Boolean);

    let res;

    if (lines.length > 1) {
        const args = lines.map(l => {
            try {
                return JSON.parse(l);
            } catch {
                return l.includes(" ")
                    ? l.split(" ").map(Number)
                    : l;
            }
        });

        res = solution(...args);
    } else if (raw.includes(" ")) {
        const nums = raw
            .split(" ")
            .map(n =>
                isNaN(Number(n))
                    ? n
                    : Number(n)
            );

        res = solution(...nums);
    } else {
        let single = raw;

        try {
            single = JSON.parse(raw);
        } catch {}

        res = solution(single);
    }

    if (res !== undefined) {
        console.log(
            typeof res === "object"
                ? JSON.stringify(res)
                : res
        );
    }
}
`;
        }

        return rawCode;
    }
}