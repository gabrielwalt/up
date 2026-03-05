/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-stories block
 *
 * Source: https://about.ups.com/us/en/home.html
 * Base Block: cards
 *
 * Block Structure:
 * - Multiple rows, 2 columns each: image | eyebrow + title + description + link
 *
 * Source HTML Pattern (from captured DOM):
 * <div class="upspr-homepage-latest-stories upspr-three-column-teaser">
 *   <div class="upspr-latest-stories">
 *     <div class="upspr-container upspr-three-column-container upspr-story-details">
 *       <div class="upspsr-cards-data row">
 *         <div class="upspr-stories-list__item col-lg-4">
 *           <div class="upspr-content-tile upspr-card">
 *             <div class="upspr-card_content">
 *               <a class="upspr-content-tile__link"><div class="upspr-content-tile__image"><img></div></a>
 *               <div class="upspr-content-tile__details">
 *                 <div class="upspr-content-tile__topic"><a class="upspr-eyebrow-link"><span class="upspr-eyebrow-text">CATEGORY</span></a></div>
 *                 <a class="upspr-content-tile__link"><h3>Title</h3><span class="upspr-description">Description</span></a>
 *               </div>
 *             </div>
 *           </div>
 *         </div>
 *         ...more items...
 *       </div>
 *     </div>
 *   </div>
 * </div>
 *
 * Generated: 2026-03-05
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find all story card items
  // VALIDATED: Source DOM has .upspr-stories-list__item for each card
  const cardItems = element.querySelectorAll('.upspr-stories-list__item');

  cardItems.forEach((card) => {
    // Extract image
    // VALIDATED: Source has img.upspr-tile-image inside .upspr-content-tile__image
    const img = card.querySelector('.upspr-content-tile__image img');

    // Extract eyebrow category text
    // VALIDATED: Source has .upspr-eyebrow-text inside .upspr-content-tile__topic
    const eyebrowText = card.querySelector('.upspr-content-tile__topic .upspr-eyebrow-text');

    // Extract title (h3)
    // VALIDATED: Source has h3 inside .upspr-content-tile__link
    const title = card.querySelector('.upspr-content-tile__details h3');

    // Extract description
    // VALIDATED: Source has .upspr-description span inside .upspr-content-tile__link
    const description = card.querySelector('.upspr-description');

    // Extract card link URL
    // VALIDATED: Source has a.upspr-content-tile__link with href
    const cardLink = card.querySelector('a.upspr-content-tile__link');

    // Build image cell (column 1)
    const imageCell = [];
    if (img) {
      const picture = document.createElement('picture');
      const newImg = document.createElement('img');
      newImg.src = img.src;
      newImg.alt = img.alt || '';
      picture.append(newImg);
      imageCell.push(picture);
    }

    // Build text cell (column 2)
    const textCell = [];

    if (eyebrowText) {
      const p = document.createElement('p');
      p.textContent = eyebrowText.textContent.trim();
      textCell.push(p);
    }

    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title.textContent.trim();
      textCell.push(h3);
    }

    if (description) {
      const p = document.createElement('p');
      p.textContent = description.textContent.trim();
      textCell.push(p);
    }

    if (cardLink) {
      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = cardLink.href;
      link.textContent = title ? title.textContent.trim() : 'Read more';
      p.append(link);
      textCell.push(p);
    }

    cells.push([imageCell, textCell]);
  });

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards-Stories', cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
