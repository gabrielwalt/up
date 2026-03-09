export default function decorate(block) {
  block.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    img.loading = 'eager';
  });

  const rows = [...block.children];

  // Separate stat rows (have h4) from CTA row (has link, no h4)
  const statRows = [];
  let ctaRow = null;

  rows.forEach((row) => {
    if (row.querySelector('h4')) {
      statRows.push(row);
    } else if (row.querySelector('a')) {
      ctaRow = row;
    }
  });

  // Build grid of stat items
  const grid = document.createElement('div');
  grid.className = 'fact-sheets-grid';

  statRows.forEach((row) => {
    const item = document.createElement('div');
    item.className = 'fact-sheets-item';

    [...row.children].forEach((col) => {
      const img = col.querySelector('picture img') || col.querySelector('img');
      if (img) {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'fact-sheets-icon';
        iconDiv.append(img);
        item.append(iconDiv);
      } else {
        // Move text children (h4, p) directly into item
        [...col.children].forEach((child) => item.append(child));
      }
    });

    grid.append(item);
  });

  // Rebuild block
  block.textContent = '';
  block.append(grid);

  // Append CTA below grid
  if (ctaRow) {
    const ctaWrapper = document.createElement('div');
    ctaWrapper.className = 'fact-sheets-cta';
    const link = ctaRow.querySelector('a');
    if (link) {
      const p = link.closest('p');
      if (p) {
        ctaWrapper.append(p);
      } else {
        const wrapper = document.createElement('p');
        wrapper.append(link);
        ctaWrapper.append(wrapper);
      }
    }
    block.append(ctaWrapper);
  }
}
