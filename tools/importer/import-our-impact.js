/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import navigationTabsParser from './parsers/navigation-tabs.js';
import columnsFeatureParser from './parsers/columns-feature.js';
import cardsAwardsParser from './parsers/cards-awards.js';
import columnsQuoteParser from './parsers/columns-quote.js';

// TRANSFORMER IMPORTS
import upsCleanupTransformer from './transformers/ups-cleanup.js';

/**
 * Block detection registry for the Our Impact page.
 * After cleanup removes header/footer/nav, these selectors target content blocks only.
 */
const BLOCK_REGISTRY = [
  {
    name: 'navigation-tabs',
    selectors: ['.upspr-navigation-tabs'],
    parser: navigationTabsParser,
  },
  {
    name: 'columns-feature',
    selectors: ['.upspr-xd-card'],
    parser: columnsFeatureParser,
  },
  {
    name: 'cards-awards',
    selectors: ['.upspr-three-column-teaser:has(.upspr-three-col-text)'],
    parser: cardsAwardsParser,
  },
  {
    name: 'columns-quote',
    selectors: ['.upspr-testimonial'],
    parser: columnsQuoteParser,
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
 */
function collectContent(element, result) {
  for (const child of Array.from(element.children)) {
    const tag = child.tagName;
    if (tag === 'TABLE') {
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

    // 4. Walk DOM and collect all content in document order
    const items = [];
    collectContent(main, items);

    // 5. Build sections explicitly for the Our Impact page layout:
    //    Section 1: H1 + subtitle paragraph + navigation-tabs (no style)
    //    Section 2: columns-feature x2 + arc-gradient
    //    Section 3: H2 "Governing Ethically" + description + "Learn More" link (no style)
    //    Section 4: H2 "Awards & Recognition" + cards-awards + "View All Awards" link + highlight
    //    Section 5: columns-quote (no style)
    main.innerHTML = '';
    let idx = 0;

    // Section 1: Everything up to and including the first block (navigation-tabs)
    while (idx < items.length) {
      const isBlock = items[idx].type === 'block';
      main.appendChild(items[idx].element.cloneNode(true));
      idx++;
      if (isBlock) break;
    }
    main.appendChild(document.createElement('hr'));

    // Section 2: Consecutive blocks (columns-feature x2)
    while (idx < items.length && items[idx].type === 'block') {
      main.appendChild(items[idx].element.cloneNode(true));
      idx++;
    }
    main.appendChild(createSectionMetadata(document, 'arc-gradient'));
    main.appendChild(document.createElement('hr'));

    // Section 3: Heading + text until next heading
    // Consume the first heading and all text/links that follow
    if (idx < items.length && items[idx].type === 'heading') {
      main.appendChild(items[idx].element.cloneNode(true));
      idx++;
    }
    while (idx < items.length && items[idx].type !== 'heading') {
      main.appendChild(items[idx].element.cloneNode(true));
      idx++;
    }
    main.appendChild(document.createElement('hr'));

    // Section 4: Heading + block + trailing text (until next standalone block)
    // Consume heading, then the first block encountered + any trailing text
    while (idx < items.length) {
      if (items[idx].type === 'block') {
        // Found a block (cards-awards) — consume it and trailing text, then break
        main.appendChild(items[idx].element.cloneNode(true));
        idx++;
        while (idx < items.length && items[idx].type === 'text') {
          main.appendChild(items[idx].element.cloneNode(true));
          idx++;
        }
        break;
      }
      main.appendChild(items[idx].element.cloneNode(true));
      idx++;
    }
    main.appendChild(createSectionMetadata(document, 'highlight'));
    main.appendChild(document.createElement('hr'));

    // Section 5: Remaining items (columns-quote)
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
        template: 'our-impact',
        blocks: blockNames,
        sections: 5,
      },
    }];
  },
};
