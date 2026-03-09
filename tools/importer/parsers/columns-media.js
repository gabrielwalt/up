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
 * Clean up UPS-specific alt text patterns.
 * - Converts "u-p-s-ers" (ARIA-friendly hyphenation) to "UPSers"
 * - Fixes known typos from the source site
 */
function cleanAltText(alt) {
  if (!alt) return alt;
  return alt
    .replace(/\bu-p-s-ers\b/gi, 'UPSers')
    .replace(/\bsmiling as the break\b/g, 'smiling as they break')
    .replace(/\bhigh-five in and unloading\b/g, 'high-five in an unloading');
}

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

/**
 * Clone inline markup (bold, italic, links, line breaks) from a source element.
 * Walks child nodes and recreates structure with clean elements.
 */
function cloneInlineContent(sourceEl, document) {
  const fragment = document.createDocumentFragment();
  sourceEl.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      // Text node
      fragment.appendChild(document.createTextNode(node.textContent));
    } else if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      if (tag === 'b' || tag === 'strong') {
        const strong = document.createElement('strong');
        strong.textContent = node.textContent;
        fragment.appendChild(strong);
      } else if (tag === 'em' || tag === 'i') {
        const em = document.createElement('em');
        em.textContent = node.textContent;
        fragment.appendChild(em);
      } else if (tag === 'a') {
        const a = document.createElement('a');
        a.href = node.href;
        a.textContent = node.textContent;
        fragment.appendChild(a);
      } else if (tag === 'br') {
        fragment.appendChild(document.createElement('br'));
      } else {
        // Fallback: just take text content
        fragment.appendChild(document.createTextNode(node.textContent));
      }
    }
  });
  return fragment;
}

/**
 * Parser for columns-media block
 *
 * Source: https://about.ups.com/us/en/our-company/our-culture.html
 *
 * Handles two source DOM patterns:
 *
 * Pattern A — Hero grid (intro section):
 * <div class="herogrid">
 *   <div class="herotext">
 *     <h1>Our Culture</h1>
 *     <p>...</p>
 *   </div>
 *   <div class="heroimage">
 *     <img src="..." alt="...">
 *   </div>
 * </div>
 * → Produces: text | image (single row, text first for image-right layout)
 *
 * Pattern B — List container (value sections):
 * <div id="list-container">
 *   <div class="list-item">
 *     <div><img class="list-item-image" src="..."></div>
 *     <div class="list-item-text-container">
 *       <div class="list-item-title">Heading Text</div>
 *       <div class="list-item-description"><p>...</p><ul>...</ul></div>
 *     </div>
 *   </div>
 *   <!-- repeated for each item -->
 * </div>
 * → Produces: image | text (multi-row, image first for image-left layout)
 *
 * Generated: 2026-03-09
 */
export default function parse(element, { document, url }) {
  const baseUrl = url || document.baseURI || '';

  // === Pattern A: Hero grid (.herogrid with .herotext + .heroimage) ===
  const heroText = element.querySelector('.herotext');
  const heroImage = element.querySelector('.heroimage');

  if (heroText && heroImage) {
    const cells = [];

    // Text cell — h1 + paragraphs with inline markup
    const textCell = [];
    const h1 = heroText.querySelector('h1');
    if (h1) {
      const heading = document.createElement('h1');
      heading.textContent = toTitleCase(h1.textContent.trim());
      textCell.push(heading);
    }
    const paragraphs = heroText.querySelectorAll(':scope > p');
    paragraphs.forEach((srcP) => {
      const p = document.createElement('p');
      p.appendChild(cloneInlineContent(srcP, document));
      textCell.push(p);
    });

    // Image cell
    const imageCell = [];
    const imgUrl = resolveImageSrc(heroImage, document, baseUrl);
    if (imgUrl) {
      const img = document.createElement('img');
      img.src = imgUrl;
      const origImg = heroImage.querySelector('img');
      const alt = origImg?.alt || '';
      // Use descriptive alt if source is empty
      img.alt = alt || 'UPS Culture diagram showing purpose, strategy, culture and stakeholders';
      imageCell.push(img);
    }

    // Text first, image second → image-right layout on desktop
    cells.push([textCell, imageCell]);

    const block = WebImporter.Blocks.createBlock(document, { name: 'Columns-Media', cells });
    element.replaceWith(block);
    return;
  }

  // === Pattern B: List container (#list-container with .list-item children) ===
  const items = element.querySelectorAll('.list-item');

  if (!items.length) return;

  const cells = [];

  items.forEach((item) => {
    // === Image cell ===
    const imageCell = [];
    const imgUrl = resolveImageSrc(item, document, baseUrl);
    if (imgUrl) {
      const img = document.createElement('img');
      img.src = imgUrl;
      const origImg = item.querySelector('img');
      if (origImg?.alt) img.alt = cleanAltText(origImg.alt);
      imageCell.push(img);
    }

    // === Text cell ===
    const textCell = [];

    // Heading — source uses <div class="list-item-title">, output as h2
    const titleEl = item.querySelector('.list-item-title');
    if (titleEl) {
      const h2 = document.createElement('h2');
      h2.textContent = toTitleCase(titleEl.textContent.trim());
      textCell.push(h2);
    }

    // Description — may contain <p> and <ul> with inline <b>/<strong> markup
    const descEl = item.querySelector('.list-item-description');
    if (descEl) {
      // Process paragraphs
      const descParagraphs = descEl.querySelectorAll(':scope > p');
      descParagraphs.forEach((srcP) => {
        const p = document.createElement('p');
        p.appendChild(cloneInlineContent(srcP, document));
        textCell.push(p);
      });

      // Process lists
      const lists = descEl.querySelectorAll(':scope > ul');
      lists.forEach((srcUl) => {
        const ul = document.createElement('ul');
        srcUl.querySelectorAll(':scope > li').forEach((srcLi) => {
          const li = document.createElement('li');
          li.appendChild(cloneInlineContent(srcLi, document));
          ul.appendChild(li);
        });
        textCell.push(ul);
      });
    }

    // Image first, text second → image-left layout on desktop
    cells.push([imageCell, textCell]);
  });

  // Create block using WebImporter utility
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns-Media', cells });

  // Replace original element with structured block table
  element.replaceWith(block);
}
