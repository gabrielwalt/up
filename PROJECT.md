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
9. **Keep import scripts aligned with content HTML** - When changing content markup patterns, update all related parsers in `tools/importer/parsers/`. Content HTML is the source of truth; parsers must reproduce it exactly. See "Import Script Alignment" in Migration Rules.
10. **NEVER push HTML content via Git** - Content and code are strictly separated. Content lives in the CMS (DA), code lives in Git. Never add `.html` files to Git, never modify `.gitignore` to track HTML files. See "Content Architecture" section.
11. **NEVER commit or push to Git yourself** - The user handles all Git operations (commit, push, branch management). Only make code changes to files — leave staging, committing, and pushing to the user.
12. **Code must be compatible with DA markup** - DA (Document Authoring) wraps inline content in `<p>` tags in `.plain.html` output. Block JS and CSS must handle this gracefully with flexible selectors — never add JS workarounds to unwrap DA markup. See "DA Markup Compatibility" section.

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

### Fragment Loading: How Nav and Footer Work

The header and footer blocks load their content as **fragments** via `loadFragment()`:

1. `header.js` fetches `{navPath}.plain.html` (default: `/nav`)
2. `footer.js` fetches `{footerPath}.plain.html` (default: `/footer`)
3. The `.plain.html` format is a clean HTML representation of the authored content

**Path resolution on deployed vs local:**
- **Deployed** (aem.page/aem.live): Content at root paths — `/nav.plain.html`, `/footer.plain.html`
- **Local dev** (localhost:3000): Content at `/content/nav.plain.html` (page metadata overrides the default path)

The local page HTML has `<meta name="nav" content="/content/nav"/>` which overrides the default `/nav` path. On deployed, this meta tag is absent, so the default `/nav` path is used — which correctly resolves to DA content.

### DA Markup Compatibility

**DA (Document Authoring) wraps inline content in `<p>` tags** in its `.plain.html` output. This is standard DA behavior and must NOT be worked around by unwrapping in JS.

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
- **Lazy styles**: `/styles/lazy-styles.css` (post-LCP styles)
- **Delayed JS**: `/scripts/delayed.js` (IntersectionObserver for scroll animations)
- **Blocks**: `/blocks/` (all block directories listed in Block Reference)
- **Icons**: `/icons/` (`search.svg`, `ups-logo.svg`)
- **Icon font**: `/fonts/upspricons.woff` — UPS icon font (button chevron `\e60f`, circle arrow `\e603`)
- **Web fonts**: `/fonts/` (`roboto-regular.woff2`, `roboto-medium.woff2`, `roboto-bold.woff2`, `roboto-condensed-bold.woff2`)
- **Navigation**: Authored in DA, served at `/nav.plain.html` (deployed) or `/content/nav.plain.html` (local dev)
- **Footer**: Authored in DA, served at `/footer.plain.html` (deployed) or `/content/footer.plain.html` (local dev)
- **Import infrastructure**: `/tools/importer/` (page-templates.json, parsers/, transformers/)

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

Fragment files (`nav`, `footer`) are **authored in DA** and loaded by blocks at runtime via `loadFragment()`. They are NOT committed to Git.

**Content source**: DA at `content.da.live/gabrielwalt/up/`
**Deployed paths**: `/nav.plain.html`, `/footer.plain.html` (served by AEM)
**Local dev paths**: `/content/nav.plain.html`, `/content/footer.plain.html` (for local preview only)

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
| Before background section (highlight/dark) | **80px** | `margin-top` on the section |
| Background section padding (highlight/dark) | **80px** | `--spacing-4xl` top and bottom |

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
main > .section.highlight, main > .section.dark          → margin-top: 80px; padding: 80px 0
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
- **Background sections (highlight/dark)** use `margin-top: 80px` (white space before background) + `padding: 80px 0` (internal spacing) with first/last child margin reset to 0. This creates symmetric 80px white + 80px colored padding on both entering and exiting the background zone.
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
| `dark` | `.section.dark` | Dark background, light text |
| `image-full-width` | `.section.image-full-width` | Images break out of container to full viewport width |
| `accent-bar` | `.section.accent-bar` | Adds yellow bar under h1/h2 (`::after`), uppercase h6 eyebrow |

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
| **hero-featured** | `/blocks/hero-featured/` | — | Hero with background image and white card overlay |
| **navigation-tabs** | `/blocks/navigation-tabs/` | — | Card-style navigation links with arrow icons |
| **fact-sheets** | `/blocks/fact-sheets/` | — | Responsive stat grid with icons, numbers, labels, and CTA |

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
| Default | `.hero-featured` | Hero with background image and white card overlay |

**Authoring:**
```
| Hero-Featured |
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

**Responsive behavior**:
- Mobile: min-height 400px, card max-width 480px, padding 24px, margin `200px 24px 24px` (equal left/bottom/right spacing of 24px)
- Desktop (>=992px): card max-width 480px with `box-sizing: border-box`, padding 48px, margin `60px 0 60px 60px` (equal top/left/bottom spacing of 60px)

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
- JS restructures rows into a grid with `.fact-sheets-item` wrappers
- Last row (link without h4) becomes gold CTA button below the grid
- Grey separators between items (4px solid `--light-color`)
- Center-aligned content

**Responsive behavior**:
- Mobile (<600px): 1 column, horizontal separators between items
- Tablet (600px-991px): 2 columns, vertical + horizontal separators
- Desktop (>=992px): 4 columns, vertical separators only

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

## Import Infrastructure

Import scripts for bulk content migration are in `/tools/importer/`.

| File | Purpose |
|------|---------|
| `page-templates.json` | Template definitions mapping source URL patterns to blocks |
| `parsers/cards-awards.js` | Parser for cards-awards block |
| `parsers/cards-stories.js` | Parser for cards-stories block |
| `parsers/columns-feature.js` | Parser for columns-feature block |
| `parsers/columns-quote.js` | Parser for columns-quote block |
| `parsers/columns-stats.js` | Parser for columns-stats block (home page) |
| `parsers/fact-sheets.js` | Parser for fact-sheets block (our-company page) |
| `parsers/hero-featured.js` | Parser for hero-featured block |
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
22. **Margin-driven spacing system** - Sections have `padding: 0` by default so wrapper margins collapse through them for cross-section gaps. Block wrappers = 80px margin-top, default-content = 40px base (overridden to 32px/24px for same-section siblings). Background sections (highlight/dark) use `padding: 80px 0` with first/last child margin reset to 0. Never add section padding to regular sections.
23. **Never push to Git yourself** - The user handles all Git operations (commit, push, branch). Only modify files — leave Git workflow to the user.
24. **Content and code are strictly separated** - Content (HTML) lives in DA (CMS), code (JS/CSS) lives in Git. Never commit HTML content to Git. Never modify `.gitignore` to track HTML files.
25. **DA wraps inline content in `<p>` tags** - Block JS/CSS must use flexible selectors (e.g., `:scope > a, :scope > p > a`) to handle both direct children and p-wrapped children from DA. Never add JS unwrapping logic — fix compatibility in CSS with button resets and in JS with dual selectors.
26. **Fragment default paths are root-relative** - `header.js` defaults to `/nav`, `footer.js` defaults to `/footer`. Local dev pages override these via `<meta name="nav" content="/content/nav"/>`. On deployed (DA), no override exists — the default root path is used.
27. **`p.button-wrapper` must have `margin: 0`** — The global `p.button-wrapper` rule must NOT add margin. Spacing is handled by the `* + *` rule inside default-content-wrapper. Extra margin on button-wrapper leaks through section boundaries (where sections have `padding: 0`) and creates incorrect gaps.

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
