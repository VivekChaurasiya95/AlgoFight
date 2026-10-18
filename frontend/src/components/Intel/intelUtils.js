import React from "react";

/**
 * Intel Hub Utility Functions
 */

/**
 * Converts SCREAMING_CAPS database titles into clean, readable Title Case.
 * Preserves common acronyms and technical tags (e.g. V2.4, JIT, API, MMR, HMAC, JVM, C++, Rust).
 */
export function formatCardTitle(title) {
  if (!title || typeof title !== "string") return "";
  const letters = title.replace(/[^a-zA-Z]/g, "");
  if (!letters) return title;
  const upper = letters.split("").filter((c) => c === c.toUpperCase()).length;

  // If more than 50% of letters are uppercase, format into Title Case
  if (letters.length > 3 && upper / letters.length >= 0.5) {
    return title
      .toLowerCase()
      .split(" ")
      .map((word) => {
        if (!word) return "";
        // Specific brands or acronyms
        if (/^algofight:?$/i.test(word)) {
          return word.endsWith(":") ? "AlgoFight:" : "AlgoFight";
        }
        if (/^(v\d+(\.\d+)?|jit|api|mmr|hmac|jvm|c\+\+|css|2v2|ui|ux|lts|id|#\d+):?$/i.test(word)) {
          return word.toUpperCase();
        }
        if (/^(i|ii|iii|iv|v|vi):?$/i.test(word)) {
          return word.toUpperCase();
        }
        // Handle hyphenated words like "zero-overhead" -> "Zero-Overhead"
        return word
          .split("-")
          .map((sub) => sub.charAt(0).toUpperCase() + sub.slice(1))
          .join("-");
      })
      .join(" ");
  }

  return title;
}

/**
 * Parses inline markdown: **bold**, __bold__, `code`, *italic*
 */
export function parseInlineMarkdown(text) {
  if (!text || typeof text !== "string") return "";
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
      parts.push(React.createElement("strong", { key: match.index }, token.slice(2, -2)));
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(React.createElement("code", { key: match.index, className: "article-inline-code" }, token.slice(1, -1)));
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(React.createElement("em", { key: match.index }, token.slice(1, -1)));
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}
