/* eslint-disable */
/* global WebImporter */

/**
 * Parser for navigation-tabs block
 *
 * Source: https://about.ups.com/us/en/our-impact.html
 *
 * Source HTML Pattern:
 * <div class="upspr-navigation-tabs">
 *   <div class="link-wrapper">
 *     <a href="/us/en/our-impact/sustainability.html" class="btn-navigation-link">
 *       <span>Sustainability</span>
 *       <i class="upspr upspr-icon-arrowright-circle"></i>
 *     </a>
 *   </div>
 *   <div class="link-wrapper">
 *     <a href="/us/en/our-impact/community.html" class="btn-navigation-link">
 *       <span>Community</span>
 *       <i class="upspr upspr-icon-arrowright-circle"></i>
 *     </a>
 *   </div>
 * </div>
 *
 * Output: Navigation-Tabs block with one row per tab link
 *
 * Generated: 2026-03-10
 */
export default function parse(element, { document }) {
  // Find all navigation links within the tabs container
  const links = element.querySelectorAll('a[href]');

  if (!links.length) return;

  const cells = [];

  links.forEach((link) => {
    // Extract text from <span> child if present, otherwise use full textContent
    const span = link.querySelector('span');
    const text = (span ? span.textContent : link.textContent).trim();
    if (!text) return;

    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = text;
    cells.push([[a]]);
  });

  if (!cells.length) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'Navigation-Tabs', cells });
  element.replaceWith(block);
}
