/**
 * Utility functions to parse, format math TeX notations, and structure raw problem statements
 * into clean sections (Description, Input Format, Output Format, Constraints, Note).
 */

const UNICODE_SUBSCRIPTS = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'm': 'ₘ', 'n': 'ₙ',
  'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'x': 'ₓ'
};

const UNICODE_SUPERSCRIPTS = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', 'n': 'ⁿ'
};

function replaceSubscripts(str) {
  return str.replace(/([a-zA-Z])_([0-9ijkmnprstx]+)/g, (_, base, sub) => {
    const converted = sub.split('').map(char => UNICODE_SUBSCRIPTS[char] || char).join('');
    return `${base}${converted}`;
  });
}

function replaceSuperscripts(str) {
  return str.replace(/\^([0-9\+\-=n]+)/g, (_, sup) => {
    const converted = sup.split('').map(char => UNICODE_SUPERSCRIPTS[char] || char).join('');
    return converted;
  });
}

/**
 * Converts raw TeX math strings into clean, readable math notation
 */
export function formatMathText(text) {
  if (!text || typeof text !== "string") return "";

  let formatted = text;

  // Replace TeX symbol commands
  formatted = formatted
    .replace(/\\le(q)?\b/g, "≤")
    .replace(/\\ge(q)?\b/g, "≥")
    .replace(/\\ne(q)?\b/g, "≠")
    .replace(/\\to\b|\\rightarrow\b/g, "→")
    .replace(/\\leftarrow\b/g, "←")
    .replace(/\\cdot\b|\\times\b/g, "×")
    .replace(/\\dots\b|\\ldots\b|\\cdots\b/g, "...")
    .replace(/\\infty\b/g, "∞")
    .replace(/\\in\b/g, "∈")
    .replace(/\\notin\b/g, "∉")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\pmod/g, "mod")
    .replace(/\\bmod/g, "mod")
    .replace(/\\pm\b/g, "±")
    .replace(/\\mathcal\{([A-Za-z])\}/g, "$1")
    .replace(/\\text\{([^}]+)\}/g, "$1");

  // Replace superscripts like 10^9 or 2^31
  formatted = replaceSuperscripts(formatted);

  // Replace subscripts like a_1, i_k
  formatted = replaceSubscripts(formatted);

  // Clean dollar signs used for TeX inline math: $x$ -> x
  formatted = formatted.replace(/\$([^$]+)\$/g, "$1");

  // Replace escaped underscores or characters
  formatted = formatted.replace(/\\_/g, "_").replace(/\\#/g, "#");

  return formatted;
}

/**
 * Parses a raw problem statement string into structured sections:
 * - description
 * - inputFormat
 * - outputFormat
 * - constraints
 * - note
 */
export function parseProblemStatement(statementText) {
  if (!statementText || typeof statementText !== "string") {
    return {
      description: ["No description available."],
      inputFormat: null,
      outputFormat: null,
      constraints: null,
      note: null
    };
  }

  const cleanRaw = statementText.replace(/\r\n/g, "\n").trim();

  // Pattern headers in Codeforces/CP problem descriptions
  const sectionHeaderRegex = /\n?\s*(Input\s*Format|Input|Output\s*Format|Output|Constraints?|Notes?|Explanations?|Sample\s*Input|Interaction)\s*\n?/gi;

  const matches = [];
  let match;
  while ((match = sectionHeaderRegex.exec(cleanRaw)) !== null) {
    matches.push({
      headerName: match[1].trim(),
      index: match.index,
      length: match[0].length
    });
  }

  if (matches.length === 0) {
    // Single block - try splitting by double newline for paragraphs
    const paragraphs = cleanRaw
      .split(/\n\s*\n/)
      .map(p => formatMathText(p.trim()))
      .filter(Boolean);

    return {
      description: paragraphs.length ? paragraphs : [formatMathText(cleanRaw)],
      inputFormat: null,
      outputFormat: null,
      constraints: null,
      note: null
    };
  }

  let descriptionText = cleanRaw.substring(0, matches[0].index).trim();
  let inputFormatText = null;
  let outputFormatText = null;
  let constraintsText = null;
  let noteText = null;

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : cleanRaw.length;
    const content = cleanRaw.substring(current.index + current.length, nextIndex).trim();

    const normalizedHeader = current.headerName.toLowerCase();

    if (normalizedHeader.startsWith("input")) {
      inputFormatText = content;
    } else if (normalizedHeader.startsWith("output")) {
      outputFormatText = content;
    } else if (normalizedHeader.startsWith("constraint")) {
      constraintsText = content;
    } else if (normalizedHeader.startsWith("note") || normalizedHeader.startsWith("explanation")) {
      noteText = content;
    } else if (!descriptionText) {
      descriptionText = content;
    }
  }

  const splitParagraphs = (str) => {
    if (!str) return null;
    return str
      .split(/\n\s*\n|\n/)
      .map(p => formatMathText(p.trim()))
      .filter(Boolean);
  };

  return {
    description: splitParagraphs(descriptionText) || [formatMathText(descriptionText)],
    inputFormat: splitParagraphs(inputFormatText),
    outputFormat: splitParagraphs(outputFormatText),
    constraints: splitParagraphs(constraintsText),
    note: splitParagraphs(noteText)
  };
}
