/* eslint-disable */
/* global WebImporter */

/**
 * Parser for footer funnel navigation links (navigation-tabs block)
 *
 * Source: https://about.ups.com/us/en/our-company/leadership/carol-tome.html
 *
 * Source HTML Pattern:
 * <div class="upspr-footer_top">
 *   <div class="container">
 *     <a href="/us/en/our-company/leadership.html" class="upspr-footer_funnel">
 *       <span>Executive Leadership</span>
 *       <i class="upspr upspr-icon-arrowright"></i>
 *     </a>
 *     <a href="/us/en/our-company/leadership.html#board-of-directors" class="upspr-footer_funnel">
 *       <span>Board of Directors</span>
 *       <i class="upspr upspr-icon-externalwindow"></i>
 *     </a>
 *   </div>
 * </div>
 *
 * Output: Navigation-Tabs block with one row per funnel link
 */
export default function parse(element, { document }) {
  const links = element.querySelectorAll('a[href]');

  if (!links.length) return;

  const cells = [];

  links.forEach((link) => {
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
