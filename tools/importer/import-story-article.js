/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import articleHeaderParser from './parsers/article-header.js';
import embedParser from './parsers/embed.js';
import socialShareParser from './parsers/social-share.js';
import cardsStoriesParser from './parsers/cards-stories.js';

// TRANSFORMER IMPORTS
import upsCleanupTransformer from './transformers/ups-cleanup.js';

// PARSER REGISTRY
const parsers = {
  'article-header': articleHeaderParser,
  'embed': embedParser,
  'social-share': socialShareParser,
  'cards-stories': cardsStoriesParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  upsCleanupTransformer,
];

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'story-article',
  description: 'Story article page with article header, body paragraphs, YouTube embeds, social share, and related stories',
  urls: [
    'https://about.ups.com/us/en/our-stories/customer-first/ups-and-lfc-celebrate-the--unstoppable-spirit--of-liverpool-busi0.html',
  ],
  blocks: [
    {
      name: 'article-header',
      instances: ['.pr15-details'],
    },
    {
      name: 'embed',
      instances: ['.pr15-details iframe[src*="youtube"]'],
    },
    {
      name: 'social-share',
      instances: ['.upspr-socialmedia'],
    },
    {
      name: 'cards-stories',
      instances: ['.pr24-background-colour .upspr-three-column-teaser'],
    },
  ],
  sections: [
    {
      id: 'article-header',
      name: 'Article Header',
      selector: '.pr15-details',
      style: null,
      blocks: ['article-header'],
      defaultContent: [],
    },
    {
      id: 'article-body',
      name: 'Article Body',
      selector: '.pr15-details .upspr-two-column_inner',
      style: null,
      blocks: ['embed'],
      defaultContent: ['.cmp-text p'],
    },
    {
      id: 'social-share',
      name: 'Social Share',
      selector: '.upspr-socialmedia',
      style: null,
      blocks: ['social-share'],
      defaultContent: [],
    },
    {
      id: 'related-stories',
      name: 'Related Stories',
      selector: '.pr24-background-colour',
      style: 'highlight, accent-bar',
      blocks: ['cards-stories'],
      defaultContent: ['.upspr-headline h2'],
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
 * Extract article body content (paragraphs with inline links, bold, italic)
 * and YouTube embeds from the richtext area.
 */
function extractArticleBody(document, bodyContainer) {
  const content = [];
  if (!bodyContainer) return content;

  // The body content is inside .upspr-two-column_inner > div > .articleText .cmp-text
  const richtext = bodyContainer.querySelector('.cmp-text') || bodyContainer;
  const children = richtext.children;

  for (let i = 0; i < children.length; i++) {
    const el = children[i];

    // Check for YouTube iframe
    const iframe = el.querySelector('iframe[src*="youtube"]');
    if (iframe) {
      // Parse as embed block
      const parser = parsers['embed'];
      if (parser) {
        try {
          parser(el, { document });
        } catch (e) {
          console.error('Failed to parse embed:', e);
        }
      }
      continue;
    }

    // Regular paragraph — clone and clean it
    if (el.tagName === 'P') {
      const p = document.createElement('p');
      // Deep clone the content, preserving inline elements (a, b, i, strong, em)
      cloneInlineContent(el, p, document);
      if (p.textContent.trim() || p.querySelector('a')) {
        content.push(p);
      }
    }
  }

  return content;
}

/**
 * Clone inline content from source to target, preserving a, strong/b, em/i, br
 */
function cloneInlineContent(source, target, document) {
  source.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      // Text node
      target.append(document.createTextNode(node.textContent));
    } else if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      if (tag === 'a') {
        const a = document.createElement('a');
        a.href = node.href;
        a.textContent = node.textContent;
        target.append(a);
      } else if (tag === 'strong' || tag === 'b') {
        const strong = document.createElement('strong');
        cloneInlineContent(node, strong, document);
        target.append(strong);
      } else if (tag === 'em' || tag === 'i') {
        const em = document.createElement('em');
        cloneInlineContent(node, em, document);
        target.append(em);
      } else if (tag === 'br') {
        target.append(document.createElement('br'));
      } else {
        // For other inline elements, just copy text
        cloneInlineContent(node, target, document);
      }
    }
  });
}

export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;
    const main = document.body;

    // 1. Execute beforeTransform transformers
    executeTransformers('beforeTransform', main, payload);

    // 2. Parse article-header block
    const articleHeaderEl = main.querySelector('.pr15-details');
    if (articleHeaderEl) {
      const parser = parsers['article-header'];
      if (parser) {
        try {
          parser(articleHeaderEl, { document, url, params });
        } catch (e) {
          console.error('Failed to parse article-header:', e);
        }
      }
    }

    // 3. Extract article body (default content paragraphs + embed blocks)
    const bodyContainer = main.querySelector('.upspr-two-column_inner');
    if (bodyContainer) {
      const bodyContent = extractArticleBody(document, bodyContainer);
      // Insert body content after the article-header block table
      const headerTable = main.querySelector('table');
      if (headerTable && bodyContent.length > 0) {
        // Add section break before body (---) only if styles differ
        // Article header and body are same section (no style), so no break needed
        const bodyFragment = document.createDocumentFragment();
        bodyContent.forEach((el) => bodyFragment.append(el));

        // Insert after article header table
        if (headerTable.nextSibling) {
          headerTable.parentNode.insertBefore(bodyFragment, headerTable.nextSibling);
        } else {
          headerTable.parentNode.append(bodyFragment);
        }
      }

      // Clean up the original body container (avoid duplicate content)
      bodyContainer.remove();
    }

    // 4. Parse social-share block
    const socialEl = main.querySelector('.upspr-socialmedia');
    if (socialEl) {
      const parser = parsers['social-share'];
      if (parser) {
        try {
          parser(socialEl, { document, url, params });
        } catch (e) {
          console.error('Failed to parse social-share:', e);
        }
      }
    }

    // 5. Parse related stories section
    const relatedSection = main.querySelector('.pr24-background-colour');
    if (relatedSection) {
      // Extract the "Related Stories" heading
      const relatedH2 = relatedSection.querySelector('h2');

      // Find the story cards container
      const storiesContainer = relatedSection.querySelector('.upspr-three-column-teaser')
        || relatedSection.querySelector('.upspr-homepage-latest-stories');
      if (storiesContainer) {
        const parser = parsers['cards-stories'];
        if (parser) {
          try {
            parser(storiesContainer, { document, url, params });
          } catch (e) {
            console.error('Failed to parse cards-stories:', e);
          }
        }
      }

      // Create section break with highlight style before related stories
      const sectionBreak = document.createElement('hr');
      relatedSection.parentNode.insertBefore(sectionBreak, relatedSection);

      // Rebuild related section: heading + cards-stories table + section-metadata
      const newRelated = document.createDocumentFragment();

      if (relatedH2) {
        const h2 = document.createElement('h2');
        h2.textContent = relatedH2.textContent.trim();
        newRelated.append(h2);
      }

      // Move the parsed cards-stories table
      const cardsTable = relatedSection.querySelector('table');
      if (cardsTable) {
        newRelated.append(cardsTable);
      }

      // Add section-metadata for highlight + accent-bar styles
      const metaCells = [
        [['Style'], ['highlight, accent-bar']],
      ];
      const metaBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: metaCells,
      });
      newRelated.append(metaBlock);

      relatedSection.replaceWith(newRelated);
    }

    // 6. Execute afterTransform transformers
    executeTransformers('afterTransform', main, payload);

    // 7. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 8. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: ['article-header', 'embed', 'social-share', 'cards-stories'],
      },
    }];
  },
};
