import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  toClassName,
} from './aem.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    // Check if h1 or picture is already inside a hero block
    if (h1.closest('.hero') || picture.closest('.hero')) {
      return; // Don't create a duplicate hero block
    }
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds a breadcrumb block and prepends to the first section.
 * Only on pages with depth > 1 (not homepage).
 * @param {Element} main The container element
 */
function buildBreadcrumb(main) {
  // Only add breadcrumb to the page's main element, not to fragment content
  if (!document.body.contains(main)) return;

  const { pathname } = window.location;
  // Match locale prefix like /us/en/ or /content/us/en/
  const localeMatch = pathname.match(/(?:\/content)?(\/[a-z]{2}\/[a-z]{2})\//);
  if (!localeMatch) return;

  const pathAfterLocale = pathname.slice(localeMatch.index + localeMatch[0].length - 1);
  const segments = pathAfterLocale.replace(/\/$/, '').split('/').filter(Boolean);

  // Don't show breadcrumb on homepage or root
  if (segments.length < 1 || segments[0] === 'home') return;

  // Prepend breadcrumb as a new section div at top of main
  // (runs before decorateSections, so .section class doesn't exist yet)
  const wrapper = document.createElement('div');
  wrapper.append(buildBlock('breadcrumb', ''));
  main.prepend(wrapper);
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }

    buildHeroBlock(main);
    buildBreadcrumb(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    const strong = a.closest('strong');
    const em = a.closest('em');

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else if (em) {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Converts table-format blocks (DA authoring format) to div-format blocks
 * (AEM runtime format) so the same HTML works both locally and in DA.
 * In EDS, every table inside a section is a block. The first row contains
 * the block name in a <td>, remaining rows are content.
 * @param {Element} main The main element
 */
function convertBlockTables(main) {
  main.querySelectorAll(':scope > div > table').forEach((table) => {
    const rows = [...table.querySelectorAll(':scope > tbody > tr, :scope > tr')];
    if (rows.length < 1) return;

    const firstRow = rows[0];
    const nameCell = firstRow.querySelector('td, th');
    if (!nameCell) return;

    const rawName = nameCell.textContent.trim();
    // Parse variant from parentheses: "block-name (variant1, variant2)" → base + variants
    const parenMatch = rawName.match(/^([^(]+?)(?:\s*\(([^)]+)\))?$/);
    const baseName = toClassName(parenMatch ? parenMatch[1].trim() : rawName);
    if (!baseName) return;

    const block = document.createElement('div');
    block.classList.add(baseName);
    if (parenMatch && parenMatch[2]) {
      parenMatch[2].split(',').forEach((v) => {
        const variant = toClassName(v.trim());
        if (variant) block.classList.add(variant);
      });
    }

    rows.slice(1).forEach((tr) => {
      const rowDiv = document.createElement('div');
      [...tr.querySelectorAll('td')].forEach((td) => {
        const colDiv = document.createElement('div');
        while (td.firstChild) colDiv.appendChild(td.firstChild);
        rowDiv.appendChild(colDiv);
      });
      block.appendChild(rowDiv);
    });

    table.replaceWith(block);
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  convertBlockTables(main);
  main.querySelectorAll(':scope > hr').forEach((hr) => hr.remove());
  main.querySelectorAll(':scope > div > .metadata').forEach((m) => m.closest('div').remove());
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  // Scroll-triggered section animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('appear');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  main.querySelectorAll('.section').forEach((section) => {
    observer.observe(section);
  });
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
