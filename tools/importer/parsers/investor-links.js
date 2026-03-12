/* eslint-disable */
/* global WebImporter */

/**
 * Parser for investor-links block
 * Purpose: Convert the "Email Alerts" / "Contacts" quick links from investors.ups.com
 * Source selector: .module-quick-links, or <ul> containing email-alerts link
 * Output: Investor-Links block with link items
 */

export default function parse(element, { document }) {
  const links = element.querySelectorAll('a');
  if (!links.length) return;

  const cells = [];
  links.forEach((link) => {
    const text = link.textContent.replace(/^[\u2709\u{1F464}\s]+/u, '').trim();
    if (!text) return;

    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = text;
    p.append(a);
    cells.push([p]);
  });

  if (!cells.length) return;

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'Investor-Links',
    cells,
  });
  element.replaceWith(block);
}
