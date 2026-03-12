/* eslint-disable */
/* global WebImporter */
import { resolveImageSrc } from '../utils/image-utils.js';

/**
 * Parser for leadership-bio block
 *
 * Source: https://about.ups.com/us/en/our-company/leadership/carol-tome.html
 *         https://about.ups.com/us/en/our-impact/community/ups-foundation-leadership/nikki-clifton.html
 *
 * Source HTML Pattern:
 * <div class="upspr-bio upspr-container">
 *   <div class="row">
 *     <div class="upspr-bio_row-bottom col-md-8 col-lg-7">
 *       <h1 class="upspr-job-name">Name</h1>
 *       <p class="upspr-job-title">Title</p>
 *       <div class="upspr-socialmedia">...</div>
 *       <p>Bio text...</p>
 *       <p><b>Subheading</b></p>
 *       <p>More bio text...</p>
 *     </div>
 *     <div class="upspr-bio_row-top col-md-4 col-lg-4">
 *       <div class="upspr-bio-image">
 *         <picture><img src="portrait.jpg" alt="Name"></picture>
 *       </div>
 *     </div>
 *   </div>
 * </div>
 *
 * Output: Leadership-Bio block
 *   Row 1: portrait image
 *   Row 2: H1 name, job title paragraph, bio paragraphs
 */
export default function parse(element, { document }) {
  // Extract portrait image
  const imageContainer = element.querySelector('.upspr-bio-image');
  const imgSrc = imageContainer ? resolveImageSrc(imageContainer, document) : null;

  // Extract name
  const nameEl = element.querySelector('.upspr-job-name, h1');
  const name = nameEl ? nameEl.textContent.trim() : '';

  // Extract job title
  const titleEl = element.querySelector('.upspr-job-title');
  const jobTitle = titleEl ? titleEl.textContent.trim() : '';

  // Extract bio paragraphs (skip job-title and social media)
  const textCol = element.querySelector('.upspr-bio_row-bottom');
  const textContent = [];

  if (textCol) {
    const children = textCol.children;
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      const tag = child.tagName;

      // Skip H1 (name), .upspr-job-title, .upspr-socialmedia
      if (tag === 'H1') continue;
      if (child.classList.contains('upspr-job-title')) continue;
      if (child.classList.contains('upspr-socialmedia')) continue;

      if (tag === 'P') {
        const p = document.createElement('p');
        // Check if this is a bold subheading (<p><b>text</b></p>)
        const boldChild = child.querySelector('b, strong');
        if (boldChild && boldChild.textContent.trim() === child.textContent.trim()) {
          // Bold subheading — preserve the <strong> for inline emphasis
          const strong = document.createElement('strong');
          strong.textContent = boldChild.textContent.trim();
          p.append(strong);
        } else {
          // Regular paragraph — preserve inline HTML (bold, links, etc.)
          p.innerHTML = child.innerHTML;
        }
        textContent.push(p);
      } else if (tag === 'UL' || tag === 'OL') {
        // Skip download links list
        const hasDownloadLink = child.querySelector('a[href*="HighRes"], a[href*="LoRes"], a[href*="highres"], a[href*="lowres"]');
        if (!hasDownloadLink) {
          const list = document.createElement(tag.toLowerCase());
          list.innerHTML = child.innerHTML;
          textContent.push(list);
        }
      }
    }
  }

  // Build image cell
  const imageCell = [];
  if (imgSrc) {
    const img = document.createElement('img');
    img.src = imgSrc;
    const origImg = imageContainer ? imageContainer.querySelector('img') : null;
    img.alt = origImg ? (origImg.alt || name) : name;
    imageCell.push(img);
  }

  // Build text cell
  const textCell = [];
  if (name) {
    const h1 = document.createElement('h1');
    h1.textContent = name;
    textCell.push(h1);
  }
  if (jobTitle) {
    const p = document.createElement('p');
    p.textContent = jobTitle;
    textCell.push(p);
  }
  textCell.push(...textContent);

  const cells = [
    [imageCell],
    [textCell],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'Leadership-Bio', cells });
  element.replaceWith(block);
}
