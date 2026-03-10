/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroFeaturedParser from './parsers/hero-featured.js';
import columnsFeatureParser from './parsers/columns-feature.js';
import factSheetsParser from './parsers/fact-sheets.js';
import cardsStoriesParser from './parsers/cards-stories.js';

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
];

const transformers = [upsCleanupTransformer];

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

    // 1. Pre-parse cleanup (remove header, footer, nav, breadcrumb, etc.)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find and parse all blocks — tables replace elements in the DOM
    const blockNames = findAndParseBlocks(main, document, url, params);

    // 3. Post-parse cleanup (title case headings, remove decorative icons)
    executeTransformers('afterTransform', main, payload);

    // 4. Walk DOM and collect all content in natural document order
    const items = [];
    collectContent(main, items);

    // 5. Group into sections
    const sections = groupIntoSections(items);

    // 6. Build output with section breaks
    main.innerHTML = '';
    sections.forEach((section, index) => {
      if (index > 0) {
        main.appendChild(document.createElement('hr'));
      }
      section.forEach((item) => {
        main.appendChild(cleanClone(item, document));
      });
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
