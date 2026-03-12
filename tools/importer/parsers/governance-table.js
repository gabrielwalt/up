/* eslint-disable */
/* global WebImporter */

/**
 * Parser for investor site board committees data table
 *
 * Source: investors.ups.com/corporategovernance/board-committees
 *
 * Source selector: .main-content > table
 *   HTML <table> with:
 *     - <thead> row: Members | Committee1 | Committee2 | ...
 *     - <tbody> rows: Name | Chair/Member/empty | ...
 *     - "Independent Directors" divider row (<th> spanning all columns)
 *     - Cells use material-icons spans: person=Chair, group=Member, sr-only=Not a Member
 *
 * Output: Data-Table block with clean text cells.
 * Also removes the legend paragraph below the table.
 */
export default function parse(element, { document }) {
  const rows = element.querySelectorAll('tr');
  if (rows.length === 0) return;

  const cells = [];

  rows.forEach((row) => {
    const rowCells = [];
    const ths = row.querySelectorAll('th');
    const tds = row.querySelectorAll('td');

    if (ths.length > 0 && tds.length === 0) {
      // Header row or divider row (e.g., "Independent Directors")
      ths.forEach((th) => {
        const div = document.createElement('div');
        // Clean up: remove sr-only spans, get visible text
        const text = cleanCellText(th);
        div.textContent = text;
        rowCells.push([div]);
      });
    } else {
      // Data row: mix of td cells
      const allCells = row.querySelectorAll('td, th');
      allCells.forEach((cell) => {
        const div = document.createElement('div');
        const text = cleanCellText(cell);
        div.textContent = text;
        rowCells.push([div]);
      });
    }

    if (rowCells.length > 0) {
      cells.push(rowCells);
    }
  });

  if (cells.length === 0) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'Data-Table', cells });

  // Remove legend paragraph that follows the table (icons + "Chairperson · Member")
  const nextSibling = element.nextElementSibling;
  if (nextSibling && nextSibling.tagName === 'P' && nextSibling.querySelector('.material-icons')) {
    nextSibling.remove();
  }

  element.replaceWith(block);
}

/**
 * Extract clean text from a table cell.
 * - material-icons "person" + "Chair" → "Chair"
 * - material-icons "group" + "Member" → "Member"
 * - sr-only "Not a Member" → "" (empty)
 * - Plain text → as-is
 */
function cleanCellText(cell) {
  const srOnly = cell.querySelector('.sr-only');
  const materialIcon = cell.querySelector('.material-icons');

  if (materialIcon) {
    // Has an icon — extract the text next to it
    const textSpan = cell.querySelector('.text');
    if (textSpan) return textSpan.textContent.trim();
    // Fallback: get all text except the icon
    const clone = cell.cloneNode(true);
    clone.querySelectorAll('.material-icons').forEach((el) => el.remove());
    return clone.textContent.trim();
  }

  if (srOnly && !materialIcon) {
    // Only sr-only text (e.g., "Not a Member") — return empty
    const visibleText = cell.textContent.replace(srOnly.textContent, '').trim();
    return visibleText || '';
  }

  // Plain text cell (e.g., member name, header text)
  // Remove sr-only spans if present alongside visible text
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('.sr-only').forEach((el) => el.remove());
  return clone.textContent.trim();
}
