/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS — all 26 parsers
import articleHeaderParser from './parsers/article-header.js';
import columnsStatsParser from './parsers/columns-stats.js';
import heroFeaturedParser from './parsers/hero-featured.js';
import columnsMediaParser from './parsers/columns-media.js';
import cardsAwardsParser from './parsers/cards-awards.js';
import cardsStoriesParser from './parsers/cards-stories.js';
import columnsFeatureParser from './parsers/columns-feature.js';
import columnsQuoteParser from './parsers/columns-quote.js';
import factSheetsParser from './parsers/fact-sheets.js';
import navigationTabsParser from './parsers/navigation-tabs.js';
import contactCardParser from './parsers/contact-card.js';
import socialShareParser from './parsers/social-share.js';
import embedParser from './parsers/embed.js';
import cardsLeadershipParser from './parsers/cards-leadership.js';
import cardsReportsParser from './parsers/cards-reports.js';
import timelineParser from './parsers/timeline.js';
import awardsListParser from './parsers/awards-list.js';
import formParser from './parsers/form.js';
import leadershipBioParser from './parsers/leadership-bio.js';
import governanceCardsParser from './parsers/governance-cards.js';
import governanceSubnavParser from './parsers/governance-subnav.js';
import footerFunnelParser from './parsers/footer-funnel.js';
import governanceBannerParser from './parsers/governance-banner.js';
import governanceAssetListParser from './parsers/governance-asset-list.js';
import governanceTableParser from './parsers/governance-table.js';
import investorLinksParser from './parsers/investor-links.js';

// TRANSFORMER IMPORTS
import upsCleanupTransformer from './transformers/ups-cleanup.js';

/**
 * Unified block detection registry.
 * Order matters: more specific selectors FIRST to avoid false matches.
 * After cleanup removes header/footer/nav, these selectors target content blocks only.
 *
 * article-header, embed, and social-share are article-path-only — skipped in standard path.
 */
const BLOCK_REGISTRY = [
  { name: 'article-header',    selectors: ['.pr15-details'],                                                    parser: articleHeaderParser },
  { name: 'leadership-bio',    selectors: ['.upspr-bio'],                                                       parser: leadershipBioParser },
  { name: 'columns-stats',     selectors: ['.upspr-heroimage.vertical-hero'],                                   parser: columnsStatsParser },
  { name: 'hero-featured',     selectors: ['.upspr-heroimage'],                                                 parser: heroFeaturedParser },
  { name: 'columns-media',     selectors: ['.herogrid', '#list-container'],                                     parser: columnsMediaParser },
  { name: 'cards-awards',      selectors: ['.upspr-three-column-teaser:has(.upspr-three-col-text)'],             parser: cardsAwardsParser },
  { name: 'cards-stories',     selectors: ['.upspr-homepage-latest-stories', '.upspr-three-column-teaser:has(.upspr-story-details)'], parser: cardsStoriesParser },
  { name: 'columns-feature',   selectors: ['.upspr-xd-card'],                                                   parser: columnsFeatureParser },
  { name: 'columns-quote',     selectors: ['.upspr-testimonial'],                                               parser: columnsQuoteParser },
  { name: 'fact-sheets',       selectors: ['.upspr-facts-container', '.upspr-stats-container'],                  parser: factSheetsParser },
  { name: 'navigation-tabs',   selectors: ['.upspr-navigation-tabs'],                                           parser: navigationTabsParser },
  { name: 'footer-funnel',     selectors: ['.upspr-footer_top'],                                                parser: footerFunnelParser },
  { name: 'contact-card',      selectors: ['.upspr-contactus'],                                                 parser: contactCardParser },
  { name: 'social-share',      selectors: ['.upspr-socialmedia'],                                               parser: socialShareParser },
  { name: 'embed',             selectors: ['iframe[src*="youtube"]'],                                           parser: embedParser },
  { name: 'cards-leadership',  selectors: ['.upspr-leadership-container'],                                      parser: cardsLeadershipParser },
  { name: 'cards-reports',     selectors: ['.upspr-reporting'],                                                  parser: cardsReportsParser },
  { name: 'governance-banner', selectors: ['.module-page-banner'],                                                parser: governanceBannerParser },
  { name: 'governance-cards',  selectors: ['.module-teasers'],                                                   parser: governanceCardsParser },
  { name: 'governance-subnav', selectors: ['.sub-navigation-wrapper'],                                           parser: governanceSubnavParser },
  { name: 'governance-table', selectors: ['.main-content > table'],                                              parser: governanceTableParser },
  { name: 'governance-asset-list', selectors: ['.module-asset-list'],                                            parser: governanceAssetListParser },
  { name: 'investor-links',    selectors: ['.module-quick-links'],                                               parser: investorLinksParser },
  { name: 'timeline',          selectors: ['.upspr-our-history'],                                                parser: timelineParser },
  { name: 'awards-list',       selectors: ['.ups-tabs'],                                                         parser: awardsListParser },
  { name: 'form',              selectors: ['.aemformcontainer'],                                                 parser: formParser },
];

/** Blocks only used in the article path — skip in standard path */
const ARTICLE_ONLY_BLOCKS = new Set(['article-header', 'social-share', 'embed']);

const transformers = [upsCleanupTransformer];

/** Maximum number of related story cards to include (article path) */
const MAX_RELATED_CARDS = 3;

// ===== SHARED UTILITIES =====

function executeTransformers(hookName, element, payload) {
  transformers.forEach((fn) => {
    try {
      fn.call(null, hookName, element, { ...payload });
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

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

// ===== PHASE 0: PRE-DETECTION (before cleanup) =====

/**
 * Detect section wrapper contexts BEFORE cleanup removes wrapper classes.
 *
 * Data-driven approach: tags individual DOM elements with data attributes
 * so that Phase 7 can read them when building section metadata.
 *
 * - Headings inside `.background-normal-arc` get `data-section-arc="true"`
 * - Headings inside `.bg-brown` get `data-section-dark="true"`
 * - Headings followed by `.upspr-under-eyebrow` get `data-accent-bar="true"`
 * - Block source elements get wrapper style in `wrapperMap`
 *
 * Returns: { wrapperMap: Map<Element, string> }
 */
function detectSectionContext(main) {
  const context = {
    wrapperMap: new Map(),
  };

  // 1. Tag headings inside arc wrappers
  main.querySelectorAll('.background-normal-arc, .hero-in-arc').forEach((wrapper) => {
    if (wrapper.classList.contains('modal-header')) return;
    wrapper.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      h.dataset.sectionArc = 'true';
    });
  });

  // 2. Tag headings inside dark wrappers
  main.querySelectorAll('.bg-brown, .upspr-section-wrapper.bg-brown').forEach((wrapper) => {
    wrapper.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
      h.dataset.sectionDark = 'true';
    });
  });

  // 3. Tag headings that have accent-bar (.upspr-under-eyebrow follows the heading or its wrapper)
  main.querySelectorAll('.upspr-under-eyebrow').forEach((el) => {
    let heading = null;
    const prev = el.previousElementSibling;
    if (prev && /^H[1-6]$/.test(prev.tagName)) {
      // Direct sibling: <h2>...</h2><div class="upspr-under-eyebrow">
      heading = prev;
    } else if (prev) {
      // Previous sibling is a container — find heading inside it
      heading = prev.querySelector('h1, h2, h3, h4, h5, h6');
    }
    if (!heading) {
      // Fallback: search parent for a heading
      heading = el.parentElement?.querySelector('h1, h2, h3, h4, h5, h6');
    }
    if (heading) {
      heading.dataset.accentBar = 'true';
    }
  });

  // 4. Build wrapper map for block source elements
  BLOCK_REGISTRY.forEach(({ name, selectors }) => {
    if (ARTICLE_ONLY_BLOCKS.has(name)) return;

    selectors.forEach((selector) => {
      let elements;
      try {
        elements = main.querySelectorAll(selector);
      } catch (e) {
        return;
      }
      elements.forEach((el) => {
        const darkWrapper = el.closest('.bg-brown, .upspr-section-wrapper.bg-brown');
        const arcWrapper = el.closest('.background-normal-arc:not(.modal-header)');
        const greyWrapper = el.closest('.upspr-section-wrapper__bg-grey_25');

        if (darkWrapper) {
          context.wrapperMap.set(el, 'dark');
        } else if (arcWrapper) {
          context.wrapperMap.set(el, 'arc');
        } else if (greyWrapper) {
          // Distinguish arc-wave from highlight:
          // arc-wave = grey wrapper containing .herogrid (culture page intro)
          if (greyWrapper.querySelector('.herogrid')) {
            context.wrapperMap.set(el, 'arc-wave');
          } else {
            context.wrapperMap.set(el, 'highlight');
          }
        }
      });
    });
  });

  return context;
}

// ===== STANDARD PATH: BLOCK DETECTION & CONTENT COLLECTION =====

/**
 * Find and parse all blocks on the page (standard path only).
 * Skips article-only blocks. Each parser calls element.replaceWith(table).
 * Tags each resulting table with its pre-detected wrapper style via data attribute.
 */
function findAndParseBlocks(main, document, url, params, sectionContext) {
  const blockNames = [];

  BLOCK_REGISTRY.forEach(({ name, selectors, parser }) => {
    if (ARTICLE_ONLY_BLOCKS.has(name)) return;

    selectors.forEach((selector) => {
      let elements;
      try {
        elements = main.querySelectorAll(selector);
      } catch (e) {
        return;
      }
      elements.forEach((el) => {
        if (!main.contains(el)) return;

        // Record wrapper style BEFORE parsing (which does replaceWith)
        const wrapperStyle = sectionContext.wrapperMap.get(el) || null;

        // Insert marker so we can find the replacement table after parsing
        const marker = document.createComment('block-wrapper-marker');
        el.before(marker);

        try {
          parser(el, { document, url, params });
          blockNames.push(name);
        } catch (e) {
          console.error(`Failed to parse ${name}:`, e);
          marker.remove();
          return;
        }

        // Tag the replacement table with its wrapper style
        if (wrapperStyle) {
          const table = marker.nextElementSibling;
          if (table && table.tagName === 'TABLE') {
            table.dataset.wrapperStyle = wrapperStyle;
          }
        }
        marker.remove();
      });
    });
  });

  return blockNames;
}

/**
 * Recursively walk the DOM collecting meaningful content in document order.
 * After block parsing, the DOM contains <table> elements (from parser replaceWith),
 * headings, paragraphs, lists, blockquotes, and images as default content.
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
    } else if (tag === 'BLOCKQUOTE') {
      if (child.textContent.trim()) {
        result.push({ type: 'blockquote', element: child });
      }
    } else if (tag === 'IMG' || tag === 'PICTURE') {
      result.push({ type: 'image', element: child });
    } else {
      collectContent(child, result);
    }
  }
}

/**
 * Wrapper-aware section grouping.
 *
 * Rules:
 * - H1 always starts a new section
 * - Blocks with a styled wrapper merge with H1 (e.g., hero in arc on great-employer)
 * - Blocks with null wrapper flush H1 section first (H1 gets its own section)
 * - Non-H1 headings flush H1 sections (prevent H2 leaking into H1's arc section)
 * - Headings immediately before a block stay with that block (section title + block)
 * - Null-wrapper blocks flush immediately (one block per section)
 * - Wrapper context changes trigger a flush
 */
function groupIntoSections(items) {
  const sections = [];
  let current = [];
  let currentWrapper = undefined; // undefined = no context yet, null = explicit null

  function flush() {
    if (current.length > 0) {
      sections.push(current);
      current = [];
    }
    currentWrapper = undefined;
  }

  for (const item of items) {
    if (item.type === 'h1') {
      flush();
      current.push(item);
      currentWrapper = undefined;
      continue;
    }

    if (item.type === 'block') {
      const wrapper = item.element.dataset.wrapperStyle || null;

      // Check if current section has H1 and block shares a styled wrapper
      const hasH1 = current.some((i) => i.type === 'h1');
      if (hasH1 && wrapper !== null) {
        // Block shares a styled wrapper with H1 — keep in same section
        current.push(item);
        currentWrapper = wrapper;
        continue;
      }

      // H1 section + null-wrapper block → flush H1 into its own section
      if (hasH1 && wrapper === null) {
        flush();
      }

      // Flush accumulated text/list/image content before starting a block section.
      // Headings are NOT flushed — they stay with the block as section titles.
      const hasTextContent = current.some((i) =>
        i.type === 'text' || i.type === 'list' || i.type === 'blockquote' || i.type === 'image');
      if (hasTextContent) {
        flush();
      }

      if (currentWrapper === undefined) {
        // Starting a new section context
        current.push(item);
        currentWrapper = wrapper;
        if (wrapper === null) {
          // Null-context blocks flush immediately (one block per section)
          flush();
        }
      } else if (wrapper === currentWrapper && wrapper !== null) {
        // Same styled wrapper — merge into current section
        current.push(item);
      } else {
        // Different context — flush and start new
        flush();
        current.push(item);
        currentWrapper = wrapper;
        if (wrapper === null) {
          flush();
        }
      }
    } else {
      // Non-block items: accumulate in current section
      const hasH1 = current.some((i) => i.type === 'h1');
      const hasBlock = current.some((i) => i.type === 'block');

      // If H1+block completed section, flush before adding heading
      if (hasH1 && hasBlock && item.type === 'heading') {
        flush();
      }

      // If H1 section (no block yet) and this is a non-H1 heading, flush H1 first.
      // Prevents headings from other page sections leaking into the H1's arc section.
      if (hasH1 && !hasBlock && item.type === 'heading') {
        flush();
      }

      current.push(item);
    }
  }

  flush();
  return sections;
}

/**
 * Create a clean output element from a content item.
 * Block tables are cloned as-is. Headings are recreated without source attributes.
 * Paragraphs preserve inline content but drop element-level attributes.
 */
function cleanClone(item, document) {
  const el = item.element;
  const tag = el.tagName.toLowerCase();

  if (item.type === 'block') {
    return el.cloneNode(true);
  }

  if (/^h[1-6]$/.test(tag)) {
    const clean = document.createElement(tag);
    // Preserve inline content (links, strong, em) in headings
    if (el.querySelector('a, strong, em')) {
      clean.innerHTML = el.innerHTML;
    } else {
      clean.textContent = el.textContent.trim();
    }
    return clean;
  }

  if (tag === 'p') {
    const clean = document.createElement('p');
    clean.innerHTML = el.innerHTML;
    return clean;
  }

  // Lists, blockquotes, images — clone as-is
  return el.cloneNode(true);
}

// ===== ARTICLE PATH HELPERS (from import-story-article.js) =====

function findRichtextContainers(bodyContainer, altContainer) {
  const containers = [];

  if (bodyContainer) {
    const cmpText = bodyContainer.querySelector('.cmp-text');
    if (cmpText && cmpText.children.length > 0) {
      containers.push(cmpText);
    }
  }

  if (altContainer) {
    const cmpEmbeds = altContainer.querySelectorAll('.cmp-embed');
    cmpEmbeds.forEach((ce) => containers.push(ce));

    const cmpTexts = altContainer.querySelectorAll('.cmp-text');
    cmpTexts.forEach((ct) => {
      if (ct.children.length > 0) containers.push(ct);
    });
  }

  return containers;
}

function cloneInlineContent(source, target, document) {
  source.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
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
      } else if (tag === 'img') {
        const newImg = document.createElement('img');
        newImg.src = node.src;
        newImg.alt = node.alt || '';
        target.append(newImg);
      } else if (tag === 'sup') {
        const sup = document.createElement('sup');
        sup.textContent = node.textContent;
        target.append(sup);
      } else {
        cloneInlineContent(node, target, document);
      }
    }
  });
}

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
          // Skip decorative images in list items
        } else {
          cloneInlineContent(node, newLi, document);
        }
      }
    });
    list.append(newLi);
  });
  return list;
}

function cloneCellContent(source, target, document) {
  source.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      const text = node.textContent;
      if (text.trim()) target.append(document.createTextNode(text));
    } else if (node.nodeType === 1) {
      const tag = node.tagName.toLowerCase();
      if (tag === 'p') {
        // Recurse into <p> to extract inline content
        cloneCellContent(node, target, document);
        // Add line break between paragraphs if more content follows
        if (node.nextElementSibling) target.append(document.createElement('br'));
      } else if (tag === 'strong' || tag === 'b') {
        const strong = document.createElement('strong');
        cloneCellContent(node, strong, document);
        target.append(strong);
      } else if (tag === 'em' || tag === 'i') {
        const em = document.createElement('em');
        cloneCellContent(node, em, document);
        target.append(em);
      } else if (tag === 'br') {
        target.append(document.createElement('br'));
      } else if (tag === 'a') {
        const a = document.createElement('a');
        a.href = node.getAttribute('href') || node.href;
        a.textContent = node.textContent;
        target.append(a);
      } else {
        // For other elements, recurse into children
        cloneCellContent(node, target, document);
      }
    }
  });
}

function cloneDataTable(sourceTable, document) {
  const rows = sourceTable.querySelectorAll('tr');
  if (rows.length === 0) return null;

  // Build cells array for a Data-Table block.
  // The data-table block JS converts the div structure back to a native <table>.
  // This is necessary because the import pipeline (DOM → markdown → DA HTML)
  // converts all <table> elements to divs, losing the native table structure.
  const cells = [];
  rows.forEach((row) => {
    const rowCells = [];
    row.querySelectorAll('td, th').forEach((cell) => {
      const div = document.createElement('div');
      cloneCellContent(cell, div, document);
      rowCells.push([div.innerHTML ? div : '']);
    });
    if (rowCells.length > 0) cells.push(rowCells);
  });

  if (cells.length === 0) return null;

  return WebImporter.Blocks.createBlock(document, { name: 'Data-Table', cells });
}

function extractContentElement(el, content, document) {
  const tag = el.tagName;

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
    if (p.textContent.trim() || p.querySelector('a') || p.querySelector('img')) {
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
  } else if (tag === 'TABLE') {
    const newTable = cloneDataTable(el, document);
    if (newTable) content.push(newTable);
  } else if (tag === 'DIV') {
    extractFromDiv(el, content, document);
  }
}

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

  Array.from(divEl.children).forEach((child) => {
    extractContentElement(child, content, document);
  });
}

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

// ===== ARTICLE PATH =====

function transformArticle(payload) {
  const { document, url, params } = payload;
  const main = document.body;

  // 1. Pre-parse cleanup
  executeTransformers('beforeTransform', main, payload);

  const pr15 = main.querySelector('.pr15-details');
  if (!pr15) {
    executeTransformers('afterTransform', main, payload);
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );
    return [{ element: main, path, report: { title: document.title, template: 'universal', blocks: [] } }];
  }

  // 2. Detach body, social, and related stories BEFORE article-header parsing

  // 2a. Detach body container
  const bodyContainer = pr15.querySelector('.upspr-two-column_inner');
  let altBodyContainer = null;
  if (bodyContainer) {
    altBodyContainer = bodyContainer.parentElement.querySelector(':scope > .par.responsivegrid');
    bodyContainer.remove();
  }
  if (altBodyContainer) altBodyContainer.remove();

  // 2b. Detach social share
  const socialEl = pr15.querySelector('.upspr-socialmedia');
  if (socialEl) socialEl.remove();

  // 2c. Detach related stories
  const relatedEl = pr15.querySelector('.pr24-background-colour');
  if (relatedEl) relatedEl.remove();

  // 3. Parse article-header
  try {
    articleHeaderParser(pr15, { document, url, params });
  } catch (e) {
    console.error('Failed to parse article-header:', e);
  }

  // 4. Extract body content from detached containers
  const bodyContent = extractArticleBody(document, bodyContainer, altBodyContainer);

  // 5. Build social-share block
  let socialBlock = null;
  if (socialEl) {
    const tempParent = document.createElement('div');
    tempParent.append(socialEl);
    try {
      socialShareParser(socialEl, { document, url, params });
    } catch (e) {
      console.error('Failed to parse social-share:', e);
    }
    socialBlock = tempParent.querySelector('table');
  }

  // 6. Insert body content after article-header table
  const headerTable = main.querySelector('table');
  if (headerTable) {
    const bodySectionBreak = document.createElement('hr');
    headerTable.after(bodySectionBreak);
    let insertPoint = bodySectionBreak;

    bodyContent.forEach((el) => {
      insertPoint.after(el);
      insertPoint = el;
    });

    if (socialBlock) {
      insertPoint.after(socialBlock);
    }
  }

  // 7. Parse related stories section
  const relatedSection = relatedEl || main.querySelector('.pr24-background-colour');
  if (relatedSection) {
    const relatedH2 = relatedSection.querySelector('h2');
    const storiesContainer = relatedSection.querySelector('.upspr-three-column-teaser')
      || relatedSection.querySelector('.upspr-homepage-latest-stories');

    if (storiesContainer) {
      try {
        cardsStoriesParser(storiesContainer, { document, url, params });
      } catch (e) {
        console.error('Failed to parse cards-stories:', e);
      }
    }

    const cardsTable = relatedSection.querySelector('table');
    const hasContent = relatedH2 || cardsTable;

    // Only create related section if there is actual content (h2 or cards)
    if (hasContent) {
      const newRelated = document.createDocumentFragment();

      if (relatedH2) {
        const h2 = document.createElement('h2');
        h2.textContent = relatedH2.textContent.trim();
        newRelated.append(h2);
      }

      if (cardsTable) {
        const rows = cardsTable.querySelectorAll('tr');
        for (let i = MAX_RELATED_CARDS + 1; i < rows.length; i++) {
          rows[i].remove();
        }
        newRelated.append(cardsTable);
      }

      const metaBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: [[['Style'], ['highlight, accent-bar']]],
      });
      newRelated.append(metaBlock);

      const sectionBreak = document.createElement('hr');
      if (relatedSection.parentNode) {
        relatedSection.parentNode.insertBefore(sectionBreak, relatedSection);
        relatedSection.replaceWith(newRelated);
      } else {
        main.append(sectionBreak);
        main.append(newRelated);
      }
    } else if (relatedSection.parentNode) {
      relatedSection.remove();
    }
  }

  // 8. Post-parse cleanup
  executeTransformers('afterTransform', main, payload);

  return { main, blocks: ['article-header', 'embed', 'social-share', 'cards-stories'] };
}

// ===== STANDARD PATH =====

function transformStandard(payload) {
  const { document, url, params } = payload;
  const main = document.body;

  // Phase 0: Pre-detect section wrapper contexts BEFORE cleanup
  const sectionContext = detectSectionContext(main);

  // Phase 1: Pre-parse cleanup
  executeTransformers('beforeTransform', main, payload);

  // Phase 2: Find and parse all blocks (tags tables with wrapper styles via data attributes)
  const blockNames = findAndParseBlocks(main, document, url, params, sectionContext);

  // Phase 3: Post-parse cleanup
  executeTransformers('afterTransform', main, payload);

  // Phase 4: Post-parse cleanup steps

  // 4a. Remove empty hero-featured tables
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

  // 4b. Format HELP focus areas text
  main.querySelectorAll('p').forEach((p) => {
    const text = p.textContent;
    if (text.includes('Health') && text.includes('Humanitarian Relief') && text.includes('\u2022')) {
      const parts = text.split('\u2022').map((s) => s.trim()).filter(Boolean);
      const html = parts.map((part) => {
        const safe = part.replace(/&/g, '&amp;');
        return `<strong>${safe.charAt(0)}</strong>${safe.slice(1)}`;
      }).join(' \u2022 ');
      p.innerHTML = html;
    }
  });

  // 4c. Promote first heading to H1 if it isn't already
  const firstHeading = main.querySelector('h1, h2, h3, h4, h5, h6');
  if (firstHeading && firstHeading.tagName !== 'H1') {
    const h1 = document.createElement('h1');
    h1.textContent = firstHeading.textContent;
    firstHeading.replaceWith(h1);
  }

  // 4d. Convert standalone h4 to h6 (eyebrow sub-headings)
  // After parsers run, h4 elements inside blocks are in <table> cells.
  // Remaining h4 in default content (e.g. "Coupa Supplier Portal" on suppliers
  // page) should become h6 eyebrows styled by global CSS.
  main.querySelectorAll('h4').forEach((h4) => {
    if (h4.closest('table')) return; // skip h4 inside block tables
    const h6 = document.createElement('h6');
    h6.textContent = h4.textContent;
    h4.replaceWith(h6);
  });

  // Phase 5: Walk DOM and collect all content in document order
  const items = [];
  collectContent(main, items);

  // Phase 6: Group into sections (wrapper styles read from table data attributes)
  const sections = groupIntoSections(items);

  // Phase 7: Build output with section breaks and section metadata
  // Data-driven: reads heading data attributes and block wrapper styles to determine
  // which section styles to apply. No hardcoded defaults — only detected styles.
  main.innerHTML = '';
  let firstHeadingSectionSeen = false;

  sections.forEach((section, index) => {
    if (index > 0) {
      main.appendChild(document.createElement('hr'));
    }

    const isH1Section = section.some((item) => item.type === 'h1');
    const startsWithHeading = section.length > 0
      && (section[0].type === 'heading' || section[0].type === 'h1');

    // Determine wrapper style from block table data attributes
    let sectionWrapperStyle = null;
    for (const item of section) {
      if (item.type === 'block' && item.element.dataset.wrapperStyle) {
        sectionWrapperStyle = item.element.dataset.wrapperStyle;
        break;
      }
    }

    section.forEach((item) => {
      main.appendChild(cleanClone(item, document));
    });

    // Build section styles from detected context (heading data attrs + block wrappers)
    const styles = [];

    // Check heading-level data attributes
    const sectionHeadings = section.filter(
      (item) => item.type === 'h1' || item.type === 'heading',
    );
    const hasArc = sectionHeadings.some(
      (item) => item.element.dataset && item.element.dataset.sectionArc === 'true',
    );
    const hasDark = sectionHeadings.some(
      (item) => item.element.dataset && item.element.dataset.sectionDark === 'true',
    );
    const hasAccentBar = sectionHeadings.some(
      (item) => item.element.dataset && item.element.dataset.accentBar === 'true',
    );

    // Background/wrapper style (priority: dark > arc > block wrapper)
    if (hasDark || sectionWrapperStyle === 'dark') {
      styles.push('dark');
    } else if (hasArc || sectionWrapperStyle === 'arc') {
      styles.push('arc');
    } else if (sectionWrapperStyle) {
      styles.push(sectionWrapperStyle);
    }

    // Accent-bar — only when explicitly detected via .upspr-under-eyebrow
    if (hasAccentBar) {
      styles.push('accent-bar');
    }

    // Spacing for heading-only sections without any detected wrapper style
    if (startsWithHeading && !hasDark && !hasArc && !sectionWrapperStyle) {
      if (!isH1Section) {
        if (!firstHeadingSectionSeen) {
          styles.push('spacing-l');
          firstHeadingSectionSeen = true;
        } else {
          styles.push('spacing-xl');
        }
      }
    }

    if (styles.length > 0) {
      main.appendChild(createSectionMetadataTable(document, styles.join(', ')));
    }
  });

  // Clean up data attributes from block tables so they don't leak into output HTML
  main.querySelectorAll('table[data-wrapper-style]').forEach((t) => {
    delete t.dataset.wrapperStyle;
  });

  return { main, blocks: blockNames };
}

// ===== ENTRY POINT =====

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // Detect article path: .pr15-details exists BEFORE any cleanup
    const isArticle = !!main.querySelector('.pr15-details');

    let result;
    if (isArticle) {
      result = transformArticle(payload);
      // transformArticle returns early for missing pr15
      if (Array.isArray(result)) return result;
    } else {
      result = transformStandard(payload);
    }

    // Finalize: WebImporter built-in rules
    result.main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(result.main, document);
    WebImporter.rules.transformBackgroundImages(result.main, document);
    WebImporter.rules.adjustImageUrls(result.main, url, params.originalURL);

    // Generate sanitized output path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: result.main,
      path,
      report: {
        title: document.title,
        template: 'universal',
        blocks: result.blocks,
      },
    }];
  },
};
