export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-stories-card-image';
      } else {
        div.className = 'cards-stories-card-body';
      }
    });

    // Set eager loading on images since they were moved in the DOM
    li.querySelectorAll('img[loading="lazy"]').forEach((img) => {
      img.loading = 'eager';
    });

    // Extract eyebrow: first paragraph in card body that is plain text before a heading
    const body = li.querySelector('.cards-stories-card-body');
    if (body) {
      const firstP = body.querySelector('p');
      if (firstP) {
        const nextEl = firstP.nextElementSibling;
        if (nextEl && /^H[1-6]$/.test(nextEl.tagName)) {
          firstP.classList.add('cards-stories-eyebrow');
        }
      }

      // Find the link that wraps the card (last link, or link matching the card title)
      const allLinks = body.querySelectorAll('a');
      if (allLinks.length > 0) {
        const cardLink = allLinks[allLinks.length - 1];
        // Make the entire card clickable
        const wrapper = document.createElement('a');
        wrapper.href = cardLink.href;
        wrapper.className = 'cards-stories-card-link';
        wrapper.setAttribute('aria-label', cardLink.textContent.trim());
        li.prepend(wrapper);

        // Move all content inside the link wrapper
        while (li.children.length > 1) {
          wrapper.append(li.children[1]);
        }

        // Remove the original standalone link paragraph
        const linkP = cardLink.closest('p');
        if (linkP) linkP.remove();
      }
    }

    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);
}
