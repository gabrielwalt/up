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

/** Maximum number of related story cards to include */
const MAX_RELATED_CARDS = 3;

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
 * Find richtext containers holding article body content.
 *
 * Two DOM patterns exist on story articles:
 * - Standard: .upspr-two-column_inner .cmp-text  (LFC, sanmar)
 * - Alternate: .par.responsivegrid .cmp-text / .cmp-embed  (5-things, new-shelves)
 *
 * The alternate path is used when .upspr-two-column_inner is empty.
 */
function findRichtextContainers(bodyContainer, altContainer) {
  const containers = [];

  // Try standard path: .upspr-two-column_inner .cmp-text
  if (bodyContainer) {
    const cmpText = bodyContainer.querySelector('.cmp-text');
    if (cmpText && cmpText.children.length > 0) {
      containers.push(cmpText);
      return containers;
    }
  }

  // Fall back to alternate container: .par.responsivegrid
  if (altContainer) {
    // Embedded content (.cmp-embed) — e.g. new-shelves blurb layout
    const cmpEmbeds = altContainer.querySelectorAll('.cmp-embed');
    cmpEmbeds.forEach((ce) => containers.push(ce));

    // Standard .cmp-text inside responsive grid — e.g. 5-things article text, CTA paragraphs
    const cmpTexts = altContainer.querySelectorAll('.cmp-text');
    cmpTexts.forEach((ct) => {
      if (ct.children.length > 0) containers.push(ct);
    });
  }

  return containers;
}

/**
 * Extract a single content element into the output array.
 * Handles P, UL, OL, H1-H6, IMG, BLOCKQUOTE, YouTube iframes,
 * and recurses into generic DIVs (e.g. .blurb containers).
 */
function extractContentElement(el, content, document) {
  const tag = el.tagName;

  // Check for YouTube iframe anywhere inside the element
  const iframe = el.querySelector('iframe[src*="youtube"]');
  if (iframe) {
    const src = iframe.src || iframe.getAttribute('src') || '';
    const embedMatch = src.match(/youtube\.com\/embed\/([\w-]+)/);
    const watchUrl = embedMatch
      ? `https://www.youtube.com/watch?v=${embedMatch[1]}`
      : src;

    const a = document.createElement('a');
    a.href = watchUrl;
    a.textContent = watchUrl;
    const block = WebImporter.Blocks.createBlock(document, {
      name: 'Embed',
      cells: [[[a]]],
    });
    content.push(block);
    return;
  }

  if (tag === 'P') {
    const p = document.createElement('p');
    cloneInlineContent(el, p, document);
    if (p.textContent.trim() || p.querySelector('a')) {
      content.push(p);
    }
  } else if (tag === 'UL' || tag === 'OL') {
    const list = cloneList(el, document);
    if (list.children.length > 0) content.push(list);
  } else if (/^H[1-6]$/.test(tag)) {
    const heading = document.createElement(tag.toLowerCase());
    cloneInlineContent(el, heading, document);
    if (heading.textContent.trim()) content.push(heading);
  } else if (tag === 'BLOCKQUOTE') {
    const bq = document.createElement('blockquote');
    Array.from(el.children).forEach((child) => {
      if (child.tagName === 'P') {
        const p = document.createElement('p');
        cloneInlineContent(child, p, document);
        bq.append(p);
      }
    });
    if (bq.textContent.trim()) content.push(bq);
  } else if (tag === 'IMG') {
    const newImg = document.createElement('img');
    newImg.src = el.src;
    newImg.alt = el.alt || '';
    content.push(newImg);
  } else if (tag === 'DIV') {
    // Handle nested containers (e.g. .blurb with image + paragraphs)
    extractFromDiv(el, content, document);
  }
  // Skip STYLE, SCRIPT, AUDIO, and other non-content elements
}

/**
 * Extract content from a generic DIV.
 * If it's a .blurb container (image + text), extract image then paragraphs.
 * Otherwise recurse into children.
 */
function extractFromDiv(divEl, content, document) {
  if (divEl.classList.contains('blurb')) {
    const img = divEl.querySelector('img');
    if (img) {
      const newImg = document.createElement('img');
      newImg.src = img.src;
      newImg.alt = img.alt || '';
      content.push(newImg);
    }
    divEl.querySelectorAll('p').forEach((p) => {
      const newP = document.createElement('p');
      cloneInlineContent(p, newP, document);
      if (newP.textContent.trim()) content.push(newP);
    });
    return;
  }

  // Generic div — recurse into children
  Array.from(divEl.children).forEach((child) => {
    extractContentElement(child, content, document);
  });
}

/**
 * Extract article body content from detached DOM containers.
 *
 * Searches both the standard body container (.upspr-two-column_inner)
 * and the alternate container (.par.responsivegrid) for richtext content.
 *
 * Handles P, UL, OL, H1-H6, IMG, BLOCKQUOTE, YouTube embeds,
 * and embedded components (e.g. blurb layouts).
 */
function extractArticleBody(document, bodyContainer, altContainer) {
  const content = [];
  const containers = findRichtextContainers(bodyContainer, altContainer);

  for (const container of containers) {
    const children = Array.from(container.children);
    for (const el of children) {
      extractContentElement(el, content, document);
    }
  }

  return content;
}

/**
 * Clone inline content from source to target, preserving a, strong/b, em/i, br.
 * Uses getAttribute('href') for links to preserve relative URLs.
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
        a.href = node.getAttribute('href') || node.href;
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

/**
 * Recursively clone a UL or OL list, preserving inline content and nested lists.
 */
function cloneList(source, document) {
  const list = document.createElement(source.tagName.toLowerCase());
  Array.from(source.children).forEach((li) => {
    if (li.tagName !== 'LI') return;
    const newLi = document.createElement('li');
    li.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        newLi.append(document.createTextNode(node.textContent));
      } else if (node.nodeType === 1) {
        const childTag = node.tagName.toLowerCase();
        if (childTag === 'ul' || childTag === 'ol') {
          // Nested list — recurse
          newLi.append(cloneList(node, document));
        } else if (childTag === 'a') {
          const a = document.createElement('a');
          a.href = node.getAttribute('href') || node.href;
          a.textContent = node.textContent;
          newLi.append(a);
        } else if (childTag === 'strong' || childTag === 'b') {
          const strong = document.createElement('strong');
          cloneInlineContent(node, strong, document);
          newLi.append(strong);
        } else if (childTag === 'em' || childTag === 'i') {
          const em = document.createElement('em');
          cloneInlineContent(node, em, document);
          newLi.append(em);
        } else if (childTag === 'br') {
          newLi.append(document.createElement('br'));
        } else if (childTag === 'img') {
          // Skip decorative images in list items (e.g. icon glyphs)
        } else {
          // Generic element — clone inline content
          cloneInlineContent(node, newLi, document);
        }
      }
    });
    list.append(newLi);
  });
  return list;
}

export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;
    const main = document.body;

    // 1. Execute beforeTransform transformers
    executeTransformers('beforeTransform', main, payload);

    const pr15 = main.querySelector('.pr15-details');
    if (!pr15) {
      // No article content found — return empty
      executeTransformers('afterTransform', main, payload);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
      );
      return [{ element: main, path, report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: [] } }];
    }

    // 2. BEFORE parsing article-header, detach body + social from .pr15-details
    //    so they survive the replaceWith in the article-header parser.

    // 2a. Detach body container (.upspr-two-column_inner)
    //     Also capture the sibling .par.responsivegrid as alternate body location.
    //     Some articles have body content there instead (e.g. 5-things, new-shelves).
    const bodyContainer = pr15.querySelector('.upspr-two-column_inner');
    let altBodyContainer = null;
    if (bodyContainer) {
      altBodyContainer = bodyContainer.parentElement.querySelector(':scope > .par.responsivegrid');
      bodyContainer.remove();
    }
    if (altBodyContainer) altBodyContainer.remove();

    // 2b. Detach social share (.upspr-socialmedia)
    const socialEl = pr15.querySelector('.upspr-socialmedia');
    if (socialEl) socialEl.remove();

    // 2c. Detach related stories (.pr24-background-colour)
    //     On some pages this is INSIDE .pr15-details (e.g. new-shelves).
    //     Must detach before article-header parser replaces .pr15-details.
    const relatedEl = pr15.querySelector('.pr24-background-colour');
    if (relatedEl) relatedEl.remove();

    // 3. Parse article-header (now safe — only header content remains in .pr15-details)
    try {
      parsers['article-header'](pr15, { document, url, params });
    } catch (e) {
      console.error('Failed to parse article-header:', e);
    }

    // 4. Extract body content from detached containers
    const bodyContent = extractArticleBody(document, bodyContainer, altBodyContainer);

    // 5. Build social-share block from detached socialEl
    let socialBlock = null;
    if (socialEl) {
      // Attach socialEl to a temp parent so replaceWith works on a detached subtree
      const tempParent = document.createElement('div');
      tempParent.append(socialEl);
      try {
        parsers['social-share'](socialEl, { document, url, params });
      } catch (e) {
        console.error('Failed to parse social-share:', e);
      }
      socialBlock = tempParent.querySelector('table');
    }

    // 6. Insert section break + body content + social-share after article-header table
    //    The <hr> creates a new section so body content is separate from article-header.
    //    This allows lazy-styles.css to apply the 2fr/1fr grid layout to the body section.
    const headerTable = main.querySelector('table');
    if (headerTable) {
      // Section break: article-header section ends, body section begins
      const bodySectionBreak = document.createElement('hr');
      headerTable.after(bodySectionBreak);
      let insertPoint = bodySectionBreak;

      // Insert body paragraphs and embed blocks
      bodyContent.forEach((el) => {
        insertPoint.after(el);
        insertPoint = el;
      });

      // Insert social-share block after body
      if (socialBlock) {
        insertPoint.after(socialBlock);
      }
    }

    // 7. Parse related stories section
    //    Use already-detached relatedEl if found inside pr15, else search main
    const relatedSection = relatedEl || main.querySelector('.pr24-background-colour');
    if (relatedSection) {
      // Extract the "Related Stories" heading
      const relatedH2 = relatedSection.querySelector('h2');

      // Find the story cards container
      const storiesContainer = relatedSection.querySelector('.upspr-three-column-teaser')
        || relatedSection.querySelector('.upspr-homepage-latest-stories');
      if (storiesContainer) {
        try {
          parsers['cards-stories'](storiesContainer, { document, url, params });
        } catch (e) {
          console.error('Failed to parse cards-stories:', e);
        }
      }

      // Rebuild related section: heading + cards-stories table + section-metadata
      const newRelated = document.createDocumentFragment();

      if (relatedH2) {
        const h2 = document.createElement('h2');
        h2.textContent = relatedH2.textContent.trim();
        newRelated.append(h2);
      }

      // Move the parsed cards-stories table, limiting to MAX_RELATED_CARDS
      const cardsTable = relatedSection.querySelector('table');
      if (cardsTable) {
        const rows = cardsTable.querySelectorAll('tr');
        // Row 0 is the block name header; rows 1+ are cards
        for (let i = MAX_RELATED_CARDS + 1; i < rows.length; i++) {
          rows[i].remove();
        }
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

      // Insert related stories into main with a section break (hr) before it
      const sectionBreak = document.createElement('hr');
      if (relatedSection.parentNode) {
        // relatedSection is still in the DOM — replace it
        relatedSection.parentNode.insertBefore(sectionBreak, relatedSection);
        relatedSection.replaceWith(newRelated);
      } else {
        // relatedSection was detached (was inside pr15) — append to main
        main.append(sectionBreak);
        main.append(newRelated);
      }
    }

    // 8. Execute afterTransform transformers
    executeTransformers('afterTransform', main, payload);

    // 9. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 10. Generate sanitized path
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
