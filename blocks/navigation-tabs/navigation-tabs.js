export default function decorate(block) {
  const isInline = block.classList.contains('navigation-tabs-inline');
  const currentPath = window.location.pathname.replace(/\/$/, '').replace(/\.html$/, '');

  [...block.children].forEach((row) => {
    const link = row.querySelector('a');
    if (link) {
      // Remove button decoration if auto-applied by EDS
      link.classList.remove('button', 'primary', 'secondary', 'accent');
      const wrapper = link.closest('.button-wrapper');
      if (wrapper) {
        wrapper.classList.remove('button-wrapper');
      }

      // Mark active tab in inline variant
      if (isInline) {
        const linkUrl = new URL(link.href, window.location.origin);
        const linkPath = linkUrl.pathname.replace(/\/$/, '').replace(/\.html$/, '');
        // Normalize both paths: strip /content prefix for local dev comparison
        const normCurrent = currentPath.replace(/^\/content/, '');
        const normLink = linkPath.replace(/^\/content/, '');
        if (normLink === normCurrent) {
          row.classList.add('navigation-tabs-active');
        }
      } else {
        // Create circle arrow icon for card variant
        const arrow = document.createElement('span');
        arrow.className = 'navigation-tabs-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        link.append(arrow);
      }
    }
  });
}
