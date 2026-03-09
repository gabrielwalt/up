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

  // tools/importer/import-company-strategy.js
  var import_company_strategy_exports = {};
  __export(import_company_strategy_exports, {
    default: () => import_company_strategy_default
  });

  // tools/importer/parsers/hero-featured.js
  var ACRONYMS = /* @__PURE__ */ new Set(["UPS", "CEO", "CFO", "COO", "CTO", "CIO", "ESG", "DEI", "CSR", "US", "UK", "EU", "UN", "AI", "IT", "HR", "PR", "B2B", "B2C", "D2C"]);
  function toTitleCase(text) {
    if (!text || text.length < 3) return text;
    if (text !== text.toUpperCase()) return text;
    return text.split(/(\s+)/).map((seg) => {
      if (/^\s+$/.test(seg)) return seg;
      return seg.split(/([-])/).map((part) => {
        if (part === "-") return part;
        if (ACRONYMS.has(part)) return part;
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join("");
    }).join("");
  }
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
    const block = WebImporter.Blocks.createBlock(document, { name: "Hero-Featured", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-stories.js
  var ACRONYMS2 = /* @__PURE__ */ new Set(["UPS", "CEO", "CFO", "COO", "CTO", "CIO", "ESG", "DEI", "CSR", "US", "UK", "EU", "UN", "AI", "IT", "HR", "PR", "B2B", "B2C", "D2C"]);
  function toTitleCase2(text) {
    if (!text || text.length < 3) return text;
    if (text !== text.toUpperCase()) return text;
    return text.split(/(\s+)/).map((seg) => {
      if (/^\s+$/.test(seg)) return seg;
      return seg.split(/([-])/).map((part) => {
        if (part === "-") return part;
        if (ACRONYMS2.has(part)) return part;
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join("");
    }).join("");
  }
  function parse2(element, { document }) {
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
        p.textContent = toTitleCase2(eyebrowText.textContent.trim());
        textCell.push(p);
      }
      if (title) {
        const h3 = document.createElement("h3");
        if (cardLink) {
          const link = document.createElement("a");
          link.href = cardLink.href;
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

  // tools/importer/parsers/columns-feature.js
  var ACRONYMS3 = /* @__PURE__ */ new Set(["UPS", "CEO", "CFO", "COO", "CTO", "CIO", "ESG", "DEI", "CSR", "US", "UK", "EU", "UN", "AI", "IT", "HR", "PR", "B2B", "B2C", "D2C"]);
  function toTitleCase3(text) {
    if (!text || text.length < 3) return text;
    if (text !== text.toUpperCase()) return text;
    return text.split(/(\s+)/).map((seg) => {
      if (/^\s+$/.test(seg)) return seg;
      return seg.split(/([-])/).map((part) => {
        if (part === "-") return part;
        if (ACRONYMS3.has(part)) return part;
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join("");
    }).join("");
  }
  function resolveImageSrc2(el, document, baseUrl) {
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
  function parse3(element, { document, url }) {
    const baseUrl = url || document.baseURI || "";
    const imgUrl = resolveImageSrc2(element, document, baseUrl);
    const contentDiv = element.querySelector(".upspr-xd-card_content");
    const textCell = [];
    if (contentDiv) {
      const eyebrow = contentDiv.querySelector(".upspr-xd-card_eyebrow");
      if (eyebrow) {
        const p = document.createElement("p");
        p.textContent = toTitleCase3(eyebrow.textContent.trim());
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
      const ACRONYMS4 = /* @__PURE__ */ new Set(["UPS", "CEO", "CFO", "COO", "CTO", "CIO", "ESG", "DEI", "CSR", "US", "UK", "EU", "UN", "AI", "IT", "HR", "PR", "B2B", "B2C", "D2C"]);
      element.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
        const text = heading.textContent.trim();
        if (text && text.length >= 3 && text === text.toUpperCase()) {
          heading.textContent = text.split(/(\s+)/).map((seg) => {
            if (/^\s+$/.test(seg)) return seg;
            return seg.split(/([-,])/).map((part) => {
              if (part === "-" || part === ",") return part;
              if (ACRONYMS4.has(part)) return part;
              return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            }).join("");
          }).join("");
        }
      });
    }
  }

  // tools/importer/import-company-strategy.js
  var parsers = {
    "hero-featured": parse,
    "cards-stories": parse2,
    "columns-feature": parse3
  };
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "company-strategy",
    description: "Strategy page with hero heading and subtitle, hero-featured card, centered text, story cards, columns-feature, and company profile blockquote",
    urls: [
      "https://about.ups.com/us/en/our-company/our-strategy.html"
    ],
    blocks: [
      {
        name: "hero-featured",
        instances: [".hero .upspr-heroimage"]
      },
      {
        name: "cards-stories",
        instances: [
          ".pr04-threecolumnteaser .upspr-homepage-latest-stories",
          ".pr04-threecolumnteaser .upspr-three-column-teaser"
        ]
      },
      {
        name: "columns-feature",
        instances: [".sectioncard .upspr-xd-card"]
      }
    ],
    sections: [
      {
        id: "hero-heading",
        name: "Hero Heading with Subtitle",
        selector: ".headline.aem-GridColumn",
        style: null,
        blocks: [],
        defaultContent: [".upspr-headline h1", ".upspr-headline h4", ".upspr-headline p"]
      },
      {
        id: "hero-featured",
        name: "Hero Featured Card",
        selector: ".hero.aem-GridColumn",
        style: null,
        blocks: ["hero-featured"],
        defaultContent: []
      },
      {
        id: "centered-text",
        name: "Centered Text",
        selector: ".headline.aem-GridColumn:has(h2)",
        style: null,
        blocks: [],
        defaultContent: [".upspr-headline h2", ".upspr-headline p"]
      },
      {
        id: "story-cards",
        name: "Story Cards",
        selector: ".pr04-threecolumnteaser",
        style: null,
        blocks: ["cards-stories"],
        defaultContent: []
      },
      {
        id: "feature-section",
        name: "Feature Section",
        selector: ".sectioncard",
        style: null,
        blocks: ["columns-feature"],
        defaultContent: []
      },
      {
        id: "company-profile",
        name: "Company Profile",
        selector: ".pr20-contentblock.text.aem-GridColumn:has(blockquote)",
        style: null,
        blocks: [],
        defaultContent: [".cmp-text h2", ".cmp-text blockquote"]
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
  var import_company_strategy_default = {
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
  return __toCommonJS(import_company_strategy_exports);
})();
