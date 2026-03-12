# Project Memory - UPS Migration

Migrating UPS "About" site (https://about.ups.com/us/en/home.html) to Adobe Edge Delivery Services.

---

## ⚠️ CRITICAL RULES

1. **NEVER create screenshots outside `/tmp` folder** - All screenshots MUST be saved to `/tmp/` directory. Never save screenshots to project root or any workspace folder.
2. **Always read files before editing** - Never modify code without reading it first.
3. **Use `box-sizing: border-box`** - When setting explicit width/height on elements with padding.
4. **REUSE existing blocks** - Always use existing blocks and variants before creating new ones. See "Block Reuse Guidelines" section.
5. **Keep PROJECT.md up-to-date** - Update this file when creating/modifying/deleting blocks, variants, or patterns. See "Maintaining This Documentation" section.
6. **Create variants, not new blocks** - When a content pattern is similar to an existing block but needs different styling, create a VARIANT of that block (not a new block). This maintains consistency and reduces code duplication.
7. **Never import all-caps content as-is** - When source content is ALL CAPS in the DOM (e.g., "REPORTS AND DISCLOSURES"), convert it to Title Case or Sentence case in the HTML content and apply `text-transform: uppercase` via CSS instead. This preserves authoring flexibility and avoids requiring authors to type in all caps.
8. **Don't rely on bold/strong for block-wide styling** - If an entire text element in a block needs to be bold or styled differently (like eyebrow labels or attribution text), apply `font-weight: 700` via CSS targeting the element position (e.g., `:first-child`). Reserve `<strong>` only for inline emphasis where the author wants to distinguish specific words from surrounding text.
9. **Keep import scripts aligned with content `.plain.html`** - When changing content markup patterns, update all related parsers in `tools/importer/parsers/`. Content `.plain.html` is the source of truth; parsers must reproduce it exactly. See "Import Script Alignment" in Migration Rules.
10. **NEVER push HTML content via Git** - Content and code are strictly separated. Content lives in the CMS (DA), code lives in Git. Never add `.html` files to Git, never modify `.gitignore` to track HTML files. See "Content Architecture" section.
11. **NEVER commit or push to Git yourself** - The user handles all Git operations (commit, push, branch management). Only make code changes to files — leave staging, committing, and pushing to the user.
12. **Code must be compatible with DA markup** - DA (Document Authoring) wraps inline content in `<p>` tags. Block JS and CSS must handle this gracefully with flexible selectors — never add JS workarounds to unwrap DA markup. See "DA Markup Compatibility" section.
13. **`.plain.html` is the single source of truth** - All content edits and updates are made directly to `.plain.html` files in `/content/`. No `.html` files exist in the content folder. `.plain.html` uses div-format blocks (`<div class="block-name">`) and section `<div>` wrappers — this is the format DA consumes. See "Content Architecture" section.
14. **Keep `/sitemap.json` up-to-date at all times** - Update the sitemap whenever pages are discovered, imported, re-imported, refactored, validated, critiqued, or approved. This is the master tracker for migration progress. See "Sitemap Maintenance" section.
15. **Keep sitemap blocks[] current after every content change** - After running import scripts, re-importing pages, or changing page content, immediately update the affected page's `blocks[]` and `sectionStyles[]` in `/sitemap.json`. Before refactoring block CSS/JS, query the sitemap to find all affected pages and verify changes on them.

---

## Block Reuse Guidelines

**IMPORTANT**: When importing new pages or content, ALWAYS prioritize reusing existing blocks and their variants.

### Before Creating a New Block

1. **Check the Block Reference table** - Review all existing blocks and their variants
2. **Analyze if existing blocks can work** - Consider:
   - Can an existing block handle this content with its current structure?
   - Can an existing variant be used with minor CSS adjustments?
   - Can a new variant of an existing block solve the need?
3. **Only create new blocks when**:
   - No existing block can reasonably accommodate the content pattern
   - The content structure is fundamentally different from all existing blocks
   - Creating a variant would require more than 50% new code

### Decision Tree for Content Mapping

```
New content section identified
    ↓
Does it match an existing block's purpose?
    ├─ YES → Use that block
    │         ↓
    │     Does styling match an existing variant?
    │         ├─ YES → Use existing variant
    │         └─ NO → Can styling be achieved with section styles (highlight)?
    │                   ├─ YES → Use base block + section style
    │                   └─ NO → Create new VARIANT (not new block)
    │
    └─ NO → Is it similar to any existing block?
              ├─ YES → Create new VARIANT of that block
              └─ NO → Create new BLOCK (document it immediately!)
```

### Variant Naming Convention

Use descriptive kebab-case names. **Block-specific variants** must be prefixed with the block name to avoid ambiguity. **Generic variants** that apply to any block or section use a short standalone name.

**Block-specific** (prefix with block name):
- `carousel-hero` - Hero-style carousel (only makes sense on the carousel block)
- `cards-featured` - Featured card layout (specific to cards)
- `columns-stats` - Statistics display (specific to columns)
- `carousel-testimonials` - Quote carousel (specific to carousel)

**Generic** (no prefix, reusable across blocks/sections):
- `highlight` - Light grey background

### Examples of Correct Reuse

| Content Need | ✅ Correct Approach | ❌ Wrong Approach |
|--------------|---------------------|-------------------|
| Hero banner with different colors | Use `carousel (carousel-hero)` or `teaser (teaser-hero)` | Create new `hero-banner` block |
| **Single hero item (no rotation)** | Use `teaser (teaser-hero)` | Use `carousel (carousel-hero)` with single slide |
| Stats display (numbers + labels) | Use `columns (columns-stats)` | Create new `stats` block |
| Expandable FAQ | Use `accordion` | Create new `faq` block |
| Card grid | Use `cards` (default) | Create new custom cards block |
| Logo strip | Use `columns (columns-logos)` | Create new `logo-strip` block |
| Tabbed content | Use `tabs` | Create new `tabbed-content` block |
| Two-column with image | Use `columns (columns-media)` variant | Create new `image-text` block |
| **Multiple two-column rows** | Single `columns (columns-media)` with multiple rows | Separate blocks for each row |
| Quote carousel | Use `carousel (carousel-testimonials)` variant | Create new `testimonials` block |

---

## Migration Rules

### Wide Viewport for Content Extraction

**⚠️ CRITICAL: Always set the browser viewport to wide desktop (≥1400px width) before extracting content from source pages.**

When scraping pages with Playwright for migration, resize the browser **before** navigating:
```javascript
// Set wide desktop viewport BEFORE navigating
await browser_resize({ width: 1440, height: 900 });
await browser_navigate({ url: 'https://example.com/page' });
```

**Why this matters:**
- Responsive images serve **higher resolution sources** at wider viewports (`srcset`, `<picture>` sources)
- Background images may change based on viewport (desktop vs tablet vs mobile)
- Some content (e.g., "Show More" sections, mega menus) is only visible at desktop widths
- CSS `display: none` may hide content at smaller breakpoints, causing missing data during extraction
- `<picture>` elements with `media` queries serve different image URLs per breakpoint — wide viewport ensures the highest-quality source is selected

**Applies to:** All Playwright-based content extraction including `browser_evaluate`, `browser_snapshot`, `browser_take_screenshot`, and any scraper scripts.

### Variant-First Approach

When encountering a content pattern that's similar to an existing block:

1. **Identify the closest existing block** (e.g., carousel, columns, cards)
2. **Analyze what's different** (layout direction, styling, content structure)
3. **Create a variant** by adding a class modifier (e.g., `carousel-testimonials`, `columns-stats`)
4. **Add variant CSS** in the same block's CSS file
5. **Update JS if needed** to handle variant-specific decoration

**Variant naming**: Block-specific variants are prefixed with the block name. In authoring: `| Carousel (carousel-testimonials) |`
- This creates class: `.carousel.carousel-testimonials`
- Generic variants (e.g., `highlight`) are not prefixed and can be applied to any block or section

**When to create a NEW block instead of variant**:
- Content structure is fundamentally different (>50% different markup)
- JavaScript logic is completely different
- No shared styling or behavior with existing blocks

### Import Script Alignment

**⚠️ CRITICAL: Import infrastructure (parsers, transformers, page-templates.json) MUST stay aligned with the actual `.plain.html` content structure.**

The import scripts in `tools/importer/` produce `.plain.html` files (div format). When the content structure changes (e.g., CSS-handled styling replaces inline markup), the parsers must be updated to match.

**Rules for keeping scripts aligned:**

1. **Content `.plain.html` is the source of truth** — If the content uses plain `<p>` for eyebrows, parsers must output plain `<p>` (not `<p><strong>...</strong></p>`).
2. **CSS handles presentation** — Bold, uppercase, colors, and spacing are all CSS concerns. Parsers should output clean semantic HTML and let block CSS handle visual styling.
3. **Create clean DOM elements in parsers** — Always use `document.createElement()` to build output elements rather than pushing source DOM nodes directly. Source nodes carry classes, attributes, and inline styles from the original site that don't belong in EDS content.
4. **Verify after content changes** — When modifying content markup patterns (e.g., removing `<strong>` wrappers from eyebrows), update ALL parsers that produce that pattern. Search across `tools/importer/parsers/` for the old pattern.
5. **Never overwrite verified content** — When simulating an import to check alignment, compare the parser output against existing content HTML. Fix the parser to match the content, never the other way around.
6. **Use DOM-walking for flexible page imports** — Parsers call `element.replaceWith(blockDiv)`, which detaches the original element. After all parsers run, walk the DOM to collect block `<div>` elements and remaining headings/paragraphs (default content) in natural document order. Group into sections. This approach handles pages with different block orders using the same import script. See `import-universal.js` for the reference implementation.

**Eyebrow text pattern (established):**
- Content HTML: `<p>Eyebrow Text</p>` (plain paragraph)
- CSS: `font-weight: 700; text-transform: uppercase; letter-spacing: 1.6px;` on the eyebrow class
- Parser: `const p = document.createElement('p'); p.textContent = eyebrow.textContent.trim();`
- Applies to: columns-feature, cards-awards, cards-stories, hero-featured eyebrows

**Yellow accent segment pattern (established):**
- Eyebrow dashes: `::before` pseudo-element, `width: 32px; height: 3px; background: #ffd100; border-radius: 5px;` positioned absolutely with `left: 0; top: 50%; transform: translateY(-50%);` and `padding-left: 40px` on the text element
- Heading bars: `::after` pseudo-element on H1, `width: 80px; height: 4px; background: #ffdc40; border-radius: 5px; margin: 32px auto 0;` displayed as block

### `.plain.html` Content Format

**All content files use `.plain.html` (div format).** This is the native format that DA produces and consumes.

**Checklist for every content `.plain.html` file:**

1. **Blocks as `<div class="block-name">` elements**
   - Block name as CSS class (lowercase, kebab-case)
   - Each row is a `<div>` child, each column within a row is a nested `<div>`
   - Variants: `<div class="block-name variant-name">`
   ```html
   <!-- Single-column block -->
   <div class="article-header">
     <div><div><h1>Title</h1></div></div>
   </div>

   <!-- Multi-column block -->
   <div class="cards-stories">
     <div><div><picture>...</picture></div><div><h3>Title</h3></div></div>
     <div><div><picture>...</picture></div><div><h3>Title</h3></div></div>
   </div>
   ```

2. **Sections as top-level `<div>` wrappers** (no `<hr>` separators)
   ```html
   <div>
     <!-- Section 1 content -->
   </div>
   <div>
     <!-- Section 2 content -->
     <div class="section-metadata">
       <div><div>Style</div><div>highlight</div></div>
     </div>
   </div>
   ```

3. **Page metadata as `<div class="metadata">` at the end**
   ```html
   <div class="metadata">
     <div><div>Title</div><div>Page Title</div></div>
     <div><div>Description</div><div>Page description</div></div>
     <div><div>Image</div><div><picture>...</picture></div></div>
     <div><div>nav</div><div>/content/nav</div></div>
     <div><div>footer</div><div>/content/footer</div></div>
   </div>
   ```

4. **No page shell** — no `<!DOCTYPE>`, no `<html>`, no `<head>`, no `<body>`, no `<header>`, no `<footer>`

**Data tables**: In `.plain.html` format, all tables are converted to divs. Data tables (non-block tables) should be handled through block implementations or other means.

---

## Content Architecture

### Strict Separation: Content in CMS, Code in Git

This project follows the AEM Edge Delivery Services architecture where **content and code are strictly separated**:

- **Code** (JS, CSS, config): Lives in Git (`github.com/gabrielwalt/up`), deployed via AEM Code Sync
- **Content** (HTML pages, fragments): Lives in DA (Document Authoring at `content.da.live/gabrielwalt/up/`), previewed/published via AEM admin API

**Rules:**
1. **Never push HTML content via Git** — The `.gitignore` has `*.html` for a reason
2. **Never modify `.gitignore` to track HTML files** — Content belongs in the CMS, not in the repo
3. **Fragment content (nav, footer) comes from DA** — These are authored and previewed in DA, not committed to Git
4. **Local `/content/` directory is for local dev only** — It mirrors DA content for local preview but is NOT tracked in Git

### Content File Format: `.plain.html`

**`.plain.html` is the single source of truth.** All content edits and updates are made directly to `.plain.html` files in the `/content/` folder. No `.html` or `.md` files exist in the content folder.

**`.plain.html` format** (what you edit and what DA consumes):
- Section `<div>` wrappers with content
- Blocks as `<div class="block-name">` (div format, not table format)
- Includes a `<div class="metadata">` block with page metadata (title, description, og:image, template)
- No page shell, no `<head>`, no `<hr>` separators, no `<header>`, no `<footer>`

**Example `.plain.html` structure:**
```html
<div>
  <h1>Page Title</h1>
  <p>Introduction text.</p>
</div>
<div>
  <div class="cards-stories">
    <div><div><picture>...</picture></div><div><p>Eyebrow</p><h3>Title</h3></div></div>
    <div><div><picture>...</picture></div><div><p>Eyebrow</p><h3>Title</h3></div></div>
  </div>
  <div class="section-metadata">
    <div><div>Style</div><div>highlight</div></div>
  </div>
</div>
<div class="metadata">
  <div><div>Title</div><div>Page Title</div></div>
  <div><div>Description</div><div>Page description</div></div>
  <div><div>Image</div><div><picture>...</picture></div></div>
</div>
```

**Key rules:**
- Blocks use **div format**: `<div class="block-name">` with nested `<div>` rows and columns
- Sections are `<div>` wrappers at the top level (no `<hr>` separators needed)
- Section metadata is a `<div class="section-metadata">` inside its section `<div>`
- Page metadata goes in a `<div class="metadata">` at the end
- No full page shell (`<!DOCTYPE>`, `<head>`, `<body>`) — just the content divs

### Fragment Loading: How Nav and Footer Work

The header and footer blocks load their content as **fragments** via `loadFragment()`:

1. `header.js` fetches `{navPath}.plain.html` (default: `/nav`)
2. `footer.js` fetches `{footerPath}.plain.html` (default: `/footer`)
3. The `.plain.html` format is the standard content format

**Fragment files are `.plain.html` like all other content.** `nav.plain.html` and `footer.plain.html` exist on disk in `/content/` and are edited directly.

**Path resolution on deployed vs local:**
- **Deployed** (aem.page/aem.live): Content at root paths — `/nav.plain.html`, `/footer.plain.html`
- **Local dev** (localhost:3000): Content at `/content/nav.plain.html` (page metadata overrides the default path)

### DA Markup Compatibility

**DA (Document Authoring) wraps inline content in `<p>` tags** in its output. This is standard DA behavior and must NOT be worked around by unwrapping in JS.

**Example — nav link in DA output:**
```html
<li>
  <p><a href="https://about.ups.com/us/en/our-stories.html">Our Stories</a></p>
  <ul>
    <li><a href="...">Customer First</a></li>
  </ul>
</li>
```

**Impact**: EDS `decorateButtons()` in `scripts.js` finds links that are sole children of `<p>` and applies `.button` class + `.button-wrapper` on the parent `<p>`. This turns nav links into styled buttons.

**Correct fix — CSS resets + flexible selectors:**
```css
/* Reset button styling applied by decorateButtons() */
header nav .nav-sections a.button:any-link {
  display: inline;
  margin: 0;
  border: none;
  padding: 0;
  background: none;
  color: currentcolor;
}

header nav .nav-sections .button-wrapper {
  all: unset;
}
```

```javascript
/* JS selectors must match both patterns */
navSection.querySelector(':scope > a, :scope > p > a');  // ✓ handles both
navSection.querySelector(':scope > a');                    // ✗ misses DA markup
```

**Wrong approaches (do NOT use):**
- ❌ JS code to unwrap `<p>` tags around links — fights the CMS output
- ❌ Copying `.plain.html` files into the Git repo — breaks content/code separation
- ❌ Modifying `.gitignore` to track HTML files — same issue

### Git Workflow

**The user handles all Git operations.** Do not:
- Run `git commit` — leave changes unstaged for the user
- Run `git push` — the user pushes when ready
- Run `git reset --hard` or other destructive operations
- Modify `.gitignore` without explicit user approval

When code changes are complete, inform the user which files were modified so they can review, commit, and push.

---

## Maintaining This Documentation

**This file is the project's source of truth.** Keep it current to ensure consistency.

### When to Update PROJECT.md

| Event | Required Updates |
|-------|------------------|
| **New block created** | Add to Block Reference table, add full documentation in Custom Blocks section |
| **New variant added** | Update the block's variant table, document specifics |
| **Block deleted** | Remove from Block Reference, remove documentation |
| **Variant removed** | Update variant table, remove variant-specific docs |
| **New section style** | Add to Section Styles table |
| **New page template** | Add to Page Templates section |
| **New design token** | Add to Design Tokens table |
| **New icon added** | Add to Local Assets section |
| **CSS pattern discovered** | Add to CSS Patterns to Maintain |
| **Bug fix with learnings** | Add to Reminders section |
| **Page imported/re-imported/refactored** | Update `/sitemap.json` (see Sitemap Maintenance) |
| **New page discovered on source site** | Add to `/sitemap.json` with `imported: false` |

### Documentation Checklist for New Blocks

When creating a new block, document ALL of the following:

```markdown
### block-name

**Location**: `/blocks/block-name/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.block-name` | Description |
| block-name-variant | `.block-name.block-name-variant` | Block-specific description |
| generic-variant | `.block-name.generic-variant` | Generic style (reusable across blocks) |

**Authoring:**
\`\`\`
| Block Name (variant) |
| -------------------- |
| Content structure... |
\`\`\`

**Features**:
- Feature 1
- Feature 2

**Responsive behavior**:
- Mobile: ...
- Desktop: ...
```

### Documentation Checklist for New Variants

When adding a variant to an existing block:

1. Add row to block's variant table
2. Add "**Variant-name specifics**" section with:
   - Key visual differences
   - Unique behaviors
   - Responsive changes
   - CSS class name

### Periodic Review

When working on this project, periodically verify:
- [ ] All blocks in `/blocks/` are documented
- [ ] All variants mentioned in CSS are documented
- [ ] Design tokens match what's in `styles.css`
- [ ] Reminders section captures recent learnings

---

## Key Files

- **Global styles**: `/styles/styles.css`
- **Lazy styles**: `/styles/lazy-styles.css` (post-LCP styles: scroll animations, arc section styles)
- **Delayed JS**: `/scripts/delayed.js` (IntersectionObserver for scroll animations)
- **Blocks**: `/blocks/` (all block directories listed in Block Reference)
- **Icons**: `/icons/` (`search.svg`, `ups-logo.svg`)
- **Icon font**: `/fonts/upspricons.woff` — UPS icon font (button chevron `\e60f`, circle arrow `\e603`)
- **Web fonts**: `/fonts/` (`roboto-regular.woff2`, `roboto-medium.woff2`, `roboto-bold.woff2`, `roboto-condensed-bold.woff2`)
- **Navigation**: Fragment at `/content/nav.plain.html` — loaded by header block via `loadFragment()`
- **Footer**: Fragment at `/content/footer.plain.html` — loaded by footer block via `loadFragment()`
- **Import infrastructure**: `/tools/importer/` (page-templates.json, parsers/, transformers/)
- **Sitemap**: `/sitemap.json` — Master tracker for all pages, import status, block usage, validation, and approval state. **Must be kept up-to-date at all times** (see Sitemap Maintenance section).

---

## Sitemap Maintenance (`/sitemap.json`)

**`/sitemap.json` is the master tracker for the entire migration.** It must always reflect the current state of every page, fragment, and block in the project.

### When to Update sitemap.json

| Event | Required Update |
|-------|-----------------|
| **New page discovered on original site** | Add entry to `pages[]` with `sourceUrl`, `imported: false` |
| **Page imported (content created)** | Set `imported: true`, populate `blocks[]` and `sectionStyles[]` |
| **Import re-run on existing page** | Update `blocks[]` and `sectionStyles[]` if they changed |
| **Import validated** | Set `importValidated: true` |
| **Page critiqued/approved** | Set `critiqued: true` / `approved: true` on the page entry |
| **Content refactored (blocks changed)** | Update `blocks[]` to reflect current block composition |
| **Section style added/removed** | Update `sectionStyles[]` to match current content |
| **Page removed** | Remove the entry from `pages[]` |
| **New fragment created** | Add entry to `fragments[]` |

### Structure Reference

```json
{
  "fragments": [
    { "path": "/nav", "imported": true, "importValidated": true, "critiqued": true, "approved": true }
  ],
  "pages": [
    {
      "path": "/us/en/page-name",
      "sourceUrl": "https://about.ups.com/us/en/page-name.html",
      "imported": true,
      "importValidated": false,
      "critiqued": false,
      "approved": false,
      "blocks": ["block-name", "another-block"],
      "sectionStyles": ["style-name", "another-style"]
    }
  ]
}
```

### Rules

1. **Always update after any content change** — If blocks are added, removed, or restructured on a page, update the corresponding `blocks[]` array immediately.
2. **Don't mark validated/critiqued/approved prematurely** — These flags live at the page level (not on individual blocks or styles). Only set them after the corresponding step is actually completed and verified.
3. **Paths use no extension** — Page paths are stored without `.html` (e.g., `/us/en/home`, not `/us/en/home.html`).
4. **Source URLs are the original site URLs** — Always include the full `https://about.ups.com/...` URL.
5. **Keep blocks[] populated for ALL pages** — `blocks[]` and `sectionStyles[]` are simple string arrays (e.g., `["cards-stories", "hero-featured"]`). Every page must have these arrays reflecting the actual blocks and section styles present in the content. Pages with no blocks should have `blocks: []`.
6. **Update blocks[] after every content operation** — After running import scripts, re-importing pages, or executing any user request that changes page content (adding/removing blocks, changing section styles), immediately update the affected page's `blocks[]` and `sectionStyles[]` arrays to match the new content.
7. **Use blocks[] for impact analysis** — Before refactoring a block's CSS/JS or modifying shared styles, query the sitemap to find all pages that use that block. Preview or verify changes on those pages to ensure nothing breaks. Example: changing `cards-stories` CSS should prompt checking all pages where `cards-stories` appears in `blocks[]`.

---

## Pages Inventory

All content pages in this project and their source URLs. All content files use `.plain.html` format.

| Local Path | Origin URL | Description |
|------------|-----------|-------------|
| `/content/nav.plain.html` | Derived from source site | Navigation fragment |
| `/content/footer.plain.html` | Derived from source site | Footer fragment |
| `/content/us/en/home.plain.html` | https://about.ups.com/us/en/home.html | Homepage |
| `/content/us/en/all-stories.plain.html` | https://about.ups.com/us/en/all-stories.html | All Stories listing |
| `/content/us/en/thank-a-ups-hero.plain.html` | https://about.ups.com/us/en/thank-a-ups-hero.html | Thank a UPS Hero form |
| `/content/us/en/our-company.plain.html` | https://about.ups.com/us/en/our-company.html | Our Company landing page |
| `/content/us/en/our-company/our-strategy.plain.html` | https://about.ups.com/us/en/our-company/our-strategy.html | Our Strategy page |
| `/content/us/en/our-company/our-culture.plain.html` | https://about.ups.com/us/en/our-company/our-culture.html | Our Culture page |
| `/content/us/en/our-company/our-history.plain.html` | https://about.ups.com/us/en/our-company/our-history.html | Our History timeline |
| `/content/us/en/our-company/leadership.plain.html` | https://about.ups.com/us/en/our-company/leadership.html | Leadership page |
| `/content/us/en/our-company/great-employer.plain.html` | https://about.ups.com/us/en/our-company/great-employer.html | Great Employer topic hub |
| `/content/us/en/our-company/suppliers.plain.html` | https://about.ups.com/us/en/our-company/suppliers.html | Suppliers topic hub |
| `/content/us/en/our-company/global-presence.plain.html` | https://about.ups.com/us/en/our-company/global-presence.html | Global Presence page |
| `/content/us/en/our-company/governance/carbon-neutral-credentials.plain.html` | https://about.ups.com/us/en/our-company/governance/carbon-neutral-credentials.html | Carbon Neutral Credentials article |
| `/content/us/en/our-company/governance/transparency-rule.plain.html` | https://about.ups.com/us/en/our-company/governance/transparency-rule.html | Transparency Rule article |
| `/content/us/en/our-impact.plain.html` | https://about.ups.com/us/en/our-impact.html | Our Impact landing page |
| `/content/us/en/our-impact/community.plain.html` | https://about.ups.com/us/en/our-impact/community.html | Community topic hub |
| `/content/us/en/our-impact/community/ups-foundation-leadership.plain.html` | https://about.ups.com/us/en/our-impact/community/ups-foundation-leadership.html | UPS Foundation Leadership |
| `/content/us/en/our-impact/community/the-ups-foundation-mission-and-purpose.plain.html` | https://about.ups.com/us/en/our-impact/community/the-ups-foundation-mission-and-purpose.html | UPS Foundation Mission article |
| `/content/us/en/our-impact/sustainability.plain.html` | https://about.ups.com/us/en/our-impact/sustainability.html | Sustainability topic hub |
| `/content/us/en/our-impact/sustainability/key-highlights-*.plain.html` | https://about.ups.com/us/en/our-impact/sustainability/key-highlights-from-ups-s-latest-sustainability-and-community-im.html | Sustainability Key Highlights article |
| `/content/us/en/our-impact/reporting.plain.html` | https://about.ups.com/us/en/our-impact/reporting.html | Reporting page |
| `/content/us/en/our-impact/reporting/gender-equality-index-ups-france.plain.html` | https://about.ups.com/us/en/our-impact/reporting/gender-equality-index---ups-france-.html | Gender Equality Index article |
| `/content/us/en/our-impact/ups-sustainability-and-social-impact-report.plain.html` | https://about.ups.com/us/en/our-impact/ups-sustainability-and-social-impact-report.html | Sustainability & Social Impact Report |
| `/content/us/en/our-impact/ups-sustainability-and-social-impact-report/delivering-for-our-communities.plain.html` | (corresponding source URL) | Delivering For Our Communities |
| `/content/us/en/our-impact/ups-sustainability-and-social-impact-report/delivering-for-our-people.plain.html` | (corresponding source URL) | Delivering For Our People |
| `/content/us/en/our-impact/ups-sustainability-and-social-impact-report/delivering-for-our-planet.plain.html` | (corresponding source URL) | Delivering For Our Planet |
| `/content/us/en/our-stories.plain.html` | https://about.ups.com/us/en/our-stories.html | Our Stories listing page |
| `/content/us/en/our-stories/customer-first.plain.html` | https://about.ups.com/us/en/our-stories/customer-first.html | Customer First category page |
| `/content/us/en/our-stories/innovation-driven.plain.html` | https://about.ups.com/us/en/our-stories/innovation-driven.html | Innovation Driven category page |
| `/content/us/en/our-stories/people-led.plain.html` | https://about.ups.com/us/en/our-stories/people-led.html | People Led category page |
| `/content/us/en/our-stories/customer-first/*.plain.html` | 36 story articles | Customer First stories |
| `/content/us/en/our-stories/innovation-driven/*.plain.html` | 33 story articles | Innovation Driven stories |
| `/content/us/en/our-stories/people-led/*.plain.html` | 35 story articles | People Led stories |
| `/content/us/en/newsroom.plain.html` | https://about.ups.com/us/en/newsroom.html | Newsroom topic hub |
| `/content/us/en/newsroom/awards-and-recognition.plain.html` | https://about.ups.com/us/en/newsroom/awards-and-recognition.html | Awards & Recognition page |
| `/content/us/en/newsroom/press-releases.plain.html` | https://about.ups.com/us/en/newsroom/press-releases.html | Press Releases listing |
| `/content/us/en/newsroom/statements.plain.html` | https://about.ups.com/us/en/newsroom/statements.html | Statements listing |
| `/content/us/en/newsroom/facebook-rules.plain.html` | https://about.ups.com/us/en/newsroom/facebook-rules.html | Facebook Rules article |

**Total**: 138 pages + 2 fragments. All pages use `.plain.html` format and `import-universal` script.

**URL mapping convention**: Local paths follow the origin URL structure with `/content/` prefix. All content files use `.plain.html` extension.

**Dead source URLs removed** (returned 404 from source site): `get-everything-you-need-to-make-valentine-s-day-extra-special-d`, `new-shelves-new-customers-same-reliable-shipper`, `from-the-philippines-to-ireland-we-deliver-the-holidays`.

### Bulk Publish URL List

When asked to list all page URLs (e.g., "list all pages", "bulk publish", "bulk preview"):

1. Scan `/workspace/content/` for all `.plain.html` files
2. For each file, strip the `/workspace/content/` prefix and the `.plain.html` extension to get the path
3. Output each as `https://main--up--gabrielwalt.aem.page/{path}`
4. Include ALL pages and fragments (nav, footer)
5. Output the URLs inside a fenced code block — one per line, no headers, no extra text

---

## Fragment Files

Fragment files (`nav`, `footer`) are `.plain.html` like all other content. They are **authored in DA** and loaded by blocks at runtime via `loadFragment()`. They are NOT committed to Git.

**Content source**: DA at `content.da.live/gabrielwalt/up/`
**Deployed paths**: `/nav.plain.html`, `/footer.plain.html` (served by AEM)
**Local dev paths**: `/content/nav.plain.html`, `/content/footer.plain.html` (for local preview only)

**Fragment `.plain.html` format**: Same div-format as all other content files — section `<div>` wrappers with block `<div class="block-name">` elements. No page shell, no `<header>` or `<footer>` tags.

**DA markup note**: DA wraps inline content in `<p>` tags. Block CSS/JS must handle this — see "DA Markup Compatibility" in Content Architecture section.

---

## Design Tokens

Defined in `/styles/styles.css` — reference these variable names, don't hardcode values.

### Colors

| Variable | Value | Usage |
|----------|-------|-------|
| `--background-color` | `#fff` | Page and card backgrounds |
| `--light-color` | `#f2f2f2` | Highlight section backgrounds, dividers |
| `--dark-color` | `#505050` | Secondary text, disabled states |
| `--text-color` | `#242424` | Primary body and heading text |
| `--link-color` | `#426da9` | Links, default button borders |
| `--link-hover-color` | `#244674` | Link/button hover states |

### Brand Gold

| Variable | Value | Usage |
|----------|-------|-------|
| `--color-gold` | `#ffc400` | Brand gold — CTA backgrounds, accent dashes, heading bars |
| `--color-gold-hover` | `#e0ac00` | Hover-darkened gold for CTA buttons |

### Neutrals

| Variable | Value | Usage |
|----------|-------|-------|
| `--color-muted` | `#767676` | Muted grey text (attribution, submenu labels, accent-bar h6) |
| `--color-border` | `#e5e5e5` | Separator/border grey (header pipes, dividers) |

### Spacing

| Variable | Value | Usage |
|----------|-------|-------|
| `--spacing-xs` | `8px` | Tight spacing |
| `--spacing-s` | `16px` | Small spacing |
| `--spacing-m` | `24px` | Medium spacing (block gap, card gaps) |
| `--spacing-l` | `32px` | Large spacing |
| `--spacing-xl` | `40px` | Card/component padding, eyebrow offset |
| `--spacing-2xl` | `48px` | Desktop card padding |
| `--spacing-3xl` | `64px` | Nav/footer edge spacing |
| `--spacing-4xl` | `80px` | Quadruple extra-large |

### Vertical Rhythm

One token controls internal default-content spacing. All other spacing uses the spacing scale tokens directly.

| Variable | Value | Purpose |
|----------|-------|---------|
| `--block-gap` | `24px` (`--spacing-m`) | Gap between elements within a wrapper (`* + *` rule) |

**Note:** `--section-padding` has been removed. The spacing system is now margin-driven — see "Vertical Spacing Rules" below.

### Radius

| Variable | Value | Usage |
|----------|-------|-------|
| `--radius-s` | `4px` | Small radius (navigation-tabs links) |
| `--radius-m` | `8px` | Medium radius (cards, content cards, stats card) |
| `--radius-l` | `16px` | Large radius (dropdown menus, stats container) |
| `--radius-pill` | `80px` | Pill shape (buttons) |

### Shadows

| Variable | Value | Usage |
|----------|-------|-------|
| `--shadow-card` | `0 4px 24px rgb(0 0 0 / 16%)` | Card resting state |
| `--shadow-card-hover` | `0 8px 32px rgb(0 0 0 / 18%)` | Card hover state |
| `--shadow-dropdown` | `0 8px 16px rgb(0 0 0 / 8%)` | Mega menu dropdown |

### Layout

| Variable | Mobile | Desktop (≥992px) |
|----------|--------|------------------|
| `--content-max-width` | `1200px` | same |
| `--content-padding` | `24px` (`--spacing-m`) | `32px` (`--spacing-l`) |

### CTA Button

| Variable | Value | Usage |
|----------|-------|-------|
| `--cta-bg` | `var(--color-gold)` | Gold CTA button background |
| `--cta-bg-hover` | `var(--color-gold-hover)` | Gold CTA button hover |
| `--cta-text` | `#121212` | CTA button text color |

### Eyebrow Label

| Variable | Value | Usage |
|----------|-------|-------|
| `--eyebrow-size` | `var(--body-font-size-xs)` (13px) | Eyebrow font size |
| `--eyebrow-weight` | `700` | Eyebrow font weight |
| `--eyebrow-tracking` | `1.6px` | Eyebrow letter spacing |

### Accent Dash

| Variable | Value | Usage |
|----------|-------|-------|
| `--accent-dash-width` | `32px` | Eyebrow yellow dash width |
| `--accent-dash-height` | `3px` | Eyebrow yellow dash height |
| `--accent-dash-color` | `var(--color-gold)` | Eyebrow yellow dash color |

### Typography

| Variable | Mobile | Desktop (≥992px) |
|----------|--------|------------------|
| `--body-font-family` | `roboto, roboto-fallback, sans-serif` | same |
| `--heading-font-family` | `roboto, roboto-fallback, sans-serif` | same |
| `--body-font-size-m` | `16px` | same |
| `--body-font-size-s` | `14px` | same |
| `--body-font-size-xs` | `13px` | same |
| `--heading-font-size-xxl` | `64px` | `64px` |
| `--heading-font-size-xl` | `40px` | `40px` |
| `--heading-font-size-l` | `24px` | `32px` |
| `--heading-font-size-m` | `20px` | `24px` |
| `--heading-font-size-s` | `18px` | `20px` |
| `--heading-font-size-xs` | `16px` | `16px` |

### Breakpoints

| Variable | Value | Usage |
|----------|-------|-------|
| `--viewport-desktop` | `992px` | Desktop layout breakpoint (grid, multi-column) |
| `--viewport-nav` | `1024px` | Navigation breakpoint (hamburger → full nav) |

**Note:** CSS custom properties cannot be used inside `@media` conditions — media queries are evaluated before the cascade. These tokens are reference values: use the literal `992px` / `1024px` in media queries and annotate with a `/* --viewport-desktop */` or `/* --viewport-nav */` comment above each `@media` rule.

### Navigation

| Variable | Mobile | Desktop (≥1024px) |
|----------|--------|-------------------|
| `--nav-height` | `64px` | `104px` |

### ⚠️ CRITICAL: CSS Variable Naming Convention

**NEVER use these incorrect variable names:**
- ~~`--spacing-sm`~~ → Use `--spacing-s`
- ~~`--spacing-md`~~ → Use `--spacing-m`
- ~~`--spacing-lg`~~ → Use `--spacing-l`

### ⚠️ CRITICAL: Always Verify CSS Variables Before Using

**Before writing any CSS property with `var(--...)`, cross-check against the variables defined in `styles.css`.** If the variable isn't defined, it does NOT exist and will silently fail.

### Vertical Spacing Rules (Margin-Driven System)

Spacing is **margin-driven** — wrappers carry `margin-top`, and sections have **no padding by default** so wrapper margins collapse *through* section boundaries for cross-section gaps.

**Key principle:** Sections with `padding: 0` are transparent to margin collapsing. A block wrapper's 80px margin-top will collapse through the section boundary, creating the same gap whether the next element is in the same section or a different one.

**Gap hierarchy:**

| Scenario | Gap | Token |
|----------|-----|-------|
| Block wrapper → Block wrapper | **80px** | `--spacing-4xl` |
| Block wrapper ↔ Default-content (same section) | **32px** | `--spacing-l` |
| Default-content (cross-section base) | **40px** | `--spacing-xl` |
| Default-content → Default-content (same section) | **24px** | `--spacing-m` |
| Elements within any wrapper (`* + *`) | **24px** | `--block-gap` |
| H1 element (above) | **80px** | `--spacing-4xl` |
| Nav → first content (H1) | **80px** | H1 margin collapses through section |
| Last section → footer | **80px** | `padding-bottom` on last section |
| Before background section (highlight) | **80px** | `margin-top` on the section |
| Background section padding (highlight) | **80px** | `--spacing-4xl` top and bottom |

**CSS selector summary:**
```css
main > .section                                          → padding: 0
main > .section:last-of-type                             → padding-bottom: 80px
main > .section > div:not(.default-content-wrapper)      → margin-top: 80px (block wrappers)
main > .section > .default-content-wrapper               → margin-top: 40px (cross-section base)
…+ .default-content-wrapper (after block)                → margin-top: 32px (same-section override)
.default-content-wrapper + div:not(…)                    → margin-top: 32px (same-section override)
.default-content-wrapper + .default-content-wrapper      → margin-top: 24px (same-section override)
main > .section > div > * + *                            → margin-top: 24px (internal gap)
main .default-content-wrapper > h1                       → margin-top: 80px
main > .section.highlight                                → margin-top: 80px; padding: 80px 0
  > div:first-child                                      → margin-top: 0
  > div:last-child                                       → margin-bottom: 0
```

**Rules:**
- **Sections have NO padding by default** — this is critical for margin collapsing through sections.
- **Block wrappers get 80px margin-top** — this is the primary inter-block gap.
- **Default-content wrappers get 40px margin-top** — overridden to 32px when adjacent to a block wrapper (same section), 24px when adjacent to another default-content-wrapper.
- **H1 gets 80px margin-top** — collapses with wrapper margin for consistent nav-to-H1 gap.
- **24px between elements within wrappers** — `main > .section > div > * + *` applies 24px gap.
- **No section margins on regular sections** — regular sections have `padding: 0` and `margin: 0`.
- **Background sections (highlight)** use `margin-top: 80px` (white space before background) + `padding: 80px 0` (internal spacing) with first/last child margin reset to 0. This creates symmetric 80px white + 80px colored padding on both entering and exiting the background zone.
- **Last section gets `padding-bottom: 80px`** for footer gap.
- **`p.button-wrapper` has `margin: 0`** — spacing is handled by the `* + *` rule; extra margin would leak through sections.
- **Blocks must not set outer margins on their wrapper** — the global spacing system handles all inter-block spacing.

---

## CSS Guidelines

1. **Never use `!important`** - increase selector specificity instead
2. **Use CSS custom properties** - reference design tokens, override at block level when needed
3. **Edge-to-edge blocks** - use `:has()` selector on wrapper: `main > div:has(.block-name)`
4. **Specificity order in styles.css** - section-specific styles must come BEFORE template styles to maintain proper cascade
5. **Visually hidden text** - use `clip-path: inset(50%)` instead of deprecated `clip: rect()`
6. **Backdrop filter** - always include both `-webkit-backdrop-filter` and `backdrop-filter`
7. **Never write selectors that depend on sibling element sequences** - Selectors like `h3 + h3 + p > strong` are fragile and break when an author reorders, adds, or removes content. If a style only works when exactly the right sequence of elements exists on the page, it is un-authorable. Authors cannot be expected to know that adding a heading before a paragraph will change its styling. Always prefer: (a) inline markup the author controls (e.g., `<strong>`), (b) block or section variants with explicit class names, or (c) accepting a "good enough" approximation over a fragile pixel-perfect hack. **Better to have a slightly imperfect style than an unmaintainable one.**

---

## Lint Rules

- **no-descending-specificity**: For complex block CSS with variant overrides, add `/* stylelint-disable no-descending-specificity */` at the top of the file
- **declaration-block-no-duplicate-properties**: Never duplicate CSS properties (except vendor prefixes like `-webkit-`)
- **property-no-deprecated**: Use modern equivalents (`clip-path` not `clip`)

---

## Responsive Breakpoints

Only two breakpoints, derived from the UPS source site. Content flows fluidly between them — avoid adding extra breakpoints.

| Breakpoint | Token | Value | Usage |
|------------|-------|-------|-------|
| **desktop** | `--viewport-desktop` | `992px` | Below: single-column mobile layout. Above: multi-column desktop layout. |
| **nav** | `--viewport-nav` | `1024px` | Below: hamburger menu. Above: full horizontal navigation. |

**Content max-width**: `1200px` — main content sections are capped at this width and centered.

**Media query syntax** (use modern CSS syntax, annotate with token name comment):
```css
/* --viewport-desktop */
@media (width >= 992px) { }

/* --viewport-desktop */
@media (width < 992px) { }

/* --viewport-nav */
@media (width >= 1024px) { }
```

### Fluid Responsive Behavior

**⚠️ IMPORTANT**: Avoid fixed-width "jumps" between breakpoints. Content should scale fluidly across all viewport sizes.

**Principles:**
1. **Content max-width of 1200px** - Main content is constrained and centered; header, footer, and edge-to-edge blocks may extend to full viewport width
2. **Use percentage-based or viewport-relative widths** - Prefer `%`, `vw`, `fr` units over fixed `px` widths for containers
3. **Flexible grids with auto-fill** - Use `repeat(auto-fill, minmax(min, 1fr))` for responsive card layouts
4. **Smooth transitions** - When switching layouts at breakpoints, ensure visual continuity
5. **Two breakpoints only** - Resist adding intermediate breakpoints; let content reflow naturally

---

## EDS Authoring Patterns

- **Link → Button**: Link alone in its own paragraph becomes a button
- **Link stays link**: Link inline with other text stays a link
- **Section metadata**: Use `section-metadata` block to apply styles like `highlight`, `accent-bar`
- **Page templates**: Add `Template: template-name` to page metadata for page-specific styles
- **HTML in table cells**: Markdown syntax (like `## Heading`) is NOT parsed inside table cells. Use HTML tags (`<h2>Heading</h2>`) when you need structured content in block tables.
- **One row per item**: In block tables (carousel, accordion), each row becomes one item/slide. Combine all content for an item into a single row using HTML.
- **Data tables vs block tables**: In EDS, `<table>` elements are converted to blocks by `convertBlockTables()` in scripts.js. To include an actual data table (not a block), ensure the first cell of the first row is empty or contains multi-word data text (not a valid block name). The `convertBlockTables()` function checks the first cell — if `toClassName()` returns an empty string, the table passes through as a native HTML table. Use `<th>` for header cells and `<td>` for data cells. Style data tables in `styles.css` under `main .default-content-wrapper table`.

---

## Page Templates

Templates are applied via page metadata: `Template: template-name`

| Template | Class Applied | Purpose |
|----------|---------------|---------|
| *(none defined yet)* | | |

### Default Content Centering (Global)

Default content (text, headings, buttons, images in `.default-content-wrapper`) should be centered on all pages.

CSS selector pattern:
```css
main .default-content-wrapper {
  text-align: center;
}
```

---

## Section Styles

Applied via `section-metadata` block with `Style: style-name`. Multiple styles can be combined.

| Style | Class | Purpose |
|-------|-------|---------|
| `highlight` | `.section.highlight` | Light grey background (`--light-color`) |
| `accent-bar` | `.section.accent-bar` | Adds yellow bar under h1/h2 (`::after`), uppercase h6 eyebrow |
| `arc` | `.section.arc` | Warm grey gradient background with white curved scoop at bottom (decorative SVG `::after`) |
| `arc-wave` | `.section.arc-wave` | Flat grey background with organic white wave at bottom — the "inverted arc" (decorative SVG `::after`) |
| `arc-gradient` | `.section.arc-gradient` | Subtle warm beige gradient wash behind content (decorative SVG `::after`, no background color change) |
| `dark` | `.section.dark` | Dark brown background (`#351c15`), inverts text/links to white |
| `spacing-l` | `.section.spacing-l` | Adds 80px (`--spacing-4xl`) margin-top to section |
| `spacing-xl` | `.section.spacing-xl` | Adds 160px margin-top to section |
| `spacing-2xl` | `.section.spacing-2xl` | Adds 240px margin-top to section |

**Example usage in content:**
```html
<div class="section-metadata">
  <div><div>Style</div><div>highlight</div></div>
</div>
```

### Arc Section Styles Detail

Decorative SVG arc backgrounds from the original UPS site. These create curved transitions between sections using `::after` pseudo-elements with inline SVG data URIs, positioned behind content at `z-index: -1`. CSS is in `/styles/lazy-styles.css`.

**`arc`** — Grey gradient section with white curved bottom edge:
- Background: `linear-gradient(318.8deg, #DFDBD7, #F2F1EF)` (warm grey-to-lighter)
- `::after`: White concave SVG scoop (1440x72 viewBox) at bottom of section
- Spacing: `margin: 80px 0 -215px`, `padding: 80px 0 215px` — negative bottom margin lets next section overlap into curve area
- SVG height is responsive: `padding-top: calc(5%)` scales with viewport width
- Next section gets `position: relative; z-index: 1` to render above the curve
- Used on: our-stories (H1 section with hero overlap below), our-company (H1 section with hero overlap below), category pages (customer-first, innovation-driven, people-led H1 sections)

**`arc-wave`** — Flat grey background with organic white wave at bottom (inverted arc):
- Background: `var(--light-color)` (`#f2f2f2`) — flat grey, no gradient
- `::after`: Organic/irregular white wave SVG (1381x118pt viewBox) overlapping upward behind content from section bottom
- Spacing: `margin: 80px 0 0`, `padding: 80px 0 32px` — no extra padding for the wave; SVG extends upward behind content
- SVG height is responsive: `padding-top: calc(8.5%)` scales with viewport width
- Next section gets `margin-top: 32px` for a tight transition
- Used on: our-culture (intro section)

**`arc-gradient`** — Subtle warm beige wash (no visible background change):
- No background color on the section itself (stays white/transparent)
- `::after`: Large gradient SVG (1440x560 viewBox) with curved bottom edge, fills from `#DFDBD7` (beige) to transparent `#F2F1EF`. Bottom-aligned.
- No extra margin or padding — uses default section spacing
- Very subtle decorative effect; barely noticeable on white backgrounds
- Used on: home (hero+stories section), our-impact (columns-feature section)

---

## Block Reference

Complete reference of all blocks and their variants.

### Summary Table

| Block | Location | Variants | Description |
|-------|----------|----------|-------------|
| **header** | `/blocks/header/` | — | Site header with logo, nav links, mega menu dropdowns, utility links |
| **footer** | `/blocks/footer/` | — | Site footer with multi-column links, legal links, copyright |
| **fragment** | `/blocks/fragment/` | — | Utility for loading content fragments |
| **columns-feature** | `/blocks/columns-feature/` | — | Two-column feature card with eyebrow, heading, CTA, image |
| **columns-quote** | `/blocks/columns-quote/` | — | Testimonial/quote with portrait image |
| **columns-stats** | `/blocks/columns-stats/` | — | Full-width image with overlapping stats panel |
| **cards-awards** | `/blocks/cards-awards/` | — | Text-only award cards with eyebrow and heading |
| **cards-stories** | `/blocks/cards-stories/` | — | Image + text story cards in a clickable grid |
| **hero-featured** | `/blocks/hero-featured/` | `hero-featured-right` | Hero with background image and white card overlay |
| **contact-card** | `/blocks/contact-card/` | — | Contact info card with title, two columns, and vertical separator |
| **navigation-tabs** | `/blocks/navigation-tabs/` | — | Card-style navigation links with arrow icons |
| **fact-sheets** | `/blocks/fact-sheets/` | — | Responsive stat grid with icons, numbers, labels, and CTA |
| **columns-media** | `/blocks/columns-media/` | — | Asymmetric image + text (1/3 + 2/3), image on either side |
| **breadcrumb** | `/blocks/breadcrumb/` | — | Auto-generated breadcrumb from URL path segments |
| **article-header** | `/blocks/article-header/` | — | Story article header with eyebrow, title, byline, subtitle, hero image |
| **embed** | `/blocks/embed/` | — | YouTube video embed with responsive 16:9 aspect ratio |
| **social-share** | `/blocks/social-share/` | — | Social media share links (Facebook, Twitter, LinkedIn, Email) |
| **cards-leadership** | `/blocks/cards-leadership/` | — | Horizontal person cards with portrait, name, title in 2-col grid |
| **cards-reports** | `/blocks/cards-reports/` | — | Horizontal document cards with thumbnail, title, action link |
| **awards-list** | `/blocks/awards-list/` | — | Year-tabbed list of award entries with eyebrow, title, meta |
| **timeline** | `/blocks/timeline/` | — | Vertical timeline with period nav sidebar and scroll spy |
| **form** | `/blocks/form/` | — | Styled form with text, email, textarea, select, submit fields |
| **data-table** | `/blocks/data-table/` | — | Converts div structure to native HTML `<table>` for data tables |

**Boilerplate blocks** (vanilla, unmodified): `cards`, `columns`, `hero`

---

## Custom Blocks

### header

**Location**: `/blocks/header/`

**Features**:
- Logo from nav fragment (60px height)
- Horizontal nav links on desktop (flex layout, 32px gap)
- Full-width mega menu dropdowns (position: fixed, 100vw width, max-width 1200px inner content)
- Utility links (ups.com, Support) with pipe separators
- Hamburger menu on mobile (animated icon, full-height overlay)
- 2px bottom border (`var(--light-color)`)
- DA-compatible: CSS resets neutralize button styling on nav links, JS selectors handle both `> li > a` and `> li > p > a` patterns

**Fragment source**: Nav content authored in DA at `/nav`, loaded via `loadFragment('/nav')`

**Responsive behavior**:
- Mobile (<1024px): Fixed position, hamburger menu, 64px height
- Desktop (≥1024px): Relative position, horizontal nav, 100px height

**Dropdown behavior**: Clicking a nav item with children toggles `aria-expanded`, showing a mega menu panel below the header. Chevron arrows indicate dropdown state. Each dropdown link has a right-pointing chevron arrow (`::after`).

---

### footer

**Location**: `/blocks/footer/`

**Features**:
- Top row: Highlighted links (Newsroom, Careers) with gold/yellow background strip
- Middle: Multi-column link grid (This Site, Other UPS Sites, Connect, Subscribe)
- Bottom: Legal links with pipe separators, copyright text

---

### columns-feature

**Location**: `/blocks/columns-feature/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.columns-feature` | Two-column feature card with eyebrow, heading, description, CTA, and image |

**Authoring:**
```
| Columns-Feature |
| --- | --- |
| <p>Eyebrow Text</p><h2>Heading</h2><p>Description</p><p><a href="...">CTA</a></p> | <picture>...</picture> |
```

**Features**:
- Eyebrow text (plain `<p>`, CSS handles bold/uppercase), h2 heading, description paragraph, CTA link
- Horizontal yellow accent dash (`::before`) on eyebrow text
- Image in one column, text content in the other
- Column order follows source (image left or right)

**Responsive behavior**:
- Mobile: stacks vertically, image on top
- Desktop (>=992px): side-by-side 50/50 columns

---

### columns-quote

**Location**: `/blocks/columns-quote/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.columns-quote` | Testimonial/quote with portrait image |

**Authoring:**
```
| Columns-Quote |
| --- | --- |
| <h3>"Quote text..."</h3><p>Attribution Name</p> | <picture>...</picture> |
```

**Features**:
- Quote text as h3, attribution name as plain `<p>` (CSS handles bold/uppercase)
- Portrait image in second column

**Responsive behavior**:
- Mobile: stacks vertically
- Desktop (>=992px): quote left, image right

---

### cards-awards

**Location**: `/blocks/cards-awards/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.cards-awards` | Text-only award cards with eyebrow and heading |

**Authoring:**
```
| Cards-Awards |
| --- |
| <p>Eyebrow Text</p><h3>Award description</h3> |
| <p>Eyebrow Text</p><h3>Award description</h3> |
```

**Features**:
- Text-only cards (no images)
- Eyebrow category label (plain `<p>`, CSS handles bold/uppercase) + h3 heading per card
- Grid layout with responsive columns

**Responsive behavior**:
- Mobile: single column
- Desktop: auto-fill grid (min 257px per card)

---

### hero-featured

**Location**: `/blocks/hero-featured/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.hero-featured` | Hero with background image and white card overlay (card on left) |
| hero-featured-right | `.hero-featured.hero-featured-right` | Card positioned on right side of image |

**Authoring:**
```
| Hero-Featured |
| --- |
| ![alt](image-url) |
| <p>Eyebrow</p><h4>Heading</h4><p>Description</p><p><a href="...">CTA</a></p> |
```

Right variant:
```
| Hero-Featured (hero-featured-right) |
| --- |
| ![alt](image-url) |
| <p>Eyebrow</p><h4>Heading</h4><p>Description</p><p><a href="...">CTA</a></p> |
```

**Features**:
- Background image fills entire block (first row → `position: absolute; inset: 0`, picture also `position: absolute; inset: 0`, img `object-fit: cover`)
- White card overlay (border-radius 8px, no box-shadow)
- Eyebrow text with horizontal yellow accent dash (`::before`, 32x3px, #ffd100)
- h4 heading, description, gold CTA button (#ffc400 bg)
- Equal spacing between image edge and card on all visible sides
- Supports both `<picture>` and bare `<img>` for background image

**hero-featured-right specifics**:
- Card positioned on right side using `justify-content: flex-end` (desktop)
- Mirror of default left positioning: `margin: 0 60px 0 0` instead of `0 0 0 60px`
- Parser detects `.upspr-heroimage_content--right` class in source DOM

**Responsive behavior**:
- Mobile: min-height 650px, card max-width 480px, padding 24px, margin `200px 24px 24px` (equal left/bottom/right spacing of 24px)
- Desktop (>=992px): card max-width 480px with `box-sizing: border-box`, padding 48px, margin `60px 0 60px 60px` (left) or `60px 60px 60px 0` (right)

---

### cards-stories

**Location**: `/blocks/cards-stories/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.cards-stories` | Image + text story cards in a grid |

**Authoring:**
```
| Cards-Stories |
| --- | --- |
| ![alt](image-url) | <p>Eyebrow</p><h3>Title</h3><p>Description</p><p><a href="...">Link</a></p> |
| ![alt](image-url) | <p>Eyebrow</p><h3>Title</h3><p>Description</p><p><a href="...">Link</a></p> |
```

**Features**:
- Image + text cards with eyebrow category label and horizontal yellow accent dash (`::before`, 32x3px)
- Entire card is clickable (wraps in anchor)
- Image zoom on hover, box-shadow hover effect
- 16:10 aspect ratio images

**Responsive behavior**:
- Mobile: single column
- Desktop (>=992px): 3-column grid

---

### columns-stats

**Location**: `/blocks/columns-stats/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.columns-stats` | Full-width image background with overlapping stats panel |

**Authoring:**
```
| Columns-Stats |
| --- | --- |
| ![alt](image-url) | <h4>~460K</h4><p>Label</p><h4>200+</h4><p>Label</p>...<p><a href="...">CTA</a></p> |
```

**Features**:
- JS restructures DOM: image becomes absolute-positioned background, stats overlay on top
- Inner container with 16px border-radius, 1200px max-width, overflow hidden
- Background image fills entire block height at all breakpoints (`picture: position absolute, inset 0; img: object-fit cover`)
- Stats panel with white background, 8px border-radius
- Each stat: h4 number + p label pair, separated by 4px solid `var(--light-color)` borders
- Gold/yellow CTA button (`#ffc400` bg, `#121212` text)

**Responsive behavior**:
- Mobile: Image fills full block height as background, stats card overlaid with `margin: 120px 24px 24px`, padding `24px 16px`
- Desktop (>=992px): Stats panel 280px wide, `margin: 30px 0 30px auto` (right-aligned), padding `24px 20px`, image `border-radius: 16px`

---

### navigation-tabs

**Location**: `/blocks/navigation-tabs/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.navigation-tabs` | Card-style navigation links with arrow icons |

**Features**:
- Row of clickable cards with heading and right-arrow icon
- Used for sub-navigation within a page section

---

### fact-sheets

**Location**: `/blocks/fact-sheets/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.fact-sheets` | Responsive stat grid with icons, numbers, labels, and gold CTA |

**Authoring:**
```
| Fact-Sheets |
| --- | --- |
| <img icon1> | <h4>~460K</h4><p>Employees</p> |
| <img icon2> | <h4>200+</h4><p>Countries & territories served</p> |
| <img icon3> | <h4>20.8M</h4><p>Packages delivered daily</p> |
| <img icon4> | <h4>$88.7B</h4><p>2025 Revenue</p> |
| <p><strong><a href="...">View All Fact Sheets</a></strong></p> |
```

**Features**:
- Each stat has its own icon (57x57px SVG), large number (h4), and label (p)
- JS restructures rows into a flex container with `.fact-sheets-item` wrappers (centered via flexbox)
- Last row (link without h4) becomes gold CTA button below the grid
- Grey separators between items (4px solid `--light-color`)
- Center-aligned content

**Responsive behavior**:
- Mobile (<600px): 1 column, horizontal separators between items
- Tablet (600px-991px): 2 columns, vertical + horizontal separators
- Desktop (>=992px): 4 columns, vertical separators only

---

### columns-media

**Location**: `/blocks/columns-media/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.columns-media` | Asymmetric two-column layout (~1/3 image + ~2/3 text), image on either side |

**Authoring:**

Image on the left (values sections):
```
| Columns-Media |
| --- | --- |
| <picture>image1</picture> | <h2>Heading</h2><p>Description with <strong>bold terms</strong>.</p><ul><li><strong>Term</strong>: explanation</li></ul> |
| <picture>image2</picture> | <h2>Heading</h2><p>Description.</p><p><strong>Sub-heading</strong><br>Additional text.</p> |
```

Text on the left, image on the right (intro/hero usage):
```
| Columns-Media |
| --- | --- |
| <h1>Heading</h1><p>Description text.</p> | <picture>image</picture> |
```

**Features**:
- Multi-row block — each row is one image + text item
- Supports both image-left and image-right layouts based on DOM order
- Image-left (first child): fixed 275px width on desktop, square aspect ratio
- Image-right (last child): flexible ~38% width, natural aspect ratio
- Text column: fluid width, h2 heading (font-weight 400), paragraphs, optional `<ul>` bullet lists
- Inline `<strong>` for key terms within body text and list items
- No card styling (no shadow, no border-radius, no background)
- No eyebrow, no CTA button, no yellow accent line
- 32px gap between image and text columns
- 32px vertical spacing between consecutive rows (`var(--spacing-l)`)
- Works well in `highlight` section for grey background intro areas

**Responsive behavior** (three-tier):
- Phone (<768px): single column stacked (DOM order preserved), max-width 320px centered, images max 290px, 24px top padding on text
- Tablet (≥768px): 50/50 two-column side-by-side, DOM order preserved, 32px gap
- Desktop (≥992px): asymmetric — image-left uses 275px fixed + text fluid; image-right uses ~38% flexible + text fluid. 32px gap, top-aligned

---

### breadcrumb

**Location**: `/blocks/breadcrumb/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.breadcrumb` | Auto-generated breadcrumb trail from URL path |

**Features**:
- Auto-generates breadcrumb from URL path (Home / Segment / Current Page)
- Strips `/content` prefix and locale prefix (`/us/en/`)
- Hidden on home page (removes its section entirely)
- Desktop only (hidden below 992px via section `display: none`)
- Accessible `<nav aria-label="Breadcrumb">` with `<ol>` list
- Angled slash separators between items (`::before` pseudo-element)
- Current page shown as plain text (no link), intermediate segments linked

**Responsive behavior**:
- Mobile (<992px): hidden entirely (section `display: none`)
- Desktop (>=992px): horizontal breadcrumb trail, 32px below nav

---

### fragment (Utility Module)

**Location**: `/blocks/fragment/`

**Note**: Not typically used as a block in content. Provides `loadFragment()` utility function used by `header.js` and `footer.js` to load nav and footer content.

**If used as a block:**
```
| Fragment |
| -------- |
| /path/to/fragment |
```

Loads the referenced fragment HTML and inserts it into the page.

---

### article-header

**Location**: `/blocks/article-header/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.article-header` | Story article header with eyebrow link, title, byline, subtitle, hero image |

**Authoring:**
```
| Article-Header |
| -------------- |
| <a href="/category">Eyebrow Category</a> |
| <h1>Article Title</h1> |
| <p>03-04-2026 | 2 Min Read</p> |
| <p>Subtitle text</p> |
| <picture>hero image</picture> |
```

**Features**:
- 5-row block: eyebrow link, h1 title, byline (date + read time), subtitle, hero image
- Eyebrow link with horizontal yellow accent dash (`::before`, 32x3px, `--accent-dash-color`)
- DA button reset: eyebrow link gets `.button` from `decorateButtons()`, CSS resets it
- Byline in uppercase with letter-spacing
- Subtitle in italic
- Hero image full-width

**Responsive behavior**:
- All viewports: single column, left-aligned, max-width constrained by `--content-max-width`

---

### embed

**Location**: `/blocks/embed/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.embed` | YouTube video embed |

**Authoring:**
```
| Embed |
| ----- |
| <a href="https://www.youtube.com/watch?v=VIDEO_ID">https://www.youtube.com/watch?v=VIDEO_ID</a> |
```

**Features**:
- Extracts YouTube video ID from watch URL
- Creates responsive iframe with 16:9 aspect ratio (`padding-bottom: 56.25%`)
- Lazy loading, full accessibility attributes (allow autoplay, encrypted-media, etc.)

**Responsive behavior**:
- All viewports: fluid 16:9 container, 100% width

---

### social-share

**Location**: `/blocks/social-share/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.social-share` | Social media share links |

**Authoring:**
```
| Social-Share |
| ------------ |
| <a href="https://facebook.com/sharer/...">Facebook</a> <a href="http://twitter.com/share?...">Twitter</a> <a href="https://linkedin.com/shareArticle?...">LinkedIn</a> <a href="mailto:?...">Email</a> |
```

**Features**:
- Horizontal row of circular social media icon buttons
- Platform icons via inline SVG data URIs (Facebook, Twitter/X, LinkedIn, Email)
- Platform detected from link href
- Accessible: `aria-label` on each link, `target="_blank"` with `rel="noopener noreferrer"`
- 40px circular buttons with grey border, hover darkens

**Responsive behavior**:
- All viewports: horizontal flex row, left-aligned

---

### contact-card

**Location**: `/blocks/contact-card/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.contact-card` | Contact info card with title and two-column layout |

**Authoring:**
```
| Contact-Card |
| --- | --- |
| <h3>Title</h3> |
| <h4>Left Label</h4><p>Text</p><ul><li>links</li></ul> | <h4>Right Label</h4><p>Text</p> |
```

**Features**:
- White card (border-radius 5px, box-shadow `var(--shadow-card)`, max-width 1000px)
- H3 title row (font-weight 500, `var(--heading-font-size-m)`)
- Two-column layout with H4 subheadings as eyebrow-style labels (uppercase, letter-spacing 2.08px, `var(--color-muted)`)
- Vertical separator between columns on desktop (`::after` on left column, 4px solid `var(--light-color)`)
- DA button reset: inline links in paragraphs and lists get `.button` from `decorateButtons()`, CSS resets them
- Contact list items: no bullets, standard link styling

**Responsive behavior**:
- Mobile: single column, `var(--spacing-l)` gap between columns
- Desktop (>=992px): side-by-side, left 58% + right flex-1, vertical separator

---

### cards-leadership

**Location**: `/blocks/cards-leadership/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.cards-leadership` | Horizontal person cards with portrait image, yellow accent dash, name, and title |

**Authoring:**
```
| Cards-Leadership |
| --- | --- |
| <picture>portrait</picture> | <h3><a href="...">Person Name</a></h3><p>Title</p> |
| <picture>portrait</picture> | <h3>Person Name (no link)</h3><p>Title</p> |
```

**Features**:
- Horizontal card layout: portrait image left, text details right
- Yellow accent dash (32x3px) above name
- Entire card wraps in `<a>` if h3 contains a link (clickable card)
- Cards without links render without anchor wrapper
- Box shadow, 8px border-radius
- DA button reset for links inside cards

**Responsive behavior**:
- Mobile: single column, max-width 450px centered, 103px portrait
- Desktop (>=992px): 2-column grid (50% each), 180px portrait, `box-sizing: border-box`

**Used on**: Leadership, UPS Foundation Leadership

---

### cards-reports

**Location**: `/blocks/cards-reports/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.cards-reports` | Horizontal document cards with thumbnail, title, and action link |

**Authoring:**
```
| Cards-Reports |
| --- | --- |
| <picture>thumbnail</picture> | <h3>Document Title</h3><p><a href="...">Download</a></p> |
```

**Features**:
- Horizontal card layout: document thumbnail left, details right
- H3 title + action link (Download, Learn More, View)
- Action link styled with bold, underline, link-color
- Box shadow, 8px border-radius
- DA button reset for action links

**Responsive behavior**:
- Mobile: single column, max-width 450px centered, 103px thumbnail
- Desktop (>=992px): 2-column grid (50% each), 180px thumbnail, `box-sizing: border-box`

**Used on**: Reporting

---

### awards-list

**Location**: `/blocks/awards-list/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.awards-list` | Year-tabbed list of award entries |

**Authoring:**
```
| Awards-List |
| --- | --- |
| 2026 | <p>Category</p><h3>Title</h3><p>Date · Description</p><p><a href="...">Read More</a></p> |
| 2026 | <p>Category</p><h3>Title</h3><p>Date · Description</p><p><a href="...">Read More</a></p> |
| 2025 | <p>Category</p><h3>Title</h3><p>Date · Description</p><p><a href="...">Read More</a></p> |
```

**Features**:
- Groups items by year (Col1), creates tab buttons per unique year
- Tab bar with teal active state (#0A8080), grey inactive (#5F5753)
- Active tab: 4px bottom border in teal
- Each item: eyebrow with yellow accent dash, h3 title, meta paragraph, Read More link with chevron
- Max-width 878px centered award list
- Separator lines between items

**Responsive behavior**:
- All viewports: single column list with sticky tab bar
- Tab bar scrollable on mobile if many years

**Used on**: Awards and Recognition

---

### timeline

**Location**: `/blocks/timeline/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.timeline` | Vertical timeline with period navigation and scroll spy |

**Authoring:**
```
| Timeline |
| --- | --- |
| 1907-1950 | <h3>Event Title</h3><p>Description</p> |
| 1907-1950 | <picture>period image</picture> |
| 1951-1975 | <h3>Event Title</h3><p>Description</p> |
```

**Features**:
- Groups items by period (Col1), renders period labels and events
- Events have year badge (yellow accent dash + year text), h3 title, description
- Images rendered full-width with 8px border-radius
- Desktop: sticky sidebar navigation with scroll spy (IntersectionObserver)
- Mobile: dropdown button with collapsible period menu
- Period labels centered on horizontal line with background pill

**Responsive behavior**:
- Mobile: full-width, dropdown period selector, events at full width
- Desktop (>=992px): 75% content + 25% sidebar, sidebar sticky, events indented 100px

**Used on**: Our History

---

### form

**Location**: `/blocks/form/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.form` | Styled form with various field types |

**Authoring:**
```
| Form |
| --- | --- |
| Field Label | text |
| Field Label | email |
| Field Label | textarea |
| Field Label | select: Option 1, Option 2, Option 3 |
| Submit | submit |
```

**Features**:
- Creates form fields from 2-column table rows (label + type)
- Supported types: text, email, textarea, select (with comma-separated options), submit
- Styled inputs with border, 8px radius, 14px padding
- Select with custom chevron SVG
- Submit button: gold CTA (#FFC400), pill border-radius
- Labels visually hidden (placeholder-only approach)

**Responsive behavior**:
- All viewports: max-width 600px centered form, full-width fields

**Used on**: Thank a UPS Hero

---

### data-table

**Location**: `/blocks/data-table/`

| Variant | Class | Purpose |
|---------|-------|---------|
| Default | `.data-table` | Converts div block structure to native HTML `<table>` |

**Authoring:**
```
| Data-Table |
| --- | --- | --- |
| Header 1 | Header 2 | Header 3 |
| Row 1 Col 1 | Row 1 Col 2 | Row 1 Col 3 |
```

**Features**:
- JS converts the div-based block structure into a native `<table>` element
- First row becomes `<thead>` with `<th>` cells, remaining rows become `<tbody>` with `<td>` cells
- Styled with blue header row, alternating grey row backgrounds, centered non-first columns
- Necessary because the import pipeline (DOM → markdown → DA HTML) converts all `<table>` elements to divs

**Responsive behavior**:
- All viewports: full-width table, horizontal scroll on narrow viewports via container

**Used on**: Gender Equality Index - UPS France

---

## Import Infrastructure

Import scripts for bulk content migration are in `/tools/importer/`.

### Universal Import Script

**⚠️ CRITICAL: Always use `import-universal.bundle.js` for all page imports.** The universal script supersedes all per-template import scripts. It handles every page type on the UPS site automatically:

- **Article pages**: Auto-detected via `.pr15-details` selector → article-header, body content, embed, social-share, related stories
- **Standard pages**: All other pages → block registry detection, DOM walking, section grouping with wrapper-aware styles

The script includes all 18 block parsers and the cleanup transformer. It detects section wrapper contexts (arc, highlight, arc-wave) before cleanup runs, then applies appropriate section-metadata styles in the output.

**Bundling** (must re-bundle after ANY change to import-universal.js, parsers, or transformers):
```bash
npx esbuild tools/importer/import-universal.js --bundle --format=iife --global-name=CustomImportScript --outfile=tools/importer/import-universal.bundle.js
```
**⚠️ CRITICAL: Use `--format=iife --global-name=CustomImportScript`**. The bulk import runner injects the script as a `<script>` tag and looks for `window.CustomImportScript.default`. ESM format (`--format=esm`) will NOT work.

**Usage:**
```bash
node run-bulk-import.js --import-script tools/importer/import-universal.bundle.js --urls urls-file.txt
```

### File Reference

| File | Purpose |
|------|---------|
| `page-templates.json` | Template definitions mapping source URL patterns to blocks |
| **`import-universal.js`** | **Universal import script — use this for ALL pages** |
| **`import-universal.bundle.js`** | **Bundled universal script (passed to run-bulk-import.js)** |
| `parsers/cards-awards.js` | Parser for cards-awards block |
| `parsers/cards-stories.js` | Parser for cards-stories block |
| `parsers/columns-feature.js` | Parser for columns-feature block |
| `parsers/columns-quote.js` | Parser for columns-quote block |
| `parsers/columns-stats.js` | Parser for columns-stats block (home page) |
| `parsers/fact-sheets.js` | Parser for fact-sheets block (our-company page) |
| `parsers/hero-featured.js` | Parser for hero-featured block |
| `parsers/columns-media.js` | Parser for columns-media block — handles hero grid (.herogrid) and list container (#list-container) patterns |
| `parsers/article-header.js` | Parser for article-header block (story article pages) |
| `parsers/embed.js` | Parser for embed block (YouTube iframe → watch URL link) |
| `parsers/social-share.js` | Parser for social-share block (social media share links) |
| `parsers/contact-card.js` | Parser for contact-card block (Media Relations section on newsroom) |
| `parsers/navigation-tabs.js` | Parser for navigation-tabs block |
| `parsers/cards-leadership.js` | Parser for cards-leadership block (leadership portraits) |
| `parsers/cards-reports.js` | Parser for cards-reports block (report document cards) |
| `parsers/timeline.js` | Parser for timeline block (our-history page) |
| `parsers/awards-list.js` | Parser for awards-list block (awards-and-recognition page) |
| `parsers/form.js` | Parser for form block (contact/speaker request forms) |
| `transformers/ups-cleanup.js` | Site-wide DOM cleanup transformer |

---

## Local Assets

**Icons** (`/icons/`):
- `search.svg` — Search icon
- `ups-logo.svg` — UPS logo

**Fonts** (`/fonts/`):
- `roboto-regular.woff2`, `roboto-medium.woff2`, `roboto-bold.woff2` — Roboto web fonts
- `roboto-condensed-bold.woff2` — Roboto Condensed Bold
- `upspricons.woff` — UPS icon font (button chevron `\e60f`)

---

## CSS Style Guide

### Color Syntax
Always use CSS Color Level 4 syntax:
```css
/* ✓ Correct */
color: rgb(0 0 0 / 95%);
background: rgb(255 255 255 / 50%);

/* ✗ Avoid */
color: rgba(0, 0, 0, 0.95);
background: rgba(255, 255, 255, 0.5);
```

### CSS Variables Usage
1. **Always use tokens** for: colors, spacing, typography, shadows, transitions
2. **Define new tokens** only if a value is used 2+ times across different files
3. **Keep hardcoded** intentional design dimensions (specific widths, icon sizes)

### Comment Format
Use consistent section headers:
```css
/* ===== SECTION NAME ===== */
```

### Block CSS Scoping
- Scope all styles to the block class: `.my-block .child-element`
- Avoid external context selectors unless necessary (e.g., `.section.highlight .my-block`)
- Use `:has()` on wrapper for edge-to-edge blocks: `main > div:has(.my-block)`

### Fixed Dimensions with Padding
When setting explicit width/height on elements that also have padding:
```css
/* ✓ Correct - dimensions include padding */
.card {
  box-sizing: border-box;
  width: 160px;
  height: 120px;
  padding: 16px;
}

/* ✗ Wrong - actual size will be 192x152px */
.card {
  width: 160px;
  height: 120px;
  padding: 16px;
}
```

### Font Family
Always use the variable, never hardcode:
```css
/* ✓ Correct */
font-family: var(--body-font-family);

/* ✗ Avoid */
font-family: 'Helvetica Neue', sans-serif;
```

---

## JavaScript Style Guide

### Block Module Pattern
Export only the default decorate function:
```javascript
// ✓ Correct
export default function decorate(block) { ... }

// ✗ Avoid - unless function is imported elsewhere
export function showSlide() { ... }
```

### DOM Manipulation
1. Use `document.createElement()` for structural elements
2. `innerHTML = ''` is acceptable for clearing containers
3. `innerHTML` with template literals is acceptable for:
   - Fully controlled static content (no user input)
   - Simple markup that would be verbose with createElement
4. Always scope queries to `block`: `block.querySelector('.child')`

### Accessibility
Always include ARIA attributes on interactive elements:
- `aria-label` on buttons without visible text
- `aria-hidden` on decorative elements
- `aria-expanded` on toggleable sections

---

## Reminders

1. **Screenshots → `/tmp/` ONLY** - Never save to project root or workspace
2. Always read files before editing
3. Test in preview at localhost:3000
4. Check hover states - many elements have specific behaviors
5. Follow existing patterns in the codebase
6. Update this file when learning new project-specific patterns
7. Use `box-sizing: border-box` when setting width/height on padded elements
8. **Fragment files** (nav.html, footer.html) must NOT have `<header>` or `<footer>` tags
9. **Merge similar blocks into single multi-row blocks** - don't create separate blocks for each row of similar content
10. **Page-specific styles stay page-specific** - When importing styles from one page to match another, NEVER modify shared block CSS in ways that affect other pages
11. **CSS variable naming** - NEVER use `--spacing-sm`, `--spacing-md`, `--spacing-lg`. The correct names are `--spacing-s`, `--spacing-m`, `--spacing-l`. Using incorrect names will silently fail.
12. **Links vs Buttons** - In EDS, links that are alone in a paragraph (`<p><a>...</a></p>`) become buttons styled by global styles. If a block needs specific button styling, the block CSS must override the global button styles using block-scoped selectors.
13. **Default content centering is global** - Centering of `.default-content-wrapper` content applies to ALL pages unconditionally.
14. **Template meta tag in HTML head** - The `decorateTemplateAndTheme()` function reads `<meta name="template" content="...">` from the `<head>`, NOT from the metadata block in the body. When creating new page HTML files, always add `<meta name="template" content="template-name"/>` to the `<head>` if the page uses a template.
15. **CSS variables: always verify before using** - Before using ANY CSS variable in your code, verify it exists in `styles.css`. CSS variables that don't exist silently resolve to nothing.
16. **Block CSS must not override global button styles with link styles** - In EDS, `a.button` gets global button styling. Block CSS should NEVER set `color: var(--link-color)` on `a.button` elements.
17. **Absolute-position `<picture>` for background images** - When using a `<picture>` element as a background (inside an absolutely-positioned container), the `<picture>` must also be `position: absolute; inset: 0`. Setting `height: 100%` alone on `<picture>` does not reliably stretch it to fill the parent.
18. **Lazy loading breaks after DOM restructuring** - When a block JS moves images from original DOM positions to new containers, set `img.loading = 'eager'` on all `img[loading="lazy"]` elements in the block.
19. **Don't use `createOptimizedPicture` for external images** - During migration, images reference external URLs. `createOptimizedPicture` strips the domain and creates broken local paths. Leave external images as-is.
20. **All-caps content → CSS text-transform** - Never import all-caps text literally. Convert to Title Case in content and apply `text-transform: uppercase` via CSS on the target element.
21. **Block-wide bold → CSS font-weight** - Don't wrap entire block elements in `<strong>`. Apply `font-weight: 700` via CSS targeting the element's position (e.g., `p:first-child`). Reserve `<strong>` for inline emphasis only.
22. **Margin-driven spacing system** - Sections have `padding: 0` by default so wrapper margins collapse through them for cross-section gaps. Block wrappers = 80px margin-top, default-content = 40px base (overridden to 32px/24px for same-section siblings). Background sections (highlight) use `padding: 80px 0` with first/last child margin reset to 0. Never add section padding to regular sections.
23. **Never push to Git yourself** - The user handles all Git operations (commit, push, branch). Only modify files — leave Git workflow to the user.
24. **Content and code are strictly separated** - Content (HTML) lives in DA (CMS), code (JS/CSS) lives in Git. Never commit HTML content to Git. Never modify `.gitignore` to track HTML files.
25. **DA wraps inline content in `<p>` tags** - Block JS/CSS must use flexible selectors (e.g., `:scope > a, :scope > p > a`) to handle both direct children and p-wrapped children from DA. Never add JS unwrapping logic — fix compatibility in CSS with button resets and in JS with dual selectors.
26. **Fragment default paths are root-relative** - `header.js` defaults to `/nav`, `footer.js` defaults to `/footer`. Local dev pages override these via `<meta name="nav" content="/content/nav"/>`. On deployed (DA), no override exists — the default root path is used.
27. **`p.button-wrapper` must have `margin: 0`** — The global `p.button-wrapper` rule must NOT add margin. Spacing is handled by the `* + *` rule inside default-content-wrapper. Extra margin on button-wrapper leaks through section boundaries (where sections have `padding: 0`) and creates incorrect gaps.
28. **Content files use `.plain.html` div format** — Blocks as `<div class="block-name">`, sections as top-level `<div>` wrappers, metadata as `<div class="metadata">`. No page shell, no `<hr>` separators. See "`.plain.html` Content Format" in Migration Rules.
29. **Import scripts: use DOM-walking, not rigid section assembly** — Parsers call `element.replaceWith(blockDiv)` which detaches the original element reference. Never search stale `block.element` after parsing. Instead, walk the DOM after all parsers run to collect block divs and default content in natural document order. This also handles pages with different block orders using the same template. See `import-universal.js` for the reference implementation.
30. **`.plain.html` is the single source of truth** — All content edits go directly in `.plain.html` files. No `.html` or `.md` files should exist in the content folder. This is the format DA consumes and produces.
31. **Always use `import-universal.bundle.js` for all imports** — The universal import script handles every page type (articles and standard pages). No per-template scripts exist — only the universal script.
32. **Data tables in `.plain.html`** — The `.plain.html` format converts all tables to divs. Use the `data-table` block for data tables: the import script outputs `Data-Table` as the block name, and `data-table.js` converts the div structure back to a native `<table>` at decoration time.
33. **Keep sitemap blocks[] current after every content change** — After imports, re-imports, or any content modification, update the affected page's `blocks[]` and `sectionStyles[]` in `/sitemap.json`. Before refactoring block CSS/JS, query the sitemap to find all affected pages.

---

## CSS Patterns to Maintain

### Constrain and Center Images on Mobile
```css
@media (width < 992px) {
  .image-container {
    max-width: 500px;
    margin: 0 auto;
  }
}
```

### Background Image Pattern (for blocks with image as background)
```css
/* Container: position relative */
.block .inner {
  position: relative;
  overflow: hidden;
}

/* Picture: absolute-positioned to fill container */
.block .inner > picture {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
}

/* Image: fill and cover */
.block .inner > picture img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Content: positioned above image */
.block .content {
  position: relative;
  z-index: 1;
}
```

### Blockquote Pattern (global default content styling)
```css
main .default-content-wrapper blockquote {
  border-left: 4px solid var(--color-gold);
  padding-left: var(--spacing-m);
  margin: 0;
  font-style: italic;
  text-align: left;
}

main .default-content-wrapper blockquote p {
  margin: 0;
}
```

### DA Button Reset Pattern (for blocks loading fragments)
When DA wraps links in `<p>` tags, `decorateButtons()` applies `.button` and `.button-wrapper` classes. Reset them in block CSS:
```css
/* Reset button styling from decorateButtons() on DA-wrapped links */
.block-name a.button:any-link {
  display: inline;
  margin: 0;
  border: none;
  border-radius: 0;
  padding: 0;
  background: none;
  color: currentcolor;
  font-size: inherit;
  font-weight: inherit;
  white-space: nowrap;
}

.block-name a.button:any-link:hover {
  background: none;
  border: none;
}

.block-name a.button:any-link::after,
.block-name .button-wrapper {
  all: unset;
}
```

### Decorative Arc Background Pattern (section `::after` with SVG)
```css
/* Section: creates stacking context */
main > .section.arc {
  position: relative;
  z-index: 0;
}

/* ::after: SVG positioned at bottom behind content */
main > .section.arc::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: auto;
  padding-top: calc(5%); /* responsive height based on section width */
  background-image: url("data:image/svg+xml,...");
  background-repeat: no-repeat;
  background-size: 100%;
  background-color: transparent;
  z-index: -1;
  pointer-events: none;
}
```

### Data Table Pattern (native HTML tables in default content)
```css
main .default-content-wrapper table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: var(--body-font-size-s);
}

main .default-content-wrapper table th {
  background: var(--link-color);
  color: #fff;
  font-weight: 700;
  padding: var(--spacing-xs) var(--spacing-s);
  text-align: center;
}

main .default-content-wrapper table td {
  padding: var(--spacing-xs) var(--spacing-s);
  border-bottom: 1px solid var(--color-border);
}

main .default-content-wrapper table td:not(:first-child) {
  text-align: center;
}
```

---

## UPS Source Site Notes

**Source URL**: https://about.ups.com/us/en/home.html

**Site structure** (confirmed from migration):
- **Header**: UPS logo (60px), horizontal navigation (Our Stories, Our Company, Our Impact, Investors, Newsroom), utility links (ups.com, Support). Mega menu dropdowns on desktop with full-width panels.
- **Hero**: Full-width h1 heading "Moving our world forward by delivering what matters" with yellow accent bar below, centered text.
- **Featured content (hero-featured)**: Background image with white card overlay — eyebrow, h4 heading, description, gold CTA.
- **Story cards (cards-stories)**: 3-column grid of clickable story cards with image, eyebrow, title, description.
- **About section**: Centered text with h6 eyebrow ("About Us"), h2 heading, CTA button. Uses `accent-bar` section style.
- **Stats (columns-stats)**: Full-width image with overlapping white stats panel — ~460K Employees, 200+ Countries, 20.8M Packages/day, $88.7B Revenue, gold CTA.
- **Impact section (columns-feature)**: Two-column with image left, text right — eyebrow, h2 heading, description, CTA.
- **Footer**: Highlighted links strip (Newsroom, Careers), 4-column links grid (This Site, Other UPS Sites, Connect, Subscribe), legal links row, copyright.

**Brand colors** (confirmed):
- Gold/Yellow CTA buttons: `#ffc400` (background), `#e0ac00` (hover)
- Yellow accent elements: `#ffd100` (eyebrow dash), `#ffdc40` (heading bar)
- Text: `#242424` (primary), `#505050` (secondary)
- Links: `#426da9` (default), `#244674` (hover)
- Backgrounds: `#fff` (white), `#f2f2f2` (light grey/highlight)

**Typography**: Roboto (regular 400, medium 500, bold 700), Roboto Condensed Bold. Font weights: headings use 500, body 400, eyebrows/buttons 700.
