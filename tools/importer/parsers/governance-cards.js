/* eslint-disable */
/* global WebImporter */
import { resolveImageSrc } from '../utils/image-utils.js';

/**
 * Parser for governance cards (cards-reports block)
 *
 * Source: https://investors.ups.com/corporategovernance
 *         (redirected from https://about.ups.com/us/en/our-company/governance.html)
 *
 * Source HTML Pattern:
 * <div class="module module-teasers two-columns">
 *   <div class="container">
 *     <div class="row">
 *       <div class="col-sm-6">
 *         <div class="content-box vertical-teaser">
 *           <a href="...">
 *             <div class="teaser-image"><img src="..." alt="..."></div>
 *             <div class="teaser-copy">
 *               <h3>Title</h3>
 *               <span class="teaser-link">Learn More <i class="icon-chevron-right"></i></span>
 *             </div>
 *           </a>
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 * </div>
 *
 * Output: Cards-Reports block with thumbnail + H3 + action link per row
 */
export default function parse(element, { document }) {
  const cells = [];

  const cards = element.querySelectorAll('.vertical-teaser, .content-box');

  cards.forEach((card) => {
    const link = card.querySelector('a[href]');
    const imgEl = card.querySelector('.teaser-image img, img');
    const h3El = card.querySelector('h3');
    const actionEl = card.querySelector('.teaser-link');

    // Image cell
    const imageCell = [];
    if (imgEl) {
      const img = document.createElement('img');
      img.src = imgEl.getAttribute('src') || imgEl.src || '';
      img.alt = imgEl.alt || (h3El ? h3El.textContent.trim() : '');
      imageCell.push(img);
    }

    // Text cell: H3 + action link
    const textCell = [];
    if (h3El) {
      const newH3 = document.createElement('h3');
      newH3.textContent = h3El.textContent.trim();
      textCell.push(newH3);
    }

    if (link) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = link.getAttribute('href') || link.href;
      // Determine action text — "Download" for PDF links, extract from DOM, or default
      const href = a.href || '';
      let actionText = 'Learn More';
      if (href.includes('.pdf')) {
        actionText = 'Download';
      } else if (actionEl) {
        actionText = actionEl.textContent.trim().replace(/\s*[>\u203A\u2192]?\s*$/, '') || 'Learn More';
      }
      a.textContent = actionText;
      p.append(a);
      textCell.push(p);
    }

    if (textCell.length > 0) {
      cells.push([imageCell, textCell]);
    }
  });

  if (!cells.length) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards-Reports', cells });
  element.replaceWith(block);
}
