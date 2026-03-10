/* eslint-disable */
/* global WebImporter */

/**
 * Parser for contact-card block
 *
 * Source: https://about.ups.com/us/en/newsroom.html
 *
 * Block Structure:
 * - Row 1: H3 title
 * - Row 2: Left column (h4 + paragraphs + contact list) | Right column (h4 + paragraph)
 *
 * Source HTML Pattern (from captured DOM):
 * <div class="upspr-contactus">
 *   <div class="upspr-contactus_mediakit">
 *     <div class="upspr-container">
 *       <div class="upspr-card upspr-contact-media">
 *         <h3 class="row">Media Relations</h3>
 *         <div class="row">
 *           <div class="col-lg-7 ...">
 *             <h4>For Reporters and Media Outlets</h4>
 *             <p>...</p>
 *             <ul><li>...</li></ul>
 *           </div>
 *           <div class="col-lg-5 ...">
 *             <h4>For Customers</h4>
 *             <p>...</p>
 *           </div>
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 * </div>
 *
 * Generated: 2026-03-10
 */
export default function parse(element, { document, url }) {
  const card = element.querySelector('.upspr-card.upspr-contact-media')
    || element.querySelector('.upspr-card')
    || element;

  // Extract h3 title
  const h3Source = card.querySelector('h3');
  const titleCell = [];
  if (h3Source) {
    const h3 = document.createElement('h3');
    h3.textContent = h3Source.textContent.trim();
    titleCell.push(h3);
  }

  // Extract left column (col-lg-7)
  const leftCol = card.querySelector('.col-lg-7, .upspr-contactmedia-info');
  const leftCell = [];
  if (leftCol) {
    extractColumnContent(leftCol, leftCell, document);
  }

  // Extract right column (col-lg-5)
  const rightCol = card.querySelector('.col-lg-5, .upspr-contact-customer');
  const rightCell = [];
  if (rightCol) {
    extractColumnContent(rightCol, rightCell, document);
  }

  const cells = [
    [titleCell],
    [leftCell, rightCell],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'Contact-Card', cells });
  element.replaceWith(block);
}

/**
 * Extract clean content from a column element.
 */
function extractColumnContent(col, cell, document) {
  for (const child of col.children) {
    const tag = child.tagName;

    if (/^H[1-6]$/.test(tag)) {
      const heading = document.createElement(tag.toLowerCase());
      heading.textContent = child.textContent.trim();
      cell.push(heading);
    } else if (tag === 'P') {
      const p = document.createElement('p');
      // Preserve inline links
      p.innerHTML = cleanInnerHTML(child, document);
      cell.push(p);
    } else if (tag === 'UL' || tag === 'OL') {
      const list = document.createElement(tag.toLowerCase());
      for (const li of child.querySelectorAll('li')) {
        const newLi = document.createElement('li');
        // Remove icon font elements, keep text and links
        const clone = li.cloneNode(true);
        clone.querySelectorAll('i.upspr, i[class*="upspr-icon"]').forEach((icon) => icon.remove());
        newLi.innerHTML = cleanInnerHTML(clone, document);
        list.appendChild(newLi);
      }
      cell.push(list);
    }
  }
}

/**
 * Clean innerHTML: strip classes and inline styles from links, keep href and text.
 */
function cleanInnerHTML(el, document) {
  const temp = el.cloneNode(true);
  // Clean up links — remove classes and inline styles but keep href
  temp.querySelectorAll('a').forEach((a) => {
    const clean = document.createElement('a');
    clean.href = a.href;
    clean.textContent = a.textContent.trim();
    if (a.getAttribute('target')) clean.target = a.getAttribute('target');
    a.replaceWith(clean);
  });
  // Remove icon font elements
  temp.querySelectorAll('i.upspr, i[class*="upspr-icon"]').forEach((icon) => icon.remove());
  // Remove empty bold/strong wrappers and nbsp
  let html = temp.innerHTML;
  html = html.replace(/&nbsp;/g, ' ').replace(/<b>\s*<\/b>/g, '').replace(/<strong>\s*<\/strong>/g, '');
  return html.trim();
}
