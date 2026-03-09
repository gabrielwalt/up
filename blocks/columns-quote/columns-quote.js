export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-quote-${cols.length}-cols`);

  // Strip literal quote marks from h3 — CSS ::before/::after adds them
  const h3 = block.querySelector('h3');
  if (h3) {
    h3.textContent = h3.textContent.replace(/^[\u201C\u201D\u201E\u201F"«»]+|[\u201C\u201D\u201E\u201F"«»]+$/g, '').trim();
  }

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture') || col.querySelector('img');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture/image is only content in column
          picWrapper.classList.add('columns-quote-img-col');
        }
      }
    });
  });
}
