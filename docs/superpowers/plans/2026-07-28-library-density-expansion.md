# CSS·FX Library Density Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand L1-L4 to 24/24/20/24, render distinct L4 miniature pages, and ship one self-contained HTML.

**Architecture:** Keep the existing base registry and merge a compact expansion definition module during the catalog build. New L1/L2 entries use a preset-driven interaction runner, new L3 entries use a lifecycle-safe scene runner, and L4 cards render structured visual recipes. A separate bundler inlines the catalog, CSS, app code, preview documents, scenes, and posters into one HTML.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node.js built-in tests, Canvas 2D, Three.js r185, iframe `srcdoc`, macOS local HTTP service.

---

### Task 1: Expansion contract

**Files:**
- Modify: `tests/layered-library.test.mjs`
- Create: `registry/expansion-definitions.mjs`
- Modify: `tools/build-layered-library.mjs`

- [ ] Add failing assertions for exact minimum counts `L1 >= 24`, `L2 >= 24`, `L3 >= 20`, `L4 >= 24`.
- [ ] Add failing assertions that every expansion preview preset resolves and every L4 item has `recipe.visual.layout`, `palette`, and at least four sections.
- [ ] Run `node --test tests/layered-library.test.mjs`; expect count and visual-contract failures.
- [ ] Add compact definitions and merge them after the base source items.
- [ ] Rebuild and rerun the test; expect the catalog contract to pass.

### Task 2: L1/L2 variant runner

**Files:**
- Create: `tests/variant-runner.test.mjs`
- Create: `demo/previews/variant-runner.html`

- [ ] Write a failing test that extracts every L1/L2 expansion preset from the catalog and requires its ID in the runner.
- [ ] Require Pointer Events, touch coordinates, keyboard paths, reduced motion, ResizeObserver, unknown-preset state, and `fx:dispose`.
- [ ] Run the test and confirm failure because the runner is absent.
- [ ] Implement eight interaction families selected by `?preset=...`, using the expansion definitions as the source list.
- [ ] Rerun the runner and catalog tests.

### Task 3: L3 scene runner

**Files:**
- Create: `tests/scene-pack.test.mjs`
- Create: `demo/scenes/scene-runner.html`
- Modify: `demo/app.js`
- Modify: `demo/app.css`

- [ ] Write a failing test requiring 17 new scene presets, Canvas and Three renderers, DPR cap, fallback, reduced motion, resize, and disposal.
- [ ] Run the test and confirm the scene runner is missing.
- [ ] Implement six scene families with per-preset composition and input behavior.
- [ ] Render generated scene posters from `preview.posterVisual` before launch.
- [x] Verify each preview is managed per card; opening a new card does not stop other active previews.

### Task 4: L4 visual recipes

**Files:**
- Modify: `tests/demo-shell.test.mjs`
- Modify: `demo/app.js`
- Modify: `demo/app.css`

- [ ] Write a failing structural test requiring `recipeVisualPreview`, layout variants, palette variables, and four miniature page modules.
- [ ] Run the test and confirm the old skeleton preview fails.
- [ ] Replace the skeleton with semantic miniature nav, hero, media, metric/grid, and CTA modules.
- [ ] Add layout-specific CSS for editorial, product, portfolio, cinematic, data, spatial, and commerce recipes.
- [ ] Verify all 24 L4 cards contain visible preview content and at least eight distinct layouts.

### Task 5: Query-pinned copy

**Files:**
- Modify: `tests/copy-payload.test.mjs`
- Modify: `demo/copy-payload.mjs`

- [ ] Add a failing test for pinning `?preset=` in copied variant and scene runners.
- [ ] Replace the mode-only helper with a helper that pins `mode` or `preset` declarations.
- [ ] Run copy tests and confirm selected L1/L2/L3 entries remain selected after copying.

### Task 6: Self-contained HTML

**Files:**
- Create: `tests/single-html.test.mjs`
- Create: `tools/build-single-html.mjs`
- Modify: `demo/index.html`
- Modify: `demo/app.js`
- Create: `demo/downloads/css-fx-library-single.html`

- [ ] Write a failing test requiring one HTML with inline CSS, inline catalog, inline app, embedded preview/scene map, embedded posters, and no relative `src` or `href` dependencies.
- [ ] Run the test and confirm the single file does not exist.
- [ ] Implement the bundler and add `window.FX_SINGLE_FILE` plus `window.FX_EMBEDDED_PREVIEWS`.
- [ ] Teach preview launch and copy to use iframe `srcdoc` and embedded documents.
- [ ] Add a download action to the server version and hide it inside the single-file version.
- [ ] Build and rerun the single-file test.

### Task 7: Acceptance and persistent runtime

**Files:**
- Modify: `docs/superpowers/runs/20260728-library-density-expansion.md`

- [ ] Run `node tools/build-layered-library.mjs`.
- [ ] Run `node tools/build-single-html.mjs`.
- [ ] Run `node --test tests/*.test.mjs` and syntax checks.
- [ ] Run the strict UI scanner on the current shell.
- [ ] Run `./tools/start-demo.sh` to mirror the rebuilt demo to the launch service.
- [ ] Browser-test L2, L3, L4, the single-file URL, desktop, 390px mobile, run/stop, copy, overflow, and console errors.
- [ ] Record baseline hash, candidate hash, allowed files, verification evidence, rollback, and release status.
