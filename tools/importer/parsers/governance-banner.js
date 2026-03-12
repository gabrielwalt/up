/* eslint-disable */
/* global WebImporter */

/**
 * Parser for governance page banner (decorative hero image)
 *
 * Source: https://investors.ups.com/corporategovernance
 *
 * Source HTML Pattern:
 * <div class="module-page-banner eq-container">
 *   <div class="background-wrapper small page-banner overlay dark"
 *        style="background: url(https://...image.jpg);background-position: 50% 50%;...">
 *   </div>
 * </div>
 *
 * The banner image is a CSS background-image (inline style), not an <img>.
 * This parser extracts the URL and outputs a plain <img> element, which
 * becomes default content in the import output (no block wrapper needed).
 */
export default function parse(element, { document }) {
  const bgWrapper = element.querySelector('.background-wrapper') || element;

  // Extract background-image URL from inline style
  const style = bgWrapper.getAttribute('style') || '';
  const match = style.match(/background(?:-image)?:\s*url\(([^)]+)\)/);
  if (!match) return;

  let src = match[1].trim().replace(/^['"]|['"]$/g, '');
  if (!src) return;

  const img = document.createElement('img');
  img.src = src;
  img.alt = '';

  element.replaceWith(img);
}
