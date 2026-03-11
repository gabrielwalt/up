/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroFeaturedParser from './parsers/hero-featured.js';
import cardsStoriesParser from './parsers/cards-stories.js';
import columnsStatsParser from './parsers/columns-stats.js';
import columnsFeatureParser from './parsers/columns-feature.js';

// TRANSFORMER IMPORTS
import upsCleanupTransformer from './transformers/ups-cleanup.js';

/**
 * Block detection registry for the home page.
 * Order matters: hero-featured must be matched before columns-stats
 * since both are inside .upspr-heroimage containers (distinguished by .vertical-hero class).
 */
const BLOCK_REGISTRY = [
  {
    name: 'hero-featured',
    selectors: ['.upspr-heroimage:not(.vertical-hero)'],
    parser: heroFeaturedParser,
  },
  {
    name: 'columns-stats',
    selectors: ['.upspr-heroimage.vertical-hero'],
    parser: columnsStatsParser,
  },
  {
    name: 'cards-stories',
    selectors: ['.upspr-homepage-latest-stories'],
    parser: cardsStoriesParser,
  },
  {
    name: 'columns-feature',
    selectors: ['.upspr-xd-card'],
    parser: columnsFeatureParser,
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
 * Walk the DOM collecting meaningful content in document order.
 * After block parsing, the DOM contains <table> elements where blocks were,
 * plus headings and paragraphs that are default content.
 */
function collectContent(element, result) {
  for (const child of Array.from(element.children)) {
    const tag = child.tagName;
    if (tag === 'TABLE') {
      result.push({ type: 'block', element: child });
    } else if (/^H[1-6]$/.test(tag)) {
      const text = child.textContent.trim();
      if (text) {
        result.push({ type: tag === 'H1' ? 'h1' : 'heading', element: child, tag });
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
    } else {
      collectContent(child, result);
    }
  }
}

function createSectionMetadata(document, style) {
  const table = document.createElement('table');
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('td');
  headerCell.colSpan = 2;
  headerCell.textContent = 'Section Metadata';
  headerRow.appendChild(headerCell);
  table.appendChild(headerRow);

  const dataRow = document.createElement('tr');
  const keyCell = document.createElement('td');
  keyCell.textContent = 'Style';
  const valueCell = document.createElement('td');
  valueCell.textContent = style;
  dataRow.appendChild(keyCell);
  dataRow.appendChild(valueCell);
  table.appendChild(dataRow);

  return table;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. Pre-parse cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Find and parse all blocks
    const blockNames = findAndParseBlocks(main, document, url, params);

    // 3. Post-parse cleanup
    executeTransformers('afterTransform', main, payload);

    // 3.5 Limit cards-stories to 3 items (home page shows only 3 featured stories)
    main.querySelectorAll('table').forEach((table) => {
      const firstRow = table.querySelector('tr');
      if (!firstRow) return;
      const firstCell = firstRow.querySelector('th, td');
      if (!firstCell) return;
      const blockName = firstCell.textContent.trim().toLowerCase();
      if (blockName === 'cards stories') {
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length > 4) {
          rows.slice(4).forEach((row) => row.remove());
        }
      }
    });

    // 4. Walk DOM and collect all content in document order
    const items = [];
    collectContent(main, items);

    // 5. Build sections explicitly for the home page layout:
    //    Section 1: H1 + accent-bar
    //    Section 2: hero-featured + cards-stories + "View All Stories" link + arc-gradient
    //    Section 3: H6 + H2 + "Get to Know Us" link + accent-bar
    //    Section 4: columns-stats + columns-feature
    main.innerHTML = '';
    let idx = 0;

    // Section 1: H1 heading
    while (idx < items.length && items[idx].type === 'h1') {
      main.appendChild(items[idx].element.cloneNode(true));
      idx++;
    }
    main.appendChild(createSectionMetadata(document, 'accent-bar'));
    main.appendChild(document.createElement('hr'));

    // Section 2: blocks and text until we hit a non-block heading (H6 "About Us")
    while (idx < items.length) {
      if (items[idx].type === 'heading') break;
      main.appendChild(items[idx].element.cloneNode(true));
      idx++;
    }
    main.appendChild(createSectionMetadata(document, 'arc-gradient'));
    main.appendChild(document.createElement('hr'));

    // Section 3: headings and text until next block (columns-stats)
    while (idx < items.length) {
      if (items[idx].type === 'block') break;
      main.appendChild(items[idx].element.cloneNode(true));
      idx++;
    }
    main.appendChild(createSectionMetadata(document, 'accent-bar'));
    main.appendChild(document.createElement('hr'));

    // Section 4: remaining blocks (columns-stats + columns-feature)
    while (idx < items.length) {
      main.appendChild(items[idx].element.cloneNode(true));
      idx++;
    }

    // 6. WebImporter built-in rules
    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 7. Generate sanitized output path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: 'home',
        blocks: blockNames,
        sections: 4,
      },
    }];
  },
};
