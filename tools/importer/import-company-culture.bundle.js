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

  // tools/importer/import-company-culture.js
  var import_company_culture_exports = {};
  __export(import_company_culture_exports, {
    default: () => import_company_culture_default
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

  // tools/importer/parsers/columns-media.js
  function cleanAltText(alt) {
    if (!alt) return alt;
    return alt.replace(/\bu-p-s-ers\b/gi, "UPSers").replace(/\bsmiling as the break\b/g, "smiling as they break").replace(/\bhigh-five in and unloading\b/g, "high-five in an unloading");
  }
  function cloneInlineContent(sourceEl, document) {
    const fragment = document.createDocumentFragment();
    sourceEl.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        fragment.appendChild(document.createTextNode(node.textContent));
      } else if (node.nodeType === 1) {
        const tag = node.tagName.toLowerCase();
        if (tag === "b" || tag === "strong") {
          const strong = document.createElement("strong");
          strong.textContent = node.textContent;
          fragment.appendChild(strong);
        } else if (tag === "em" || tag === "i") {
          const em = document.createElement("em");
          em.textContent = node.textContent;
          fragment.appendChild(em);
        } else if (tag === "a") {
          const a = document.createElement("a");
          a.href = node.href;
          a.textContent = node.textContent;
          fragment.appendChild(a);
        } else if (tag === "br") {
          fragment.appendChild(document.createElement("br"));
        } else {
          fragment.appendChild(document.createTextNode(node.textContent));
        }
      }
    });
    return fragment;
  }
  function parse(element, { document, url }) {
    const baseUrl = url || document.baseURI || "";
    const heroText = element.querySelector(".herotext");
    const heroImage = element.querySelector(".heroimage");
    if (heroText && heroImage) {
      const cells2 = [];
      const textCell = [];
      const h1 = heroText.querySelector("h1");
      if (h1) {
        const heading = document.createElement("h1");
        heading.textContent = toTitleCase(h1.textContent.trim());
        textCell.push(heading);
      }
      const paragraphs = heroText.querySelectorAll(":scope > p");
      paragraphs.forEach((srcP) => {
        const p = document.createElement("p");
        p.appendChild(cloneInlineContent(srcP, document));
        textCell.push(p);
      });
      const imageCell = [];
      const imgUrl = resolveImageSrc(heroImage, document, baseUrl);
      if (imgUrl) {
        const img = document.createElement("img");
        img.src = imgUrl;
        const origImg = heroImage.querySelector("img");
        const alt = origImg?.alt || "";
        img.alt = alt || "UPS Culture diagram showing purpose, strategy, culture and stakeholders";
        imageCell.push(img);
      }
      cells2.push([textCell, imageCell]);
      const block2 = WebImporter.Blocks.createBlock(document, { name: "Columns-Media", cells: cells2 });
      element.replaceWith(block2);
      return;
    }
    const items = element.querySelectorAll(".list-item");
    if (!items.length) return;
    const cells = [];
    items.forEach((item) => {
      const imageCell = [];
      const imgUrl = resolveImageSrc(item, document, baseUrl);
      if (imgUrl) {
        const img = document.createElement("img");
        img.src = imgUrl;
        const origImg = item.querySelector("img");
        if (origImg?.alt) img.alt = cleanAltText(origImg.alt);
        imageCell.push(img);
      }
      const textCell = [];
      const titleEl = item.querySelector(".list-item-title");
      if (titleEl) {
        const h2 = document.createElement("h2");
        h2.textContent = toTitleCase(titleEl.textContent.trim());
        textCell.push(h2);
      }
      const descEl = item.querySelector(".list-item-description");
      if (descEl) {
        const descParagraphs = descEl.querySelectorAll(":scope > p");
        descParagraphs.forEach((srcP) => {
          const p = document.createElement("p");
          p.appendChild(cloneInlineContent(srcP, document));
          textCell.push(p);
        });
        const lists = descEl.querySelectorAll(":scope > ul");
        lists.forEach((srcUl) => {
          const ul = document.createElement("ul");
          srcUl.querySelectorAll(":scope > li").forEach((srcLi) => {
            const li = document.createElement("li");
            li.appendChild(cloneInlineContent(srcLi, document));
            ul.appendChild(li);
          });
          textCell.push(ul);
        });
      }
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns-Media", cells });
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

  // tools/importer/import-company-culture.js
  var parsers = {
    "columns-media": parse
  };
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "company-culture",
    description: "Culture page with hero heading and description, culture wheel infographic, and three image-text value sections",
    urls: [
      "https://about.ups.com/us/en/our-company/our-culture.html"
    ],
    blocks: [
      {
        name: "columns-media",
        instances: [".herogrid", "#list-container", ".upspr-two-column_content_ytembed #list-container"]
      }
    ],
    sections: [
      {
        id: "hero-intro",
        name: "Hero Intro with Culture Wheel",
        style: "arc-wave",
        blocks: ["columns-media"],
        defaultContent: []
      },
      {
        id: "value-sections",
        name: "Values, Partnership, and Leadership Sections",
        style: null,
        blocks: ["columns-media"],
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
  var import_company_culture_default = {
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
      const columnsMediaTables = blockTableMap["columns-media"] || [];
      main.innerHTML = "";
      if (columnsMediaTables.length > 0) {
        main.appendChild(columnsMediaTables[0].cloneNode(true));
      }
      main.appendChild(createSectionMetadata(document, "arc-wave"));
      main.appendChild(document.createElement("hr"));
      for (let i = 1; i < columnsMediaTables.length; i++) {
        main.appendChild(columnsMediaTables[i].cloneNode(true));
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
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_company_culture_exports);
})();
