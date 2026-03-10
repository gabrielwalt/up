export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  // Row 1: title (h3)
  const titleRow = rows[0];
  const titleDiv = titleRow.querySelector('div');
  if (titleDiv) {
    titleDiv.classList.add('contact-card-title');
  }

  // Row 2: two columns
  const columnsRow = rows[1];
  if (columnsRow) {
    columnsRow.classList.add('contact-card-columns');
    const cols = [...columnsRow.children];
    if (cols[0]) cols[0].classList.add('contact-card-col-left');
    if (cols[1]) cols[1].classList.add('contact-card-col-right');
  }

  // Add icon classes to contact list items based on link type
  block.querySelectorAll('li').forEach((li) => {
    const link = li.querySelector('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('tel:')) {
      li.classList.add('contact-icon-phone');
    } else if (href.startsWith('mailto:')) {
      li.classList.add('contact-icon-email');
    } else if (href.includes('twitter.com') || href.includes('x.com')) {
      li.classList.add('contact-icon-x');
    }
  });
}
