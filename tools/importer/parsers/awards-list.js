/* eslint-disable */
/* global WebImporter */
import { toTitleCase } from '../utils/text-utils.js';

/**
 * Parser for awards-list block
 *
 * Source: https://about.ups.com/us/en/newsroom/awards-and-recognition.html
 *
 * Block Structure (2-column rows):
 *   Col1: Year (e.g., "2026") — used for tab grouping
 *   Col2: <p>Eyebrow</p><h3>Title</h3><p>Date · Description</p><p><a>Read More</a></p>
 *
 * Source selector: .ups-tabs (AEM Core Component tabs wrapper)
 *   .cmp-tabs__tablist > .cmp-tabs__tab (year tabs: "2026", "2025", "2024")
 *   .cmp-tabs__tabpanel (tab content panels)
 *     .upspr-recognition__item (individual award entries)
 *       .content-block contains:
 *         .upspr-content-tile__topic .upspr-eyebrow-text (category)
 *         h3 (award title)
 *         span.upspr-story-date (date)
 *         bare text node (description — NOT wrapped in any element)
 *         div > a.award-read-more (Read More link)
 */
export default function parse(element, { document }) {
  const cells = [];

  // Find tabs and panels
  const tabs = element.querySelectorAll('.cmp-tabs__tab');
  const panels = element.querySelectorAll('.cmp-tabs__tabpanel');

  if (tabs.length > 0 && panels.length > 0) {
    tabs.forEach((tab, index) => {
      const year = tab.textContent.trim();
      const panel = panels[index];
      if (!panel) return;

      // Find award entries in the panel
      const entries = panel.querySelectorAll('.upspr-recognition__item');

      entries.forEach((entry) => {
        const textCell = [];

        // Eyebrow category
        const eyebrow = entry.querySelector('.upspr-eyebrow-text');
        if (eyebrow) {
          const p = document.createElement('p');
          p.textContent = toTitleCase(eyebrow.textContent.trim());
          textCell.push(p);
        }

        // Title
        const heading = entry.querySelector('h3');
        if (heading) {
          const h3 = document.createElement('h3');
          h3.textContent = heading.textContent.trim();
          textCell.push(h3);
        }

        // Date and description
        // The content-block contains: eyebrow div, h3, span.upspr-story-date, bare text node, div with read-more
        // We need to walk child nodes of content-block to extract the date and bare text description.
        const contentBlock = entry.querySelector('.content-block') || entry;
        const dateEl = contentBlock.querySelector('.upspr-story-date');
        const dateText = dateEl ? dateEl.textContent.trim() : '';

        // Walk child nodes to find bare text node(s) after the date span
        let description = '';
        let foundDate = false;
        for (const node of contentBlock.childNodes) {
          if (node === dateEl || (node.nodeType === 1 && node.contains(dateEl))) {
            foundDate = true;
            continue;
          }
          if (foundDate && node.nodeType === 3) {
            // Text node after date
            const text = node.textContent.trim();
            if (text.length > 3) {
              description = text;
              break;
            }
          }
          // Stop at the div containing read-more link
          if (foundDate && node.nodeType === 1 && node.querySelector('.award-read-more, a.award-read-more')) {
            break;
          }
        }

        if (dateText) {
          const pDate = document.createElement('p');
          pDate.textContent = dateText;
          textCell.push(pDate);
        }

        if (description) {
          const pDesc = document.createElement('p');
          pDesc.textContent = description;
          textCell.push(pDesc);
        }

        // Read More link
        const readMore = entry.querySelector('.award-read-more a, a.award-read-more');
        if (readMore && readMore.href) {
          const p = document.createElement('p');
          const a = document.createElement('a');
          a.href = readMore.getAttribute('href') || readMore.href;
          a.textContent = 'Read More';
          p.append(a);
          textCell.push(p);
        }

        if (textCell.length > 0) {
          cells.push([[year], textCell]);
        }
      });
    });
  }

  if (cells.length > 0) {
    const block = WebImporter.Blocks.createBlock(document, { name: 'Awards-List', cells });
    element.replaceWith(block);
  }
}
