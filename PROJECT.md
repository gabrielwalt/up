# Project Memory - UPS Migration

Migrating UPS "About" site (https://about.ups.com/us/en/home.html) to Adobe Edge Delivery Services.

---

## ⚠️ CRITICAL RULES

1. **NEVER create screenshots outside `/tmp` folder** - All screenshots MUST be saved to `/tmp/` directory. Never save screenshots to project root or any workspace folder.
2. **Always read files before editing** - Never modify code without reading it first.
3. **Use `box-sizing: border-box`** - When setting explicit width/height on elements with padding.
4. **REUSE existing blocks** - Always use existing blocks and variants before creating new ones. See "Block Reuse Guidelines" section.
5. **Keep CLAUDE.md up-to-date** - Update this file when creating/modifying/deleting blocks, variants, or patterns. See "Maintaining This Documentation" section.
6. **Create variants, not new blocks** - When a content pattern is similar to an existing block but needs different styling, create a VARIANT of that block (not a new block). This maintains consistency and reduces code duplication.
7. **Never import all-caps content as-is** - When source content is ALL CAPS in the DOM (e.g., "REPORTS AND DISCLOSURES"), convert it to Title Case or Sentence case in the HTML content and apply `text-transform: uppercase` via CSS instead. This preserves authoring flexibility and avoids requiring authors to type in all caps.
8. **Don't rely on bold/strong for block-wide styling** - If an entire text element in a block needs to be bold or styled differently (like eyebrow labels or attribution text), apply `font-weight: 700` via CSS targeting the element position (e.g., `:first-child`). Reserve `<strong>` only for inline emphasis where the author wants to distinguish specific words from surrounding text.
9. **Keep import scripts aligned with content HTML** - When changing content markup patterns, update all related parsers in `tools/importer/parsers/`. Content HTML is the source of truth; parsers must reproduce it exactly. See "Import Script Alignment" in Migration Rules.

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
    │         └─ NO → Can styling be achieved with section styles (dark, highlight)?
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
- `dark` - Dark background with light text
- `highlight` - Accent background color

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
| Full-width image section | Use `image-full-width` section style | Create new `full-image` block |
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
- Generic variants (e.g., `dark`) are not prefixed and can be applied to any block or section

**When to create a NEW block instead of variant**:
- Content structure is fundamentally different (>50% different markup)
- JavaScript logic is completely different
- No shared styling or behavior with existing blocks

### Fade-in-up Animation on Import

**⚠️ When importing content, inspect the original page for scroll-triggered fade-in animations and apply the `fade-in-up` section style accordingly.**

The UPS source site uses scroll-triggered fade-in-up animations on many sections. When importing a page:

1. **Identify animated sections**: Scroll through the original page and note which sections animate into view (elements slide up and fade in as you scroll down).
2. **Apply `fade-in-up` section style**: Add a `section-metadata` block at the end of each animated section:
   ```html
   <div class="section-metadata">
     <div><div>Style</div><div>fade-in-up</div></div>
   </div>
   ```
3. **Combine with other styles**: If the section also has a background style, combine them:
   ```html
   <div><div>Style</div><div>highlight, fade-in-up</div></div>
   ```
4. **Headings are excluded**: The animation only applies to non-heading children (`p`, blocks, buttons, etc.). Headings (`h1`–`h6`) remain visible immediately — this is by design.
5. **Cards-awards special handling**: For `cards-awards` blocks inside `fade-in-up` sections, individual list items animate with staggered delays (0.2s, 0.4s, 0.6s).

**Common animated sections on the UPS site:**
- "Governing Ethically" and similar text+CTA sections
- "Awards & Recognition" with the grey highlight background
- Statistics and impact sections

### Import Script Alignment

**⚠️ CRITICAL: Import infrastructure (parsers, transformers, page-templates.json) MUST stay aligned with the actual content HTML structure.**

The import scripts in `tools/importer/` are designed to reproduce the exact content structure found in `content/`. When the content structure changes (e.g., CSS-handled styling replaces inline markup), the parsers must be updated to match.

**Rules for keeping scripts aligned:**

1. **Content HTML is the source of truth** — If the content HTML uses plain `<p>` for eyebrows, parsers must output plain `<p>` (not `<p><strong>...</strong></p>`).
2. **CSS handles presentation** — Bold, uppercase, colors, and spacing are all CSS concerns. Parsers should output clean semantic HTML and let block CSS handle visual styling.
3. **Create clean DOM elements in parsers** — Always use `document.createElement()` to build output elements rather than pushing source DOM nodes directly. Source nodes carry classes, attributes, and inline styles from the original site that don't belong in EDS content.
4. **Verify after content changes** — When modifying content markup patterns (e.g., removing `<strong>` wrappers from eyebrows), update ALL parsers that produce that pattern. Search across `tools/importer/parsers/` for the old pattern.
5. **Never overwrite verified content** — When simulating an import to check alignment, compare the parser output against existing content HTML. Fix the parser to match the content, never the other way around.

**Eyebrow text pattern (established):**
- Content HTML: `<p>Eyebrow Text</p>` (plain paragraph)
- CSS: `font-weight: 700; text-transform: uppercase; letter-spacing: 1.6px;` on the eyebrow class
- Parser: `const p = document.createElement('p'); p.textContent = eyebrow.textContent.trim();`
- Applies to: columns-feature, cards-awards, cards-stories, hero-featured eyebrows

**Yellow accent segment pattern (established):**
- Eyebrow dashes: `::before` pseudo-element, `width: 32px; height: 3px; background: #ffd100; border-radius: 5px;` positioned absolutely with `left: 0; top: 50%; transform: translateY(-50%);` and `padding-left: 40px` on the text element
- Heading bars: `::after` pseudo-element on H1, `width: 80px; height: 4px; background: #ffdc40; border-radius: 5px; margin: 32px auto 0;` displayed as block

---

## Maintaining This Documentation

**This file is the project's source of truth.** Keep it current to ensure consistency.

### When to Update CLAUDE.md

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
- **Blocks**: `/blocks/` (add block directories as created)
- **Icons**: `/icons/` (custom SVG icons)
- **Icon font**: `/fonts/upspricons.woff` — UPS icon font (button chevron `\e60f`, circle arrow `\e603`)
- **Images**: `/content/images/` (local assets)
- **Navigation**: `/content/nav.html`, `/content/nav.plain.html` (fragment files)
- **Footer**: `/content/footer.html`, `/content/footer.plain.html` (fragment files)

---

## Pages Inventory

All content pages in this project and their source URLs.

| Local Path | Origin URL | Description |
|------------|-----------|-------------|
| `/content/us/en/home.html` | https://about.ups.com/us/en/home.html | Homepage |
| `/content/us/en/our-impact.html` | https://about.ups.com/us/en/our-impact.html | Our Impact landing page |
| `/content/nav.html` | Derived from https://about.ups.com/us/en/home.html | Navigation fragment |
| `/content/footer.html` | Derived from https://about.ups.com/us/en/home.html | Footer fragment |

**URL mapping convention**: Local paths follow the origin URL structure with `/content/` prefix.

---

## Fragment Files

Fragment files (`nav.html`, `footer.html`) are loaded by blocks, not rendered as standalone pages.

**⚠️ CRITICAL**: Fragment files must NOT have `<header></header>` or `<footer></footer>` tags in their HTML structure. These tags cause AEM to try loading header/footer blocks on the fragment page itself, creating recursive loading issues.

**Correct fragment structure**:
```html
<!DOCTYPE html>
<html>
<head>...</head>
<body>
<main>
  <!-- Fragment content here -->
</main>
</body>
</html>
```

**Wrong** (causes duplicate header/recursion):
```html
<body>
<header></header>  <!-- ✗ Don't include -->
<main>...</main>
<footer></footer>  <!-- ✗ Don't include -->
</body>
```

---

## Design Tokens

Defined in `/styles/styles.css` - reference these variable names, don't hardcode values.

**TODO**: Define design tokens after analyzing the UPS site's color palette, typography, and spacing. The UPS brand uses brown (#644117 / #351C15) and gold (#FFB500) as primary colors.

### ⚠️ CRITICAL: CSS Variable Naming Convention

**NEVER use these incorrect variable names:**
- ~~`--spacing-sm`~~ → Use `--spacing-s`
- ~~`--spacing-md`~~ → Use `--spacing-m`
- ~~`--spacing-lg`~~ → Use `--spacing-l`

**Recommended spacing variable names:**
| Variable | Value |
|----------|-------|
| `--spacing-xxs` | 4px |
| `--spacing-xs` | 8px |
| `--spacing-s` | 12px |
| `--spacing-m` | 16px |
| `--spacing-l` | 24px |
| `--spacing-xl` | 32px |
| `--spacing-xxl` | 48px |
| `--spacing-xxxl` | 64px |

**Why this matters:** Using non-existent variable names like `--spacing-md` will silently fail - the CSS rule will have no effect because the variable resolves to nothing. Always verify variable names exist in `styles.css` before using them.

### ⚠️ CRITICAL: Always Verify CSS Variables Before Using

**Before writing any CSS property with `var(--...)`, cross-check against the variables defined in `styles.css`.** If the variable isn't defined, it does NOT exist and will silently fail.

---

## CSS Guidelines

1. **Never use `!important`** - increase selector specificity instead
2. **Use CSS custom properties** - reference design tokens, override at block level when needed
3. **Edge-to-edge blocks** - use `:has()` selector on wrapper: `main > div:has(.block-name)`
4. **Specificity order in styles.css** - section-specific styles must come BEFORE template styles to maintain proper cascade
5. **Visually hidden text** - use `clip-path: inset(50%)` instead of deprecated `clip: rect()`
6. **Backdrop filter** - always include both `-webkit-backdrop-filter` and `backdrop-filter`

---

## Lint Rules

- **no-descending-specificity**: For complex block CSS with variant overrides, add `/* stylelint-disable no-descending-specificity */` at the top of the file
- **declaration-block-no-duplicate-properties**: Never duplicate CSS properties (except vendor prefixes like `-webkit-`)
- **property-no-deprecated**: Use modern equivalents (`clip-path` not `clip`)

---

## Responsive Breakpoints

Only two breakpoints, derived from the UPS source site. Content flows fluidly between them — avoid adding extra breakpoints.

| Breakpoint | Value | Usage |
|------------|-------|-------|
| **mobile** | 992px | Below: single-column mobile layout. Above: multi-column desktop layout. |
| **nav** | 1024px | Below: hamburger menu. Above: full horizontal navigation. |

**Content max-width**: `1400px` — main content area is capped at this width and centered on wider viewports.

**Media query syntax** (use modern CSS syntax):
```css
/* Mobile-first — desktop layout */
@media (width >= 992px) { }

/* Desktop-first — mobile layout */
@media (width < 992px) { }

/* Navigation breakpoint */
@media (width >= 1024px) { }
```

### Fluid Responsive Behavior

**⚠️ IMPORTANT**: Avoid fixed-width "jumps" between breakpoints. Content should scale fluidly across all viewport sizes.

**Principles:**
1. **Content max-width of 1400px** - Main content is constrained and centered; header, footer, and edge-to-edge blocks may extend to full viewport width
2. **Use percentage-based or viewport-relative widths** - Prefer `%`, `vw`, `fr` units over fixed `px` widths for containers
3. **Flexible grids with auto-fill** - Use `repeat(auto-fill, minmax(min, 1fr))` for responsive card layouts
4. **Smooth transitions** - When switching layouts at breakpoints, ensure visual continuity
5. **Two breakpoints only** - Resist adding intermediate breakpoints; let content reflow naturally

---

## EDS Authoring Patterns

- **Link → Button**: Link alone in its own paragraph becomes a button
- **Link stays link**: Link inline with other text stays a link
- **Section metadata**: Use `section-metadata` block to apply styles like `highlight`, `dark`, `image-full-width`
- **Page templates**: Add `Template: template-name` to page metadata for page-specific styles
- **HTML in table cells**: Markdown syntax (like `## Heading`) is NOT parsed inside table cells. Use HTML tags (`<h2>Heading</h2>`) when you need structured content in block tables.
- **One row per item**: In block tables (carousel, accordion), each row becomes one item/slide. Combine all content for an item into a single row using HTML.

---

## Page Templates

Templates are applied via page metadata: `Template: template-name`

| Template | Class Applied | Purpose |
|----------|---------------|---------|
| *(none defined yet)* | | |

**TODO**: Define templates as pages are imported.

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
| `highlight` | `.section.highlight` | Accent background color |
| `dark` | `.section.dark` | Dark background, light text |
| `image-full-width` | `.section.image-full-width` | Images break out of container to full viewport width |
| `fade-in-up` | `.section.fade-in-up` | Scroll-triggered fade-in-up animation for section children. Uses IntersectionObserver (in `delayed.js`) to add `.visible` class when 15% visible. Children animate with staggered delays (0s, 0.2s, 0.4s...). For cards blocks, individual list items animate separately. Can be combined with other styles (e.g., `highlight, fade-in-up`). |

**Example usage in content:**
```html
<div class="section-metadata">
  <div><div>Style</div><div>dark</div></div>
</div>
```

---

## Block Reference

Complete reference of all blocks and their variants.

### Summary Table

| Block | Variants | Description |
|-------|----------|-------------|
| **header** | — | Site header (to be built) |
| **footer** | — | Site footer (to be built) |
| **fragment** | — | Utility for loading content fragments |
| **columns** | columns-feature, columns-quote, columns-stats | Side-by-side content layout |
| **cards** | cards-awards, cards-stories | Card-based content grid |
| **hero** | hero-featured | Hero banner with overlay card |
| **navigation-tabs** | — | Card-style navigation links with arrow icons |

---

## Custom Blocks

*(Document each block here as it is created. Follow the Documentation Checklist for New Blocks.)*

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
| Default | `.hero-featured` | Full-width hero with background image and white card overlay |

**Authoring:**
```
| Hero-Featured |
| --- |
| ![alt](image-url) |
| <p>Eyebrow</p><h4>Heading</h4><p>Description</p><p><a href="...">CTA</a></p> |
```

**Features**:
- Full-width background image (first row)
- White card overlay at bottom-left (rounded 8px, no box-shadow)
- Eyebrow text with horizontal yellow accent dash (`::before`, 32x3px, #ffd100)
- h4 heading, description, outlined CTA button (default global style)

**Responsive behavior**:
- Mobile: min-height 400px, card max-width 480px
- Desktop (>=992px): min-height 600px, card max-width 50%, padding 72px 64px

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
| Default | `.columns-stats` | Image with overlapping stats panel |

**Authoring:**
```
| Columns-Stats |
| --- | --- |
| ![alt](image-url) | <h4>~460K</h4><p>Label</p><h4>200+</h4><p>Label</p>...<p><a href="...">CTA</a></p> |
```

**Features**:
- Left image (fills available width)
- Stats panel overlaps image on desktop (`margin-left: -40px`, centered vertically)
- Each stat: h4 number + p label pair, separated by 4px solid `var(--light-color)` borders
- Gold/yellow CTA button (`#ffc400` bg, `#121212` text, no border)

**Responsive behavior**:
- Mobile: stacks vertically (image then stats)
- Desktop (>=992px): image fills flex space, stats panel 280px wide overlapping with `border-radius: 8px`

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

## Local Assets

**Icons** (`/icons/`): *(add icons as they are created)*

**Images** (`/content/images/`): *(add images as they are imported)*

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
- Avoid external context selectors unless necessary (e.g., `.section.dark .my-block`)
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
10. **Use teaser (teaser-hero) for single hero items** - don't use carousel (carousel-hero) for non-rotating single items
11. **Page-specific styles stay page-specific** - When importing styles from one page to match another, NEVER modify shared block CSS in ways that affect other pages
12. **CSS variable naming** - NEVER use `--spacing-sm`, `--spacing-md`, `--spacing-lg`. The correct names are `--spacing-s`, `--spacing-m`, `--spacing-l`. Using incorrect names will silently fail.
13. **Links vs Buttons** - In EDS, links that are alone in a paragraph (`<p><a>...</a></p>`) become buttons styled by global styles. If a block needs specific button styling, the block CSS must override the global button styles using block-scoped selectors.
14. **Default content centering is global** - Centering of `.default-content-wrapper` content applies to ALL pages unconditionally.
15. **Template meta tag in HTML head** - The `decorateTemplateAndTheme()` function reads `<meta name="template" content="...">` from the `<head>`, NOT from the metadata block in the body. When creating new page HTML files, always add `<meta name="template" content="template-name"/>` to the `<head>` if the page uses a template.
16. **CSS variables: always verify before using** - Before using ANY CSS variable in your code, verify it exists in `styles.css`. CSS variables that don't exist silently resolve to nothing.
17. **Block CSS must not override global button styles with link styles** - In EDS, `a.button` gets global button styling. Block CSS should NEVER set `color: var(--link-color)` on `a.button` elements.
18. **Picture elements need explicit height** - When using `img { width: 100%; height: 100%; object-fit: cover; }`, the parent `<picture>` element also needs `width: 100%; height: 100%`.
19. **Lazy loading breaks after DOM restructuring** - When a block JS moves images from original DOM positions to new containers, set `img.loading = 'eager'` on all `img[loading="lazy"]` elements in the block.
20. **Don't use `createOptimizedPicture` for external images** - During migration, images reference external URLs. `createOptimizedPicture` strips the domain and creates broken local paths. Leave external images as-is.
21. **All-caps content → CSS text-transform** - Never import all-caps text literally. Convert to Title Case in content and apply `text-transform: uppercase` via CSS on the target element.
22. **Block-wide bold → CSS font-weight** - Don't wrap entire block elements in `<strong>`. Apply `font-weight: 700` via CSS targeting the element's position (e.g., `p:first-child`). Reserve `<strong>` for inline emphasis only.

---

## CSS Patterns to Maintain

### Full-Width Breakout
```css
main .section.image-full-width .default-content-wrapper p:has(picture) {
  align-self: stretch;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  max-width: unset;
}
```

### Constrain and Center Images on Mobile
```css
@media (width < 992px) {
  .image-container {
    max-width: 500px;
    margin: 0 auto;
  }
}
```

---

## UPS Source Site Notes

**Source URL**: https://about.ups.com/us/en/home.html

**Observed site structure** (to be refined during import):
- **Header**: Logo, search, navigation (Our Stories, Our Company, Our Impact, Investors, Newsroom), language selector
- **Hero**: Full-width hero with headline "Moving our world forward by delivering what matters"
- **Featured content**: Card/story with image and CTA
- **About section**: "Customer First, People Led, Innovation Driven" with CTA
- **Stats**: ~460K Employees, 200+ Countries, 20.8M Packages/day, $88.7B Revenue
- **Impact section**: Text content with CTA
- **Footer**: Multi-column links (Our Stories, Our Company, Our Impact, Investors, Newsroom, Support), social links, legal links, copyright

**Brand colors** (to verify during import):
- UPS Brown: `#644117` / `#351C15`
- UPS Gold/Yellow: `#FFB500`
- White and dark grays for text

**Typography** (to verify): The site appears to use a sans-serif font stack.
