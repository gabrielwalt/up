/* eslint-disable */
/* global WebImporter */
import { resolveImageSrc } from '../utils/image-utils.js';

/**
 * Parser for timeline block
 *
 * Source: https://about.ups.com/us/en/our-company/our-history.html
 *
 * Block Structure (2-column rows):
 *   Col1: Period label (e.g., "1907-1950") — used for grouping
 *   Col2: Event content:
 *     - Text event: <p>Year</p><h3>Heading</h3><p>Description</p>
 *     - Image: <img src="..." alt="...">
 *
 * Source selector: .upspr-our-history
 *   Contains: .upspr-our-history-timeline-container
 *     .upspr-timeline-section (each era, has id like "period-1907-1950")
 *       .upspr-timeline-section__period (era label)
 *       .upspr-timeline-section__item_image (timeline images)
 *       .upspr-timeline-section__item_event (year + heading + description)
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find all timeline period sections
  const periodSections = element.querySelectorAll('.upspr-timeline-section');

  periodSections.forEach((section) => {
    // Extract the period label (e.g., "1907-1950")
    const periodEl = section.querySelector('.upspr-timeline-section__period');
    const period = periodEl ? periodEl.textContent.trim() : 'Unknown';

    // Walk through all child items in document order (images and events)
    const items = section.querySelectorAll(
      '.upspr-timeline-section__item_image, .upspr-timeline-section__item_event'
    );

    items.forEach((item) => {
      if (item.classList.contains('upspr-timeline-section__item_image')) {
        // Image row — use resolveImageSrc to handle srcset/src patterns
        const imgSrc = resolveImageSrc(item, document);
        if (imgSrc) {
          const newImg = document.createElement('img');
          newImg.src = imgSrc;
          const origImg = item.querySelector('img');
          newImg.alt = origImg ? origImg.alt || '' : '';
          cells.push([[period], [newImg]]);
        }
      } else if (item.classList.contains('upspr-timeline-section__item_event')) {
        // Text event row
        const textCell = [];

        // Year eyebrow (div.upspr-eyebrow-head or elements with year/date in class)
        const yearEl = item.querySelector('.upspr-eyebrow-head, [class*="year"], [class*="date"], .upspr-timeline-year');
        if (yearEl) {
          const p = document.createElement('p');
          p.textContent = yearEl.textContent.trim();
          textCell.push(p);
        }

        // Heading
        const heading = item.querySelector('h3, h4');
        if (heading) {
          const h3 = document.createElement('h3');
          h3.textContent = heading.textContent.trim();
          textCell.push(h3);
        }

        // Description - get paragraphs that aren't the year
        const paragraphs = item.querySelectorAll('p');
        paragraphs.forEach((p) => {
          if (p === yearEl) return;
          // Skip if it's inside a year/date container
          if (p.closest('.upspr-eyebrow-head, [class*="year"], [class*="date"]')) return;
          const text = p.textContent.trim();
          if (text) {
            const newP = document.createElement('p');
            newP.textContent = text;
            textCell.push(newP);
          }
        });

        if (textCell.length > 0) {
          cells.push([[period], textCell]);
        }
      }
    });
  });

  if (cells.length > 0) {
    const block = WebImporter.Blocks.createBlock(document, { name: 'Timeline', cells });
    element.replaceWith(block);
  }
}
