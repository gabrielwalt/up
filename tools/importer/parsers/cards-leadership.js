/* eslint-disable */
/* global WebImporter */
import { resolveImageSrc } from '../utils/image-utils.js';

/**
 * Parser for cards-leadership block
 *
 * Source: https://about.ups.com/us/en/our-company/leadership.html
 *        https://about.ups.com/us/en/our-impact/community/ups-foundation-leadership.html
 *
 * Block Structure (2-column rows):
 *   Col1: <img> portrait image
 *   Col2: <h3><a href="...">Name</a></h3><p>Title</p>
 *
 * Source selector: .upspr-leadership-container
 *   Contains: .upspr-leader-head (H2 section heading like "Executive Leadership Team")
 *             .upspr-stories-list.row > .upspr-stories-list__item (person cards)
 *
 * Each card: <a class="upspr-content-tile__link" data-link-type="leadership-card">
 *              <div class="upspr-content-tile__image"><picture>...</picture></div>
 *              <div class="upspr-content-tile__details"><h3>Name</h3><p class="upspr-job-title">Title</p></div>
 *            </a>
 *
 * Preserves the H2 heading by inserting it before the block table.
 * Skips containers with no card items (empty leadership sections).
 */
export default function parse(element, { document }) {
  // Find all person card items — skip empty containers
  const cardItems = element.querySelectorAll('.upspr-stories-list__item');
  if (cardItems.length === 0) {
    // Empty container (e.g., placeholder on ups-foundation-leadership) — remove it
    element.remove();
    return;
  }

  const cells = [];

  // Extract the section H2 heading before building the block
  const sectionH2 = element.querySelector('.upspr-leader-head h2, h2');
  let h2Clone = null;
  if (sectionH2) {
    const text = sectionH2.textContent.trim();
    if (text) {
      h2Clone = document.createElement('h2');
      h2Clone.textContent = text;
    }
  }

  cardItems.forEach((item) => {
    // Extract image — use resolveImageSrc to handle srcset/src patterns
    const imageContainer = item.querySelector('.upspr-content-tile__image, .upspr-card');
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

    // Extract name (h3) and link
    const h3 = item.querySelector('.upspr-content-tile__details h3');
    const cardLink = item.querySelector('a.upspr-content-tile__link, a[data-link-type="leadership-card"], a.upspr-analytics');

    // Extract job title
    const jobTitle = item.querySelector('.upspr-job-title');

    const textCell = [];

    if (h3) {
      const newH3 = document.createElement('h3');
      if (cardLink && cardLink.getAttribute('href')) {
        const a = document.createElement('a');
        a.href = cardLink.getAttribute('href');
        a.textContent = h3.textContent.trim();
        newH3.append(a);
      } else {
        newH3.textContent = h3.textContent.trim();
      }
      textCell.push(newH3);
    }

    if (jobTitle) {
      const p = document.createElement('p');
      p.textContent = jobTitle.textContent.trim();
      textCell.push(p);
    }

    if (imageCell.length > 0 || textCell.length > 0) {
      cells.push([imageCell, textCell]);
    }
  });

  if (cells.length === 0) {
    element.remove();
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards-Leadership', cells });

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
