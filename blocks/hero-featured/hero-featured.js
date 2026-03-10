export default function decorate(block) {
  // Set eager loading on images since they'll be moved in the DOM
  block.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    img.loading = 'eager';
  });

  if (!block.querySelector(':scope > div:first-child picture, :scope > div:first-child img')) {
    block.classList.add('no-image');
  }

  // Extract eyebrow paragraph (first p in content row)
  const contentRow = block.querySelector(':scope > div:last-child');
  if (contentRow) {
    const firstP = contentRow.querySelector('p');
    if (firstP && !firstP.querySelector('picture') && !firstP.querySelector('a.button')) {
      // Check if it's a plain text paragraph (eyebrow) before any heading
      const nextSibling = firstP.nextElementSibling;
      if (nextSibling && /^H[1-6]$/.test(nextSibling.tagName)) {
        firstP.classList.add('hero-featured-eyebrow');
      }
    }
  }
}
