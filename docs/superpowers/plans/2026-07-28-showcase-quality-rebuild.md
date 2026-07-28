# CSS·FX Showcase Quality Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make L1-L3 card covers use the exact live preview they activate, raise interaction and scene finish, and turn every L4 card into a scrollable miniature long page.

**Architecture:** Route all lightweight interactions through one polished preset runner, render L1-L3 previews as lazy same-source iframes, and activate input without replacing the iframe. Render L4 as internally scrollable semantic page sections. Rebuild the existing single-file artifact from the same sources.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Canvas 2D, Three.js r185, IntersectionObserver, iframe messaging, Node.js built-in tests.

---

### Task 1: Quality contract

**Files:**
- Create: `tests/showcase-quality.test.mjs`
- Modify: `tests/variant-runner.test.mjs`
- Modify: `tests/demo-shell.test.mjs`

- [ ] Add a failing test requiring `ambient-frame`, `IntersectionObserver`, `activatePreview`, and no click-time iframe replacement.
- [ ] Add a failing test requiring all 48 L1/L2 entries to resolve to the polished runner or an approved signature scene.
- [ ] Add a failing test requiring L4 `tabindex`, internal overflow, overscroll containment, and at least six miniature sections.
- [ ] Run `node --test tests/showcase-quality.test.mjs`; expect all three contracts to fail.

### Task 2: Unified L1/L2 routing

**Files:**
- Modify: `tools/build-layered-library.mjs`
- Modify: `demo/previews/variant-runner.html`
- Modify: `tests/variant-runner.test.mjs`

- [ ] Normalize base L1/L2 preview and copy targets to `variant-runner.html?preset=<id>`.
- [ ] Route `physics-curtain` and `particle-network-panel` to their signature scene previews while preserving standalone copy targets.
- [ ] Register the 16 base preset IDs in the polished runner with real input families.
- [ ] Rebuild the catalog and confirm all 48 preview references resolve.

### Task 3: Same-source live cards

**Files:**
- Modify: `demo/app.js`
- Modify: `demo/app.css`
- Modify: `tests/showcase-quality.test.mjs`

- [ ] Render an unloaded `iframe.ambient-frame` for every L1/L2/L3 card.
- [ ] Add IntersectionObserver loading and disposal with a viewport margin.
- [ ] Replace click-time iframe creation with `activatePreview(itemId)` that toggles pointer events on the existing frame.
- [ ] Keep multiple L1/L2 cards active and limit L3 only to one active input focus.
- [ ] Verify the iframe element identity and URL remain unchanged after activation.

### Task 4: L1/L2 finish pass

**Files:**
- Modify: `demo/previews/variant-runner.html`
- Modify: `tests/variant-runner.test.mjs`

- [ ] Add base preset configurations for magnetic, spotlight, lens, kinetic type, gravity, ripple, liquid, image trail, scroll scrub, raycast, card stack, shader poster, media carousel, network, and orbit viewer.
- [ ] Add explicit composition details for timeline, masonry, data orbit, node editor, product stage, audio panel, and generative poster.
- [ ] Support `fx:activate`, `fx:deactivate`, `fx:dispose`, reduced motion, keyboard input, and a low-power `cover=1` mode.
- [ ] Run runner tests and manually verify representative DOM, Canvas, audio, and Three presets.

### Task 5: L3 scene finish and cover mode

**Files:**
- Modify: `demo/scenes/scene-runner.html`
- Modify: `tests/scene-pack.test.mjs`

- [ ] Add `cover=1` and activation messages without changing scene composition.
- [ ] Add scene-specific detail text and foreground subjects for all 17 presets.
- [ ] Cap cover DPR and particle counts; restore full values when activated.
- [ ] Verify WebGL fallback, canvas rendering, resize, reduced motion, and disposal.

### Task 6: Scrollable L4 pages

**Files:**
- Modify: `demo/app.js`
- Modify: `demo/app.css`
- Modify: `tests/showcase-quality.test.mjs`

- [ ] Replace the fixed miniature with a focusable `.recipe-scroll` container.
- [ ] Render nav, hero, proof, feature, media, detail, CTA, and footer from each recipe.
- [ ] Set a stable preview height, internal `overflow-y: auto`, `overscroll-behavior: contain`, and visible compact scrollbar.
- [ ] Browser-test wheel and keyboard scrolling on desktop and mobile.

### Task 7: Packaging and acceptance

**Files:**
- Modify: `tools/build-single-html.mjs`
- Modify: `tests/single-html.test.mjs`
- Modify: `docs/superpowers/runs/20260728-showcase-quality-rebuild.md`
- Rebuild: `demo/downloads/css-fx-library-single.html`

- [ ] Rebuild catalog and single HTML.
- [ ] Run syntax checks and `node --test tests/*.test.mjs`.
- [ ] Mirror the demo with `tools/start-demo.sh`.
- [ ] Verify desktop and 390px mobile, L1 parallel activation, L3 same-node activation, L4 internal wheel scroll, copy, and console.
- [ ] Record artifact size, SHA-256, known boundaries, and rollback.
