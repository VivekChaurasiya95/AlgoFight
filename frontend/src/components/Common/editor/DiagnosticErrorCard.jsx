import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faBug,
  faCode,
  faClock,
  faMicrochip,
  faLocationArrow,
  faCircleExclamation,
  faCheckCircle,
  faChevronDown,
  faChevronUp
} from "@fortawesome/free-solid-svg-icons";
import "./DiagnosticErrorCard.css";

export default function DiagnosticErrorCard({ diagnostic, onJumpToLine }) {
  const [showRaw, setShowRaw] = useState(false);

  if (!diagnostic) return null;

  if (!diagnostic.isError) {
    return (
      <div className="diagnostic-card card-accepted">
        <div className="diagnostic-header">
          <div className="diagnostic-badge badge-accepted">
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>Accepted</span>
          </div>
        </div>
        <div className="diagnostic-msg-box msg-accepted">
          {diagnostic.message}
        </div>
        <div className="diagnostic-section">
          <span className="diagnostic-section-title">Analysis</span>
          <p className="diagnostic-explanation-text">{diagnostic.explanation}</p>
        </div>
      </div>
    );
  }

  const isLogical = diagnostic.verdictType === "WRONG_ANSWER";
  const isSyntax = diagnostic.verdictType === "SYNTAX_ERROR" || diagnostic.verdictType === "COMPILATION_ERROR";
  const isTimeout = diagnostic.verdictType === "TIME_LIMIT_EXCEEDED";
  const isMemory = diagnostic.verdictType === "MEMORY_LIMIT_EXCEEDED";

  const getBadgeIcon = () => {
    if (isLogical) return faCircleExclamation;
    if (isSyntax) return faCode;
    if (isTimeout) return faClock;
    if (isMemory) return faMicrochip;
    return faBug;
  };

  const getBadgeClass = () => {
    if (isLogical) return "badge-logical";
    if (isSyntax) return "badge-syntax";
    if (isTimeout) return "badge-timeout";
    if (isMemory) return "badge-memory";
    return "badge-runtime";
  };

  return (
    <div className={`diagnostic-card ${isLogical ? "card-logical" : "card-error"}`}>
      {/* 1. Header with Badge & Location */}
      <div className="diagnostic-header">
        <div className={`diagnostic-badge ${getBadgeClass()}`}>
          <FontAwesomeIcon icon={getBadgeIcon()} />
          <span>{diagnostic.title}</span>
        </div>

        {diagnostic.line ? (
          <div className="diagnostic-loc-group">
            <span className="diagnostic-line-pill">
              Line {diagnostic.line}{diagnostic.column ? `:${diagnostic.column}` : ""}
            </span>
            {onJumpToLine && (
              <button
                type="button"
                className="diagnostic-jump-btn"
                onClick={() => onJumpToLine(diagnostic.line, diagnostic.column)}
                title="Scroll code editor to this line"
              >
                <FontAwesomeIcon icon={faLocationArrow} />
                <span>Jump</span>
              </button>
            )}
          </div>
        ) : isLogical && diagnostic.logicalDiff ? (
          <span className="diagnostic-line-pill pill-testcase">
            Test Case #{diagnostic.logicalDiff.testCaseId}
          </span>
        ) : null}
      </div>

      {/* 2. Primary Compiler / Error Message */}
      <div className={`diagnostic-msg-box ${isLogical ? "msg-logical" : "msg-error"}`}>
        <strong>Message:</strong> {diagnostic.message}
      </div>

      {/* 3. Code Context Snippet (Syntax / Runtime / Compilation Errors) */}
      {diagnostic.codeContext?.lines && diagnostic.codeContext.lines.length > 0 && (
        <div className="diagnostic-section">
          <span className="diagnostic-section-title">Code Context</span>
          <div className="diagnostic-code-box">
            {diagnostic.codeContext.lines.map((l) => (
              <div key={l.line} className={`diagnostic-code-line ${l.isErrorLine ? "error-line" : ""}`}>
                <span className="diagnostic-line-num">{l.line} |</span>
                <span className="diagnostic-line-content">{l.content}</span>
              </div>
            ))}
            {diagnostic.codeContext.highlightColumn && (
              <div className="diagnostic-caret-line">
                {" ".repeat(Math.max(0, diagnostic.codeContext.highlightColumn - 1)) + "^"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Side-by-Side Diff Section (Logical Errors / Wrong Answer) */}
      {isLogical && diagnostic.logicalDiff && (
        <div className="diagnostic-section">
          <span className="diagnostic-section-title">Discrepancy Analysis</span>
          {diagnostic.logicalDiff.diffNote && (
            <div className="diagnostic-diff-note">
              {diagnostic.logicalDiff.diffNote}
            </div>
          )}
          <div className="diagnostic-diff-grid">
            <div className="diagnostic-diff-block">
              <span className="diagnostic-diff-label label-expected">Expected Output</span>
              <pre className="diagnostic-diff-pre pre-expected">
                {diagnostic.logicalDiff.expected || "(Empty output)"}
              </pre>
            </div>
            <div className="diagnostic-diff-block">
              <span className="diagnostic-diff-label label-actual">Your Output</span>
              <pre className="diagnostic-diff-pre pre-actual">
                {diagnostic.logicalDiff.actual || "(No output produced)"}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 5. What happened / Compiler Explanation */}
      {diagnostic.explanation && (
        <div className="diagnostic-section">
          <span className="diagnostic-section-title">What Happened</span>
          <p className="diagnostic-explanation-text">{diagnostic.explanation}</p>
        </div>
      )}

      {/* 6. How to Fix / Actionable Suggestion */}
      {diagnostic.suggestion && (
        <div className="diagnostic-section">
          <span className="diagnostic-section-title">How To Fix</span>
          <div className="diagnostic-suggestion-box">
            {diagnostic.suggestion}
          </div>
        </div>
      )}

      {/* 7. Expandable Raw Compiler / Engine Output */}
      {diagnostic.rawMessage && (
        <div className="diagnostic-raw-wrap">
          <button
            type="button"
            className="diagnostic-raw-toggle"
            onClick={() => setShowRaw(!showRaw)}
          >
            <span>{showRaw ? "Hide Raw Compiler Trace" : "Show Raw Compiler Output"}</span>
            <FontAwesomeIcon icon={showRaw ? faChevronUp : faChevronDown} />
          </button>
          {showRaw && (
            <pre className="diagnostic-raw-pre">
              {diagnostic.rawMessage}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
