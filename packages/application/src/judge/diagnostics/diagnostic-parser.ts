import { ErrorType, StructuredError, Verdict } from "@algofight/types";
import { CppDiagnosticParser } from "./parsers/cpp-parser";
import { PythonDiagnosticParser } from "./parsers/python-parser";
import { JavaScriptDiagnosticParser } from "./parsers/javascript-parser";
import { JavaDiagnosticParser } from "./parsers/java-parser";
import { logger } from "@algofight/logger";

export class DiagnosticParser {
    /**
     * Parses compilation output into a normalized StructuredError object.
     */
    public static parseCompilationError(
        language: string,
        userCode: string,
        rawCompilerOutput: string,
        lineOffset: number = 0
    ): StructuredError {
        const lang = language.toLowerCase().trim();

        try {
            switch (lang) {
                case "cpp":
                case "c++":
                case "c":
                    return CppDiagnosticParser.parseCompilation(rawCompilerOutput, userCode, lineOffset);
                case "python":
                case "py":
                case "python3":
                    return PythonDiagnosticParser.parse(rawCompilerOutput, userCode, lineOffset);
                case "javascript":
                case "js":
                case "typescript":
                case "ts":
                    return JavaScriptDiagnosticParser.parse(rawCompilerOutput, userCode, lineOffset);
                case "java":
                    return JavaDiagnosticParser.parseCompilation(rawCompilerOutput, userCode, lineOffset);
                default:
                    return this.createFallbackError(
                        ErrorType.COMPILATION_ERROR,
                        "Compilation error occurred.",
                        rawCompilerOutput
                    );
            }
        } catch (err: any) {
            logger.error({ err: err?.message, language }, "Failed in DiagnosticParser.parseCompilationError");
            return this.createFallbackError(
                ErrorType.COMPILATION_ERROR,
                "Compilation error occurred.",
                rawCompilerOutput
            );
        }
    }

    /**
     * Parses runtime stderr into a normalized StructuredError object.
     */
    public static parseRuntimeError(
        language: string,
        userCode: string,
        stderr: string,
        lineOffset: number = 0,
        signal?: string | null
    ): StructuredError {
        const lang = language.toLowerCase().trim();

        try {
            switch (lang) {
                case "cpp":
                case "c++":
                case "c":
                    return CppDiagnosticParser.parseRuntime(stderr, userCode, lineOffset, signal);
                case "python":
                case "py":
                case "python3":
                    return PythonDiagnosticParser.parse(stderr, userCode, lineOffset);
                case "javascript":
                case "js":
                case "typescript":
                case "ts":
                    return JavaScriptDiagnosticParser.parse(stderr, userCode, lineOffset);
                case "java":
                    return JavaDiagnosticParser.parseRuntime(stderr, userCode, lineOffset);
                default:
                    return this.createFallbackError(
                        ErrorType.RUNTIME_ERROR,
                        "Runtime exception occurred.",
                        stderr
                    );
            }
        } catch (err: any) {
            logger.error({ err: err?.message, language }, "Failed in DiagnosticParser.parseRuntimeError");
            return this.createFallbackError(
                ErrorType.RUNTIME_ERROR,
                "Runtime exception occurred.",
                stderr
            );
        }
    }

    public static createTimeoutError(timeLimitMs: number): StructuredError {
        return {
            type: ErrorType.TIME_LIMIT_EXCEEDED,
            message: `Execution exceeded time limit of ${timeLimitMs}ms.`,
            line: null,
            column: null,
            explanation: "The program did not finish executing within the allowed time limit.",
            suggestion: "Check for infinite loops (while/for conditions) or optimize time complexity algorithmically.",
        };
    }

    public static createMemoryError(memoryLimitBytes: number): StructuredError {
        const mb = (memoryLimitBytes / (1024 * 1024)).toFixed(1);
        return {
            type: ErrorType.MEMORY_LIMIT_EXCEEDED,
            message: `Execution exceeded memory limit of ${mb}MB.`,
            line: null,
            column: null,
            explanation: "The program allocated more memory than allowed by the judge configuration.",
            suggestion: "Avoid excessive memory allocations, large arrays, or un-garbage-collected references.",
        };
    }

    public static createWrongAnswerError(
        testCaseNumber: number,
        input?: string,
        expectedOutput?: string,
        actualOutput?: string,
        isHidden: boolean = false
    ): StructuredError {
        const expTrim = (expectedOutput || "").trim();
        const actTrim = (actualOutput || "").trim();

        let detail = `Your output did not match the expected output on ${isHidden ? "hidden" : "sample"} test case #${testCaseNumber}.`;
        let fix = isHidden
            ? "Consider edge cases such as empty inputs, boundary values, or negative numbers."
            : "Compare your output line-by-line with the expected output to spot discrepancies.";

        if (!actTrim) {
            detail = `Logical Error: Program produced no output on test case #${testCaseNumber}.`;
            fix = "Ensure your solution prints or returns the expected value without exiting prematurely.";
        } else if (actTrim.startsWith("[") && !expTrim.startsWith("[")) {
            detail = `Format Mismatch: Output was formatted as a raw array or JSON string (${actTrim.length > 40 ? actTrim.substring(0, 40) + "..." : actTrim}), but the judge expects space-separated values.`;
            fix = "Format array elements separated by spaces (e.g. arr.join(' ') in JS or print(*arr) in Python) instead of printing the array directly.";
        } else if (expTrim.includes("\n") && !actTrim.includes("\n")) {
            detail = `Line Count Mismatch: Expected multiple lines of output, but received a single line.`;
            fix = "Print each answer or step on its own line.";
        }

        return {
            type: ErrorType.WRONG_ANSWER,
            subtype: "LOGICAL_ERROR",
            message: `Output mismatch on test case #${testCaseNumber}.`,
            line: null,
            column: null,
            explanation: detail,
            suggestion: fix,
        };
    }

    public static createSystemError(message: string): StructuredError {
        return {
            type: ErrorType.SYSTEM_ERROR,
            message: message || "Judge internal error.",
            line: null,
            column: null,
            explanation: "An infrastructure or sandbox communication error occurred.",
            suggestion: "Please try resubmitting your code in a few moments.",
        };
    }

    private static createFallbackError(
        type: ErrorType,
        message: string,
        rawMessage: string
    ): StructuredError {
        return {
            type,
            message: rawMessage.split("\n")[0] || message,
            line: null,
            column: null,
            rawMessage,
            explanation: "An error occurred during judge execution.",
            suggestion: "Inspect raw output for technical details.",
        };
    }
}
