/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-stats block
 *
 * Source: https://about.ups.com/us/en/home.html
 * Base Block: columns
 *
 * Block Structure:
 * - Row 1, 2 columns: image | stats (h4 value + p label pairs) + CTA link
 *
 * Source HTML Pattern (from captured DOM):
 * <div class="upspr-heroimage vertical-hero">
 *   <picture><img src="..."></picture>
 *   <div class="upspr-facts_vertical upspr-heroimage_content">
 *     <div class="upspr-heroimage_msg">
 *       <ul class="upspr-facts list-unstyled">
 *         <li class="upspr-facts__content">
 *           <h4 class="upspr-facts__content--fact">~460K</h4>
 *           <p class="upspr-facts__content--label">Employees</p>
 *         </li>
 *         ...more items...
 *       </ul>
 *       <div class="upspr-read-the-story">
 *         <a class="btn btn-primary" href="...">View All Fact Sheets</a>
 *       </div>
 *     </div>
 *   </div>
 * </div>
 *
 * Generated: 2026-03-05
 */
export default function parse(element, { document }) {
  // Extract image
  // Source DOM may have <picture> or plain <img>
  let picture = element.querySelector('picture');
  if (!picture) {
    const img = element.querySelector('img');
    if (img) {
      picture = document.createElement('picture');
      picture.appendChild(img.cloneNode(true));
    }
  }

  // Build image cell (column 1)
  const imageCell = [];
  if (picture) {
    imageCell.push(picture);
  }

  // Build stats cell (column 2)
  const statsCell = [];

  // Extract all stat items
  // VALIDATED: Source DOM has li.upspr-facts__content with h4 (value) and p (label)
  const statItems = element.querySelectorAll('.upspr-facts__content');
  statItems.forEach((item) => {
    const factValue = item.querySelector('.upspr-facts__content--fact');
    const factLabel = item.querySelector('.upspr-facts__content--label');

    if (factValue) {
      const h4 = document.createElement('h4');
      h4.textContent = factValue.textContent.trim();
      statsCell.push(h4);
    }

    if (factLabel) {
      const p = document.createElement('p');
      p.textContent = factLabel.textContent.trim();
      statsCell.push(p);
    }
  });

  // Extract CTA link
  // VALIDATED: Source has <a class="btn btn-primary"> inside .upspr-read-the-story
  const ctaLink = element.querySelector('.upspr-read-the-story a.btn');
  if (ctaLink) {
    // Clean up: remove decorative icon
    const icon = ctaLink.querySelector('i.upspr');
    if (icon) icon.remove();

    const p = document.createElement('p');
    const link = document.createElement('a');
    link.href = ctaLink.href;
    link.textContent = ctaLink.textContent.trim();
    p.append(link);
    statsCell.push(p);
  }

  // Build cells array - 1 row, 2 columns (image | stats)
  const cells = [
    [imageCell, statsCell],
  ];

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns-Stats', cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
