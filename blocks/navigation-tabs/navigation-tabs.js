export default function decorate(block) {
  [...block.children].forEach((row) => {
    const link = row.querySelector('a');
    if (link) {
      // Remove button decoration if auto-applied by EDS
      link.classList.remove('button', 'primary', 'secondary', 'accent');
      const wrapper = link.closest('.button-wrapper');
      if (wrapper) {
        wrapper.classList.remove('button-wrapper');
      }

      // Create circle arrow icon
      const arrow = document.createElement('span');
      arrow.className = 'navigation-tabs-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      link.append(arrow);
    }
  });
}
