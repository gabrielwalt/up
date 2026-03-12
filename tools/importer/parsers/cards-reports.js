/* eslint-disable */
/* global WebImporter */
import { resolveImageSrc } from '../utils/image-utils.js';

/**
 * Parser for cards-reports block
 *
 * Source: https://about.ups.com/us/en/our-impact/reporting.html
 *
 * Block Structure (2-column rows):
 *   Col1: <img> thumbnail image
 *   Col2: <h3>Document Title</h3><p><a href="...">Download|Learn more|View</a></p>
 *
 * Source selector: .upspr-reporting (each report category section)
 *   Contains: H2 section heading (e.g., "Latest Reports")
 *             .upspr-stories-list.row > .upspr-stories-list__item (report cards)
 *
 * Each card: <div class="upspr-content-tile upspr-card upspr-card_rounded">
 *              <div class="upspr-content-tile__image"><picture>...</picture></div>
 *              <div class="upspr-content-tile__details">
 *                <h3>Title</h3>
 *                <ul><li><a href="...">Download</a></li></ul>
 *              </div>
 *            </div>
 *
 * The parser preserves the H2 heading by inserting it before the block table,
 * so the DOM walk in import-universal picks it up as a heading item.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Extract the section H2 heading before building the block
  const sectionH2 = element.querySelector('h2');
  let h2Clone = null;
  if (sectionH2) {
    h2Clone = document.createElement('h2');
    h2Clone.textContent = sectionH2.textContent.trim();
  }

  // Find all report card items
  const cardItems = element.querySelectorAll('.upspr-stories-list__item');

  cardItems.forEach((item) => {
    // Extract thumbnail image — use resolveImageSrc to handle srcset/src patterns
    const imageContainer = item.querySelector('.upspr-content-tile__image');
    const imageCell = [];
    if (imageContainer) {
      const imgSrc = resolveImageSrc(imageContainer, document);
      if (imgSrc) {
        const newImg = document.createElement('img');
        newImg.src = imgSrc;
        const origImg = imageContainer.querySelector('img');
        newImg.alt = origImg ? origImg.alt || '' : '';
        imageCell.push(newImg);
      }
    }

    // Extract title
    const h3 = item.querySelector('.upspr-content-tile__details h3');

    // Extract action link - could be in a list or direct
    const link = item.querySelector('.upspr-content-tile__details a[href]');

    const textCell = [];

    if (h3) {
      const newH3 = document.createElement('h3');
      newH3.textContent = h3.textContent.trim();
      textCell.push(newH3);
    }

    if (link) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = link.getAttribute('href') || link.href;
      a.textContent = link.textContent.trim() || 'Download';
      p.append(a);
      textCell.push(p);
    }

    if (textCell.length > 0) {
      cells.push([imageCell, textCell]);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards-Reports', cells });

  // Insert H2 heading before the block so it appears in the DOM walk
  if (h2Clone) {
    const fragment = document.createDocumentFragment();
    fragment.append(h2Clone);
    fragment.append(block);
    element.replaceWith(fragment);
  } else {
    element.replaceWith(block);
  }
}
