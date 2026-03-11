/* eslint-disable */

/**
 * Shared text utilities for import parsers.
 */

/**
 * Known acronyms to preserve when converting ALL CAPS to Title Case.
 */
const ACRONYMS = new Set([
  'UPS', 'CEO', 'CFO', 'COO', 'CTO', 'CIO',
  'ESG', 'DEI', 'CSR',
  'US', 'UK', 'EU', 'UN',
  'AI', 'IT', 'HR', 'PR',
  'B2B', 'B2C', 'D2C',
]);

/**
 * Convert ALL CAPS text to Title Case. Mixed-case strings are returned unchanged.
 * Detection heuristic: if the string is 3+ characters and equals its own .toUpperCase(),
 * it is treated as all-caps and converted. Known acronyms (UPS, CEO, ESG, etc.) are preserved.
 * Handles hyphens ("SELF-DRIVING" → "Self-Driving") and apostrophes ("DON'T" → "Don't").
 * @param {string} text
 * @returns {string}
 */
export function toTitleCase(text) {
  if (!text || text.length < 3) return text;
  if (text !== text.toUpperCase()) return text;

  // Skip strings that are primarily numbers/symbols (e.g. "4B+", "$19K+", "~460K")
  // If less than half of non-whitespace characters are letters, it's a stat, not prose
  const nonWhitespace = text.replace(/\s/g, '');
  const letterCount = (nonWhitespace.match(/[a-zA-Z]/g) || []).length;
  if (letterCount < nonWhitespace.length / 2) return text;

  return text.split(/(\s+)/).map((segment) => {
    if (/^\s+$/.test(segment)) return segment;
    // Handle hyphenated words
    return segment.split(/([-,])/).map((part) => {
      if (part === '-' || part === ',') return part;
      if (ACRONYMS.has(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join('');
  }).join('');
}
