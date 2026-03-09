# Future Prompting Plan

This document provides the exact prompts to use for fixing current issues and migrating further pages.
Each prompt is designed for a **separate chat session** unless marked as continuing in the same session.
Prompts within the same phase can share a session if the work is closely related.

---

## Cross-Cutting Concerns

Three systemic issues affect multiple phases and must be addressed early and maintained throughout:

### 1. Import Script Alignment

Content is the source of truth. After every content change, the import scripts must be verified
to ensure they would reproduce the same content if run again. The workflow is:

1. Make content changes (fix casing, restructure sections, etc.)
2. Ask the agent to simulate the relevant import script against the original URL
3. Compare the simulated output against the current content
4. Fix the script to match the content — never the other way around
5. Repeat until the diff is empty

This is enforced by a dedicated verification prompt after each content-changing phase.

### 2. All-Caps Content Conversion

**Problem**: None of the 7 parsers convert all-caps text. Every parser uses `.textContent.trim()`
which preserves the original ALL CAPS casing from the source site. This violates PROJECT.md rule #7.

**Known all-caps content still in the project**:
- `our-stories.plain.html`: "CUSTOMER FIRST" (hero-featured eyebrow)
- `innovation-driven.plain.html`: "INNOVATION DRIVEN" (one cards-stories eyebrow)
- `our-strategy.plain.html`: "CUSTOMER FIRST, PEOPLE LED, INNOVATION DRIVEN" (h4 subtitle)
- `our-impact.html`/`.plain.html`: "HELP" in heading "Delivering HELP where it's needed most" (borderline — may be intentional emphasis)

**Fix**: A shared `toTitleCase()` utility added to the transformer, used by all parsers for
eyebrow text, attribution names, and any other text known to be all-caps on the source site.

### 3. Unnecessary Section Breaks

Pages imported via the structured import scripts have clean section boundaries (only where
section-metadata styles or logical breaks require them). Pages imported without import scripts
may have excessive section breaks between blocks that share the same styling context.

These unnecessary sections are harmless visually (the margin-driven spacing system collapses
through zero-padding sections) but add noise to the content structure and confuse authors.

**Fix**: Consolidate sections that have no section-metadata and contain blocks that logically
belong together.

---

## Phase 0: Infrastructure Hardening (1 session)

This phase fixes the import pipeline before any further content work, so all subsequent
migrations produce correct output from the start.

### Prompt 0.1 — Warm-Up

```
Read PROJECT.md and AGENTS.md to understand the current project state.
Confirm you've loaded the block inventory, design tokens, spacing rules,
and the import infrastructure in tools/importer/.
```

### Prompt 0.2 — Add toTitleCase Utility to Import Pipeline

```
None of the parsers in tools/importer/parsers/ convert all-caps text to title case.
Every parser uses .textContent.trim() which preserves the original ALL CAPS casing
from the UPS source site. This violates our rule: "Never import all-caps content as-is."

Fix this systemically:

1. Add a toTitleCase(text) utility function to tools/importer/transformers/ups-cleanup.js
   (or a shared utils file that all parsers can import). The function should:
   - Convert ALL CAPS strings to Title Case (e.g., "CUSTOMER FIRST" → "Customer First")
   - Leave mixed-case strings unchanged (e.g., "Read The Story" stays as-is)
   - Handle edge cases: single words, acronyms like "UPS" that should stay uppercase,
     hyphens, apostrophes
   - Detection heuristic: if the string is 3+ characters and equals its own .toUpperCase(),
     treat it as all-caps and convert

2. Update every parser that extracts eyebrow text or attribution text to run the
   extracted textContent through toTitleCase() before assigning it. Specifically:
   - parsers/cards-awards.js (eyebrow text)
   - parsers/cards-stories.js (eyebrow text)
   - parsers/hero-featured.js (eyebrow text)
   - parsers/columns-feature.js (eyebrow text)
   - parsers/columns-quote.js (attribution text)

3. Do NOT apply toTitleCase to stat numbers (columns-stats, fact-sheets), CTA link text,
   or heading text that is naturally mixed-case.

After implementing, verify by running each parser mentally against a known all-caps
eyebrow like "CUSTOMER FIRST" and confirming the output would be "Customer First".
```

### Prompt 0.3 — Fix Existing All-Caps Content

```
Fix the all-caps content that already leaked into our content files:

1. our-stories.plain.html: Change "CUSTOMER FIRST" to "Customer First" in the
   hero-featured eyebrow.

2. innovation-driven.plain.html: Change "INNOVATION DRIVEN" to "Innovation Driven"
   in the one cards-stories eyebrow that still has all-caps.

3. our-strategy.plain.html: Change the h4 "CUSTOMER FIRST, PEOPLE LED, INNOVATION DRIVEN"
   to "Customer First, People Led, Innovation Driven".

4. For our-impact.html and our-impact.plain.html: Leave "HELP" as-is in
   "Delivering HELP where it's needed most" — this is intentional brand emphasis,
   not a CSS concern.

Do not change anything else in these files.
```

### Prompt 0.4 — Clean Up Unnecessary Sections

```
Review all content pages and consolidate unnecessary section breaks.

Sections should only be separated (by <hr> in .plain.html or by separate top-level <div>
in .html) when:
- A section-metadata block applies a different style (highlight, dark, accent-bar)
- There is a logical content boundary (e.g., hero area vs. body content)

Sections should NOT be separated just because there's a different block type.
Multiple blocks in the same styling context belong in the same section.

Check these pages specifically:
- our-impact.html / our-impact.plain.html: Sections 2 and 3 each contain a single
  columns-feature block with no section-metadata. These could be consolidated.
- Any other page where blocks are in separate sections for no styling reason.

For each consolidation, explain what you're merging and why.
Do not merge sections that have section-metadata styles.
```

---

## Phase 0.5: Bug Fixes (same session if context allows, else new session)

### Prompt 0.5 — Footer Subscribe Box Background on Mobile

```
In the footer, the email subscription column ("Get news delivered to your inbox.")
has a lighter brown background (var(--footer-surface)) that only applies at desktop
(inside a @media (width >= 992px) block in footer.css).

Fix: Apply the same background, border-radius, and padding to footer .footer-col:last-child
at all breakpoints, not just desktop. Move the background/radius/padding rules outside the
media query so they apply at every viewport width.
```

### Prompt 0.6 — Breadcrumb on 2nd-Level Pages

```
The breadcrumb currently only appears on 3rd-level pages (like /our-company/our-culture)
but not on 2nd-level pages (like /our-stories or /our-company).

The original UPS site shows the breadcrumb on 2nd-level pages too — for example,
the our-stories page shows "Home / Our Stories".

The root cause is in scripts.js buildBreadcrumb() and blocks/breadcrumb/breadcrumb.js:
both use `segments.length <= 1` as the threshold. A 2nd-level page like /us/en/our-stories
has only 1 segment after stripping the locale, so it's excluded.

Fix: Change the condition from `segments.length <= 1` to `segments.length < 1` in both files.
This allows single-segment pages to get a breadcrumb showing "Home / Page Name".
Exclude the homepage explicitly if needed (segment[0] === 'home').
```

### Prompt 0.7 — Breadcrumb Vertical Spacing

```
The breadcrumb has too much vertical space from the top nav — about 116px instead of 32px.

The breadcrumb CSS sets `padding-top: var(--spacing-l)` (32px) on the first section,
and the breadcrumb-wrapper has `margin-top: 0`. But the global spacing rule
`main > .section > div:not(.default-content-wrapper) { margin-top: var(--spacing-4xl) }`
(80px) likely overrides or stacks with this.

Investigate the computed margin-top on the breadcrumb-wrapper in the preview.
Fix it so the breadcrumb sits exactly 32px below the nav bar.
Verify on both a 2nd-level page and a 3rd-level page.
```

---

## Phase 1: Our-Strategy Page Fixes (1 session)

### Prompt 1.1 — Warm-Up

```
Read PROJECT.md and AGENTS.md.
Then read the content of /content/us/en/our-company/our-strategy.plain.html
and check the preview at localhost:3000.
```

### Prompt 1.2 — Fix Our-Strategy Content Issues

```
On the our-strategy page, fix these content issues:

1. The hero-featured block with "Guided by a better not bigger framework" has an
   empty image row. Scrape the image from the original page at
   https://about.ups.com/us/en/our-company/our-strategy.html (set viewport to 1440px
   width first) and add it to the hero-featured block's first row.

2. The columns-feature block with "Our purpose in action" also has an empty image
   column. Scrape that image from the original page too and add it.

3. The "Company Profile" section has a blockquote with the company description.
   This should be styled as a standalone quote block — similar to the columns-quote
   styling but without the side image. Either create a section style that applies
   the quote treatment (left gold border, italic text), or create a minimal
   "blockquote" variant. Choose whichever is simpler.

After fixing the content, update the import script for company-strategy to
produce the correct output for these blocks (including the images).
```

### Prompt 1.3 — Verify Import Script Alignment

```
Simulate the company-strategy import script against the original page at
https://about.ups.com/us/en/our-company/our-strategy.html

Compare the simulated output against the current content at
/content/us/en/our-company/our-strategy.plain.html

List every difference. Fix the import script to match the current content structure.
Do NOT overwrite the content — the content is the source of truth.

Confirm: if I ran this import script on a fresh page, would it produce content
identical to what we have now?
```

---

## Phase 2: Our-Culture Page — New Block (1 session, use planning)

### Prompt 2.1 — Warm-Up + Planning

```
Read PROJECT.md and AGENTS.md.
Then analyze the our-culture page on the original site at
https://about.ups.com/us/en/our-company/our-culture.html

I need to understand the layout before implementing. The page has an alternating
pattern of image-on-one-side and text-on-the-other for three value sections:
- "What Drives Us: Our Values" (image left, text right)
- "How We Show Up: Our Partnership" (image right, text left)
- "How We Lead: Our Leadership Model" (image left, text right)

Each section has a circular image, a heading, a description, and a bulleted list.

Before implementing:
1. Inspect the exact layout, spacing, and typography from the original site
2. Check if columns-feature could work for this (it has image + text two-column layout)
3. If columns-feature can't work (different content structure with lists, different
   image treatment), propose a new block name and content model
4. Present your recommendation — do not implement yet
```

### Prompt 2.2 — Implement (after reviewing the plan)

```
Implement the block you proposed for the our-culture page.
Create the block JS and CSS, update the page content with proper block markup,
and create an import script/parser for the company-culture template.

Important: Ensure any eyebrow or heading text extracted from the source is run
through the toTitleCase utility if it's all-caps on the source site.

Preview the result and verify at desktop and mobile breakpoints.
Update PROJECT.md with the new block documentation.
```

### Prompt 2.3 — Verify Import Script Alignment

```
Simulate the company-culture import script against the original page at
https://about.ups.com/us/en/our-company/our-culture.html

Compare the simulated output against the current content at
/content/us/en/our-company/our-culture.plain.html

List every difference. Fix the import script to match the current content.
Do NOT overwrite the content.
```

---

## Phase 3: Story Article Template (new session)

Story articles are a new page template that doesn't exist yet. This is the prerequisite
for bulk-importing stories.

### Prompt 3.1 — Analyze Story Article Structure

```
Read PROJECT.md and AGENTS.md.

Analyze a story article page on the original site. Use this URL:
https://about.ups.com/us/en/our-stories/customer-first/ups-and-lfc-celebrate-the--unstoppable-spirit--of-liverpool-busi0.html

Identify:
1. The page structure: breadcrumb, article header (category eyebrow, H1, date/read-time,
   subtitle), hero image, article body, social share links, related stories section
2. Which parts map to existing blocks (hero-featured? cards-stories for related?)
3. Which parts need new blocks or are default content
4. Whether embedded content (YouTube videos) needs special handling

Present a page template proposal with sections and block mappings. Do not implement yet.
```

### Prompt 3.2 — Implement Story Article Template

```
Implement the story article template based on your analysis.
Create any new blocks needed, the page template definition in page-templates.json,
and parsers for any new blocks.

Important:
- All parsers must use the toTitleCase utility for eyebrow text and any all-caps content.
- Only create section breaks where section-metadata styles differ.
- Article body paragraphs are default content — do not wrap them in a block.

Then migrate this single story as a test:
https://about.ups.com/us/en/our-stories/customer-first/ups-and-lfc-celebrate-the--unstoppable-spirit--of-liverpool-busi0.html

Preview and verify the result.
```

### Prompt 3.3 — Critique and Refine

```
Critique the migrated story article page against the original at
https://about.ups.com/us/en/our-stories/customer-first/ups-and-lfc-celebrate-the--unstoppable-spirit--of-liverpool-busi0.html

Focus on: article header layout, typography, image sizing, body text styling,
related stories section, and overall vertical spacing.
```

### Prompt 3.4 — Verify Import Script Alignment

```
Simulate the story-article import script against the same URL:
https://about.ups.com/us/en/our-stories/customer-first/ups-and-lfc-celebrate-the--unstoppable-spirit--of-liverpool-busi0.html

Compare the simulated output against the migrated content file.
List every difference. Fix the script to match.

Also verify:
- No all-caps text leaked through (eyebrows, headings, category labels)
- No unnecessary section breaks were created
- The toTitleCase utility is being called on all text that could be all-caps
```

---

## Phase 4: Bulk Import Stories (new session)

This depends on Phase 3 being complete and validated.

### Prompt 4.1 — Warm-Up + Small Batch

```
Read PROJECT.md and AGENTS.md.

Run bulk import on these 3 story articles using the story-article template:
https://about.ups.com/us/en/our-stories/customer-first/5-things-you-didn-t-know-the-ups-store-could-do-for-your-small-b.html
https://about.ups.com/us/en/our-stories/customer-first/new-shelves--new-customers---same-reliable-shipper.html
https://about.ups.com/us/en/our-stories/customer-first/sanmar-and-ups--an-iconic-partnership-delivering-world-class-spe.html

After import, preview all three and verify:
1. Content structure matches the template
2. No all-caps text leaked through
3. No unnecessary section breaks
4. Images imported correctly
```

### Prompt 4.2 — Fix Issues (if needed)

```
[Based on what you see in the preview, describe specific issues to fix.
Keep to 1-2 issues per prompt. After fixing, re-run the import on one
of the 3 pages to verify the fix works in the pipeline, not just in the content.]
```

### Prompt 4.3 — Scale Up

```
The story article import looks correct. Run bulk import on the remaining
customer-first stories:
https://about.ups.com/us/en/our-stories/customer-first/fresh-products-need-a-reliable-shipper.html
https://about.ups.com/us/en/our-stories/customer-first/get-everything-you-need-to-make-valentine-s-day-extra-special--d.html
https://about.ups.com/us/en/our-stories/customer-first/how-ups-powers-small-business-growth.html
https://about.ups.com/us/en/our-stories/customer-first/woodworking-company-s-export-business-booms-with-help-from-ups.html
https://about.ups.com/us/en/our-stories/people-led/peak-wrap-up.html
https://about.ups.com/us/en/our-stories/people-led/national-human-trafficking-prevention-month.html
https://about.ups.com/us/en/our-stories/people-led/from-the-philippines-to-ireland--we-deliver-the-holidays.html
```

---

## Phase 5: Retroactive Import Script Verification (new session)

This phase verifies that ALL existing import scripts still produce output that matches
the current content, catching any drift introduced during Phases 0-2.

### Prompt 5.1 — Verify All Existing Templates

```
Read PROJECT.md and AGENTS.md.

For each import script that exists in tools/importer/, simulate the import against
its source URL and compare against the current content file:

1. import-story-hub.js → our-stories.plain.html
   Source: https://about.ups.com/us/en/our-stories.html

2. import-story-category.js → customer-first.plain.html
   Source: https://about.ups.com/us/en/our-stories/customer-first.html

3. import-company-hub.js → our-company.plain.html
   Source: https://about.ups.com/us/en/our-company.html

4. import-company-strategy.js → our-strategy.plain.html
   Source: https://about.ups.com/us/en/our-company/our-strategy.html

5. import-company-culture.js → our-culture.plain.html
   Source: https://about.ups.com/us/en/our-company/our-culture.html

For each, list any differences and fix the script to match the content.
Content is always the source of truth — never overwrite content to match a script.

Also verify that every parser is calling toTitleCase on eyebrow/attribution text.
```

---

## Phase 6: Full-Site Critique (new session)

### Prompt 6.1 — Page-Level Critique

```
Read PROJECT.md and AGENTS.md.

Critique the home page against https://about.ups.com/us/en/home.html
Check all blocks at both desktop (1440px) and mobile (375px) breakpoints.
Focus on: vertical spacing, typography, image sizing, button styling.
```

### Prompt 6.2 — Repeat for Other Pages

```
Critique the our-impact page against https://about.ups.com/us/en/our-impact.html
at desktop and mobile breakpoints.
```

(Repeat for our-company, our-strategy, our-culture, our-stories, story articles.)

---

## Phase 7: PROJECT.md Comprehensive Audit (new session)

This phase brings PROJECT.md back in sync with the actual project state.
An audit found **18 discrepancies** between the documentation and the codebase.
This is critical for scaling — new contributors (human or AI) rely on PROJECT.md
as the source of truth.

### Prompt 7.1 — Warm-Up + Inventory Audit

```
Read PROJECT.md and AGENTS.md.

Audit the Pages Inventory table in PROJECT.md against the actual content files in
/content/. List every page that exists as a file but is missing from the inventory.
Add all missing pages with their correct local path, origin URL, and description.

Also check the Import Infrastructure table. List every file in tools/importer/ that
exists but isn't documented. Add all missing entries (parsers, transformers, import
scripts, bundle files).
```

### Prompt 7.2 — Block Documentation Audit

```
Audit the Block Reference and Custom Blocks sections in PROJECT.md against the
actual blocks in /blocks/. For each block directory:

1. Is it listed in the Summary Table? If not, add it.
2. Does it have a full Custom Blocks section with variant table, authoring example,
   features, and responsive behavior? If not, add the missing documentation.
3. Are all CSS variants (classes in the CSS file) documented in the variant table?

Specifically known gaps:
- The breadcrumb block (/blocks/breadcrumb/) is not documented at all
- Any blocks created in Phase 2 (our-culture) or Phase 3 (story template) need docs

Add full documentation for every undocumented block following the format in
"Documentation Checklist for New Blocks" in PROJECT.md.
```

### Prompt 7.3 — Design Token and Style Audit

```
Audit the design tokens and styles documentation in PROJECT.md against the actual
CSS in styles/styles.css. Check for:

1. CSS variables defined in :root that aren't documented in the Design Tokens tables
2. Documented variables that don't actually exist in the CSS (remove these)
3. Incorrect values (document says X, CSS says Y) — fix the documentation to match CSS

Known issues to verify:
- Navigation height: docs say --nav-height is 64px/104px, but check actual values
  and the breakpoint used (docs say 1024px — verify this is correct)
- Header height: docs say "100px height" in the header block section but
  --nav-height at desktop is 104px — reconcile these
- The "light" section style (.section.light) may be implemented but not documented
  — check if it exists in CSS and add it to the Section Styles table if so
- The "image-full-width" section style is documented but may not be fully
  implemented — check if the CSS exists and either implement it or remove the docs

Also check: are there any font files in /fonts/ not documented in Local Assets?
Known gap: upspricons-x.woff may exist alongside upspricons.woff.
```

### Prompt 7.4 — Final PROJECT.md Review

```
Read the full PROJECT.md from top to bottom.

Check for internal consistency:
- Do all block names referenced in Migration Rules match actual block names?
- Do all file paths referenced anywhere actually exist?
- Are the Reminders numbered correctly with no duplicates?
- Does the CSS Patterns section reflect patterns actually used in the codebase?
- Are the breakpoint token values consistent across all tables?

Fix any inconsistencies found. This is the final quality pass before scaling.
```

---

## Phase 8: Code Quality Cleanup (same session if context allows, else new session)

This phase addresses technical debt and code quality issues that could cause
problems at scale.

### Prompt 8.1 — Fix Lint Configuration

```
Read PROJECT.md and AGENTS.md.

The project has lint errors from bundle.js files in tools/importer/ that shouldn't
be linted. These are generated/concatenated files, not source code.

1. Check if .eslintignore exists. If not, create it.
2. Add patterns to ignore bundle files: tools/importer/**/*.bundle.js
   Also ignore any other generated files (node_modules/, etc.)
3. Run `npm run lint` and verify the bundle errors are gone.
4. If real lint errors remain in source files, list them (but don't fix unless trivial).
```

### Prompt 8.2 — Fix Phantom Block Names in page-templates.json

```
Audit tools/importer/page-templates.json for block names that don't have
corresponding block directories in /blocks/.

Known phantoms in the our-impact template:
- "section-hero" — no /blocks/section-hero/ exists
- "section-governing" — no /blocks/section-governing/ exists
- "section-awards" — no /blocks/section-awards/ exists

For each phantom:
1. Determine what the block name SHOULD be (check the our-impact content for
   what blocks are actually used in those positions)
2. Fix the name in page-templates.json to match the actual block
3. If the entry maps to default content (not a block), remove it from the
   blocks array and add the selector to the section's defaultContent array instead
```

### Prompt 8.3 — Replace Hardcoded Values

```
Search all CSS files in /blocks/ and /styles/ for hardcoded color values that
should use CSS custom properties instead.

Known issue: footer.css uses `color: #fff` somewhere that should be
`color: var(--background-color)` or a more specific token.

For each hardcoded value found:
1. Identify the matching CSS custom property from styles.css
2. Replace the hardcoded value with the variable reference
3. Skip intentional one-off values that don't match any token
   (e.g., specific opacity values, one-time accent colors)

Only fix clear matches — don't force a token where none fits.
```

### Prompt 8.4 — Clean Up Migration Artifacts (optional)

```
Check if a migration-work/ directory or similar temporary artifacts exist in
the project root. These may have been created during earlier migration sessions.

If found:
1. List the contents
2. Determine if anything is still needed (referenced by scripts, needed for docs)
3. If purely temporary, add the directory to .gitignore (don't delete — the user
   may want to review first)
4. Report what you found and recommend whether to keep or remove
```

---

## Phase 9: Scaling Readiness Checklist (end of session)

A final verification that the project is ready for additional contributors and
continued page migration.

### Prompt 9.1 — Scaling Readiness Check

```
Read PROJECT.md and AGENTS.md.

Run through this scaling readiness checklist and report pass/fail for each item:

1. DOCUMENTATION
   - [ ] Every block in /blocks/ has a Custom Blocks entry in PROJECT.md
   - [ ] Every page in /content/ is in the Pages Inventory table
   - [ ] Every file in tools/importer/ is in the Import Infrastructure table
   - [ ] All design tokens in styles.css are documented
   - [ ] All section styles in the CSS are documented
   - [ ] Breakpoint values are consistent across all documentation

2. IMPORT PIPELINE
   - [ ] All parsers use toTitleCase on eyebrow/attribution text
   - [ ] page-templates.json has no phantom block names
   - [ ] Every template has at least one verified content page

3. CODE QUALITY
   - [ ] `npm run lint` passes with zero errors on source files
   - [ ] No hardcoded colors that should be tokens
   - [ ] No bundle.js files being linted

4. CONTENT QUALITY
   - [ ] No all-caps text in content files (except intentional emphasis)
   - [ ] No unnecessary section breaks
   - [ ] All images reference valid source URLs

For any failing items, note what still needs to be done.
This is the "done" gate before scaling to more pages.
```

---

## Import Script Testing & Iteration Workflow

Use this workflow whenever you need to verify or fix an import script.
It applies after any content change and before any bulk import.

### Step 1 — Simulate

```
Simulate the [template-name] import script against the original page at [URL].
Show me what content the script would produce. Do NOT write it to disk.
```

### Step 2 — Compare

```
Compare the simulated output against the current content at [content-path].
List every difference line by line:
- Content in file but not in script output (script needs to add this)
- Content in script output but not in file (script produces something wrong)
- Content that differs (casing, structure, attributes)
```

### Step 3 — Fix Script

```
Fix the import script to eliminate all differences.
The content file is the source of truth.
Do NOT change the content file.
After fixing, re-simulate to confirm zero differences.
```

### Step 4 — Verify All-Caps Rule

```
Check the script output for any text that is 3+ characters and entirely uppercase.
If found, the parser is missing a toTitleCase call. Fix the parser.
```

### When to Run This Workflow

- After every content change that affects block structure or text casing
- Before running bulk import on a template for the first time
- After adding or modifying any parser
- After modifying the ups-cleanup transformer
- When a bulk import produces unexpected results

---

## Session Management Rules

1. **Start every session with the warm-up prompt** (read PROJECT.md + AGENTS.md)
2. **One phase per session** — don't mix bug fixes with new block development
3. **Maximum 15 substantive prompts per session** — start fresh after that
4. **One task per prompt** — maximum 2 closely related items
5. **If the agent misses something you said earlier, start a new session** — don't argue
6. **After any complex change, ask the agent to update PROJECT.md** before ending the session
7. **Use "critique" language** to trigger the critique workflow rather than describing pixel differences manually
8. **Provide original CSS/selectors** when you have them — the agent works much better with reference material
9. **Planning before implementation** for any new block or multi-file change — ask the agent to analyze and propose first
10. **End every content-changing phase with an import script verification prompt** — never assume the scripts stayed aligned
11. **Remind the agent about the all-caps rule** when creating new parsers — the rule exists in PROJECT.md but parsers are generated from templates that don't enforce it automatically
12. **Run the PROJECT.md audit (Phase 7) after every major milestone** — e.g., after completing a new page template, after bulk imports, or after any session that creates/modifies blocks
13. **End scaling sprints with the readiness checklist (Phase 9)** — run Prompt 9.1 periodically as a health check, not just once

---

## Expected New Artifacts

After completing all phases, the project should have:

| Artifact | Phase | Description |
|----------|-------|-------------|
| `toTitleCase` utility | 0 | Shared case-conversion function used by all parsers |
| Updated parsers (7 files) | 0 | All parsers call toTitleCase on eyebrow/attribution text |
| Fixed all-caps content (3 files) | 0 | our-stories, innovation-driven, our-strategy |
| Consolidated sections | 0 | Unnecessary section breaks removed |
| Footer mobile fix | 0.5 | Subscribe background at all breakpoints |
| Breadcrumb on 2nd-level pages | 0.5 | `segments.length < 1` threshold |
| Breadcrumb spacing fix | 0.5 | 32px from nav |
| Our-strategy content fixes | 1 | Missing images, blockquote styling |
| Our-strategy import script aligned | 1 | Script verified against content |
| Our-culture alternating block | 2 | New block for image/text alternating layout |
| Our-culture import script | 2 | New parser + script verified against content |
| Story article template | 3 | New page template + any new blocks |
| Story article parser(s) | 3 | Import infrastructure with toTitleCase |
| Story article import verified | 3 | Script output matches migrated content |
| 10+ imported story articles | 4 | Bulk imported content |
| All import scripts verified | 5 | Retroactive alignment check across all templates |
| PROJECT.md updates | All | New blocks, templates, rules, and toTitleCase documented |
| Pages Inventory updated | 7 | All content pages listed with origin URLs |
| Block docs complete | 7 | Every block has full Custom Blocks documentation |
| Import Infrastructure table updated | 7 | All parsers, transformers, scripts documented |
| Design token docs reconciled | 7 | Token tables match actual CSS values |
| Section styles verified | 7 | Documented ↔ implemented parity |
| `.eslintignore` | 8 | Bundle files excluded from linting |
| `page-templates.json` fixed | 8 | No phantom block names |
| Hardcoded values replaced | 8 | CSS tokens used consistently |
| Scaling readiness report | 9 | Pass/fail checklist for continued migration |
