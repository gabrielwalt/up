export default function decorate(block) {
  const links = block.querySelectorAll('a');
  links.forEach((link) => {
    link.classList.remove('button', 'primary', 'secondary', 'accent');
    const wrapper = link.closest('.button-wrapper');
    if (wrapper) {
      wrapper.classList.remove('button-wrapper');
    }

    // Detect icon type from link text
    const text = link.textContent.trim().toLowerCase();
    const icon = document.createElement('span');
    icon.className = 'investor-links-icon';
    icon.setAttribute('aria-hidden', 'true');

    if (text.includes('email') || text.includes('alert')) {
      icon.classList.add('investor-links-icon-email');
    } else if (text.includes('contact')) {
      icon.classList.add('investor-links-icon-contact');
    }

    link.prepend(icon);
  });
}
