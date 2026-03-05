export default function decorate(block) {
  // Set eager loading on images since they'll be moved in DOM
  block.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    img.loading = 'eager';
  });

  const row = block.firstElementChild;
  if (!row) return;

  // Find image column and stats column
  let imgCol = null;
  let statsCol = null;
  [...row.children].forEach((col) => {
    if (col.querySelector('picture')) {
      imgCol = col;
    } else {
      statsCol = col;
    }
  });

  if (!imgCol || !statsCol) return;

  // Structure the stats into items
  const statItems = statsCol.querySelectorAll('h4');
  statItems.forEach((h4) => {
    const label = h4.nextElementSibling;
    const wrapper = document.createElement('div');
    wrapper.className = 'columns-stats-item';
    h4.parentNode.insertBefore(wrapper, h4);
    wrapper.append(h4);
    if (label && label.tagName === 'P' && !label.classList.contains('button-wrapper')) {
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

  // Remove any leftover hr elements
  statsCol.querySelectorAll('hr').forEach((hr) => hr.remove());

  // Restructure: image becomes background, stats overlay on top
  // New structure: block > div.columns-stats-inner > picture + div.columns-stats-content
  const inner = document.createElement('div');
  inner.className = 'columns-stats-inner';

  // Move picture element directly into inner
  const picture = imgCol.querySelector('picture');
  if (picture) inner.append(picture);

  // Move stats content into inner
  statsCol.className = 'columns-stats-content';
  inner.append(statsCol);

  // Replace block contents
  block.textContent = '';
  block.append(inner);
}
