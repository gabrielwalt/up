/* eslint-disable */
/* global WebImporter */

/**
 * Parser for hero-featured block
 *
 * Source: https://about.ups.com/us/en/home.html
 * Base Block: hero
 *
 * Block Structure:
 * - Row 1: Background image
 * - Row 2: Eyebrow paragraph + h4 heading + description + CTA link
 *
 * Source HTML Pattern (from captured DOM):
 * <div class="upspr-heroimage">
 *   <picture><img src="..."></picture>
 *   <div class="upspr-heroimage_content upspr-heroimage_content--left">
 *     <div class="upspr-heroimage_msg">
 *       <a class="upspr-eyebrow-link"><div class="upspr-eyebrow-head"><span class="upspr-eyebrow-text">EYEBROW</span></div></a>
 *       <h4 class="upspr-heroimage_msg--title">Heading</h4>
 *       <p>Description</p>
 *       <div class="upspr-read-the-story"><a class="btn btn-primary" href="...">CTA</a></div>
 *     </div>
 *   </div>
 * </div>
 *
 * Generated: 2026-03-05
 */
export default function parse(element, { document }) {
  // Extract background image
  // VALIDATED: Source DOM has <picture> as direct child of .upspr-heroimage
  const picture = element.querySelector('picture');

  // Extract content from the hero message area
  // VALIDATED: Source DOM has .upspr-heroimage_msg with eyebrow, heading, description, CTA
  const msgDiv = element.querySelector('.upspr-heroimage_msg');

  // Build image row (Row 1)
  const imageCell = [];
  if (picture) {
    imageCell.push(picture);
  }

  // Build content row (Row 2)
  const contentCell = [];

  if (msgDiv) {
    // Extract eyebrow text
    // VALIDATED: Source has .upspr-eyebrow-text inside .upspr-eyebrow-link
    const eyebrowText = msgDiv.querySelector('.upspr-eyebrow-text');
    if (eyebrowText) {
      const p = document.createElement('p');
      p.textContent = eyebrowText.textContent.trim();
      contentCell.push(p);
    }

    // Extract heading
    // VALIDATED: Source has h4.upspr-heroimage_msg--title
    const heading = msgDiv.querySelector('h4');
    if (heading) {
      const h4 = document.createElement('h4');
      h4.textContent = heading.textContent.trim();
      contentCell.push(h4);
    }

    // Extract description paragraph(s)
    // VALIDATED: Source has <p> elements directly in .upspr-heroimage_msg
    const paragraphs = msgDiv.querySelectorAll(':scope > p');
    paragraphs.forEach((p) => {
      const newP = document.createElement('p');
      newP.textContent = p.textContent.trim();
      contentCell.push(newP);
    });

    // Extract CTA link
    // VALIDATED: Source has <a class="btn btn-primary"> inside .upspr-read-the-story
    const ctaLink = msgDiv.querySelector('.upspr-read-the-story a.btn');
    if (ctaLink) {
      // Clean up: remove decorative icon and reader text
      const icon = ctaLink.querySelector('i.upspr');
      if (icon) icon.remove();
      const readerTxt = ctaLink.querySelector('.upspr-readerTxt');
      if (readerTxt) readerTxt.remove();

      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = ctaLink.href;
      link.textContent = ctaLink.textContent.trim();
      p.append(link);
      contentCell.push(p);
    }
  }

  // Build cells array - single column, 2 rows (image then content)
  const cells = [
    [imageCell],
    [contentCell],
  ];

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero-Featured', cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
