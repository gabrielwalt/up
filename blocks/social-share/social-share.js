export default function decorate(block) {
  const links = block.querySelectorAll('a');
  const ul = document.createElement('ul');

  links.forEach((link) => {
    const li = document.createElement('li');
    const { href } = link;
    let platform = '';

    if (href.includes('facebook.com')) platform = 'facebook';
    else if (href.includes('twitter.com') || href.includes('x.com')) platform = 'twitter';
    else if (href.includes('linkedin.com')) platform = 'linkedin';
    else if (href.startsWith('mailto:')) platform = 'email';
    else return;

    const a = document.createElement('a');
    a.href = href;
    a.className = `social-share-${platform}`;
    a.setAttribute('aria-label', `Share on ${platform}`);
    if (!href.startsWith('mailto:')) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }

    li.append(a);
    ul.append(li);
  });

  block.textContent = '';
  block.append(ul);
}
