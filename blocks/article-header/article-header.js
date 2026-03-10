export default function decorate(block) {
  const rows = [...block.children];

  /* Row 0: eyebrow link */
  const eyebrowRow = rows[0];
  if (eyebrowRow) {
    eyebrowRow.className = 'article-header-eyebrow';
  }

  /* Row 1: h1 title */
  const titleRow = rows[1];
  if (titleRow) {
    titleRow.className = 'article-header-title';
  }

  /* Row 2: byline (date + read time) */
  const bylineRow = rows[2];
  if (bylineRow) {
    bylineRow.className = 'article-header-byline';
  }

  /* Row 3: subtitle */
  const subtitleRow = rows[3];
  if (subtitleRow) {
    subtitleRow.className = 'article-header-subtitle';
  }

  /* Row 4: hero image */
  const imageRow = rows[4];
  if (imageRow) {
    imageRow.className = 'article-header-image';
    imageRow.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      img.loading = 'eager';
    });
  }
}
