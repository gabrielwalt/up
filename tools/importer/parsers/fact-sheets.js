/* eslint-disable */
/* global WebImporter */

/**
 * Parser for fact-sheets block
 *
 * Source: https://about.ups.com/us/en/our-company.html
 * Block Structure:
 * - Row per stat item: icon image | h4 value + p label
 * - Final row: CTA link
 *
 * Source HTML Pattern:
 * <div class="upspr-facts-container">
 *   <ul class="upspr-facts">
 *     <li class="upspr-facts__content">
 *       <img src="...icon.svg">
 *       <h4>~460K</h4>
 *       <p>Employees</p>
 *     </li>
 *     ...
 *   </ul>
 *   <a class="btn" href="...">View All Fact Sheets</a>
 * </div>
 */
export default function parse(element, { document, url, params }) {
  const cells = [];

  // Detect sustainability sub-page color variant from URL
  const pageUrl = (params && params.originalURL) || (url && url.toString()) || '';
  let variantName = '';
  if (pageUrl.includes('delivering-for-our-communities')) {
    variantName = 'fact-sheets-communities';
  } else if (pageUrl.includes('delivering-for-our-people')) {
    variantName = 'fact-sheets-people';
  } else if (pageUrl.includes('delivering-for-our-planet')) {
    variantName = 'fact-sheets-planet';
  }

  // Extract each stat item as a row: [image | h4+p]
  const statItems = element.querySelectorAll('li');
  statItems.forEach((item) => {
    const img = item.querySelector('img');
    const h4 = item.querySelector('h4');
    const p = item.querySelector('p');

    const imageCell = [];
    if (img) {
      const newImg = document.createElement('img');
      newImg.src = img.src;
      newImg.alt = img.alt || '';
      imageCell.push(newImg);
    }

    const textCell = [];
    if (h4) {
      const newH4 = document.createElement('h4');
      newH4.textContent = h4.textContent.trim();
      textCell.push(newH4);
    }
    if (p) {
      const newP = document.createElement('p');
      newP.textContent = p.textContent.trim();
      textCell.push(newP);
    }

    cells.push([imageCell, textCell]);
  });

  // Extract CTA link as final row
  const ctaLink = element.querySelector('a.btn, a[class*="btn"], .upspr-read-the-story a');
  if (ctaLink) {
    const icon = ctaLink.querySelector('i.upspr');
    if (icon) icon.remove();

    const p = document.createElement('p');
    const strong = document.createElement('strong');
    const link = document.createElement('a');
    link.href = ctaLink.href;
    link.textContent = ctaLink.textContent.trim();
    strong.append(link);
    p.append(strong);
    cells.push([[p]]);
  }

  const blockName = variantName ? `Fact-Sheets (${variantName})` : 'Fact-Sheets';
  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}
