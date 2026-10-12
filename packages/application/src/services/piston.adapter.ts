import { Verdict } from "@algofight/types";
import { CodeHarness } from "../judge/harness/code-harness";
import vm from "node:vm";

// Types matching Piston's API format
interface PistonExecuteRequest {
    language: string;
    version: string;
    files: {
        name?: string;
        content: string;
    }[];
    stdin?: string;
    args?: string[];
    compile_timeout?: number;
    run_timeout?: number;
    compile_memory_limit?: number;
    run_memory_limit?: number;
}

interface PistonStageResult {
    stdout: string;
    stderr: string;
    code: number | null;
    signal: string | null;
    output: string;
    memory?: number;
    message?: string | null;
    status?: string | null;
    cpu_time?: number;
    wall_time?: number;
}

interface PistonExecuteResponse {
    language: string;
    version: string;
    compile?: PistonStageResult;
    run: PistonStageResult;
    message?: string;
}

export interface NormalizedExecutionResult {
    compile: {
        success: boolean;
        output: string;
        error?: string;
    };
    run: {
        success: boolean;
        stdout: string;
        stderr: string;
        code: number | null;
        signal: string | null;
        isTimeout: boolean;
        isMemoryLimit: boolean;
        isRuntimeError: boolean;
        timeMs?: number;
        memoryBytes?: number;
    };
}

export class PistonAdapter {
    private readonly PISTON_URL = process.env.PISTON_URL || (process.env.NODE_ENV === "production" ? "http://piston-1:2000" : "http://127.0.0.1:2001");

    // Maps AlgoFight languages to Piston (language, version)
    private languageMap: Record<string, { language: string; version: string; fileExtension: string }> = {
        javascript: { language: "javascript", version: "*", fileExtension: "js" },
        js: { language: "javascript", version: "*", fileExtension: "js" },
        node: { language: "javascript", version: "*", fileExtension: "js" },
        typescript: { language: "typescript", version: "*", fileExtension: "ts" },
        ts: { language: "typescript", version: "*", fileExtension: "ts" },
        python: { language: "python", version: "*", fileExtension: "py" },
        py: { language: "python", version: "*", fileExtension: "py" },
        python3: { language: "python", version: "*", fileExtension: "py" },
        cpp: { language: "c++", version: "*", fileExtension: "cpp" },
        "c++": { language: "c++", version: "*", fileExtension: "cpp" },
        c: { language: "c", version: "*", fileExtension: "c" },
        java: { language: "java", version: "*", fileExtension: "java" }
    };

    private resolveExecutionUrl(endpoint: string): string {
        const clean = endpoint.trim().replace(/\/+$/, "");
        if (clean.endsWith("/api/v2/execute") || clean.endsWith("/execute")) {
            return clean;
        }
        if (clean.endsWith("/api/v2/piston") || clean.endsWith("/api/v2")) {
            return `${clean}/execute`;
        }
        return `${clean}/api/v2/execute`;
    }

    /**
     * Executes the provided code on the Piston engine and normalizes the response.
     * Incorporates automatic fallback cascade across targetUrl -> PISTON_URL -> backup nodes.
     */
    async executeCode(
        language: string,
        code: string,
        stdin: string,
        timeLimitMs: number = 3000,
        memoryLimitBytes: number = -1, // Use Piston default if -1
        targetUrl?: string
    ): Promise<NormalizedExecutionResult> {
        const pistonLang = this.languageMap[language.toLowerCase()];
        if (!pistonLang) {
            throw new Error(`Unsupported language: ${language}`);
        }

        const prepared = CodeHarness.prepare(language, code, pistonLang.fileExtension);
        const safeRunTimeout = Math.min(Math.max(100, timeLimitMs), 10000);
        const safeMemoryBytes = this.normalizeMemoryLimitBytes(memoryLimitBytes);

        const requestBody: PistonExecuteRequest = {
            language: pistonLang.language,
            version: pistonLang.version,
            files: [
                {
                    name: prepared.fileName,
                    content: prepared.code,
                },
            ],
            stdin: stdin,
            run_timeout: safeRunTimeout,
            compile_timeout: 10000,
            run_memory_limit: safeMemoryBytes,
        };

        const candidates: string[] = [];
        if (targetUrl) candidates.push(targetUrl);
        if (this.PISTON_URL && !candidates.includes(this.PISTON_URL)) candidates.push(this.PISTON_URL);

        // Support local backup runners (e.g. secondary Piston containers) without ever calling public APIs
        const backupUrls = (process.env.PISTON_BACKUP_URLS || "").split(",").map(u => u.trim()).filter(Boolean);
        for (const backup of backupUrls) {
            if (!candidates.includes(backup)) candidates.push(backup);
        }

        let lastError: any = null;

        for (const candidate of candidates) {
            const url = this.resolveExecutionUrl(candidate);
            try {
                const controller = new AbortController();
                const timeoutTimer = setTimeout(() => controller.abort(), timeLimitMs + 5000);

                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal,
                });

                clearTimeout(timeoutTimer);

                if (!response.ok) {
                    const text = await response.text().catch(() => "");
                    throw new Error(`Piston API Error (${response.status}) at ${url}: ${text}`);
                }

                const data: PistonExecuteResponse = await response.json();

                if (data.message) {
                    throw new Error(`Piston Error at ${url}: ${data.message}`);
                }

                return this.normalizeResponse(data, timeLimitMs, memoryLimitBytes);
            } catch (error: any) {
                lastError = error;
                if (error.name === "AbortError") {
                    return this.createErrorResult(Verdict.TIME_LIMIT_EXCEEDED, "Request to execution engine timed out completely.");
                }
                // Try next candidate URL in pool
                continue;
            }
        }
 
        // In-process resilient fallback for JavaScript / TypeScript if Piston runtime is uninstalled/unknown
        const langLower = language.toLowerCase().trim();
        if (["javascript", "js", "typescript", "ts", "node"].includes(langLower)) {
            return this.executeInProcessVm(langLower, prepared.code, stdin, timeLimitMs);
        }

        let userFriendlyMsg = lastError?.message || "Unknown error";
        if (userFriendlyMsg.includes("runtime is unknown")) {
            userFriendlyMsg = `Language runtime for ${language.toUpperCase()} is not yet installed on the sandbox cluster. (Currently ready: C++, C, Python, JavaScript, TypeScript).`;
        }

        // If all candidate runtimes failed, return normalized system error
        return this.createErrorResult(
            Verdict.SYSTEM_ERROR,
            `Sandbox execution engine unreachable across all nodes. Last error: ${userFriendlyMsg}`
        );
    }

    private executeInProcessVm(
        language: string,
        preparedCode: string,
        stdin: string,
        timeLimitMs: number
    ): NormalizedExecutionResult {
        const langLower = language.toLowerCase().trim();
        let runnableCode = preparedCode;

        if (langLower.includes("type") || langLower === "ts") {
            try {
                let ts: any;
                try {
                    ts = require("typescript");
                } catch {
                    ts = require("d:/AlgoFight/node_modules/typescript");
                }
                const transpiled = ts.transpileModule(preparedCode, {
                    compilerOptions: {
                        module: ts.ModuleKind.CommonJS,
                        target: ts.ScriptTarget.ES2020,
                    },
                });
                runnableCode = transpiled.outputText;
            } catch (err: any) {
                return {
                    compile: {
                        success: false,
                        output: "",
                        error: `TypeScript transpilation error: ${err.message}`,
                    },
                    run: {
                        success: false,
                        stdout: "",
                        stderr: err.message,
                        code: 1,
                        signal: null,
                        isTimeout: false,
                        isMemoryLimit: false,
                        isRuntimeError: false,
                        timeMs: 0,
                        memoryBytes: 0,
                    },
                };
            }
        }

        let stdoutBuffer = "";
        let stderrBuffer = "";

        const customConsole = {
            log: (...args: any[]) => {
                stdoutBuffer += args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ") + "\n";
            },
            error: (...args: any[]) => {
                stderrBuffer += args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ") + "\n";
            },
            warn: (...args: any[]) => {
                stderrBuffer += args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ") + "\n";
            },
        };

        const customFs = {
            readFileSync: (_fd: any, _enc?: string) => stdin,
        };

        const sandbox = {
            console: customConsole,
            require: (mod: string) => {
                if (mod === "fs") return customFs;
                return {};
            },
            Buffer,
            setTimeout,
            clearTimeout,
            setInterval,
            clearInterval,
            process: {
                stdin: {
                    read: () => stdin,
                },
                stdout: {
                    write: (chunk: string) => {
                        stdoutBuffer += chunk;
                    },
                },
                stderr: {
                    write: (chunk: string) => {
                        stderrBuffer += chunk;
                    },
                },
            },
        };

        const start = Date.now();
        try {
            const context = vm.createContext(sandbox);
            const script = new vm.Script(runnableCode);
            script.runInContext(context, { timeout: timeLimitMs });
            const timeMs = Date.now() - start;

            return {
                compile: {
                    success: true,
                    output: "",
                },
                run: {
                    success: true,
                    stdout: stdoutBuffer.trim(),
                    stderr: stderrBuffer.trim(),
                    code: 0,
                    signal: null,
                    isTimeout: false,
                    isMemoryLimit: false,
                    isRuntimeError: false,
                    timeMs,
                    memoryBytes: 15 * 1024 * 1024,
                },
            };
        } catch (err: any) {
            const timedOut = err.code === "ERR_SCRIPT_EXECUTION_TIMEOUT";
            const timeMs = Date.now() - start;
            return {
                compile: {
                    success: true,
                    output: "",
                },
                run: {
                    success: false,
                    stdout: stdoutBuffer.trim(),
                    stderr: (stderrBuffer + "\n" + (timedOut ? "Time Limit Exceeded" : err.message)).trim(),
                    code: 1,
                    signal: timedOut ? "SIGXCPU" : null,
                    isTimeout: timedOut,
                    isMemoryLimit: false,
                    isRuntimeError: !timedOut,
                    timeMs,
                    memoryBytes: 15 * 1024 * 1024,
                },
            };
        }
    }

    private normalizeMemoryLimitBytes(memoryLimitBytes: number): number {
        if (!memoryLimitBytes || memoryLimitBytes <= 0) return -1;
        // If passed as MB (< 10000), convert to Bytes
        if (memoryLimitBytes < 10000) {
            return memoryLimitBytes * 1024 * 1024;
        }
        return memoryLimitBytes;
    }

    private normalizeResponse(
        response: PistonExecuteResponse,
        timeLimitMs: number,
        memoryLimitBytes: number = -1
    ): NormalizedExecutionResult {
        const hasCompile = !!response.compile;
        const compileSuccess = hasCompile ? response.compile!.code === 0 : true;

        const run = response.run;
        const isExplicitTimeout =
            run.status === "TO" ||
            run.signal === "SIGXCPU" ||
            (run.message?.toLowerCase().includes("time limit") ?? false);

        const safeMemoryBytes = this.normalizeMemoryLimitBytes(memoryLimitBytes);

        const isMemoryLimit =
            run.status === "MLE" ||
            (run.message?.toLowerCase().includes("memory limit") ?? false) ||
            (!isExplicitTimeout && (
                (run.code === 137 && (run.stderr?.includes("Killed") || run.output?.includes("Killed"))) ||
                (safeMemoryBytes > 0 && (run.memory ?? 0) >= safeMemoryBytes)
            ));

        const isTimeout = isExplicitTimeout || (!isMemoryLimit && run.signal === "SIGKILL");
        const isRuntimeError = !compileSuccess ? false : (run.code !== 0 && !isTimeout && !isMemoryLimit);

        return {
            compile: {
                success: compileSuccess,
                output: hasCompile ? response.compile!.output : "",
                error: !compileSuccess ? response.compile!.stderr || response.compile!.output : undefined,
            },
            run: {
                success: run.code === 0 && !isTimeout && !isMemoryLimit,
                stdout: run.stdout,
                stderr: run.stderr,
                code: run.code,
                signal: run.signal,
                isTimeout,
                isMemoryLimit,
                isRuntimeError,
                timeMs: run.wall_time ?? run.cpu_time ?? 0,
                memoryBytes: run.memory ?? 0,
            }
        };
    }

    private createErrorResult(verdict: Verdict, message: string): NormalizedExecutionResult {
        return {
            compile: {
                success: true,
                output: "",
            },
            run: {
                success: false,
                stdout: "",
                stderr: message,
                code: -1,
                signal: null,
                isTimeout: verdict === Verdict.TIME_LIMIT_EXCEEDED,
                isMemoryLimit: verdict === Verdict.MEMORY_LIMIT_EXCEEDED,
                isRuntimeError: verdict === Verdict.RUNTIME_ERROR || verdict === Verdict.SYSTEM_ERROR,
                timeMs: 0,
                memoryBytes: 0,
            }
        };
    }
}
