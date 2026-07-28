# Layered Effects Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing CSS atom gallery into an L0-L4 library with real interactions, isolated Three.js/Canvas scenes, prompt recipes, trend metadata, and level-aware copy actions.

**Architecture:** Preserve the generated atom registry, add a discriminated layered source registry, and build one merged browser catalog. Cheap atoms render inline; reusable interactions run in a shared runner; heavy scenes create a sandboxed iframe only after an explicit Run action.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node.js built-in test runner, Canvas 2D, Three.js per isolated scene, optional GSAP only inside the legacy rolling-tape scene.

**Status:** Completed locally on 2026-07-27. Acceptance evidence is recorded in `docs/superpowers/runs/20260727-225531-layered-effects-library.md`.

---

### Task 1: Registry contract and builder

**Files:**
- Create: `tests/layered-library.test.mjs`
- Create: `registry/layered-library.schema.json`
- Create: `registry/layered-library.source.json`
- Create: `tools/build-layered-library.mjs`
- Create: `registry/layered-library.json`
- Create: `demo/generated-data.js`

- [ ] Write a failing Node test that requires L0-L4 coverage, four engines, minimum checkpoint counts, valid preview files, scene fallbacks, and level-aware copy payloads.
- [ ] Run `node --test tests/layered-library.test.mjs`; expect failure because the layered registry does not exist.
- [ ] Add the schema, source manifests, and pure builder functions.
- [ ] Run the builder and rerun the test; expect all registry assertions to pass.

### Task 2: Library shell

**Files:**
- Create: `tests/demo-shell.test.mjs`
- Modify: `demo/index.html`
- Create: `demo/app.css`
- Create: `demo/app.js`

- [ ] Write a failing structural test for level tabs, engine filters, search, trend radar, run/stop controls, and level-aware copy.
- [ ] Run `node --test tests/demo-shell.test.mjs`; expect missing shell markers.
- [ ] Implement the dense, asymmetric library interface while keeping the existing 170 atom previews.
- [ ] Rerun both test files; expect pass.

### Task 3: Interaction runner

**Files:**
- Create: `tests/interaction-runner.test.mjs`
- Create: `demo/previews/interaction-runner.html`

- [ ] Write a failing test requiring at least ten named mechanics, Pointer Events, touch-compatible coordinate handling, ResizeObserver, reduced-motion handling, and a destroy/reset path.
- [ ] Run the test; expect failure because the runner does not exist.
- [ ] Implement the mechanics as isolated modes selected by query string.
- [ ] Rerun the test and browser-smoke representative pointer interactions.

### Task 4: Complete scenes

**Files:**
- Create: `tests/scenes.test.mjs`
- Create: `demo/scenes/rolling-tape.html`
- Create: `demo/scenes/tengwang-curtain.html`
- Create: `demo/scenes/three-particle-network.html`

- [ ] Write a failing test for scene titles, canvas presence, dependency declarations, DPR caps, fallback markup, and reduced-motion support.
- [ ] Run the test; expect missing scene files.
- [ ] Import the two supplied examples into isolated pages and add a current Three.js particle-network scene.
- [ ] Verify all scenes produce nonblank canvases and stop cleanly when the iframe is removed.

### Task 5: Trend integration and final acceptance

**Files:**
- Modify: `registry/layered-library.source.json`
- Create: `registry/github-trend-scan.json`
- Create: `docs/superpowers/runs/20260727-225531-layered-effects-library.md`

- [ ] Normalize the read-only GitHub research into project, stars-at-check, license, layer fit, and adopted product pattern.
- [ ] Rebuild the catalog and run all Node tests.
- [ ] Test desktop and 390px mobile layouts, filters, copy, run/stop, Canvas pixels, Three pixels, console errors, and overflow.
- [ ] Save screenshots and the L3 run record with rollback and remaining-risk status.
