/**
 * Cards Reports Block
 * Horizontal document cards in a 2-column grid with thumbnail image,
 * title, and action link (Download/Learn more/View).
 *
 * Content model (table rows):
 *   Col1: <picture> thumbnail image
 *   Col2: <h3>Document Title</h3><p><a href="...">Download</a></p>
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const isText = block.classList.contains('cards-reports-text');
  const rows = [...block.children];
  const grid = document.createElement('ul');
  grid.className = 'cards-reports-grid';

  rows.forEach((row) => {
    const cols = [...row.children];
    if (cols.length < 2) return;

    const li = document.createElement('li');
    li.className = 'cards-reports-card';

    const imageCol = cols[0];
    const textCol = cols[1];

    const inner = document.createElement('div');
    inner.className = 'cards-reports-inner';

    // Image container
    const imageWrap = document.createElement('div');
    imageWrap.className = 'cards-reports-image';
    const pic = imageCol.querySelector('picture') || imageCol.querySelector('img');
    if (pic) {
      const img = pic.querySelector ? pic.querySelector('img') || pic : pic;
      if (img.loading === 'lazy') img.loading = 'eager';
      imageWrap.append(pic);
    }

    // Details container
    const details = document.createElement('div');
    details.className = 'cards-reports-details';

    // Title (h3)
    const h3 = textCol.querySelector('h3');
    if (h3) details.append(h3);

    // Action link
    const linkP = textCol.querySelector('p');
    if (linkP) {
      const link = linkP.querySelector('a');
      if (link) {
        if (isText) {
          // Text variant: keep .button class for standard EDS button styling
          link.classList.add('cards-reports-action');
        } else {
          // Default variant: reset button styling for inline link
          link.className = 'cards-reports-action';
          link.classList.remove('button', 'primary', 'secondary', 'accent');
        }
        details.append(link);
      }
    }

    inner.append(imageWrap, details);
    li.append(inner);
    grid.append(li);
  });

  block.textContent = '';
  block.append(grid);
}
