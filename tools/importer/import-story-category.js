/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsStoriesParser from './parsers/cards-stories.js';

// TRANSFORMER IMPORTS
import upsCleanupTransformer from './transformers/ups-cleanup.js';

// PARSER REGISTRY
const parsers = {
  'cards-stories': cardsStoriesParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  upsCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'story-category',
  description: 'Story category listing page with h1 heading and story cards grid with Load More button',
  urls: [
    'https://about.ups.com/us/en/our-stories/customer-first.html',
    'https://about.ups.com/us/en/our-stories/people-led.html',
    'https://about.ups.com/us/en/our-stories/innovation-driven.html',
  ],
  blocks: [
    {
      name: 'cards-stories',
      instances: [
        '.pr04-threecolumnteaser .upspr-homepage-latest-stories',
        '.pr04-threecolumnteaser .upspr-three-column-teaser',
      ],
    },
  ],
  sections: [
    {
      id: 'hero-heading',
      name: 'Category Heading',
      style: 'arc',
      blocks: [],
      defaultContent: ['.upspr-headline h1'],
    },
    {
      id: 'story-cards',
      name: 'Story Cards Grid',
      style: null,
      blocks: ['cards-stories'],
      defaultContent: [],
    },
  ],
};

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element: el,
          section: blockDef.section || null,
        });
      });
    });
  });
  return pageBlocks;
}

/**
 * Scan the DOM for parsed block tables and map them by block name.
 */
function findBlockTables(main) {
  const tableMap = {};
  main.querySelectorAll('table').forEach((table) => {
    const firstRow = table.querySelector('tr');
    if (!firstRow) return;
    const firstCell = firstRow.querySelector('th, td');
    if (!firstCell) return;
    const name = firstCell.textContent.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tableMap[name]) tableMap[name] = [];
    tableMap[name].push(table);
  });
  return tableMap;
}

/**
 * Create a section-metadata block table for a given style.
 */
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

/**
 * Organize parsed content into sections with section breaks and section-metadata.
 */
function assembleSections(document, main, template, blockTableMap) {
  const output = document.createElement('div');

  template.sections.forEach((sectionDef, index) => {
    if (index > 0) {
      output.appendChild(document.createElement('hr'));
    }

    sectionDef.defaultContent.forEach((contentSelector) => {
      const els = main.querySelectorAll(contentSelector);
      els.forEach((el) => {
        output.appendChild(el.cloneNode(true));
      });
    });

    sectionDef.blocks.forEach((blockName) => {
      const tables = blockTableMap[blockName] || [];
      tables.forEach((table) => {
        output.appendChild(table.cloneNode(true));
      });
    });

    if (sectionDef.style) {
      output.appendChild(createSectionMetadata(document, sectionDef.style));
    }
  });

  return output;
}

export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;
    const main = document.body;

    // 1. Execute beforeTransform transformers
    executeTransformers('beforeTransform', main, payload);

    // 2. Find and parse blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name}:`, e);
        }
      }
    });

    // 3. Execute afterTransform transformers
    executeTransformers('afterTransform', main, payload);

    // 4. Find block tables in the DOM after parsing
    const blockTableMap = findBlockTables(main);

    // 5. Assemble sections with breaks and section-metadata
    if (PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 0) {
      const sectionOutput = assembleSections(document, main, PAGE_TEMPLATE, blockTableMap);
      main.innerHTML = '';
      while (sectionOutput.firstChild) {
        main.appendChild(sectionOutput.firstChild);
      }
    }

    // 6. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 7. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
        sections: PAGE_TEMPLATE.sections.map((s) => ({ id: s.id, style: s.style })),
      },
    }];
  },
};
