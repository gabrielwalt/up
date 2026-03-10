/* eslint-disable */
/* global WebImporter */
import { toTitleCase } from '../utils/text-utils.js';
import { resolveImageSrc } from '../utils/image-utils.js';

/**
 * Parser for article-header block
 *
 * Source: https://about.ups.com story article pages
 *
 * Block Structure:
 * - Row 1: Eyebrow link (category link with text)
 * - Row 2: H1 title
 * - Row 3: Byline (date + read time)
 * - Row 4: Subtitle
 * - Row 5: Hero image
 *
 * Source HTML Pattern (from captured DOM):
 * <div class="pr15-details">
 *   <div class="upspr-two-column">
 *     <div class="upspr-container upspr-two-column_header">
 *       <div class="upspr-two-column_eyebrow">
 *         <a class="upspr-eyebrow-link" href="...">
 *           <span class="upspr-eyebrow-text">CUSTOMER FIRST</span>
 *         </a>
 *       </div>
 *       <div class="upspr-two-column_title"><h1>Title</h1></div>
 *       <div class="upspr-two-column_byline">
 *         <span class="upspr-story-date">03-04-2026</span>
 *         <span class="upspr-read-time">2 MIN READ</span>
 *       </div>
 *       <div class="upspr-two-column_subtext">Subtitle text</div>
 *     </div>
 *     <div class="upspr-two-column_image upspr-container">
 *       <div class="upspr-heroimage">
 *         <img class="upspr-show_lg" src="..." alt="...">
 *         <img class="upspr-show_md" src="..." alt="...">
 *         <img class="upspr-show_sm" src="..." alt="...">
 *       </div>
 *     </div>
 *   </div>
 * </div>
 *
 * Generated: 2026-03-10
 */
export default function parse(element, { document, url }) {
  const baseUrl = url || document.baseURI || '';
  const cells = [];

  // Row 1: Eyebrow category link
  const eyebrowLink = element.querySelector('.upspr-eyebrow-link');
  const eyebrowText = element.querySelector('.upspr-eyebrow-text');
  const eyebrowCell = [];
  if (eyebrowLink && eyebrowText) {
    const a = document.createElement('a');
    a.href = eyebrowLink.href;
    a.textContent = toTitleCase(eyebrowText.textContent.trim());
    eyebrowCell.push(a);
  }
  cells.push([eyebrowCell]);

  // Row 2: H1 title
  const titleEl = element.querySelector('.upspr-two-column_title h1');
  const titleCell = [];
  if (titleEl) {
    const h1 = document.createElement('h1');
    h1.textContent = titleEl.textContent.trim();
    titleCell.push(h1);
  }
  cells.push([titleCell]);

  // Row 3: Byline (date + read time)
  const dateEl = element.querySelector('.upspr-story-date');
  const readTimeEl = element.querySelector('.upspr-read-time');
  const bylineCell = [];
  const parts = [];
  if (dateEl) parts.push(dateEl.textContent.trim());
  if (readTimeEl) parts.push(readTimeEl.textContent.trim());
  if (parts.length > 0) {
    const p = document.createElement('p');
    p.textContent = parts.join(' | ');
    bylineCell.push(p);
  }
  cells.push([bylineCell]);

  // Row 4: Subtitle
  const subtextEl = element.querySelector('.upspr-two-column_subtext');
  const subtitleCell = [];
  if (subtextEl) {
    const p = document.createElement('p');
    p.textContent = subtextEl.textContent.trim();
    subtitleCell.push(p);
  }
  cells.push([subtitleCell]);

  // Row 5: Hero image (prefer desktop/large image)
  const heroImageContainer = element.querySelector('.upspr-heroimage');
  const imageCell = [];
  if (heroImageContainer) {
    // Prefer the large (desktop) image
    const lgImg = heroImageContainer.querySelector('img.upspr-show_lg')
      || heroImageContainer.querySelector('img');
    if (lgImg) {
      const src = lgImg.getAttribute('src') || lgImg.getAttribute('data-src');
      const resolvedSrc = src && !/^https?:\/\//.test(src)
        ? (() => { try { return new URL(src, baseUrl).href; } catch { return src; } })()
        : src;
      const img = document.createElement('img');
      img.src = resolvedSrc || lgImg.src;
      img.alt = lgImg.alt || '';
      imageCell.push(img);
    }
  }
  cells.push([imageCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Article-Header', cells });
  element.replaceWith(block);
}
