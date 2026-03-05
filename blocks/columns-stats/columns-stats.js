export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-stats-${cols.length}-cols`);

  // Set eager loading on images since they may be moved in DOM
  block.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    img.loading = 'eager';
  });

  // Setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-stats-img-col');
        }
      }
    });
  });

  // Find the stats column (non-image column) and structure the stats
  const statsCol = block.querySelector(':scope > div > div:not(.columns-stats-img-col)');
  if (statsCol) {
    const statItems = statsCol.querySelectorAll('h4');
    statItems.forEach((h4) => {
      const label = h4.nextElementSibling;
      const wrapper = document.createElement('div');
      wrapper.className = 'columns-stats-item';
      h4.parentNode.insertBefore(wrapper, h4);
      wrapper.append(h4);
      if (label && label.tagName === 'P') {
        wrapper.append(label);
      }
    });

    // Wrap all stat items in a stats container
    const items = statsCol.querySelectorAll('.columns-stats-item');
    if (items.length > 0) {
      const container = document.createElement('div');
      container.className = 'columns-stats-list';
      items[0].parentNode.insertBefore(container, items[0]);
      items.forEach((item) => container.append(item));
    }

    // Remove any leftover hr elements used as separators in authoring
    statsCol.querySelectorAll('hr').forEach((hr) => hr.remove());

    statsCol.classList.add('columns-stats-content');
  }
}
