/* eslint-disable */
/* global WebImporter */

/**
 * Parser for investor site document/asset lists
 *
 * Source: investors.ups.com governance sub-pages
 *   - /corporategovernance/governance-documents
 *   - /corporategovernance/ups-code-of-conduct-and-ethics
 *   - /corporategovernance/political-engagement-policy/archive
 *
 * Source selector: .module-asset-list
 *   Contains: .asset children, each with:
 *     <a href="..."><h4>Title</h4></a>
 *     <a href="..." class="btn"><span>Title:</span> Download|View <icon></a>
 *
 * Output: Cards-Reports (cards-reports-text) block — text-only variant
 * with no image column. Each row has an empty first cell and title + action link.
 */
export default function parse(element, { document }) {
  const cells = [];

  const assets = element.querySelectorAll('.asset');
  assets.forEach((asset) => {
    const links = asset.querySelectorAll('a');
    const titleLink = links[0];
    const actionLink = links[1];

    // Get title from the h4 inside the first link
    const h4 = titleLink ? titleLink.querySelector('h4') : null;
    const titleText = h4 ? h4.textContent.trim() : (titleLink ? titleLink.textContent.trim() : '');
    if (!titleText) return;

    // Get href — prefer action link href (same URL usually), fall back to title link
    const href = (actionLink ? actionLink.getAttribute('href') : null)
      || (titleLink ? titleLink.getAttribute('href') : null);
    if (!href) return;

    // Determine action text: "Download" for PDFs, "View" for pages
    const isPdf = href.toLowerCase().endsWith('.pdf');
    const actionText = isPdf ? 'Download' : 'View';

    // Build text cell: h3 title + action link paragraph
    const textCell = [];

    const newH3 = document.createElement('h3');
    newH3.textContent = titleText;
    textCell.push(newH3);

    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = actionText;
    p.append(a);
    textCell.push(p);

    // Empty image cell + text cell (cards-reports expects 2 columns)
    cells.push([[], textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Cards-Reports (cards-reports-text)',
    cells,
  });
  element.replaceWith(block);
}
