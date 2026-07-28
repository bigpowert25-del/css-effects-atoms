# L4 Industry Pages Run

## Goal

Classify the available MotionSites prompt library and turn selected directions
into distinct, industry-specific finished pages inside L4.

## Source State

- Historical local source snapshot checked read-only.
- Available source files: 405 Markdown prompts.
- The classifier is deterministic and can be rerun when more prompts arrive.

## Delivered

- Prompt catalog:
  `registry/motionsites-prompt-catalog.json`
- Classification report:
  `registry/motionsites-prompt-report.md`
- L4 count: 30
- Finished pages: 6
- Industries: technology, finance, travel, retail, business services, culture
- Finished pages are shown before recipe previews.
- Finished pages use real iframe documents with internal scrolling.
- Multiple finished pages can remain active at the same time.
- Finished pages copy their standalone HTML instead of a prompt.
- Single HTML includes all six finished-page documents as embedded previews.

## Verification

- Catalog build: 268 total items
- Automated tests: 38 passed, 0 failed
- UI quality gate: passed with 0 errors
- Desktop browser: 30 L4 cards and 6 finished pages
- Concurrent browser run: 6 of 6 finished pages active
- Travel page: 5 sections, 4790 px document height in preview
- Internal travel-page scroll: 0 to 1250 px
- Mobile viewport: 390 x 844, 390 px document width, no horizontal overflow
- Single HTML: all 6 finished pages loaded from `srcdoc`
- Offline single HTML: all six pages keep layout, text and interaction without
  external media or font requests; Tailwind runtime is bundled locally.
- Single HTML console: 0 errors
- Single HTML size: 7,084,117 bytes
- SHA-256:
  `babff29aaab439057f59a51b540f96bce49af4307a1d26f5d026a515b737523a`
- Project and runtime-copy hashes match.

## Residual Risk

The normal server preview keeps the richer remote video and product imagery
from the reused source pages. The single HTML intentionally replaces those
remote media files with lightweight CSS and Canvas fallbacks so the artifact
stays portable instead of growing by tens of megabytes.

## Rollback

Remove `finishedPageItems` from `registry/expansion-definitions.mjs`, rebuild the
layered catalog and single HTML, then rerun `tools/start-demo.sh 9876`.

## 661 Prompt Library Extension

The original NAS snapshot remains a 405-file historical subset. The complete
public repository was verified at commit
`2a8c639aff9007999afb4243db3e0fec28bb4a31`, where
`motionsites-prompts/` contains 661 Markdown prompts and 661 metadata files.

- Source records: 661
- Unique prompt bodies: 659
- Complete, copyable prompts: 656
- Upstream records without usable prompt text: 3
- Exact duplicate prompt bodies: 2
- License: MIT
- Search: title, summary, source, tags, engines and full prompt body
- Filters: industry, page type and visual style
- Initial render: 48 cards, progressive loading in batches of 48
- Actions: expand full prompt, open source and copy full prompt
- Route: `#PROMPTS`
- Automated tests: 41 passed, 0 failed
- Desktop width: 1482 px, no horizontal overflow
- Mobile viewport: 390 x 844, one-column cards, no horizontal overflow
- Single HTML size: 11,844,128 bytes
- Single HTML SHA-256:
  `a13eb6d8d6b5009a01e435d73e2e3b256ad887f4bf69a7cabe8aa492f4d8454a`
- Project and runtime-copy hashes match for the shell, app, Prompt data and
  single HTML.
