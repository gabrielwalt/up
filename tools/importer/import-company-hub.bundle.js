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

  // tools/importer/import-company-hub.js
  var import_company_hub_exports = {};
  __export(import_company_hub_exports, {
    default: () => import_company_hub_default
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

  // tools/importer/utils/image-utils.js
  function resolveImageSrc(el, document, baseUrl) {
    const base = baseUrl || document.baseURI || document.location?.href || "";
    function resolve(raw) {
      if (!raw) return null;
      const url = raw.split(",")[0].trim().split(/\s+/)[0];
      if (!url) return null;
      if (/^https?:\/\//.test(url)) return url;
      try {
        return new URL(url, base).href;
      } catch {
      }
      try {
        const origin = new URL(base).origin;
        if (url.startsWith("/")) return origin + url;
      } catch {
      }
      return url;
    }
    const picture = el.querySelector("picture");
    if (picture) {
      const sources = picture.querySelectorAll("source");
      for (const source of sources) {
        const srcset = source.getAttribute("srcset") || source.getAttribute("data-srcset");
        const resolved = resolve(srcset);
        if (resolved) return resolved;
      }
    }
    const img = el.querySelector("img");
    if (img) {
      const srcset = img.getAttribute("srcset") || img.getAttribute("data-srcset");
      const resolved = resolve(srcset);
      if (resolved) return resolved;
      const src = img.getAttribute("src") || img.getAttribute("data-src");
      if (src) return resolve(src) || src;
      if (img.src) return img.src;
    }
    return null;
  }

  // tools/importer/parsers/hero-featured.js
  function parse(element, { document, url }) {
    const baseUrl = url || document.baseURI || "";
    const imgUrl = resolveImageSrc(element, document, baseUrl);
    const imageCell = [];
    if (imgUrl) {
      const img = document.createElement("img");
      img.src = imgUrl;
      const origImg = element.querySelector("img");
      if (origImg?.alt) img.alt = origImg.alt;
      imageCell.push(img);
    }
    const msgDiv = element.querySelector(".upspr-heroimage_msg");
    const contentCell = [];
    if (msgDiv) {
      const eyebrowText = msgDiv.querySelector(".upspr-eyebrow-text");
      if (eyebrowText) {
        const p = document.createElement("p");
        p.textContent = toTitleCase(eyebrowText.textContent.trim());
        contentCell.push(p);
      }
      const heading = msgDiv.querySelector("h4");
      if (heading) {
        const h4 = document.createElement("h4");
        h4.textContent = heading.textContent.trim();
        contentCell.push(h4);
      }
      const paragraphs = msgDiv.querySelectorAll(":scope > p");
      paragraphs.forEach((p) => {
        const newP = document.createElement("p");
        newP.textContent = p.textContent.trim();
        contentCell.push(newP);
      });
      const ctaLink = msgDiv.querySelector(".upspr-read-the-story a.btn");
      if (ctaLink) {
        const icon = ctaLink.querySelector("i.upspr");
        if (icon) icon.remove();
        const readerTxt = ctaLink.querySelector(".upspr-readerTxt");
        if (readerTxt) readerTxt.remove();
        const p = document.createElement("p");
        const link = document.createElement("a");
        link.href = ctaLink.href;
        link.textContent = ctaLink.textContent.trim();
        p.append(link);
        contentCell.push(p);
      }
    }
    const cells = [
      [imageCell],
      [contentCell]
    ];
    const contentWrapper = element.querySelector(".upspr-heroimage_content--right");
    const blockName = contentWrapper ? "Hero-Featured (hero-featured-right)" : "Hero-Featured";
    const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/fact-sheets.js
  function parse2(element, { document }) {
    const cells = [];
    const statItems = element.querySelectorAll("li");
    statItems.forEach((item) => {
      const img = item.querySelector("img");
      const h4 = item.querySelector("h4");
      const p = item.querySelector("p");
      const imageCell = [];
      if (img) {
        const newImg = document.createElement("img");
        newImg.src = img.src;
        newImg.alt = img.alt || "";
        imageCell.push(newImg);
      }
      const textCell = [];
      if (h4) {
        const newH4 = document.createElement("h4");
        newH4.textContent = h4.textContent.trim();
        textCell.push(newH4);
      }
      if (p) {
        const newP = document.createElement("p");
        newP.textContent = p.textContent.trim();
        textCell.push(newP);
      }
      cells.push([imageCell, textCell]);
    });
    const ctaLink = element.querySelector('a.btn, a[class*="btn"], .upspr-read-the-story a');
    if (ctaLink) {
      const icon = ctaLink.querySelector("i.upspr");
      if (icon) icon.remove();
      const p = document.createElement("p");
      const strong = document.createElement("strong");
      const link = document.createElement("a");
      link.href = ctaLink.href;
      link.textContent = ctaLink.textContent.trim();
      strong.append(link);
      p.append(strong);
      cells.push([[p]]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Fact-Sheets", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-feature.js
  function parse3(element, { document, url }) {
    const baseUrl = url || document.baseURI || "";
    const imgUrl = resolveImageSrc(element, document, baseUrl);
    const contentDiv = element.querySelector(".upspr-xd-card_content");
    const textCell = [];
    if (contentDiv) {
      const eyebrow = contentDiv.querySelector(".upspr-xd-card_eyebrow");
      if (eyebrow) {
        const p = document.createElement("p");
        p.textContent = toTitleCase(eyebrow.textContent.trim());
        textCell.push(p);
      }
      const heading = contentDiv.querySelector("h2, h3");
      if (heading) {
        const h = document.createElement(heading.tagName.toLowerCase());
        h.textContent = heading.textContent.trim();
        textCell.push(h);
      }
      const paragraphs = contentDiv.querySelectorAll(":scope > p");
      paragraphs.forEach((srcP) => {
        const p = document.createElement("p");
        p.textContent = srcP.textContent.trim();
        textCell.push(p);
      });
      const cta = contentDiv.querySelector("a.btn, a.btn-secondary");
      if (cta) {
        const icon = cta.querySelector("i.upspr");
        if (icon) icon.remove();
        const p = document.createElement("p");
        const link = document.createElement("a");
        link.href = cta.href;
        link.textContent = cta.textContent.trim();
        p.append(link);
        textCell.push(p);
      }
    }
    const imageCell = [];
    if (imgUrl) {
      const img = document.createElement("img");
      img.src = imgUrl;
      const origImg = element.querySelector("img");
      if (origImg?.alt) img.alt = origImg.alt;
      imageCell.push(img);
    }
    const firstCol = element.querySelector(".row > div:first-child");
    const imageIsFirst = firstCol && (firstCol.querySelector("picture") || firstCol.querySelector("img"));
    const cells = [];
    if (imageIsFirst) {
      cells.push([imageCell, textCell]);
    } else {
      cells.push([textCell, imageCell]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns-Feature", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-quote.js
  function parse4(element, { document }) {
    const quoteCell = [];
    const quoteHeading = element.querySelector(".upspr-testimonial__wrap--title, .upspr-testimonial__wrap h3");
    if (quoteHeading) {
      const h3 = document.createElement("h3");
      h3.textContent = quoteHeading.textContent.trim().replace(/^[\u201C\u201D\u201E\u201F"«»]+|[\u201C\u201D\u201E\u201F"«»]+$/g, "").trim();
      quoteCell.push(h3);
    }
    const attribution = element.querySelector(".upspr-testimonial__wrap--name .upspr-eyebrow-text") || element.querySelector(".upspr-testimonial__wrap--name");
    if (attribution) {
      const p = document.createElement("p");
      p.textContent = toTitleCase(attribution.textContent.trim());
      quoteCell.push(p);
    }
    const imageCell = [];
    const imgContainer = element.querySelector(".upspr-testimonial__image") || element;
    const imgUrl = resolveImageSrc(imgContainer, document);
    if (imgUrl) {
      const img = document.createElement("img");
      img.src = imgUrl;
      const origImg = imgContainer.querySelector("img");
      if (origImg?.alt) img.alt = origImg.alt;
      imageCell.push(img);
    }
    const cells = [
      [quoteCell, imageCell]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns-Quote", cells });
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

  // tools/importer/import-company-hub.js
  var parsers = {
    "hero-featured": parse,
    "fact-sheets": parse2,
    "columns-feature": parse3,
    "columns-quote": parse4
  };
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "company-hub",
    description: "Our Company landing page with hero heading, hero-featured card, stats row, columns-feature sections, and CEO quote",
    urls: [
      "https://about.ups.com/us/en/our-company.html"
    ],
    blocks: [
      {
        name: "hero-featured",
        instances: [".hero .upspr-heroimage"]
      },
      {
        name: "fact-sheets",
        instances: [".upspr-facts-container", ".upspr-stats-container"]
      },
      {
        name: "columns-feature",
        instances: [".sectioncard .upspr-xd-card"]
      },
      {
        name: "columns-quote",
        instances: [".quotes .upspr-testimonial"]
      }
    ],
    sections: [
      {
        id: "hero-heading",
        name: "Hero Heading",
        selector: ".headline.aem-GridColumn",
        style: "arc",
        blocks: [],
        defaultContent: [".upspr-headline h1"]
      },
      {
        id: "hero-featured-stats",
        name: "Hero Featured and Stats",
        selector: [".hero.aem-GridColumn", ".responsivegrid > .aem-Grid > div:has(.upspr-heroimage)"],
        style: null,
        blocks: ["hero-featured", "fact-sheets"],
        defaultContent: []
      },
      {
        id: "feature-sections",
        name: "Feature Sections",
        selector: ".sectioncard",
        style: "highlight",
        blocks: ["columns-feature"],
        defaultContent: []
      },
      {
        id: "quote-section",
        name: "CEO Quote",
        selector: ".quotes",
        style: null,
        blocks: ["columns-quote"],
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
    const headerCell = document.createElement("th");
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
          const clone = el.cloneNode(true);
          output.appendChild(clone);
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
  var import_company_hub_default = {
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
  return __toCommonJS(import_company_hub_exports);
})();
