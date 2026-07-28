# L4 Industry Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Classify every available MotionSites prompt and surface six visually distinct, industry-specific finished pages inside L4.

**Architecture:** A deterministic Node classifier reads an external prompt directory and writes derived metadata into the registry. Selected finished pages are ordinary standalone HTML files referenced by L4 catalog entries, rendered through the existing lazy same-source iframe system and embedded into the single-file build.

**Tech Stack:** Node.js ESM, vanilla HTML/CSS/Canvas, existing CSS·FX catalog builder, sandboxed iframes, Node test runner.

---

### Task 1: Prompt classification contract

**Files:**
- Create: `tests/prompt-classification.test.mjs`
- Create: `tools/classify-motionsites-prompts.mjs`
- Create: `registry/motionsites-prompt-catalog.json`
- Create: `registry/motionsites-prompt-report.md`

- [ ] Write a failing test that imports `classifyPrompt`, classifies representative AI, finance, travel, automotive, culture, retail, education, and unknown samples, and requires stable `industry`, `pageType`, `style`, and `engines` fields.
- [ ] Run `node --test tests/prompt-classification.test.mjs`; expect failure because the classifier does not exist.
- [ ] Implement ordered keyword rules with `other` fallbacks and a CLI accepting `--source` and `--output`.
- [ ] Run the classifier against the read-only NAS snapshot and assert exactly 405 output records, unique IDs, relative source paths, and no full prompt body.
- [ ] Run the test again; expect pass.

### Task 2: Finished-page catalog entries

**Files:**
- Modify: `registry/expansion-definitions.mjs`
- Modify: `tools/build-layered-library.mjs`
- Create: `tests/l4-finished-pages.test.mjs`

- [ ] Write a failing test requiring six L4 entries with `maturity: "finished-page"`, distinct industries, distinct style IDs, and resolvable `preview.page` files.
- [ ] Run the test and verify it fails because finished-page entries are absent.
- [ ] Add entries for AI, finance, travel, collectible retail, SaaS, and culture; preserve existing recipe entries.
- [ ] Rebuild the catalog and verify L4 grows from 24 to 30.

### Task 3: Cultural finished page

**Files:**
- Create: `demo/pages/ink-pavilion.html`
- Modify: `tests/l4-finished-pages.test.mjs`

- [ ] Extend the failing test to require a complete page structure, Canvas ink field, internal sections, pointer/touch input, reduced-motion support, and disposal.
- [ ] Build a standalone editorial cultural page with rice-paper texture, pavilion typography, scroll chapters, exhibition panels, and pointer-driven Canvas ink.
- [ ] Run the focused test and verify pass.

### Task 4: L4 real-page preview integration

**Files:**
- Modify: `demo/app.js`
- Modify: `demo/app.css`
- Modify: `tests/showcase-quality.test.mjs`

- [ ] Write a failing test requiring `preview.mode === "page"` to use the same-source frame, display industry/style badges, and activate card-internal scrolling without replacing the iframe.
- [ ] Implement page-aware labels and styling while retaining recipe miniature pages for non-finished entries.
- [ ] Verify six real pages render as iframes and the remaining 24 render as recipe mini pages.

### Task 5: Single-file packaging

**Files:**
- Modify: `tools/build-single-html.mjs`
- Modify: `tests/single-html.test.mjs`

- [ ] Write a failing test requiring all six page HTML files in `FX_EMBEDDED_PREVIEWS`.
- [ ] Add selected pages to the embed manifest.
- [ ] Rebuild `demo/downloads/css-fx-library-single.html`.
- [ ] Verify finished pages load through `srcdoc` with no local relative script or stylesheet dependencies.

### Task 6: Acceptance

**Files:**
- Modify: `docs/superpowers/runs/20260728-l4-industry-pages.md`

- [ ] Run `node --test tests/*.test.mjs`.
- [ ] Sync the demo runtime with `./tools/start-demo.sh 9876`.
- [ ] Browser-check L4 at desktop and 390×844: six finished pages visible, card-internal scroll works, no horizontal overflow.
- [ ] Browser-check the single HTML: finished pages use embedded `srcdoc`, recipe cards remain scrollable, console has no errors.
- [ ] Run the UI scanner and record justified exceptions.
- [ ] Record counts, artifact hash, browser evidence, rollback path, and the 405-vs-600 source discrepancy.
