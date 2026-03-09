# Prompt Review

## 1. Executive Summary

### Key Findings

1. **You almost never used the agent's built-in skills explicitly.** The prompting guide documents specific skills (`excat:excat-site-migration`, `excat:excat-complete-design-expert`, `excat:excat-page-critique`, `excat:excat-block-critique`) with structured workflows. You bypassed these almost entirely, treating the agent as a general-purpose coding assistant rather than a workflow-driven migration tool. This is the single highest-leverage change you can make.

2. **You overloaded prompts with 4-10 unrelated tasks.** Many prompts mixed critique, content fixes, import script alignment, animation work, and styling corrections in a single message. The agent likely executed some and lost track of others, leading to repeated requests ("I asked you to..."). The prompting guide explicitly says "Do not try to front-load all requirements in the initial prompt."

3. **You iterated on the footer and header across 10+ prompts without ever invoking the critique skill.** The manual pixel-by-pixel correction loop (change icon size → check → too small → revert → try again) would have been handled more systematically by `excat:excat-block-critique` or `excat:excat-page-critique`, which compare against the original site automatically.

4. **You redesigned the vertical spacing system three times.** The first attempt (24px blocks, 64px cross-section), then a CSS token refactoring, then a complete redesign (80px margin-driven). Each redesign required touching all block CSS files. Planning this once and getting agreement before implementation would have saved significant work.

5. **You did not reset context when it was clearly degraded.** The conversation shows "Request timed out" entries (4 consecutive timeouts around prompt 55/the spacing redesign), followed by the agent eventually resuming 4+ hours later. At that point, the context window was almost certainly degraded. A fresh chat with a warm-up prompt would have been more reliable.

6. **Your design documentation habit was strong but late.** You built a thorough PROJECT.md with design tokens, block reference, spacing rules, and coding conventions — but much of this was documented after the fact rather than established before the work. The prompting guide recommends "Create markdown files in the project to document project-specific rules" upfront.

7. **The massive CSS refactoring prompt (Prompt 33) was your best prompt.** It was a complete, self-contained plan with explicit steps, find/replace tables, and validation criteria. This is exactly how complex changes should be communicated to the agent. More of your prompts should have followed this pattern.

8. **You provided original-site CSS snippets effectively.** When you gave the agent specific CSS from the original site (e.g., `fadeInUp` keyframes, `.upspr-icon-arrowright-circle` rules, active nav pseudo-element), the agent had the context it needed to implement accurately. When you didn't, it had to guess.

9. **You missed the bulk import workflow.** The prompting guide describes a clear sequence: migrate one page → validate → run bulk import on a small set → scale up. You attempted to import multiple pages individually rather than leveraging the bulk import infrastructure you helped create.

10. **Context was visibly lost multiple times.** You had to remind the agent about previous requests ("I haven't seen the effect of following request", "Also, didn't I ask you to make some of the links in that footer white?"). This suggests the conversation exceeded useful context length well before it ended.

### Strongest Habits
- Providing original-site CSS as reference context
- Inspecting specific DOM elements and providing selectors
- Iterating on specific visual details until they're right
- Building comprehensive project documentation (PROJECT.md)
- Writing the detailed CSS refactoring plan

### Weakest Habits
- Not using the agent's built-in skills
- Overloading prompts with multiple unrelated tasks
- Not resetting context when it degraded
- Redesigning systems instead of planning them first
- Extended pixel-tweaking loops instead of using critique workflows

### Highest-Leverage Changes
1. **Start every task by invoking the right skill** — the agent's skills have structured workflows that are far more reliable than ad-hoc instructions
2. **One task per prompt** — never mix more than 2 closely related items
3. **Reset context aggressively** — start fresh every 15-20 substantive prompts, or whenever you see signs of lost context
4. **Plan before implementing** — use planning mode for anything that touches more than 3 files
5. **Use the critique skills** instead of manual visual comparison

---

## 2. Model of the Agent

### Available Skills (from repo CLAUDE.md and prompting guide)

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `excat:excat-site-migration` | "migrate", "import", "convert" + URL(s) | Full page migration: scrape → analyze → author → map blocks → generate content → create import infra → preview |
| `excat:excat-complete-design-expert` | "design", "style", "CSS", "tokens" + "extract", "migrate" | Phase 1: global tokens. Phase 2: block-specific styles |
| `excat:excat-block-critique` | "critique block", "validate block" | Compare migrated block vs original, iterate CSS fixes to 85% similarity |
| `excat:excat-page-critique` | "critique page", "validate page" | Full-page visual comparison, iterate to 85% similarity |
| `excat:excat-navigation-expert` | "navigation", "nav", "menu" + "setup", "fix" | Dedicated nav migration with 3-section structure |
| `excat:excat-eds-debugger` | "debug", "fix", "troubleshoot" + "blocks", "images" | Systematic issue diagnosis |
| `excat:excat-eds-developer` | "implement", "create", "develop" + "block", "component" | Block JS/CSS development |
| `excat:excat-page-analysis` | "analyze" + "page", "structure" | Content structure analysis without generating content |
| `excat:excat-content-import` | (invoked by site-migration) | Executes content import for URLs |
| `excat:excat-import-infrastructure` | (invoked by site-migration) | Creates parsers, transformers |
| `excat:excat-import-script` | (invoked by content-import) | Develops import scripts |
| `excat-figma:excat-figma-migration` | Figma URL | Migrates Figma designs to EDS blocks |
| `forms-excat:excat-form-migration` | Form migration | Form block handling |

### Workflow Dependencies (from prompting guide + inference)

```
excat-site-migration (at least 1 page)
    ├── requires → page scraping (automatic)
    ├── requires → page analysis (automatic)
    ├── produces → import infrastructure (parsers, transformers, templates)
    └── enables  → excat-content-import (bulk import)

excat-complete-design-expert (Phase 1: site-wide)
    └── enables → excat-complete-design-expert (Phase 2: block-specific)
                   └── enables → excat-block-critique (needs both design + content)
                                  └── enables → excat-page-critique

excat-navigation-expert
    └── independent (can run anytime, works with nav.md)
```

**Critical dependency from the prompting guide**: "Migrate at least one page before running bulk import" and "Complete the site-wide design before styling individual blocks."

### Context Window Limitations

- **The agent's context is finite.** The prompting guide warns: "Over long conversations, earlier instructions may be compacted or forgotten."
- **Evidence from this project**: Multiple "I asked you to..." reminders, 4 consecutive request timeouts, agent losing track of tasks in overloaded prompts.
- **Inference**: A productive window is roughly 15-25 substantive exchanges before degradation begins. Complex exchanges (reading many files, writing CSS) consume more context than simple ones.
- **The agent can recover from PROJECT.md**: Since you documented decisions there, a fresh chat can warm up by reading it. This is explicitly recommended by the prompting guide.

### When Planning Mode Would Have Helped

- The vertical spacing system (designed 3 times)
- The header mega menu implementation
- The footer styling (10+ incremental prompts)
- The CSS token refactoring (you did plan this yourself, which worked well)
- The animation system import and subsequent scope reduction

### What This Agent Seems To Do Well (from evidence)

- Executing structured, single-purpose tasks (fix this one CSS property, add this selector)
- Following detailed plans when given (the CSS refactoring prompt)
- Block JS/CSS implementation when the spec is clear
- Scraping and extracting from source sites when told what to look for
- Import infrastructure creation (parsers, transformers)
- DOM debugging when directed to specific elements

### What This Agent Seems To Do Poorly (from evidence)

- Maintaining multi-task coherence in overloaded prompts
- Remembering earlier instructions as conversation grows long
- Visual comparison without the critique skill workflow (ad-hoc "compare with original" is unreliable)
- Getting spacing/layout exactly right on first attempt (required many iterations)
- Self-correcting when it makes a change that breaks something else (e.g., button-wrapper margin leak)

---

## 3. Prompt-by-Prompt Review

### Cluster A: Initial Migration (Prompts 1-2, missing)

**Prompts**: "Import https://about.ups.com/us/en/home.html" and "Import the global design from that page and the design of all blocks present on that page."

**Likely intent**: Get the homepage migrated and styled.

**Likely skill used**: `excat:excat-site-migration` for the first prompt, `excat:excat-complete-design-expert` for the second.

**Confidence**: Inferred — these are textbook trigger patterns from the skill guide.

**Assessment**: Good starting prompts. The separation of migration and design is correct per the prompting guide's dependency chain: migrate first, then apply design. These likely worked well based on the resulting project state (homepage content exists, design tokens are comprehensive).

**What was weak**: No warm-up prompt to establish project context first. No explicit mention of which skills to use (though the agent should auto-select).

**Better prompt**:
```
Read PROJECT.md and AGENTS.md to understand the current project state.
Then migrate this page to Edge Delivery Services: https://about.ups.com/us/en/home.html
```

---

### Cluster B: Post-Migration Visual Fixes (Prompts 1-3)

**Prompts**: Default content centering, white button backgrounds, upspricons font import.

**Likely intent**: Fix visual issues noticed after the initial migration and design import.

**Likely skill used**: No formal skill — these are ad-hoc CSS/content fixes. The agent likely used general-purpose editing.

**Confidence**: Inferred from the nature of the requests.

**What was good**: Specific, focused requests. Prompt 3 was excellent — it provided the exact CSS from the original site (`content: "\e603"`, `font-family: "upspricons"`), giving the agent precise implementation context.

**What was weak**: These three prompts could have been one. They're all "post-design-import visual fixes." But more importantly, these should have been caught by `excat:excat-page-critique` or `excat:excat-block-critique` instead of manual inspection.

**Better prompt**:
```
Critique the migrated home page against https://about.ups.com/us/en/home.html
Pay special attention to: default content centering, button backgrounds on non-white sections, and icon fonts.
```

---

### Cluster C: First Critique Attempt + Crash Recovery (Prompt 4)

**Prompt**: "Critique all the blocks with the original site" + specific items + then "You got unresponsive... Check how far you got in previous tasks."

**Likely intent**: Systematic comparison of all blocks against original site.

**Likely skill used**: Unknown — "Critique all blocks" should trigger `excat:excat-page-critique` or `excat:excat-block-critique`, but the recovery prompt suggests it crashed partway through.

**Confidence**: Speculative — the word "critique" matches the trigger pattern, but the agent may have attempted ad-hoc comparison instead.

**What was good**: Using "critique" language that matches skill triggers. Including specific focus areas (vertical spacings, navigation-tabs measures).

**What was weak**: "Critique all the blocks" is very broad. The critique skills work per-block or per-page, not "all blocks at once." This likely overloaded the agent. The recovery prompt is a sign of context window exhaustion.

**Better prompt sequence** (separate prompts):
```
Critique the hero-featured block against the original site.
```
Then:
```
Critique the navigation-tabs block against the original site. Inspect exact text sizes and inner spacings from the original.
```

---

### Cluster D: Content Rules Establishment (Prompt 5)

**Prompt**: All-caps → CSS rule, bold/strong → CSS rule, content fixes.

**Likely intent**: Establish content authoring rules and fix existing content.

**Likely skill used**: General-purpose editing (content + CSS + PROJECT.md update).

**Confidence**: Inferred.

**What was good**: This was an excellent prompt. You established principles ("when finding all-caps content, convert it and apply uppercase via CSS") that became project rules. You gave specific examples of where to apply them. You asked the agent to "Remember this in your project instructions." This is exactly what the prompting guide means by creating project documentation.

**What was weak**: It mixed content fixes with rule establishment. The rule-setting and the execution should be separate: first document the rules, then apply them.

**Better prompt**:
```
Add the following rules to PROJECT.md:
1. Never import all-caps content as-is — convert to title case and apply text-transform: uppercase via CSS.
2. Don't wrap entire block elements in <strong> — apply font-weight: 700 via CSS instead.

Then apply these rules to all existing content: cards-awards eyebrows, columns-quote attribution, columns-feature eyebrows.
```

---

### Cluster E: Navigation-Tabs + Animation + Critique (Prompt 6)

**Prompt**: 5+ distinct tasks in one prompt — nav-tabs shadow, arrow color, circle thickness, hover animation, vertical spacing critique, text sizes, fadeInUp animation import.

**Likely intent**: Polish the navigation-tabs block and add scroll animations.

**Likely skill used**: General-purpose editing for the fixes. The animation import is a design migration task.

**Confidence**: Inferred.

**What was good**: Providing the exact CSS for `fadeInUp` from the original site was valuable reference context.

**What was weak**: This is severely overloaded. It contains at least 7 separate tasks:
1. Nav-tabs shadow fix
2. Arrow color change
3. Circle thickness reduction
4. Hover animation inspection + import
5. Vertical spacing critique (all blocks)
6. Text size critique (nav-tabs)
7. fadeInUp animation system (new feature)

The agent likely completed some and missed others. Evidence: the follow-up prompt says "The text in the cards-awards shouldn't rely on the strong font" and adds more tasks, suggesting the critique didn't catch everything.

**Better approach**: Three separate prompts:
```
# Prompt 1
Fix the navigation-tabs block:
- Restore box-shadow: 0 4px 24px rgba(0, 0, 0, 0.16)
- Make the arrow icon blue instead of black
- Make the circle around the arrow thinner
- Inspect and replicate the hover animation from the original site's .upspr-icon-arrowright-circle
```
```
# Prompt 2
Critique the navigation-tabs block against the original site. Focus on text sizes and inner spacings. Inspect exact measures from the original.
```
```
# Prompt 3
Import the fadeInUp scroll animation from the original site. Here's the CSS I found: [paste CSS]
Apply it as a section-style variant that can be applied to any block.
```

---

### Cluster F: Animation Refinement + Content Rules (Prompt 7)

**Prompt**: Fade-in scope, cards-awards bold removal, columns-quote quote marks, critique all blocks.

**Likely intent**: Continue polish work.

**What was good**: Clear instructions about specific elements ("don't rely on the strong font", "quotes should be added by CSS").

**What was weak**: Still mixing critique with specific fixes. The "Critique all the blocks" at the end will produce different results because the agent is already focused on the specific fixes above.

---

### Cluster G: Homepage Import (Prompt 8)

**Prompt**: "Import now the homepage https://about.ups.com/us/en/home.html"

**Likely intent**: Re-import or import the home page content.

**Likely skill used**: `excat:excat-site-migration` or `excat:excat-content-import`.

**Confidence**: Inferred — this matches the exact trigger pattern.

**What was good**: Clean, single-purpose prompt with a URL.

**What was weak**: The homepage was already migrated (it was the first thing imported). This may be a re-import after content changes, but the intent is ambiguous. "Re-import" or "regenerate the home page content" would be clearer.

---

### Cluster H: Multi-Page Fixes (Prompts 9-12)

**Prompts**: A sequence of wide-ranging fix prompts spanning both home and our-impact pages, touching spacing, font sizes, breakpoints, import script alignment, columns-feature layout, navigation-tabs mobile, h1 sizing.

**Likely intent**: Polish multiple pages simultaneously after initial migration.

**What was good**: Prompt 10 was particularly strong — asking the agent to verify import scripts stay aligned with content and simulate an import to check. This shows good awareness of the infrastructure maintenance problem.

**What was weak**: These prompts routinely mix 5+ pages and concerns. Prompt 9 alone contains: default content spacing, h2 title size, columns-featured column widths, yellow dash positioning, navigation-tabs breakpoint, columns-feature mobile eyebrow, h1 mobile size. That's 7 distinct issues across 3 blocks and global styles.

**Better approach**: Organize by scope (global → page → block):
```
# Global prompt
Reduce h2 title size to match the original site (inspect for exact value).
Add more vertical spacing to default content — check the "Governing Ethically" section.
```
```
# Page-specific prompt
On the our-impact page at narrow breakpoints:
- Navigation-tabs has excessive vertical spacing — probably caused by flex: 0 1 360px.
- H1 title should stay larger on mobile — compare with original site.
```

---

### Cluster I: Hero-Featured + Columns-Stats Styling (Prompts 11-15)

**Prompts**: Multiple iterations on hero-featured and columns-stats blocks — full-width image, card padding, equal spacing around card, background image behavior, stat divider thickness, mobile background height.

**Likely intent**: Get two complex blocks to match the original site pixel-accurately.

**Likely skill used**: General-purpose CSS editing. Should have been `excat:excat-block-critique`.

**Confidence**: Inferred.

**What was good**: Detailed visual requirements ("the space between the background image and the content box should have the same space on top, left and bottom"). Providing original CSS values when available.

**What was weak**: This was a slow manual convergence loop. Six prompts to get hero-featured right. The `excat:excat-block-critique` skill automates this: it captures both blocks, compares them, calculates a similarity score, generates CSS fixes, applies them, and iterates up to 3 times. You did the same loop manually over 6 prompts.

**Better approach**:
```
Critique the hero-featured block on the home page against https://about.ups.com/us/en/home.html
Focus on: card spacing relative to background image, padding, border-radius, and behavior across breakpoints.
```

---

### Cluster J: The Footer Saga (Prompts 18-29)

**Prompts**: 12+ prompts of incremental footer refinement — social icon style, spacing above headings, link colors, horizontal rules, external link icons, bottom padding, radial gradients, icon thickness, copyright text alignment, Protect Against Fraud link colors.

**Likely intent**: Make the footer match the original site exactly.

**Likely skill used**: General-purpose CSS editing throughout. Never invoked `excat:excat-block-critique`.

**Confidence**: Explicit from the prompt content.

**What was good**: Very specific visual corrections with clear before/after expectations.

**What was critically weak**: This is the clearest anti-pattern in the entire project. Twelve prompts on one block, each fixing 1-3 small visual issues, with several reversals ("remove that radial-gradient, this looks horrible", "I didn't ask you to make the social icons smaller, but thinner", "revert this as well"). This loop consumed significant context budget on repetitive work.

**Root cause**: You were doing manual visual comparison instead of letting the critique skill automate it. The skill captures screenshots, matches elements, scores similarity, generates prioritized CSS fixes, and iterates — exactly what you were doing manually over 12 exchanges.

**Secondary cause**: No context reset. By prompt 25+ in the footer saga, the agent had likely lost early context about what had already been fixed or reverted.

**Better approach**:
```
# Single prompt to invoke the skill
Critique the footer block against the original site at https://about.ups.com/us/en/home.html
Pay special attention to: social icon styling, link colors in each section, vertical spacing between sections, horizontal rules.
```
Then after reviewing the critique results, one focused fix prompt for anything the critique missed.

---

### Cluster K: The Header Saga (Prompts 20-23, 29, 39, 41)

**Prompts**: Multiple prompts on mega menu behavior — dropdown animation, hover bridge, shadow direction, multi-column alignment, active nav highlighting, baseline alignment, mobile accordion, dropdown closing behavior.

**Likely intent**: Full header/nav implementation matching the original site.

**Likely skill used**: General-purpose editing. Should have been `excat:excat-navigation-expert` initially, then `excat:excat-block-critique` for refinement.

**Confidence**: Inferred from trigger patterns in the skill guide.

**What was good**: Providing reference CSS from the original site (active nav pseudo-element), screenshots of desired behavior, specific DOM element selectors.

**What was weak**: The navigation expert skill has dedicated logic for the three-section nav structure, dropdown behavior, and DA compatibility. You built the nav manually through general-purpose prompts, which required debugging issues (like DA wrapping links in `<p>` tags) that the nav skill would have handled automatically.

**Better starting prompt**:
```
Set up the navigation from https://about.ups.com/us/en/home.html
Include: mega menu dropdowns with multi-column support, utility links (ups.com, Support, English, search), active section highlighting, mobile hamburger with accordion.
```

---

### Cluster L: Spacing System Redesign (Prompts 31-36, 55)

**Prompts**: Three complete iterations of the vertical spacing system — 24px/64px → CSS tokens → 80px margin-driven.

**Likely intent**: Establish consistent vertical rhythm across all pages.

**What was good**: The CSS refactoring plan (Prompt 33) was exceptional — a complete, self-contained spec with audit, token definitions, implementation steps, and validation criteria. Prompt 55 (the final redesign) was also well-articulated with clear rules and edge cases.

**What was critically weak**: You designed this system three times. Each time required touching `styles.css` plus every block CSS file. The first design (24px gap, 64px cross-section) was replaced by the token refactoring, which was then replaced by the 80px margin-driven system. Two of these three rounds were wasted work.

**Root cause**: The initial spacing specification was too simple for the complexity of the actual content. A planning phase where the agent analyzed the original site's spacing across multiple pages would have surfaced the 80px inter-block pattern before any implementation.

**Better approach**:
```
# Planning prompt (before implementation)
Analyze the vertical spacing between all blocks on the home page and the our-impact page of the original UPS site.
Measure: block-to-block gaps, default-content spacing, cross-section gaps, background-section behavior.
Present a spacing system proposal based on what you find. Do not implement yet.
```
Then after reviewing the proposal, one implementation prompt.

---

### Cluster M: Import Infrastructure Alignment (Prompts 10, 42-48)

**Prompts**: Verifying import scripts match content, fixing missing images, re-importing pages, updating parsers.

**Likely intent**: Keep import infrastructure aligned with evolving content structure.

**What was good**: Prompt 10 was particularly smart — asking the agent to simulate an import and compare output against actual content, then fix discrepancies. This is exactly the right way to maintain import infrastructure.

**What was weak**: Import issues (missing images, broken HTML tables) came up multiple times, suggesting the import pipeline wasn't validated end-to-end after each content change. The prompting guide's bulk import section says "All parsers are validated before bulk import can proceed" — this validation step was skipped or incomplete.

---

### Cluster N: The Deployed Site Investigation (Prompt 30)

**Prompt**: "The top nav and the footer don't show up on https://main--up--gabrielwalt.aem.page/us/en/home"

**Likely intent**: Debug why deployed site differs from local preview.

**Likely skill used**: `excat:excat-eds-debugger` would be appropriate here.

**Confidence**: Speculative — this matches the debugger trigger pattern ("not working", "not showing").

**What was good**: Clear problem statement with the exact deployed URL.

**What was weak**: Could have been more diagnostic upfront — e.g., "The nav and footer render correctly on localhost:3000 but not on the deployed site. They load from /nav and /footer fragment paths."

---

### Cluster O: Figma Migration (visible in chat history)

**Prompts**: The chat history shows a `cards-team` Figma migration happening mid-conversation.

**Likely intent**: Import a team cards design from Figma.

**Likely skill used**: `excat-figma:excat-figma-migration` — the chat history shows the full Phase 1-4 workflow executing.

**What was good**: This appears to be one of the few times a dedicated skill was properly invoked (the Figma URL triggered it automatically).

**What was weak**: The Figma migration happened in the middle of a conversation that was already deep into UPS migration work. The `cards-team` block (with green decorative blobs, Space Grotesk font) is stylistically unrelated to the UPS brand. This seems like an experiment or side task that was injected into the main migration conversation, consuming context budget.

---

## 4. Recurring Prompting Patterns

### Patterns That Help

1. **Providing original-site CSS as reference**: When you paste specific CSS from the source site (selectors, values, animations), the agent can implement accurately. This happened consistently with the best outcomes.

2. **Establishing rules and asking the agent to document them**: "Remember this in your project instructions" led to robust PROJECT.md entries that persisted across conversation resets.

3. **Asking the agent to verify its work in preview**: Many prompts end with implicit or explicit "check the preview." This catches issues early.

4. **Detailed implementation plans**: The CSS token refactoring prompt (Prompt 33) was a masterclass in structured prompting — it left no ambiguity.

5. **Pointing to specific DOM elements**: Providing selectors like `#page-95890a8440 > div.root...` or describing element positions helps the agent locate exactly what to inspect or fix.

### Patterns That Hurt

1. **"Critique all the blocks"**: Too broad. The critique skill works on one block at a time with detailed comparison. "All blocks" forces the agent to do shallow comparison across everything instead of deep comparison of one thing.

2. **Mixing "fix this" with "critique that"**: When you say "fix the arrow color AND critique all blocks," the agent fixes the arrow first, then runs out of context/energy on the critique. Separate these.

3. **Describing what you DON'T want after the fact**: "I didn't ask you to make the social icons smaller, but thinner" and "remove that radial-gradient, this looks horrible" are reactive corrections. A more proactive approach: give the agent a screenshot of the target state before it implements.

4. **Repeating the same spacing spec multiple times**: The spacing system description appears in at least 3 separate prompts with slightly different numbers. Each repetition signals to the agent that this is a new requirement, not a reminder. The agent then re-implements from scratch.

5. **"Can you check if there's not a delay to remove"**: Hedged, indirect requests ("can you check if...") are weaker than direct ones ("Remove the 0.5s animation delay so it starts immediately on viewport entry").

### Recurring Anti-Patterns

1. **The Incremental Pixel Loop**: Fix one small thing → check → fix another small thing → check → notice the first fix broke something → revert → fix differently. This consumed 30%+ of the conversation on footer/header alone.

2. **The Scope Creep Addendum**: Many prompts start with one focused task, then add "Also..." or "Additionally..." items that are unrelated. The agent loses focus on the primary task.

3. **The Retrospective Reminder**: "I asked you to X earlier, why isn't X done?" This always means context was lost. Instead of reminding, just re-state the requirement clearly.

4. **The Missing Context Reset**: After the 4 consecutive timeouts (around the spacing redesign), you continued in the same conversation. A fresh chat with "Read PROJECT.md, then implement the new spacing system" would have been more reliable.

### Fighting the Agent vs. Collaborating

You were fighting the agent when:
- Manually comparing blocks to the original site instead of invoking critique skills
- Providing incremental pixel corrections instead of letting the comparison workflow find all differences at once
- Redesigning systems mid-implementation instead of planning first
- Mixing 7+ tasks in one prompt instead of trusting the skill workflows

You were collaborating when:
- Providing CSS reference from the original site
- Asking the agent to document rules in PROJECT.md
- Writing the detailed CSS refactoring plan
- Asking the agent to verify import scripts against actual content

---

## 5. Workflow Diagnosis

### Ideal Workflow (from prompting guide)

```
1. Setup / Warm-up
2. First page migration (excat-site-migration)
3. Site-wide design import (excat-complete-design-expert Phase 1)
4. Block-specific design (excat-complete-design-expert Phase 2)
5. Block critique → refinement cycle
6. Page critique → refinement cycle
7. Navigation setup (excat-navigation-expert)
8. Import infrastructure validation
9. Bulk import for additional pages
10. Full-site validation
```

### Your Actual Workflow (reconstructed from prompts)

```
1. ❌ No warm-up — jumped straight to migration
2. ✅ First page migration (home page)
3. ✅ Global design import (likely)
4. ❌ Block design not done as Phase 2 — mixed with ad-hoc fixes
5. ❌ No critique skill used — manual visual comparison instead
6. ❌ No page critique — same issue
7. ❌ Nav built through general-purpose prompts, not nav skill
8. ✅ Import script alignment checked (good, but late)
9. ❌ Additional pages imported individually, not via bulk import
10. ❌ No full-site validation pass
```

### Critical Sequencing Issues

1. **Design → Block styling → Critique was not followed**: You mixed design token work with content fixes, animation imports, and spacing redesigns. The prompting guide says "complete the site-wide design before styling individual blocks." You styled blocks, then redesigned the token system, then re-styled blocks.

2. **No context resets at natural boundaries**: The conversation should have been reset at least at these points:
   - After the initial migration + design import was stable
   - Before starting the header/footer work
   - After the spacing system was redesigned
   - Before the final polish pass

3. **Footer work started too early**: You began footer styling before the global spacing system was finalized, then had to redo footer spacing when the system changed. Footer/header should come after global styles are stable.

4. **The Figma side-quest consumed context**: The `cards-team` Figma migration happened mid-conversation, consuming significant context on a task unrelated to the UPS migration.

### When Context Likely Degraded

Based on the evidence:

| Signal | Approximate Prompt | Evidence |
|--------|-------------------|----------|
| First lost instruction | ~Prompt 15 | "I haven't seen the effect of following request" |
| Repeated reminders needed | ~Prompt 22-25 | "didn't I ask you to make the links white?" |
| Agent unresponsive | Prompt 4 | "You got unresponsive" |
| Request timeouts (4x) | ~Prompt 55 | "Request timed out" in conversation |
| Repeated spacing spec | Prompts 31, 32, 55 | Same system described 3 times |

**Recommended reset points that were missed:**
- After prompt 15 (first sign of lost context)
- After prompt 25 (deep into footer pixel-tweaking)
- After the 4 timeouts (context was almost certainly degraded)
- Before the final spacing redesign

---

## 6. Personal Prompting Playbook

### How to Start a New Chat

Always begin with a warm-up prompt:
```
Read PROJECT.md and AGENTS.md. Familiarize yourself with:
- The block inventory and their variants
- The design token system in styles/styles.css
- The vertical spacing rules
- The import infrastructure in tools/importer/
Then confirm you're ready.
```

This loads your documented decisions, coding conventions, and block reference into the conversation context before you start working.

### How to Warm Up the Agent

After the initial read, give it a lightweight verification task:
```
Check the preview of the home page at localhost:3000/content/us/en/home.html.
Take a screenshot and confirm all blocks are rendering correctly.
```

This activates the preview pipeline and confirms the dev server is working.

### How to Ask for Planning First

Use explicit planning language:
```
I want to redesign the vertical spacing system. Before implementing anything:
1. Analyze the original UPS site's spacing between blocks on the home page and our-impact page
2. Measure the gaps at desktop and mobile breakpoints
3. Propose a CSS rule system that would enforce consistent spacing
4. Present the proposal for my review before writing any code
```

### How to Give Context Without Overloading

Provide context as structured reference, not embedded in the task:
```
Context:
- The original site uses this CSS for the active nav item: [paste CSS]
- The nav structure follows the 3-section pattern (brand, sections, tools)

Task:
Add active section highlighting to the top nav. The current page's section should show a yellow accent bar below its nav link.
```

### How to Sequence Tasks

Follow this order for any new page:

1. **Migrate content**: `Migrate this page: [URL]`
2. **Import design** (if new blocks): `Style the [block-name] block on the [page] page`
3. **Critique blocks individually**: `Critique the [block-name] block against [original URL]`
4. **Critique the full page**: `Critique the [page] page against [original URL]`
5. **Fix specific issues**: `On the [page] page, fix: [one specific issue]`

### How to Recover When the Agent Goes Off Track

1. **Check what it actually did**: "Show me the diff of the last changes you made"
2. **Redirect specifically**: "Stop. Revert the last change to footer.css. Instead, only change the social icon font-size from 24px to 20px."
3. **Re-anchor to documentation**: "Re-read the Vertical Spacing Rules in PROJECT.md, then look at what you just wrote. Does it comply?"

### When to Start Fresh

Start a new chat when:
- You've exchanged 15-20 substantive prompts
- The agent misses something you told it earlier
- You're switching from one major workstream to another (e.g., content migration → header/footer → spacing system)
- The agent produces output that contradicts its own earlier work
- You see timeouts or unusual delays
- You're about to start a complex multi-file change

When starting fresh:
```
Warm up by reading PROJECT.md and AGENTS.md.
[Context summary of what was done and what's next]
Then proceed with: [specific task]
```

---

## 7. Reusable Prompt Templates

### Template 1: Warm-Up / Context Load
```
Read PROJECT.md and AGENTS.md to understand the current project state.
Confirm: how many custom blocks exist, what pages have been migrated, and what design tokens are defined.
```

### Template 2: Planning Before Complex Work
```
I want to [describe the change]. Before implementing:
1. Analyze [what to inspect] on the original site at [URL]
2. Check our current implementation in [files/blocks]
3. Propose an approach with specific CSS rules / JS changes
4. Present the proposal — do not implement until I approve
```

### Template 3: Single Page Migration
```
Migrate this page to Edge Delivery Services: [URL]
Reuse existing blocks where possible. Create new variants only when necessary.
After migration, preview the result and confirm all blocks render correctly.
```

### Template 4: Design Import (Site-Wide)
```
Extract the site-wide design from [URL]:
- Color palette and accent colors
- Typography (fonts, sizes, weights)
- Spacing system
- Button styles
- Section backgrounds
Apply as CSS custom properties in styles/styles.css.
```

### Template 5: Block-Specific Styling
```
Style the [block-name] block to match the original at [URL].
The block is located [where on the page].
Here is the original CSS I found for reference: [paste relevant CSS]
After styling, critique the result against the original.
```

### Template 6: Block Critique
```
Critique the [block-name] block on [page path] against the original at [URL].
Focus on: [specific areas — spacing, colors, typography, responsive behavior].
Apply CSS fixes for any differences you find.
```

### Template 7: Page Critique
```
Critique the [page path] page against [original URL].
Check all blocks, vertical spacing between sections, and responsive behavior at both desktop and mobile breakpoints.
```

### Template 8: Bulk Import
```
Run bulk import on these pages using the [template-name] template:
[URL1]
[URL2]
[URL3]
Validate the output against the first migrated page of this template.
```

### Template 9: Debugging a Specific Issue
```
On [page path], the [block-name] block has this issue: [specific description].
Expected behavior: [what it should do].
Actual behavior: [what it does].
Inspect the rendered DOM and CSS to find the cause, then fix it.
```

### Template 10: Design System Update
```
Update the [token/variable/rule] in the design system:
- Current value: [what it is now]
- New value: [what it should be]
- Rationale: [why]
Apply this change to styles.css and verify all blocks that reference this token still render correctly.
```

### Template 11: Import Script Alignment Check
```
Simulate an import of [URL] using the [template-name] import script.
Compare the output against the existing content at [page path].
If there are differences, fix the import script to match the current content structure.
Do NOT overwrite the existing content.
```

### Template 12: Context Recovery After Reset
```
I'm starting a fresh chat. Read PROJECT.md and AGENTS.md.

Current state:
- Pages migrated: [list]
- Last completed work: [summary]
- Known issues: [list]

Next task: [what to do]
```

### Template 13: Navigation Setup
```
Set up the navigation from [URL].
Follow the EDS 3-section structure: brand (logo), sections (main nav links), tools (utility links).
Include: [mega menus / dropdowns / mobile hamburger / active section highlighting].
```

### Template 14: Fix-the-Specific-Issue
```
On [page], fix this one issue:
[Precise description of what's wrong and what it should be]
Do not change anything else.
```

### Template 15: Rule Documentation
```
Add the following rule to PROJECT.md under [section]:
[Rule description]
Then apply this rule to all existing [blocks/content/styles] that violate it.
```

---

## 8. Final Diagnosis

### The 5 Biggest Changes That Would Most Improve Your Prompting

1. **Invoke skills explicitly for their intended purpose.** "Critique the hero-featured block against the original" triggers the critique workflow. "Fix the spacing on the hero-featured" gets ad-hoc editing. The former is systematically reliable; the latter depends on the agent's judgment in an already-crowded context window. Use the critique skills for comparison work, the design expert for styling, and the nav expert for navigation.

2. **One focused task per prompt.** The agent can handle 1-2 related items well. At 4+ items, it starts dropping things. Your best results came from focused prompts (the CSS refactoring plan, the fadeInUp import with reference CSS). Your worst results came from overloaded prompts (the footer saga, the multi-page multi-block fix prompts).

3. **Plan complex changes before implementing.** The spacing system, the header/footer, and the design token refactoring all deserved a planning phase where the agent analyzed the original site and proposed an approach before writing code. You did this for the CSS refactoring (Prompt 33) and it was your most successful prompt. Apply that pattern to every multi-file change.

4. **Reset context at natural boundaries.** After migration is stable, start fresh for design. After design is stable, start fresh for polish. After polish, start fresh for bulk import. Each fresh chat starts with a warm-up prompt that reads PROJECT.md. This costs 30 seconds and prevents the "I asked you to..." problem entirely.

5. **Use critique skills instead of manual pixel comparison.** The footer saga (12 prompts) and hero-featured saga (6 prompts) could each have been 2-3 prompts: invoke critique → review report → fix remaining issues. The critique skill captures both sides, matches elements, scores similarity, and generates prioritized CSS fixes — exactly what you were doing manually.

### The 3 Mistakes to Stop Making First

1. **Stop mixing 5+ tasks in one prompt.** This is the most frequent cause of dropped instructions and "I asked you to..." reminders. Break every prompt into at most 2 closely related items. If you have 6 things to fix, send 3 prompts of 2 items each.

2. **Stop manually comparing blocks to the original site.** Every time you write "the icon should be blue instead of black" or "reduce the padding by 10px," you're doing work the critique skill automates. Invoke the skill, let it identify all differences at once, then review its report.

3. **Stop continuing in a degraded conversation.** When you see signs of lost context (dropped tasks, contradictory changes, timeouts), reset immediately. The cost of a 30-second warm-up prompt is negligible compared to the cost of 5+ prompts of re-explanation and correction.
