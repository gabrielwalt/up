/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroFeaturedParser from './parsers/hero-featured.js';
import factSheetsParser from './parsers/fact-sheets.js';
import columnsFeatureParser from './parsers/columns-feature.js';
import columnsQuoteParser from './parsers/columns-quote.js';

// TRANSFORMER IMPORTS
import upsCleanupTransformer from './transformers/ups-cleanup.js';

// PARSER REGISTRY
const parsers = {
  'hero-featured': heroFeaturedParser,
  'fact-sheets': factSheetsParser,
  'columns-feature': columnsFeatureParser,
  'columns-quote': columnsQuoteParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  upsCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'company-hub',
  description: 'Our Company landing page with hero heading, hero-featured card, stats row, columns-feature sections, and CEO quote',
  urls: [
    'https://about.ups.com/us/en/our-company.html',
  ],
  blocks: [
    {
      name: 'hero-featured',
      instances: ['.hero .upspr-heroimage'],
    },
    {
      name: 'fact-sheets',
      instances: ['.upspr-facts-container', '.upspr-stats-container'],
    },
    {
      name: 'columns-feature',
      instances: ['.sectioncard .upspr-xd-card'],
    },
    {
      name: 'columns-quote',
      instances: ['.quotes .upspr-testimonial'],
    },
  ],
  sections: [
    {
      id: 'hero-heading',
      name: 'Hero Heading',
      selector: '.headline.aem-GridColumn',
      style: 'arc',
      blocks: [],
      defaultContent: ['.upspr-headline h1'],
    },
    {
      id: 'hero-featured-stats',
      name: 'Hero Featured and Stats',
      selector: ['.hero.aem-GridColumn', '.responsivegrid > .aem-Grid > div:has(.upspr-heroimage)'],
      style: null,
      blocks: ['hero-featured', 'fact-sheets'],
      defaultContent: [],
    },
    {
      id: 'feature-sections',
      name: 'Feature Sections',
      selector: '.sectioncard',
      style: 'highlight',
      blocks: ['columns-feature'],
      defaultContent: [],
    },
    {
      id: 'quote-section',
      name: 'CEO Quote',
      selector: '.quotes',
      style: null,
      blocks: ['columns-quote'],
      defaultContent: [],
    },
  ],
};

/**
 * Execute all page transformers for a specific hook
 */
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

/**
 * Find all blocks on the page based on embedded template configuration
 */
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
 * After parsers call element.replaceWith(table), the original elements are detached.
 * This function finds the replacement tables in the live DOM.
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
 * Create a section-metadata block table for a given style
 */
function createSectionMetadata(document, style) {
  const table = document.createElement('table');
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('th');
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
 * Iterates over the template sections config, finds matched source elements,
 * collects their parsed output, and assembles them with <hr> separators.
 */
function assembleSections(document, main, template, blockTableMap) {
  const output = document.createElement('div');

  template.sections.forEach((sectionDef, index) => {
    // Add section break between sections (not before the first)
    if (index > 0) {
      output.appendChild(document.createElement('hr'));
    }

    // Collect default content for this section
    sectionDef.defaultContent.forEach((contentSelector) => {
      const els = main.querySelectorAll(contentSelector);
      els.forEach((el) => {
        const clone = el.cloneNode(true);
        output.appendChild(clone);
      });
    });

    // Collect parsed block tables for this section
    sectionDef.blocks.forEach((blockName) => {
      const tables = blockTableMap[blockName] || [];
      tables.forEach((table) => {
        output.appendChild(table.cloneNode(true));
      });
    });

    // Add section-metadata if section has a style
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
