/* eslint-disable */
/* global WebImporter */

/**
 * Convert ALL CAPS text to Title Case. Mixed-case strings are returned unchanged.
 * Detection: string is 3+ chars and equals its own toUpperCase().
 * Preserves known acronyms (UPS, CEO, ESG, etc.).
 */
const ACRONYMS = new Set(['UPS', 'CEO', 'CFO', 'COO', 'CTO', 'CIO', 'ESG', 'DEI', 'CSR', 'US', 'UK', 'EU', 'UN', 'AI', 'IT', 'HR', 'PR', 'B2B', 'B2C', 'D2C']);
function toTitleCase(text) {
  if (!text || text.length < 3) return text;
  if (text !== text.toUpperCase()) return text;
  return text.split(/(\s+)/).map((seg) => {
    if (/^\s+$/.test(seg)) return seg;
    return seg.split(/([-])/).map((part) => {
      if (part === '-') return part;
      if (ACRONYMS.has(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join('');
  }).join('');
}

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
/**
 * Extract the best image URL from an element containing <picture>/<source>/<img>.
 * Resolves relative URLs. Prefers desktop <source> srcset.
 */
function resolveImageSrc(el, doc) {
  const base = doc.baseURI || doc.location?.href || '';
  const picture = el.querySelector('picture');
  if (picture) {
    const sources = picture.querySelectorAll('source');
    for (const source of sources) {
      const srcset = source.getAttribute('srcset');
      if (srcset) {
        const raw = srcset.split(',')[0].trim().split(/\s+/)[0];
        try { return new URL(raw, base).href; } catch { return raw; }
      }
    }
  }
  const img = el.querySelector('img');
  if (img) {
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      const raw = srcset.split(',')[0].trim().split(/\s+/)[0];
      try { return new URL(raw, base).href; } catch { return raw; }
    }
    if (img.src) return img.src;
  }
  return null;
}

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
    p.textContent = toTitleCase(attribution.textContent.trim());
    quoteCell.push(p);
  }

  // Build image column — resolve from <picture> sources since <img> may lack src
  const imageCell = [];
  const imgContainer = element.querySelector('.upspr-testimonial__image') || element;
  const imgUrl = resolveImageSrc(imgContainer, document);
  if (imgUrl) {
    const img = document.createElement('img');
    img.src = imgUrl;
    const origImg = imgContainer.querySelector('img');
    if (origImg?.alt) img.alt = origImg.alt;
    imageCell.push(img);
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
