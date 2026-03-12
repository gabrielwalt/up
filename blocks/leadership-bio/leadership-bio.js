/**
 * Leadership Bio Block
 * Two-column bio layout: text (name, title, paragraphs) on the left,
 * portrait image on the right. Reverses on mobile (image on top).
 *
 * Content model (rows):
 *   Row 1: <picture> portrait image
 *   Row 2: <h1>Name</h1><p>Job Title</p><p>Bio paragraph...</p>...
 *
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  const imageRow = rows[0];
  const textRow = rows[1];

  // Build the two-column layout
  const container = document.createElement('div');
  container.className = 'leadership-bio-container';

  // Text column (left on desktop)
  const textCol = document.createElement('div');
  textCol.className = 'leadership-bio-text';

  // Move all content from text row into the text column
  const textContent = textRow.querySelector('div') || textRow;
  while (textContent.firstChild) {
    textCol.append(textContent.firstChild);
  }

  // Image column (right on desktop)
  const imageCol = document.createElement('div');
  imageCol.className = 'leadership-bio-image';

  const pic = imageRow.querySelector('picture') || imageRow.querySelector('img');
  if (pic) {
    const img = pic.querySelector ? pic.querySelector('img') || pic : pic;
    if (img.loading === 'lazy') img.loading = 'eager';
    imageCol.append(pic);
  }

  container.append(textCol, imageCol);

  block.textContent = '';
  block.append(container);
}
