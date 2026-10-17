import { ErrorType, StructuredError, CodeContext } from "@algofight/types";

export class JavaScriptDiagnosticParser {
    public static parse(
        rawOutput: string,
        userCode: string,
        lineOffset: number
    ): StructuredError {
        const userLines = userCode.split("\n");
        const totalUserLines = userLines.length;

        let line: number | null = null;
        let column: number | null = null;

        // 1. Comprehensive regex to capture filename:line:col across all Node.js / V8 outputs
        const linePatterns = [
            /(?:[a-zA-Z0-9_.\-\\/]+)?(?:main|index|app|code|solution|runner|script|\w+)\.(?:js|ts|mjs|cjs):(\d+)(?::(\d+))?/gi,
            /evalmachine\.<anonymous>:(\d+)(?::(\d+))?/gi,
            /at\s+(?:.*?\s+\()?(?:[a-zA-Z0-9_.\-\\/]+)\.(?:js|ts|mjs|cjs):(\d+):(\d+)\)?/gi,
            /\((\d+):(\d+)\)/g,
            /(?:^|\s|\()line\s+(\d+)(?:,\s*col(?:umn)?\s*(\d+))?/gi,
        ];

        for (const pattern of linePatterns) {
            const matches = [...rawOutput.matchAll(pattern)];
            if (matches.length > 0) {
                // Check from first to last to find a match that falls into user code
                for (const match of matches) {
                    const repLine = parseInt(match[1], 10);
                    if (!isNaN(repLine)) {
                        const adj = repLine - lineOffset;
                        if (adj >= 1 && adj <= totalUserLines) {
                            line = adj;
                            if (match[2]) {
                                const parsedCol = parseInt(match[2], 10);
                                if (!isNaN(parsedCol)) column = parsedCol;
                            }
                            break;
                        }
                    }
                }
            }
            if (line !== null) break;
        }

        // 2. SyntaxError column caret parsing
        // Example:
        // const x =
        //         ^
        const caretMatch = rawOutput.match(/\n([ \t]+)\^[^\n]*/);
        if (caretMatch && caretMatch[1] && column === null) {
            column = caretMatch[1].length + 1;
        }

        // 3. Extract Exception line (e.g. SyntaxError: Unexpected token '}')
        const lines = rawOutput.trim().split("\n");
        let excLine = "";
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (trimmed.includes("Error:") || trimmed.includes("Exception:")) {
                excLine = trimmed;
                break;
            }
        }
        if (!excLine) {
            excLine = lines.find(l => l.includes("Error")) || lines[0] || "Error: JavaScript Exception";
        }

        const colonIndex = excLine.indexOf(":");
        const excName = colonIndex !== -1 ? excLine.substring(0, colonIndex).trim() : "Error";
        const excMsg = colonIndex !== -1 ? excLine.substring(colonIndex + 1).trim() : excLine.trim();

        const isSyntax = excName === "SyntaxError";
        const errorType = isSyntax ? ErrorType.SYNTAX_ERROR : ErrorType.RUNTIME_ERROR;

        const codeLine = line ? userLines[line - 1] : null;

        // 4. Build CodeContext around the error line
        let codeContext: CodeContext | null = null;
        if (line) {
            const start = Math.max(1, line - 2);
            const end = Math.min(totalUserLines, line + 2);
            const ctxLines = [];
            for (let l = start; l <= end; l++) {
                ctxLines.push({
                    line: l,
                    content: userLines[l - 1],
                    isErrorLine: l === line,
                });
            }
            codeContext = {
                lines: ctxLines,
                highlightColumn: column,
            };
        }

        const { explanation, suggestion } = this.categorizeJsError(excName, excMsg);

        return {
            type: errorType,
            subtype: excName,
            message: excMsg || excName,
            line,
            column,
            codeLine: codeLine || undefined,
            codeContext,
            rawMessage: rawOutput,
            explanation,
            suggestion,
        };
    }

    private static categorizeJsError(
        excName: string,
        excMsg: string
    ): { explanation: string; suggestion: string } {
        const lowerMsg = (excMsg || "").toLowerCase();

        if (excName === "SyntaxError") {
            if (lowerMsg.includes("unexpected token") || lowerMsg.includes("unexpected identifier")) {
                if (lowerMsg.includes("}") || lowerMsg.includes(")")) {
                    return {
                        explanation: `Syntax Error: Unexpected closing delimiter (${excMsg}).`,
                        suggestion: "Check line and preceding statements for missing commas, semicolons, or mismatched brackets/parentheses.",
                    };
                }
                return {
                    explanation: `Syntax Error: The parser encountered an unexpected token (${excMsg}).`,
                    suggestion: "Verify that operators, brackets, and semicolons are properly placed and balanced.",
                };
            }
            if (lowerMsg.includes("unexpected end of input")) {
                return {
                    explanation: "Syntax Error: Unexpected end of input while parsing code.",
                    suggestion: "You likely forgot a closing bracket '}', parenthesis ')', or quote '\"'. Check all block closures.",
                };
            }
            if (lowerMsg.includes("missing ) after") || lowerMsg.includes("missing } after")) {
                return {
                    explanation: "Syntax Error: Missing closing delimiter in expression.",
                    suggestion: "Ensure every opening '(' and '{' has a matching closing ')' and '}'.",
                };
            }
            return {
                explanation: `Syntax Error: ${excMsg}`,
                suggestion: "Review code syntax around the indicated line and check for missing punctuation.",
            };
        }

        if (excName === "ReferenceError") {
            return {
                explanation: `Reference Error: An identifier was accessed before declaration or out of scope (${excMsg}).`,
                suggestion: "Ensure the variable or function is declared with let/const/var and spelled correctly.",
            };
        }

        if (excName === "TypeError") {
            if (lowerMsg.includes("cannot read properties of undefined") || lowerMsg.includes("cannot read property")) {
                return {
                    explanation: "Type Error: Attempted to read a property from 'undefined' or 'null'.",
                    suggestion: "Ensure the array or object is initialized and boundary checks are in place before indexing.",
                };
            }
            if (lowerMsg.includes("is not a function")) {
                return {
                    explanation: `Type Error: Value invoked as a function is not callable (${excMsg}).`,
                    suggestion: "Check that the function exists and was not overwritten by a variable with the same name.",
                };
            }
            if (lowerMsg.includes("assignment to constant variable")) {
                return {
                    explanation: "Type Error: Attempted to reassign a variable declared with 'const'.",
                    suggestion: "Change the declaration from 'const' to 'let' if the value needs to be reassigned.",
                };
            }
            return {
                explanation: `Type Error: Incompatible type operation (${excMsg}).`,
                suggestion: "Inspect variable types and values passed into operators or methods.",
            };
        }

        if (excName === "RangeError") {
            if (lowerMsg.includes("maximum call stack size exceeded")) {
                return {
                    explanation: "Range Error: Maximum call stack size exceeded (Infinite Recursion).",
                    suggestion: "Check the base case condition in your recursive function to ensure it properly terminates.",
                };
            }
            return {
                explanation: `Range Error: Value out of allowed range (${excMsg}).`,
                suggestion: "Check array length boundaries, repeat counts, and numeric ranges.",
            };
        }

        return {
            explanation: `${excName}: ${excMsg || "Runtime exception encountered during execution."}`,
            suggestion: "Check runtime inputs and logic around the reported line number.",
        };
    }
}
