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

  // Add external link icon to "Other UPS Sites" column links
  const footerCols = footer.querySelectorAll('.footer-col');
  footerCols.forEach((col) => {
    const heading = col.querySelector('p strong');
    if (heading && heading.textContent.trim() === 'Other UPS Sites') {
      col.querySelectorAll('ul a').forEach((link) => {
        const icon = document.createElement('i');
        icon.className = 'upspricon-newwindow';
        icon.setAttribute('aria-hidden', 'true');
        link.append(icon);
      });
    }
  });

  // Decorate social media links in the Connect column with upspricons
  const socialIconMap = {
    'facebook.com': '\\e608',
    'x.com': '\\e900',
    'twitter.com': '\\e900',
    'instagram.com': '\\e626',
    'linkedin.com': '\\e609',
    'youtube.com': '\\e60b',
  };

  const connectCol = footer.querySelectorAll('.footer-col');
  connectCol.forEach((col) => {
    const heading = col.querySelector('p strong');
    if (heading && heading.textContent.trim() === 'Connect') {
      col.classList.add('footer-connect');
      col.querySelectorAll('ul a').forEach((link) => {
        const href = link.getAttribute('href') || '';
        Object.entries(socialIconMap).forEach(([domain, code]) => {
          if (href.includes(domain)) {
            const icon = document.createElement('i');
            icon.className = 'upspricon-social';
            icon.setAttribute('aria-hidden', 'true');
            icon.style.setProperty('--icon-code', `"${code}"`);
            link.textContent = '';
            link.append(icon);
          }
        });
      });
    }
  });

  block.append(footer);
}
