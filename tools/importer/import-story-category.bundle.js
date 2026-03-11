var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-story-category.js
  var import_story_category_exports = {};
  __export(import_story_category_exports, {
    default: () => import_story_category_default
  });

  // tools/importer/utils/text-utils.js
  var ACRONYMS = /* @__PURE__ */ new Set([
    "UPS",
    "CEO",
    "CFO",
    "COO",
    "CTO",
    "CIO",
    "ESG",
    "DEI",
    "CSR",
    "US",
    "UK",
    "EU",
    "UN",
    "AI",
    "IT",
    "HR",
    "PR",
    "B2B",
    "B2C",
    "D2C"
  ]);
  function toTitleCase(text) {
    if (!text || text.length < 3) return text;
    if (text !== text.toUpperCase()) return text;
    return text.split(/(\s+)/).map((segment) => {
      if (/^\s+$/.test(segment)) return segment;
      return segment.split(/([-,])/).map((part) => {
        if (part === "-" || part === ",") return part;
        if (ACRONYMS.has(part)) return part;
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join("");
    }).join("");
  }

  // tools/importer/parsers/cards-stories.js
  function parse(element, { document }) {
    const cells = [];
    const cardItems = element.querySelectorAll(".upspr-stories-list__item");
    cardItems.forEach((card) => {
      const img = card.querySelector(".upspr-content-tile__image img");
      const eyebrowText = card.querySelector(".upspr-content-tile__topic .upspr-eyebrow-text");
      const title = card.querySelector(".upspr-content-tile__details h3");
      const description = card.querySelector(".upspr-description");
      const cardLink = card.querySelector("a.upspr-content-tile__link");
      const imageCell = [];
      if (img) {
        const newImg = document.createElement("img");
        newImg.src = img.src;
        newImg.alt = img.alt || "";
        imageCell.push(newImg);
      }
      const textCell = [];
      if (eyebrowText) {
        const p = document.createElement("p");
        p.textContent = toTitleCase(eyebrowText.textContent.trim());
        textCell.push(p);
      }
      if (title) {
        const h3 = document.createElement("h3");
        if (cardLink) {
          const link = document.createElement("a");
          link.href = cardLink.getAttribute("href") || cardLink.href;
          link.textContent = title.textContent.trim();
          h3.append(link);
        } else {
          h3.textContent = title.textContent.trim();
        }
        textCell.push(h3);
      }
      if (description) {
        const p = document.createElement("p");
        p.textContent = description.textContent.trim();
        textCell.push(p);
      }
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Cards-Stories", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/ups-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#uspsr-navContainer",
        ".upspr-sticky-nav",
        ".cmp-experiencefragment--upspr-header-fragment"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".cmp-experiencefragment--upspr-footer-fragment",
        ".upspr-footer"
      ]);
      const emptyBlocks = element.querySelectorAll(".pr20-contentblock");
      emptyBlocks.forEach((block) => {
        const text = block.textContent.trim().replace(/\u00a0/g, "");
        if (!text) {
          block.remove();
        }
      });
      WebImporter.DOMUtils.remove(element, [
        ".video.dynamicmedia"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "input"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".upspr-overlay-global"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".cmp-experiencefragment--breadcrumbExperienceFragment",
        ".upspr-breadcrumb-container"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk",
        "#onetrust-style"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "footer"
      ]);
      const trackingPixels = element.querySelectorAll('img[src*="rlcdn.com"], img[src*="doubleclick.net"], img[src*="demdex.net"]');
      trackingPixels.forEach((img) => {
        const parent = img.closest("p") || img.parentElement;
        if (parent && parent.children.length <= 1) {
          parent.remove();
        } else {
          img.remove();
        }
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "link",
        "noscript"
      ]);
      const decorativeIcons = element.querySelectorAll("i.upspr");
      decorativeIcons.forEach((icon) => {
        icon.remove();
      });
      const readerSpans = element.querySelectorAll(".upspr-readerTxt");
      readerSpans.forEach((span) => {
        span.remove();
      });
      element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
        const original = heading.textContent.trim();
        const converted = toTitleCase(original);
        if (converted !== original) {
          heading.textContent = converted;
        }
      });
    }
  }

  // tools/importer/import-story-category.js
  var parsers = {
    "cards-stories": parse
  };
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "story-category",
    description: "Story category listing page with h1 heading and story cards grid with Load More button",
    urls: [
      "https://about.ups.com/us/en/our-stories/customer-first.html",
      "https://about.ups.com/us/en/our-stories/people-led.html",
      "https://about.ups.com/us/en/our-stories/innovation-driven.html"
    ],
    blocks: [
      {
        name: "cards-stories",
        instances: [
          ".pr04-threecolumnteaser .upspr-homepage-latest-stories",
          ".pr04-threecolumnteaser .upspr-three-column-teaser"
        ]
      }
    ],
    sections: [
      {
        id: "hero-heading",
        name: "Category Heading",
        style: "arc",
        blocks: [],
        defaultContent: [".upspr-headline h1"]
      },
      {
        id: "story-cards",
        name: "Story Cards Grid",
        style: null,
        blocks: ["cards-stories"],
        defaultContent: []
      }
    ]
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
            section: blockDef.section || null
          });
        });
      });
    });
    return pageBlocks;
  }
  function findBlockTables(main) {
    const tableMap = {};
    main.querySelectorAll("table").forEach((table) => {
      const firstRow = table.querySelector("tr");
      if (!firstRow) return;
      const firstCell = firstRow.querySelector("th, td");
      if (!firstCell) return;
      const name = firstCell.textContent.trim().toLowerCase().replace(/\s+/g, "-");
      if (!tableMap[name]) tableMap[name] = [];
      tableMap[name].push(table);
    });
    return tableMap;
  }
  function createSectionMetadata(document, style) {
    const table = document.createElement("table");
    const headerRow = document.createElement("tr");
    const headerCell = document.createElement("td");
    headerCell.colSpan = 2;
    headerCell.textContent = "Section Metadata";
    headerRow.appendChild(headerCell);
    table.appendChild(headerRow);
    const dataRow = document.createElement("tr");
    const keyCell = document.createElement("td");
    keyCell.textContent = "Style";
    const valueCell = document.createElement("td");
    valueCell.textContent = style;
    dataRow.appendChild(keyCell);
    dataRow.appendChild(valueCell);
    table.appendChild(dataRow);
    return table;
  }
  function assembleSections(document, main, template, blockTableMap) {
    const output = document.createElement("div");
    template.sections.forEach((sectionDef, index) => {
      if (index > 0) {
        output.appendChild(document.createElement("hr"));
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
  var import_story_category_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
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
      executeTransformers("afterTransform", main, payload);
      const blockTableMap = findBlockTables(main);
      if (PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 0) {
        const sectionOutput = assembleSections(document, main, PAGE_TEMPLATE, blockTableMap);
        main.innerHTML = "";
        while (sectionOutput.firstChild) {
          main.appendChild(sectionOutput.firstChild);
        }
      }
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name),
          sections: PAGE_TEMPLATE.sections.map((s) => ({ id: s.id, style: s.style }))
        }
      }];
    }
  };
  return __toCommonJS(import_story_category_exports);
})();
