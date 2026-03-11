/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsMediaParser from './parsers/columns-media.js';

// TRANSFORMER IMPORTS
import upsCleanupTransformer from './transformers/ups-cleanup.js';

// PARSER REGISTRY
const parsers = {
  'columns-media': columnsMediaParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  upsCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'company-culture',
  description: 'Culture page with hero heading and description, culture wheel infographic, and three image-text value sections',
  urls: [
    'https://about.ups.com/us/en/our-company/our-culture.html',
  ],
  blocks: [
    {
      name: 'columns-media',
      instances: ['.herogrid', '#list-container', '.upspr-two-column_content_ytembed #list-container'],
    },
  ],
  sections: [
    {
      id: 'hero-intro',
      name: 'Hero Intro with Culture Wheel',
      style: 'arc-wave',
      blocks: ['columns-media'],
      defaultContent: [],
    },
    {
      id: 'value-sections',
      name: 'Values, Partnership, and Leadership Sections',
      style: null,
      blocks: ['columns-media'],
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
    const columnsMediaTables = blockTableMap['columns-media'] || [];

    // 5. Assemble sections — culture page splits same-name block across sections
    // First columns-media table (from .herogrid) → section 1 with arc-wave
    // Remaining columns-media tables (from #list-container) → section 2
    main.innerHTML = '';

    // Section 1: Hero intro with culture wheel
    if (columnsMediaTables.length > 0) {
      main.appendChild(columnsMediaTables[0].cloneNode(true));
    }
    main.appendChild(createSectionMetadata(document, 'arc-wave'));

    // Section break
    main.appendChild(document.createElement('hr'));

    // Section 2: Values, Partnership, and Leadership
    for (let i = 1; i < columnsMediaTables.length; i++) {
      main.appendChild(columnsMediaTables[i].cloneNode(true));
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
      },
    }];
  },
};
