/* eslint-disable */
/* global WebImporter */

/**
 * Parser for governance sub-navigation (navigation-tabs block)
 *
 * Source: https://investors.ups.com/corporategovernance
 *         (redirected from https://about.ups.com/us/en/our-company/governance.html)
 *
 * Source HTML Pattern:
 * <nav class="sub-navigation-wrapper">
 *   <ul class="sub-navigation">
 *     <li class="active"><a href="/corporategovernance">Overview</a></li>
 *     <li><a href="https://about.ups.com/...">Board of Directors</a></li>
 *     <li><a href="/corporategovernance/board-committees">Board Committees</a></li>
 *     <li><a href="/corporategovernance/governance-documents">Governance Documents</a></li>
 *     <li><a href="/corporategovernance/contact-the-board">Contact the Board</a></li>
 *   </ul>
 * </nav>
 *
 * Output: Navigation-Tabs block with one row per nav link
 */
export default function parse(element, { document }) {
  const links = element.querySelectorAll('a[href]');

  if (!links.length) return;

  const cells = [];

  links.forEach((link) => {
    const text = link.textContent.trim();
    if (!text) return;

    const a = document.createElement('a');
    let href = link.getAttribute('href') || link.href;

    // Resolve relative investor-site URLs to full URLs
    if (href.startsWith('/') && !href.startsWith('/us/')) {
      href = `https://investors.ups.com${href}`;
    }

    a.href = href;
    a.textContent = text;
    cells.push([[a]]);
  });

  if (!cells.length) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'Navigation-Tabs (navigation-tabs-inline)', cells });
  element.replaceWith(block);
}
