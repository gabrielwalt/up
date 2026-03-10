/* eslint-disable */
/* global WebImporter */

/**
 * Parser for social-share block
 *
 * Source: https://about.ups.com story article pages
 *
 * Block Structure:
 * - Single row with social media share links
 *
 * Source HTML Pattern (from captured DOM):
 * <div class="upspr-socialmedia">
 *   <div class="upspr-social-share">
 *     <ul>
 *       <li><a id="upspr-share-facebook" href="https://www.facebook.com/sharer/sharer.php?u=...">...</a></li>
 *       <li><a id="upspr-share-twitter" href="http://www.twitter.com/share?text=...">...</a></li>
 *       <li><a id="upspr-share-linkedin" href="https://www.linkedin.com/shareArticle?...">...</a></li>
 *       <li><a id="upspr-share-mail" href="mailto:?...">...</a></li>
 *     </ul>
 *   </div>
 * </div>
 *
 * Generated: 2026-03-10
 */
export default function parse(element, { document }) {
  const cells = [];
  const linkCell = [];

  const shareLinks = element.querySelectorAll('.upspr-social-share a');
  shareLinks.forEach((link) => {
    const href = link.getAttribute('href') || link.href;
    if (!href) return;

    // Skip print button (no href or javascript: href)
    if (href.startsWith('javascript:')) return;

    // Only keep Facebook, Twitter, LinkedIn, Email
    const isSocial = href.includes('facebook.com')
      || href.includes('twitter.com')
      || href.includes('x.com')
      || href.includes('linkedin.com')
      || href.startsWith('mailto:');

    if (isSocial) {
      const a = document.createElement('a');
      a.href = href;

      if (href.includes('facebook.com')) a.textContent = 'Facebook';
      else if (href.includes('twitter.com') || href.includes('x.com')) a.textContent = 'Twitter';
      else if (href.includes('linkedin.com')) a.textContent = 'LinkedIn';
      else if (href.startsWith('mailto:')) a.textContent = 'Email';

      linkCell.push(a);
    }
  });

  if (linkCell.length > 0) {
    cells.push([linkCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: 'Social-Share', cells });
    element.replaceWith(block);
  }
}
