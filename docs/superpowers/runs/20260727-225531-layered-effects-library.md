# L3 Run Record — Layered Effects Library

## Scope

- Run ID: `20260727-225531-layered-effects-library`
- Completed at: `2026-07-27 23:28 CST`
- Working copy: local project checkout
- Release state: local only; no publish, push, upload, or NAS source modification
- Version control: unavailable because this directory is not a Git repository

## Result

| Gate | Result | Evidence |
| --- | --- | --- |
| L0-L4 catalog | PASS | 197 total: L0 170, L1 10, L2 6, L3 3, L4 8 |
| Engine coverage | PASS | CSS/DOM, Canvas 2D, Media, Three/WebGL |
| GitHub trend scan | PASS | 15 projects, 5 product directions, license and reuse-risk fields |
| Heavy preview lifecycle | PASS | poster-first, explicit run, one active iframe, dispose message, stop removal |
| Copy contract | PASS | snippet, selected standalone mode, full scene, or recipe prompt by level |
| Automated tests | PASS | `node --test tests/*.test.mjs`: 19 passed, 0 failed |
| Syntax checks | PASS | app, copy helper, and catalog builder |
| UI quality scan | PASS | scoped strict scan: 0 errors, 2 accepted warnings |
| Desktop browser | PASS | five layers, posters, Three scene, copy, no overflow, no app console errors |
| Mobile browser | PASS | 390px width, no overflow, live interaction, visible stop control |
| Three pixel gate | PASS | desktop center Y 0–152; mobile center Y 8–82 |

## Browser Evidence

- `evidence/20260727-particle-desktop.jpg`
- `evidence/20260727-particle-mobile.jpg`
- Three.js metric changed while running, confirming an active render loop.
- Switching from one heavy card to another kept the iframe count at exactly one.
- Stopping a preview reduced iframe and stop-control counts to zero.

## Review Fixes

1. Mobile preview stop control was hidden behind the sticky toolbar.
   - Fixed by centering the launched preview and using a visible close icon.
2. L1/L2 copy could lose its selected query mode.
   - Fixed by embedding the selected mode into the copied standalone HTML.
3. Tengwang curtain disposal did not close Web Audio.
   - Fixed by disconnecting output and closing the audio context.
4. Browser screenshots contained JPEG bytes under PNG names.
   - Fixed extensions and catalog paths to `.jpg`.
5. Search relied on placeholder text as its accessible name.
   - Added an explicit `aria-label`.

## Accepted Exceptions

- The title dash warning is intentional editorial punctuation.
- Radius values from 3px to 7px form the restrained control/card hierarchy.
- Legacy files under `demo/pages/` are not part of the new catalog shell and retain pre-existing scanner findings.
- The rolling-tape example intentionally keeps its isolated Three r128 and GSAP runtime.
- Three.js scene loading still depends on the jsDelivr CDN; poster and fallback states remain available if it fails.

## Rollback

- Restore the previous `demo/index.html` and remove the new `demo/app.*` shell files.
- Remove `registry/layered-library*`, `registry/github-trend-scan.json`, and `tools/build-layered-library.mjs`.
- Remove `demo/previews/`, `demo/scenes/`, and `demo/assets/posters/`.
- The original supplied HTML files and NAS MotionSites source were never modified.
