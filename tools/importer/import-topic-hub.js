/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroFeaturedParser from './parsers/hero-featured.js';
import columnsFeatureParser from './parsers/columns-feature.js';
import factSheetsParser from './parsers/fact-sheets.js';
import cardsStoriesParser from './parsers/cards-stories.js';
import contactCardParser from './parsers/contact-card.js';

// TRANSFORMER IMPORTS
import upsCleanupTransformer from './transformers/ups-cleanup.js';

/**
 * Block detection registry.
 * Selectors are intentionally broad to match blocks regardless of page layout.
 * After cleanup removes header/footer/nav, these selectors target content blocks only.
 */
const BLOCK_REGISTRY = [
  {
    name: 'hero-featured',
    selectors: ['.upspr-heroimage'],
    parser: heroFeaturedParser,
  },
  {
    name: 'columns-feature',
    selectors: ['.upspr-xd-card'],
    parser: columnsFeatureParser,
  },
  {
    name: 'fact-sheets',
    selectors: ['.upspr-facts-container', '.upspr-stats-container'],
    parser: factSheetsParser,
  },
  {
    name: 'cards-stories',
    selectors: ['.upspr-homepage-latest-stories', '.upspr-three-column-teaser'],
    parser: cardsStoriesParser,
  },
  {
    name: 'contact-card',
    selectors: ['.upspr-contactus'],
    parser: contactCardParser,
  },
];

const transformers = [upsCleanupTransformer];

/**
 * Detect section styles from source DOM BEFORE cleanup removes wrapper classes.
 * The UPS source site uses wrapper classes like "background-normal-arc" and
 * "hero-in-arc" to indicate section backgrounds that map to EDS section styles.
 */
function detectSectionStyles(main) {
  const styles = {};

  // Check the first heading (H1 or H2) for arc wrapper — sustainability uses H2 as page title
  const firstHeading = main.querySelector('h1, h2');
  if (firstHeading) {
    const arcWrapper = firstHeading.closest('.background-normal-arc, .hero-in-arc');
    if (arcWrapper) {
      styles.pageTitle = 'arc';
    }
  }

  return styles;
}

/**
 * Create a Section Metadata table for applying section styles.
 */
function createSectionMetadataTable(document, style) {
  const table = document.createElement('table');
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('td');
  headerCell.colSpan = 2;
  headerCell.textContent = 'Section Metadata';
  headerRow.appendChild(headerCell);
  table.appendChild(headerRow);

  const styleRow = document.createElement('tr');
  const keyCell = document.createElement('td');
  keyCell.textContent = 'Style';
  const valueCell = document.createElement('td');
  valueCell.textContent = style;
  styleRow.appendChild(keyCell);
  styleRow.appendChild(valueCell);
  table.appendChild(styleRow);

  return table;
}

function executeTransformers(hookName, element, payload) {
  transformers.forEach((fn) => {
    try {
      fn.call(null, hookName, element, { ...payload });
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find and parse all blocks on the page.
 * Each parser calls element.replaceWith(table), placing a <table> in the DOM
 * at the original element's position.
 */
function findAndParseBlocks(main, document, url, params) {
  const blockNames = [];

  BLOCK_REGISTRY.forEach(({ name, selectors, parser }) => {
    selectors.forEach((selector) => {
      let elements;
      try {
        elements = main.querySelectorAll(selector);
      } catch (e) {
        return;
      }
      elements.forEach((el) => {
        // Skip if element was already replaced by a previous parser
        if (!main.contains(el)) return;
        try {
          parser(el, { document, url, params });
          blockNames.push(name);
        } catch (e) {
          console.error(`Failed to parse ${name}:`, e);
        }
      });
    });
  });

  return blockNames;
}

/**
 * Recursively walk the DOM collecting meaningful content in document order.
 * After block parsing, the DOM contains:
 *   - <table> elements where blocks were (from parser replaceWith)
 *   - Headings and paragraphs that are default content
 *   - Empty wrapper divs (skipped via recursion)
 */
function collectContent(element, result) {
  for (const child of Array.from(element.children)) {
    const tag = child.tagName;

    if (tag === 'TABLE') {
      // Parsed block — collect without recursing into children
      result.push({ type: 'block', element: child });
    } else if (/^H[1-6]$/.test(tag)) {
      const text = child.textContent.trim();
      if (text) {
        result.push({ type: tag === 'H1' ? 'h1' : 'heading', element: child });
      }
    } else if (tag === 'P') {
      const text = child.textContent.trim().replace(/\u00a0/g, '');
      if (text || child.querySelector('a, img')) {
        result.push({ type: 'text', element: child });
      }
    } else if (tag === 'UL' || tag === 'OL') {
      if (child.textContent.trim()) {
        result.push({ type: 'list', element: child });
      }
    } else if (tag === 'IMG' || tag === 'PICTURE') {
      result.push({ type: 'image', element: child });
    } else {
      // Recurse into wrapper divs, grid columns, etc.
      collectContent(child, result);
    }
  }
}

/**
 * Group content items into sections.
 * - H1 always gets its own section (breadcrumb + heading)
 * - A block table closes the current section
 * - Headings/text before a block belong to the same section as that block
 * - Trailing text after the last block gets its own section
 */
function groupIntoSections(items) {
  const sections = [];
  let current = [];

  for (const item of items) {
    if (item.type === 'h1') {
      if (current.length > 0) sections.push(current);
      sections.push([item]);
      current = [];
    } else if (item.type === 'block') {
      current.push(item);
      sections.push(current);
      current = [];
    } else {
      current.push(item);
    }
  }

  if (current.length > 0) sections.push(current);
  return sections;
}

/**
 * Create a clean output element from a content item.
 * Block tables are cloned as-is. Headings are recreated without source attributes.
 * Paragraphs preserve inline content (links, bold) but drop element-level attributes.
 */
function cleanClone(item, document) {
  const el = item.element;
  const tag = el.tagName.toLowerCase();

  if (item.type === 'block') {
    return el.cloneNode(true);
  }

  if (/^h[1-6]$/.test(tag)) {
    const clean = document.createElement(tag);
    clean.textContent = el.textContent.trim();
    return clean;
  }

  if (tag === 'p') {
    const clean = document.createElement('p');
    clean.innerHTML = el.innerHTML;
    return clean;
  }

  // Lists, images — clone as-is
  return el.cloneNode(true);
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 0. Detect section styles BEFORE cleanup removes wrapper classes
    const sectionStyles = detectSectionStyles(main);

    // 1. Pre-parse cleanup (remove header, footer, nav, breadcrumb, etc.)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find and parse all blocks — tables replace elements in the DOM
    const blockNames = findAndParseBlocks(main, document, url, params);

    // 3. Post-parse cleanup (title case headings, remove decorative icons)
    executeTransformers('afterTransform', main, payload);

    // 3.5 Remove empty hero-featured blocks (source has decorative hero wrappers with no content)
    main.querySelectorAll('table').forEach((table) => {
      const firstRow = table.querySelector('tr');
      if (!firstRow) return;
      const firstCell = firstRow.querySelector('th') || firstRow.querySelector('td');
      if (!firstCell) return;
      const blockName = firstCell.textContent.trim().toLowerCase();
      if (blockName.startsWith('hero featured')) {
        const dataRows = Array.from(table.querySelectorAll('tr')).slice(1);
        const hasContent = dataRows.some((row) => {
          const cells = row.querySelectorAll('td');
          return Array.from(cells).some((cell) => {
            const img = cell.querySelector('img');
            const text = cell.textContent.trim();
            return (img && img.getAttribute('src')) || text;
          });
        });
        if (!hasContent) {
          table.remove();
        }
      }
    });

    // 3.6 Limit cards-stories blocks to 3 items (matching original page layout)
    main.querySelectorAll('table').forEach((table) => {
      const firstRow = table.querySelector('tr');
      if (!firstRow) return;
      const firstCell = firstRow.querySelector('th') || firstRow.querySelector('td');
      if (!firstCell) return;
      // createBlock converts hyphens to spaces in the table header
      const blockName = firstCell.textContent.trim().toLowerCase();
      if (blockName === 'cards stories') {
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length > 4) {
          rows.slice(4).forEach((row) => row.remove());
        }
      }
    });

    // 3.7 Format HELP focus areas text (spaces around bullets, bold first word)
    // Bold entire first word (not single letter) to survive markdown round-tripping
    main.querySelectorAll('p').forEach((p) => {
      const text = p.textContent;
      if (text.includes('Health') && text.includes('Humanitarian Relief') && text.includes('\u2022')) {
        const parts = text.split('\u2022').map((s) => s.trim()).filter(Boolean);
        const html = parts.map((part) => {
          const safe = part.replace(/&/g, '&amp;');
          const spaceIdx = safe.indexOf(' ');
          if (spaceIdx > 0) {
            return `<strong>${safe.slice(0, spaceIdx)}</strong>${safe.slice(spaceIdx)}`;
          }
          return `<strong>${safe}</strong>`;
        }).join(' \u2022 ');
        p.innerHTML = html;
      }
    });

    // 4. Walk DOM and collect all content in natural document order
    const items = [];
    collectContent(main, items);

    // 4.5 Promote first heading to page-title type so it gets its own section
    // Sustainability uses H2 as page title; this ensures it gets sectioned like H1
    if (items.length > 0 && items[0].type === 'heading') {
      items[0].type = 'h1';
    }

    // 5. Group into sections
    const sections = groupIntoSections(items);

    // 6. Build output with section breaks and section metadata
    main.innerHTML = '';
    let firstH1SectionSeen = false;
    let firstHeadingSectionSeen = false;
    sections.forEach((section, index) => {
      if (index > 0) {
        main.appendChild(document.createElement('hr'));
      }
      const isH1Section = section.some((item) => item.type === 'h1');
      const startsWithHeading = section.length > 0 && section[0].type === 'heading';

      section.forEach((item) => {
        main.appendChild(cleanClone(item, document));
      });

      // Inject section-metadata for detected styles
      if (isH1Section) {
        if (!firstH1SectionSeen) {
          // Page title section — apply arc (if detected) + accent-bar
          firstH1SectionSeen = true;
          const style = sectionStyles.pageTitle
            ? `${sectionStyles.pageTitle}, accent-bar`
            : 'accent-bar';
          main.appendChild(createSectionMetadataTable(document, style));
        } else {
          // Subsequent h1 sections — accent-bar + spacing-l
          main.appendChild(createSectionMetadataTable(document, 'accent-bar, spacing-l'));
        }
      } else if (startsWithHeading) {
        // Heading sections: first gets spacing-l, subsequent get spacing-xl
        if (!firstHeadingSectionSeen) {
          main.appendChild(createSectionMetadataTable(document, 'spacing-l'));
          firstHeadingSectionSeen = true;
        } else {
          main.appendChild(createSectionMetadataTable(document, 'spacing-xl'));
        }
      }
    });

    // 7. WebImporter built-in rules (metadata, background images, URL adjustment)
    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 8. Generate sanitized output path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: 'topic-hub',
        blocks: blockNames,
        sections: sections.length,
      },
    }];
  },
};
