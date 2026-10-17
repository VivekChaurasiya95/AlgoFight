/**
 * Frontend Diagnostic & Compiler Error Parser
 * Normalizes compilation, syntax, runtime, and logical errors into rich, structured diagnostics.
 * Includes client-side traceback parsing fallback to guarantee exact line detection and code context.
 */

export function parseDiagnosticError(result, userCode = "", language = "javascript") {
  if (!result) return null;

  const rawVerdict = String(result?.verdict || result?.status || "").toUpperCase();
  const rawTestResults = result?.testCaseResults || result?.results || [];
  const passedTests = result?.passedTestCases ?? rawTestResults.filter(r => r.passed).length;
  const totalTests = Math.max(result?.totalTestCases || 0, rawTestResults.length, 1);
  const isAllPassed = Boolean(result?.passed || (totalTests > 0 && passedTests === totalTests));

  if (isAllPassed && !result?.compilation?.error && !result?.error && !rawVerdict.includes("ERROR") && !rawVerdict.includes("WA")) {
    return {
      isError: false,
      verdictType: "ACCEPTED",
      title: "Accepted",
      message: "All test cases passed successfully!",
      line: null,
      column: null,
      codeContext: null,
      explanation: "Your code satisfied all constraints and produced correct outputs for all test cases.",
      suggestion: "Great job! Try optimizing time and memory complexity or submit to leaderboard.",
    };
  }

  // 1. Gather all potential error text sources
  const compOutput = result?.compilation?.error || result?.compilation?.output || "";
  const firstFailedTc = rawTestResults.find(r => !r.passed) || null;
  const tcError = firstFailedTc?.error || "";
  const tcRawOutput = firstFailedTc?.actualOutput || firstFailedTc?.actual || "";
  const rawMsg = result?.output || compOutput || result?.error?.rawMessage || (typeof result?.error === "string" ? result.error : "") || tcError || "";

  const structured = result?.structuredError || result?.error || firstFailedTc?.structuredError || null;
  const structType = String(structured?.type || "").toUpperCase();

  // 2. Classify verdict and diagnostic category
  let verdictType = "ACCEPTED";
  let isCompilation = false;
  let isSyntax = false;
  let isRuntime = false;
  let isTimeout = false;
  let isMemory = false;
  let isLogical = false;

  if (
    rawVerdict.includes("COMPILE") ||
    rawVerdict.includes("COMPILATION") ||
    structType === "COMPILATION_ERROR" ||
    (result?.compilation && result.compilation.success === false)
  ) {
    verdictType = "COMPILATION_ERROR";
    isCompilation = true;
  } else if (
    rawVerdict.includes("TIME") ||
    rawVerdict.includes("TLE") ||
    structType === "TIME_LIMIT_EXCEEDED"
  ) {
    verdictType = "TIME_LIMIT_EXCEEDED";
    isTimeout = true;
  } else if (
    rawVerdict.includes("MEM") ||
    rawVerdict.includes("MLE") ||
    structType === "MEMORY_LIMIT_EXCEEDED"
  ) {
    verdictType = "MEMORY_LIMIT_EXCEEDED";
    isMemory = true;
  } else if (
    structType === "SYNTAX_ERROR" ||
    rawMsg.includes("SyntaxError") ||
    rawMsg.includes("IndentationError")
  ) {
    verdictType = "SYNTAX_ERROR";
    isSyntax = true;
  } else if (
    rawVerdict.includes("RUNTIME") ||
    rawVerdict.includes("EXCEPTION") ||
    structType === "RUNTIME_ERROR" ||
    rawMsg.includes("ReferenceError") ||
    rawMsg.includes("TypeError") ||
    rawMsg.includes("RangeError") ||
    rawMsg.includes("IndexError") ||
    rawMsg.includes("ZeroDivisionError") ||
    rawMsg.includes("Segmentation fault") ||
    rawMsg.includes("SIGSEGV")
  ) {
    verdictType = "RUNTIME_ERROR";
    isRuntime = true;
  } else if (
    rawVerdict.includes("WRONG") ||
    rawVerdict.includes("WA") ||
    !isAllPassed ||
    structType === "WRONG_ANSWER"
  ) {
    verdictType = "WRONG_ANSWER";
    isLogical = true;
  } else {
    verdictType = "RUNTIME_ERROR";
    isRuntime = true;
  }

  // 3. Extract exact Line & Column with multi-pattern fallback
  const userLines = typeof userCode === "string" ? userCode.split("\n") : [];
  const totalUserLines = userLines.length;

  let line = (typeof structured?.line === "number" && structured.line > 0 && structured.line <= totalUserLines)
    ? structured.line
    : null;
  let column = (typeof structured?.column === "number" && structured.column > 0)
    ? structured.column
    : null;

  const textToScan = `${compOutput}\n${rawMsg}\n${tcError}\n${tcRawOutput}`;

  if (line === null && totalUserLines > 0 && (isCompilation || isSyntax || isRuntime)) {
    const patterns = [
      // GCC / Clang: file.cpp:12:5: error: or file.cpp:12: error:
      /(?:[a-zA-Z0-9_.\-\\/]+):(\d+)(?::(\d+))?:\s*(?:fatal\s+)?error:/i,
      // Node.js: at ... (/path/to/main.js:12:5) or main.js:12:5
      /(?:main|index|app|code|solution|runner|script|\w+)\.(?:js|ts|mjs|cjs):(\d+)(?::(\d+))?/i,
      /evalmachine\.<anonymous>:(\d+)(?::(\d+))?/i,
      /at\s+.*?:(\d+):(\d+)/i,
      // Python: File "...", line 12
      /File\s+"[^"]+",\s+line\s+(\d+)/i,
      // Java: Main.java:12: error:
      /(?:[a-zA-Z0-9_.\-\\/]+\.java):(\d+):/i,
      // General line & column patterns
      /(?:line|Line)\s+(\d+)(?:,\s*col(?:umn)?\s*(\d+))?/i,
      /\((\d+):(\d+)\)/,
      /:(\d+):(\d+)/
    ];

    for (const pattern of patterns) {
      const match = textToScan.match(pattern);
      if (match && match[1]) {
        const parsedLine = parseInt(match[1], 10);
        if (!isNaN(parsedLine) && parsedLine >= 1 && parsedLine <= totalUserLines) {
          line = parsedLine;
          if (match[2]) {
            const parsedCol = parseInt(match[2], 10);
            if (!isNaN(parsedCol)) column = parsedCol;
          }
          break;
        }
      }
    }

    // Caret column detector
    if (column === null) {
      const caretMatch = textToScan.match(/\n([ \t]+)\^[^\n]*/);
      if (caretMatch && caretMatch[1]) {
        column = caretMatch[1].length + 1;
      }
    }
  }

  // 4. Build Code Context Box around line
  let codeContext = structured?.codeContext || null;
  if (!codeContext && line && totalUserLines > 0) {
    const start = Math.max(1, line - 2);
    const end = Math.min(totalUserLines, line + 2);
    const ctxLines = [];
    for (let l = start; l <= end; l++) {
      ctxLines.push({
        line: l,
        content: userLines[l - 1] || "",
        isErrorLine: l === line,
      });
    }
    codeContext = {
      lines: ctxLines,
      highlightColumn: column,
    };
  }

  // 5. Build Compiler-Grade Messages and Suggestions
  let title = "Error";
  let message = structured?.message || "";
  let explanation = structured?.explanation || "";
  let suggestion = structured?.suggestion || "";
  let logicalDiff = null;

  if (isCompilation) {
    title = "Compilation Error";
    if (!message) {
      message = compOutput.split("\n")[0] || "Code failed to compile.";
    }
    if (!explanation) {
      explanation = "The compiler encountered fatal build errors and could not generate an executable binary.";
    }
    if (!suggestion) {
      suggestion = "Check variable types, function signatures, missing headers/semicolons, and syntax around the highlighted line.";
    }
  } else if (isSyntax) {
    title = "Syntax Error";
    if (!message) {
      message = extractCleanErrorMessage(textToScan, "SyntaxError");
    }
    if (!explanation) {
      explanation = "The language interpreter encountered invalid tokens or unexpected structure while parsing.";
    }
    if (!suggestion) {
      suggestion = "Check for missing or unclosed brackets '{}', parentheses '()', semicolons ';', or typos in keywords.";
    }
  } else if (isRuntime) {
    const subtype = structured?.subtype || extractSubtypeName(textToScan);
    title = subtype ? `Runtime Error (${subtype})` : "Runtime Error";
    if (!message) {
      message = extractCleanErrorMessage(textToScan, subtype || "Error");
    }
    if (!explanation) {
      explanation = "An unhandled exception occurred during program execution while processing a test case.";
    }
    if (!suggestion) {
      suggestion = "Inspect boundary conditions, verify that referenced variables/indices exist, and handle null/empty states.";
    }
  } else if (isTimeout) {
    title = "Time Limit Exceeded (TLE)";
    message = structured?.message || `Execution exceeded time limit.`;
    explanation = "Your program did not finish executing within the allotted execution time.";
    suggestion = "Look for infinite loops (while/for conditions) or optimize time complexity from O(N²) to O(N log N) or O(N).";
  } else if (isMemory) {
    title = "Memory Limit Exceeded (MLE)";
    message = structured?.message || `Execution exceeded memory limit.`;
    explanation = "Your program allocated more RAM than permitted by the judge.";
    suggestion = "Avoid large 2D table allocations or unbounded recursive call stacks.";
  } else if (isLogical) {
    title = "Wrong Answer (Logical Error)";
    const tcNum = (rawTestResults.findIndex(r => !r.passed) + 1) || 1;
    const exp = firstFailedTc?.expectedOutput ?? firstFailedTc?.expected ?? "";
    const act = firstFailedTc?.actualOutput ?? firstFailedTc?.actual ?? "";
    const inp = firstFailedTc?.input ?? "";

    message = `Output mismatch on Test Case #${tcNum}.`;
    
    // Smart logical diff analyzer
    const analysis = analyzeOutputMismatch(exp, act);
    explanation = structured?.explanation || analysis.explanation;
    suggestion = structured?.suggestion || analysis.suggestion;

    logicalDiff = {
      testCaseId: tcNum,
      input: typeof inp === "object" ? JSON.stringify(inp) : String(inp),
      expected: typeof exp === "object" ? JSON.stringify(exp) : String(exp),
      actual: typeof act === "object" ? JSON.stringify(act) : String(act),
      diffNote: analysis.diffNote,
    };
  }

  return {
    isError: true,
    verdictType,
    title,
    message: message || "An unexpected error occurred during execution.",
    line,
    column,
    codeContext,
    explanation,
    suggestion,
    rawMessage: textToScan.trim() || rawMsg,
    logicalDiff,
  };
}

function extractCleanErrorMessage(text, preferredPrefix = "") {
  if (!text) return "";
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  
  if (preferredPrefix) {
    const match = lines.find(l => l.includes(`${preferredPrefix}:`) || l.startsWith(preferredPrefix));
    if (match) return match;
  }

  const errLine = lines.find(l => l.includes("Error:") || l.includes("Exception:"));
  if (errLine) return errLine;

  return lines[0] || "Execution error encountered";
}

function extractSubtypeName(text) {
  if (!text) return "";
  const match = text.match(/\b(TypeError|ReferenceError|RangeError|IndexError|NameError|ValueError|KeyError|ZeroDivisionError|NullPointerException|ArrayIndexOutOfBoundsException|NoSuchElementException)\b/);
  return match ? match[1] : "";
}

function analyzeOutputMismatch(expected, actual) {
  const expStr = typeof expected === "object" ? JSON.stringify(expected) : String(expected || "").trim();
  const actStr = typeof actual === "object" ? JSON.stringify(actual) : String(actual || "").trim();

  if (!actStr) {
    return {
      diffNote: "No output produced on standard output (stdout).",
      explanation: "Your program completed without printing any output to standard output.",
      suggestion: "Make sure your solution uses console.log / print / cout / System.out.println to output the final answer.",
    };
  }

  if (actStr.startsWith("[") && !expStr.startsWith("[")) {
    return {
      diffNote: "Output format mismatch: received JSON/Array structure instead of space-separated values.",
      explanation: `Your program printed a raw array representation ('${actStr.length > 30 ? actStr.substring(0, 30) + "..." : actStr}'), but the judge expects space-separated values.`,
      suggestion: "Print individual numbers separated by spaces (e.g. arr.join(' ') in JavaScript or *arr in Python).",
    };
  }

  const expLines = expStr.split(/\r?\n/).map(l => l.trim());
  const actLines = actStr.split(/\r?\n/).map(l => l.trim());

  if (expLines.length !== actLines.length) {
    return {
      diffNote: `Line count mismatch: expected ${expLines.length} line(s), but produced ${actLines.length} line(s).`,
      explanation: `Your output produced ${actLines.length} lines, whereas the judge requires exactly ${expLines.length} lines.`,
      suggestion: "Ensure you are printing each test case result or newline in accordance with the problem statement.",
    };
  }

  for (let i = 0; i < expLines.length; i++) {
    if (expLines[i] !== actLines[i]) {
      return {
        diffNote: `Mismatch at line ${i + 1}: expected '${expLines[i]}', got '${actLines[i]}'.`,
        explanation: `At line ${i + 1}, your code computed '${actLines[i]}', but the correct answer is '${expLines[i]}'.`,
        suggestion: "Double-check your loop termination, off-by-one indices, and edge case assumptions.",
      };
    }
  }

  return {
    diffNote: "Content mismatch between expected and actual output.",
    explanation: "The values output by your code did not match the expected judge output.",
    suggestion: "Trace through sample test cases step-by-step or check edge cases like empty arrays or duplicate elements.",
  };
}
