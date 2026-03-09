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
 * Parser for columns-feature block
 *
 * Source: https://about.ups.com/us/en/our-impact.html
 * Base Block: columns
 *
 * Block Structure (from columns markdown example):
 * - Row 1: Block name header ("Columns-Feature")
 * - Row 2+: Two columns per row (text content | image, or image | text content)
 *
 * Source HTML Pattern (from captured DOM):
 * <div class="upspr-xd-card upspr-xd-card__right">
 *   <div class="row no-gutters">
 *     <div class="col-lg-6 col-12">  <!-- image column -->
 *       <picture><img src="..."></picture>
 *     </div>
 *     <div class="col-lg-6 col-12 upspr-xd-card_container">  <!-- text column -->
 *       <div class="upspr-xd-card_content">
 *         <a class="upspr-eyebrow-link"><div class="upspr-xd-card_eyebrow">EYEBROW</div></a>
 *         <h2>Heading</h2>
 *         <p>Description</p>
 *         <a class="btn btn-secondary" href="...">CTA Text</a>
 *       </div>
 *     </div>
 *   </div>
 * </div>
 *
 * Generated: 2026-03-05
 */
/**
 * Extract the best image URL from an element containing <picture>/<source>/<img>.
 * Resolves relative URLs against baseUrl (from import context) or document.baseURI.
 * Prefers desktop <source> srcset, falls back to <img> srcset/src/data-src.
 */
function resolveImageSrc(el, document, baseUrl) {
  const base = baseUrl || document.baseURI || document.location?.href || '';

  function resolve(raw) {
    if (!raw) return null;
    const url = raw.split(',')[0].trim().split(/\s+/)[0];
    if (!url) return null;
    if (/^https?:\/\//.test(url)) return url;
    try { return new URL(url, base).href; } catch { /* fall through */ }
    try {
      const origin = new URL(base).origin;
      if (url.startsWith('/')) return origin + url;
    } catch { /* fall through */ }
    return url;
  }

  const picture = el.querySelector('picture');
  if (picture) {
    const sources = picture.querySelectorAll('source');
    for (const source of sources) {
      const srcset = source.getAttribute('srcset') || source.getAttribute('data-srcset');
      const resolved = resolve(srcset);
      if (resolved) return resolved;
    }
  }
  const img = el.querySelector('img');
  if (img) {
    const srcset = img.getAttribute('srcset') || img.getAttribute('data-srcset');
    const resolved = resolve(srcset);
    if (resolved) return resolved;
    const src = img.getAttribute('src') || img.getAttribute('data-src');
    if (src) return resolve(src) || src;
    if (img.src) return img.src;
  }
  return null;
}

export default function parse(element, { document, url }) {
  // Resolve image URL from <picture> sources (img may lack src)
  const baseUrl = url || document.baseURI || '';
  const imgUrl = resolveImageSrc(element, document, baseUrl);

  // Extract text content from the card content area
  const contentDiv = element.querySelector('.upspr-xd-card_content');

  // Build text column content
  const textCell = [];

  if (contentDiv) {
    // Extract eyebrow text (plain p, CSS handles bold/uppercase styling)
    // VALIDATED: Source has .upspr-xd-card_eyebrow inside .upspr-eyebrow-link
    const eyebrow = contentDiv.querySelector('.upspr-xd-card_eyebrow');
    if (eyebrow) {
      const p = document.createElement('p');
      p.textContent = toTitleCase(eyebrow.textContent.trim());
      textCell.push(p);
    }

    // Extract heading (create clean element to avoid carrying source attributes)
    // VALIDATED: Source has h2 element directly in .upspr-xd-card_content
    const heading = contentDiv.querySelector('h2, h3');
    if (heading) {
      const h = document.createElement(heading.tagName.toLowerCase());
      h.textContent = heading.textContent.trim();
      textCell.push(h);
    }

    // Extract description paragraph (create clean elements)
    // VALIDATED: Source has <p> elements (not inside links) in .upspr-xd-card_content
    const paragraphs = contentDiv.querySelectorAll(':scope > p');
    paragraphs.forEach((srcP) => {
      const p = document.createElement('p');
      p.textContent = srcP.textContent.trim();
      textCell.push(p);
    });

    // Extract CTA link
    // VALIDATED: Source has <a class="btn btn-secondary"> for CTA buttons
    const cta = contentDiv.querySelector('a.btn, a.btn-secondary');
    if (cta) {
      // Clean up: remove decorative icon inside CTA
      const icon = cta.querySelector('i.upspr');
      if (icon) icon.remove();

      const p = document.createElement('p');
      const link = document.createElement('a');
      link.href = cta.href;
      link.textContent = cta.textContent.trim();
      p.append(link);
      textCell.push(p);
    }
  }

  // Build image cell with clean <img> element
  const imageCell = [];
  if (imgUrl) {
    const img = document.createElement('img');
    img.src = imgUrl;
    const origImg = element.querySelector('img');
    if (origImg?.alt) img.alt = origImg.alt;
    imageCell.push(img);
  }

  // Determine column order: check if image is first child or second
  const firstCol = element.querySelector('.row > div:first-child');
  const imageIsFirst = firstCol && (firstCol.querySelector('picture') || firstCol.querySelector('img'));

  // Build cells array - 2 columns matching columns block structure
  const cells = [];
  if (imageIsFirst) {
    cells.push([imageCell, textCell]);
  } else {
    cells.push([textCell, imageCell]);
  }

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns-Feature', cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
