/* eslint-disable */
/* global WebImporter */

/**
 * Parser for columns-quote block
 *
 * Source: https://about.ups.com/us/en/our-impact.html
 * Base Block: columns
 *
 * Block Structure (from columns markdown example):
 * - Row 1: Block name header ("Columns-Quote")
 * - Row 2: Two columns - quote text + attribution | portrait image
 *
 * Source HTML Pattern (from captured DOM):
 * <div class="upspr-testimonial row">
 *   <div class="upspr-testimonial__wrap col-lg-7 col-md-8">
 *     <h3 class="upspr-testimonial__wrap--title">"Quote text..."</h3>
 *     <div class="upspr-eyebrow-head upspr-testimonial__wrap--name">
 *       <span class="upspr-eyebrow-text">CAROL B. TOMÉ</span>
 *     </div>
 *   </div>
 *   <div class="upspr-testimonial__image col-lg-5 col-md-4">
 *     <div class="upspr-image-wrap">
 *       <picture><img src="..."></picture>
 *     </div>
 *   </div>
 * </div>
 *
 * Generated: 2026-03-05
 */
export default function parse(element, { document }) {
  // Build quote text column
  const quoteCell = [];

  // Extract quote text
  // VALIDATED: Source has h3.upspr-testimonial__wrap--title with quote text
  const quoteHeading = element.querySelector('.upspr-testimonial__wrap--title, .upspr-testimonial__wrap h3');
  if (quoteHeading) {
    const h3 = document.createElement('h3');
    h3.textContent = quoteHeading.textContent.trim();
    quoteCell.push(h3);
  }

  // Extract attribution name (plain p, CSS handles styling)
  // VALIDATED: Source has .upspr-testimonial__wrap--name with .upspr-eyebrow-text
  const attribution = element.querySelector('.upspr-testimonial__wrap--name .upspr-eyebrow-text') ||
                      element.querySelector('.upspr-testimonial__wrap--name');
  if (attribution) {
    const p = document.createElement('p');
    p.textContent = attribution.textContent.trim();
    quoteCell.push(p);
  }

  // Build image column
  const imageCell = [];

  // Extract portrait image
  // Source may have <picture> or plain <img>
  let picture = element.querySelector('.upspr-testimonial__image picture') ||
                element.querySelector('picture');
  if (!picture) {
    const img = element.querySelector('.upspr-testimonial__image img') ||
                element.querySelector('img');
    if (img) {
      picture = document.createElement('picture');
      picture.appendChild(img.cloneNode(true));
    }
  }
  if (picture) {
    imageCell.push(picture);
  }

  // Build cells array - 2 columns: quote text | image
  const cells = [
    [quoteCell, imageCell]
  ];

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns-Quote', cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
