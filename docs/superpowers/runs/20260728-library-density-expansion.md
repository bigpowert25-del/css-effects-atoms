# Library Density Expansion Run

Run time: 2026-07-28 02:37 CST

## Scope

- Expand catalog counts to L1 24, L2 24, L3 20, L4 24.
- Add high-difference interaction and scene runners.
- Replace generic L4 placeholders with miniature page compositions.
- Keep card previews independently runnable and stoppable.
- Produce one self-contained HTML artifact.

## Result

- Catalog: 262 total items with L0/L1/L2/L3/L4 = 170/24/24/20/24.
- New presets: 32 L1/L2 interactions, 17 L3 scenes, 16 L4 recipes.
- L3 presentation: 3 supplied scene posters plus 17 generated scene covers.
- L4 presentation: 24 populated miniature pages across at least 8 layouts.
- Parallel preview acceptance: two L1 cards remained active; stopping one left the other running.
- Heavy preview acceptance: opening a second L3 scene released the first L3 iframe.
- Review fixes: protected `$`/`$$` during bundling, added module parse coverage, upgraded key interaction presets to real input behavior, and widened WebGL fallback coverage.
- Artifact: `demo/downloads/css-fx-library-single.html`, 5,641,891 bytes.
- Artifact SHA-256: `2cc7f8024b7329b79501060b31e045c4f48997139635847031d72a05e2586141`.

## Verification

- `node --test tests/*.test.mjs`: 24 passed, 0 failed.
- HTTP readback: index, variant runner, scene runner, and single HTML returned 200.
- Runtime mirror hashes matched the source for `app.js`, `variant-runner.html`, and the single HTML artifact.
- Desktop L4: 24 cards, 24 recipe previews, no horizontal overflow, no broken images.
- Mobile 390x844 L4: one-column grid, 24 cards, no document-level horizontal overflow.
- Three scene: `scene-cosmic-archive` rendered a 2560x1440 canvas with no fallback or console errors.
- Supplied Tengwang scene: rendered a 2560x1440 canvas with no fresh console errors.

## Known Boundary

- The in-app browser blocked direct `file://` navigation by policy. Offline structure is covered by the single-file test, but double-click execution was not visually accepted in that browser.
- The whole-demo UI scanner still reports six pre-existing errors in unused legacy reference pages under `demo/pages/`. No current catalog or expansion file is implicated by those errors.
