/**
 * Breadcrumb block — auto-generated from URL path.
 * Builds: Home / Segment / ... / Current Page
 */

function slugToLabel(slug) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function decorate(block) {
  const { pathname } = window.location;

  // Strip optional /content prefix and locale prefix (e.g., /content/us/en/ or /us/en/)
  const localeMatch = pathname.match(/^(\/content)?(\/[a-z]{2}\/[a-z]{2})\//);
  if (!localeMatch) return;

  const contentPrefix = localeMatch[1] || ''; // '/content' or ''
  const localePrefix = localeMatch[2]; // '/us/en'
  const fullPrefix = contentPrefix + localePrefix; // '/content/us/en' or '/us/en'
  const pathWithoutLocale = pathname.slice(localeMatch[0].length - 1);

  // Split into segments, filtering empties
  const segments = pathWithoutLocale
    .replace(/\/$/, '')
    .split('/')
    .filter(Boolean);

  // Don't render breadcrumb on home page
  if (segments.length < 1 || segments[0] === 'home') {
    block.closest('.section')?.remove();
    return;
  }

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');

  // Home link
  const homeLi = document.createElement('li');
  const homeLink = document.createElement('a');
  homeLink.href = `${fullPrefix}/home`;
  homeLink.textContent = 'Home';
  homeLi.append(homeLink);
  ol.append(homeLi);

  // Intermediate segments (not including the last one which is the current page)
  let builtPath = fullPrefix;
  for (let i = 0; i < segments.length - 1; i += 1) {
    builtPath += `/${segments[i]}`;
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = builtPath;
    link.textContent = slugToLabel(segments[i]);
    li.append(link);
    ol.append(li);
  }

  // Current page (plain text, not clickable)
  const currentLi = document.createElement('li');
  currentLi.classList.add('active');
  currentLi.textContent = slugToLabel(segments[segments.length - 1]);
  ol.append(currentLi);

  nav.append(ol);
  block.textContent = '';
  block.append(nav);
}
