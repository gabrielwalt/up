import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // Add classes to footer sections
  const sections = footer.querySelectorAll(':scope > .section');
  const sectionClasses = ['footer-featured', 'footer-links', 'footer-legal'];
  sections.forEach((section, i) => {
    if (sectionClasses[i]) section.classList.add(sectionClasses[i]);
  });

  // Restructure footer-links section into columns
  const linksSection = footer.querySelector('.footer-links');
  if (linksSection) {
    const wrapper = linksSection.querySelector('.default-content-wrapper');
    if (wrapper) {
      const columns = document.createElement('div');
      columns.className = 'footer-columns';

      let currentCol = null;
      [...wrapper.children].forEach((child) => {
        // Start a new column at each <p> with <strong> (column header)
        if (child.tagName === 'P' && child.querySelector('strong')) {
          currentCol = document.createElement('div');
          currentCol.className = 'footer-col';
          columns.append(currentCol);
          currentCol.append(child);
        } else if (currentCol) {
          currentCol.append(child);
        }
      });

      wrapper.textContent = '';
      wrapper.append(columns);
    }
  }

  block.append(footer);
}
