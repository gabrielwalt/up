/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-awards block
 *
 * Source: https://about.ups.com/us/en/our-impact.html
 * Base Block: cards (no images variant)
 *
 * Block Structure (from cards no-images markdown example):
 * - Row 1: Block name header ("Cards-Awards")
 * - Row 2+: One column per row, each containing eyebrow + heading text
 *
 * Source HTML Pattern (from captured DOM):
 * <div class="upspr-three-column-teaser">
 *   <div class="upspr-latest-stories upspr-animation">
 *     <div class="upspr-container upspr-three-column-container upspr-three-col-text">
 *       <div class="upspsr-cards-data row upspr-stories-list">
 *         <div class="upspr-stories-list__item col-lg-4">
 *           <div class="upspr-content-tile upspr-card upspr-card_rounded">
 *             <div class="upspr-card_content upspr-card_content_no_padding">
 *               ...
 *               <div class="upspr-content-tile__details">
 *                 <div class="content-block">
 *                   <div class="upspr-content-tile__topic">
 *                     <a><div class="upspr-eyebrow-head"><span class="upspr-eyebrow-text">EYEBROW</span></div></a>
 *                   </div>
 *                   <a><h3>Card Heading</h3></a>
 *                 </div>
 *               </div>
 *             </div>
 *           </div>
 *         </div>
 *         ... more items ...
 *       </div>
 *     </div>
 *   </div>
 * </div>
 *
 * Generated: 2026-03-05
 */
export default function parse(element, { document }) {
  // Find all card items
  // VALIDATED: Source DOM has .upspr-stories-list__item for each card
  const cardItems = element.querySelectorAll('.upspr-stories-list__item');

  // Build cells array - 1 column per row (no-images card variant)
  const cells = [];

  cardItems.forEach((item) => {
    const cardContent = [];

    // Extract eyebrow text (plain p, CSS handles bold/uppercase styling)
    // VALIDATED: Source has .upspr-eyebrow-text inside .upspr-content-tile__topic
    const eyebrow = item.querySelector('.upspr-eyebrow-text');
    if (eyebrow) {
      const p = document.createElement('p');
      p.textContent = eyebrow.textContent.trim();
      cardContent.push(p);
    }

    // Extract heading
    // VALIDATED: Source has h3 inside .content-block > a.upspr-content-tile__link
    const heading = item.querySelector('.content-block h3');
    if (heading) {
      const h3 = document.createElement('h3');
      h3.textContent = heading.textContent.trim();
      cardContent.push(h3);
    }

    if (cardContent.length > 0) {
      cells.push([cardContent]);
    }
  });

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards-Awards', cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
