/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-feature block
 *
 * Source: https://about.ups.com/us/en/our-impact.html
 * Base Block: columns
 *
 * Block Structure (from columns markdown example):
 * - Row 1: Block name header ("Columns-Feature")
 * - Row 2+: Two columns per row (text content | image, or image | text content)
 *
 * Source HTML Pattern (from captured DOM):
 * <div class="upspr-xd-card upspr-xd-card__right">
 *   <div class="row no-gutters">
 *     <div class="col-lg-6 col-12">  <!-- image column -->
 *       <picture><img src="..."></picture>
 *     </div>
 *     <div class="col-lg-6 col-12 upspr-xd-card_container">  <!-- text column -->
 *       <div class="upspr-xd-card_content">
 *         <a class="upspr-eyebrow-link"><div class="upspr-xd-card_eyebrow">EYEBROW</div></a>
 *         <h2>Heading</h2>
 *         <p>Description</p>
 *         <a class="btn btn-secondary" href="...">CTA Text</a>
 *       </div>
 *     </div>
 *   </div>
 * </div>
 *
 * Generated: 2026-03-05
 */
export default function parse(element, { document }) {
  // Extract image from first or second column
  // Source DOM may have <picture> or plain <img> inside columns
  let picture = element.querySelector('picture');
  if (!picture) {
    const img = element.querySelector('img');
    if (img) {
      picture = document.createElement('picture');
      picture.appendChild(img.cloneNode(true));
    }
  }

  // Extract text content from the card content area
  // VALIDATED: Source DOM has .upspr-xd-card_content with eyebrow, heading, description, CTA
  const contentDiv = element.querySelector('.upspr-xd-card_content');

  // Build text column content
  const textCell = [];

  if (contentDiv) {
    // Extract eyebrow text (plain p, CSS handles bold/uppercase styling)
    // VALIDATED: Source has .upspr-xd-card_eyebrow inside .upspr-eyebrow-link
    const eyebrow = contentDiv.querySelector('.upspr-xd-card_eyebrow');
    if (eyebrow) {
      const p = document.createElement('p');
      p.textContent = eyebrow.textContent.trim();
      textCell.push(p);
    }

    // Extract heading (create clean element to avoid carrying source attributes)
    // VALIDATED: Source has h2 element directly in .upspr-xd-card_content
    const heading = contentDiv.querySelector('h2, h3');
    if (heading) {
      const h = document.createElement(heading.tagName.toLowerCase());
      h.textContent = heading.textContent.trim();
      textCell.push(h);
    }

    // Extract description paragraph (create clean elements)
    // VALIDATED: Source has <p> elements (not inside links) in .upspr-xd-card_content
    const paragraphs = contentDiv.querySelectorAll(':scope > p');
    paragraphs.forEach((srcP) => {
      const p = document.createElement('p');
      p.textContent = srcP.textContent.trim();
      textCell.push(p);
    });

    // Extract CTA link
    // VALIDATED: Source has <a class="btn btn-secondary"> for CTA buttons
    const cta = contentDiv.querySelector('a.btn, a.btn-secondary');
    if (cta) {
      // Clean up: remove decorative icon inside CTA
      const icon = cta.querySelector('i.upspr');
      if (icon) icon.remove();

      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = cta.href;
      link.textContent = cta.textContent.trim();
      p.append(link);
      textCell.push(p);
    }
  }

  // Build image cell
  const imageCell = [];
  if (picture) {
    imageCell.push(picture);
  }

  // Determine column order: check if image is first child or second
  const firstCol = element.querySelector('.row > div:first-child');
  const imageIsFirst = firstCol && (firstCol.querySelector('picture') || firstCol.querySelector('img'));

  // Build cells array - 2 columns matching columns block structure
  const cells = [];
  if (imageIsFirst) {
    cells.push([imageCell, textCell]);
  } else {
    cells.push([textCell, imageCell]);
  }

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns-Feature', cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
