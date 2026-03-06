/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroFeaturedParser from './parsers/hero-featured.js';
import cardsStoriesParser from './parsers/cards-stories.js';

// TRANSFORMER IMPORTS
import upsCleanupTransformer from './transformers/ups-cleanup.js';

// PARSER REGISTRY
const parsers = {
  'hero-featured': heroFeaturedParser,
  'cards-stories': cardsStoriesParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  upsCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'story-hub',
  description: 'Our Stories landing page with hero heading, hero-featured card, and story cards grid with Load More',
  urls: [
    'https://about.ups.com/us/en/our-stories.html',
  ],
  blocks: [
    {
      name: 'hero-featured',
      instances: ['.hero .upspr-heroimage'],
    },
    {
      name: 'cards-stories',
      instances: ['.pr04-threecolumnteaser .upspr-homepage-latest-stories'],
    },
  ],
  sections: [
    {
      id: 'hero-heading',
      name: 'Hero Heading',
      selector: '.headline.aem-GridColumn',
      style: 'accent-bar',
      blocks: [],
      defaultContent: ['.upspr-headline h1'],
    },
    {
      id: 'hero-featured',
      name: 'Hero Featured Card',
      selector: '.hero.aem-GridColumn',
      style: null,
      blocks: ['hero-featured'],
      defaultContent: [],
    },
    {
      id: 'story-cards',
      name: 'Story Cards Grid',
      selector: '.pr04-threecolumnteaser',
      style: null,
      blocks: ['cards-stories'],
      defaultContent: ['.load-more-cta'],
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

    // 4. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Generate sanitized path
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
