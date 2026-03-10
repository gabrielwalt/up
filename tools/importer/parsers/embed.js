/* eslint-disable */
/* global WebImporter */

/**
 * Parser for embed block (YouTube videos)
 *
 * Source: https://about.ups.com story article pages
 *
 * Block Structure:
 * - Single row, single cell: YouTube URL as a link
 *
 * Source HTML Pattern (from captured DOM):
 * <p><iframe width="560" height="315"
 *   src="https://www.youtube.com/embed/VIDEO_ID?si=..."
 *   title="YouTube video player" frameborder="0"
 *   allowfullscreen="allowfullscreen"></iframe></p>
 *
 * Generated: 2026-03-10
 */
export default function parse(element, { document }) {
  const iframe = element.querySelector('iframe[src*="youtube"]');
  if (!iframe) return;

  const src = iframe.src || iframe.getAttribute('src') || '';

  // Convert embed URL to watch URL
  const embedMatch = src.match(/youtube\.com\/embed\/([\w-]+)/);
  const watchUrl = embedMatch
    ? `https://www.youtube.com/watch?v=${embedMatch[1]}`
    : src;

  const cells = [];
  const linkCell = [];
  const a = document.createElement('a');
  a.href = watchUrl;
  a.textContent = watchUrl;
  linkCell.push(a);
  cells.push([linkCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Embed', cells });
  element.replaceWith(block);
}
