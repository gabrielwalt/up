export default function decorate(block) {
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture') || col.querySelector('img');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-media-img-col');
        }
        // Prevent lazy-loading issues after DOM decoration
        const img = col.querySelector('img');
        if (img && img.loading === 'lazy') {
          img.loading = 'eager';
        }
      }
    });
  });
}
