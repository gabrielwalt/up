/**
 * Cards Leadership Block
 * Horizontal person cards in a 2-column grid with portrait image,
 * yellow accent dash, name, and title. Entire card is clickable.
 *
 * Content model (table rows):
 *   Col1: <picture> portrait image
 *   Col2: <h3><a href="...">Name</a></h3><p>Title</p>
 *         or <h3>Name</h3><p>Title</p> (non-linked)
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  const grid = document.createElement('ul');
  grid.className = 'cards-leadership-grid';

  rows.forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;

    const li = document.createElement('li');
    li.className = 'cards-leadership-card';

    const imageCol = cols[0];
    const textCol = cols[1];

    // Build card inner
    const inner = document.createElement('div');
    inner.className = 'cards-leadership-inner';

    // Image container
    const imageWrap = document.createElement('div');
    imageWrap.className = 'cards-leadership-image';
    const pic = imageCol.querySelector('picture') || imageCol.querySelector('img');
    if (pic) {
      // Set eager loading since DOM is restructured
      const img = pic.querySelector ? pic.querySelector('img') || pic : pic;
      if (img.loading === 'lazy') img.loading = 'eager';
      imageWrap.append(pic);
    }

    // Details container
    const details = document.createElement('div');
    details.className = 'cards-leadership-details';

    // Yellow accent dash
    const dash = document.createElement('span');
    dash.className = 'cards-leadership-dash';
    details.append(dash);

    // Name (h3)
    const h3 = textCol.querySelector('h3');
    if (h3) details.append(h3);

    // Title (first p after h3)
    const title = textCol.querySelector('p');
    if (title) {
      title.className = 'cards-leadership-title';
      details.append(title);
    }

    inner.append(imageWrap, details);

    // If h3 contains a link, wrap entire card in that link
    const link = h3 ? h3.querySelector('a') : null;
    if (link) {
      const cardLink = document.createElement('a');
      cardLink.href = link.href;
      cardLink.className = 'cards-leadership-link';
      cardLink.setAttribute('aria-label', link.textContent);
      // Unwrap the link text back into h3
      h3.textContent = link.textContent;
      cardLink.append(inner);
      li.append(cardLink);
    } else {
      li.append(inner);
    }

    grid.append(li);
  });

  block.textContent = '';
  block.append(grid);
}
