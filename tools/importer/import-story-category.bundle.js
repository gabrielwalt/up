var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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
        const picture = document.createElement("picture");
        const newImg = document.createElement("img");
        newImg.src = img.src;
        newImg.alt = img.alt || "";
        picture.append(newImg);
        imageCell.push(picture);
      }
      const textCell = [];
      if (eyebrowText) {
        const p = document.createElement("p");
        p.textContent = eyebrowText.textContent.trim();
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
        selector: ".headline.aem-GridColumn",
        style: null,
        blocks: [],
        defaultContent: [".upspr-headline h1"]
      },
      {
        id: "story-cards",
        name: "Story Cards Grid",
        selector: ".pr04-threecolumnteaser",
        style: null,
        blocks: ["cards-stories"],
        defaultContent: [".load-more-cta"]
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
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
  return __toCommonJS(import_story_category_exports);
})();
