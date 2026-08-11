# CSS.FX Cinematic Intro Integration Run

```text
run_id: cssfx-intro-integration-20260811-084846
overall_status: partial
implementation_status: passed
local_verification: passed
e2e_acceptance: passed
publish_status: partial
rollback_status: ready
```

## Scope

- Repository worktree: `/Users/mac/.config/superpowers/worktrees/css-effects-atoms/cssfx-intro-integration`
- Feature branch: `feature/cssfx-intro-integration`
- Main branch baseline: `43139c8`
- Read-only source experiment: `/Users/mac/Documents/完项目/38-css-effects-atoms/experiments/exp-20260728-cssfx-cinematic-intro`
- Local service: `com.spicy.css-fx-demo`, `127.0.0.1:9876`
- Feature branch push: completed at `a038e8678543852fb1924eecbdf704a050624268`
- PR creation, Pages deployment and visibility changes: not executed

## Implemented

- Added root `index.html` with automatic and manual fallback entry to `./demo/index.html`.
- Added `intro/` with the verified Three.js runtime and local MIT notice.
- Updated intro navigation to `../demo/index.html#L0`, `#L1` and `#L3`.
- Updated `tools/start-demo.sh` to sync the root entry and `intro/` into the existing 9876 launch-service runtime directory.
- Added README and third-party attribution for the optional intro.
- Clarified public README local-preview addresses and added repository source links.
- Added a regression test preventing clickable localhost links in the public README.
- Left `demo/`, `atoms/`, `registry/` and existing catalog data untouched.

## TDD and automated verification

- Integration RED: 7 tests failed because the new root and intro files were absent.
- Integration GREEN after runtime port: 7/7 passed.
- Service-sync RED: 7 passed, 1 failed because `tools/start-demo.sh` did not sync root/intro.
- Service-sync GREEN: 8/8 passed.
- Original integration suite: 49 passed, 0 failed.
- Post-push README regression suite: 50 passed, 0 failed.
- JavaScript syntax: `intro/src/cinematic-intro.js` and `intro/src/scene.js` passed.
- Shell syntax: `tools/start-demo.sh` passed.
- `git diff --check`: passed.

## UI gate

The strict UI scanner returned `status: pass`, `errors: 0`, and 6 warnings. A clean baseline scan of the pre-integration main checkout returned the same 6 warnings in existing `demo/` content; the integration added no new warning. The strict process exits non-zero because warnings are present, so the UI dimension is recorded as `passed_with_baseline_warnings`, not as warning-free.

## Local service evidence

Observed at `2026-08-11T08:48:46+0800`:

```text
root 200
demo 200
intro 200
intro_app 200
three 200
```

The launch service remained running with PID 1081. Source and served HTML hashes matched:

```text
47cb636141e1b11c0b84c9a90740099cda82ed89eb6e950481361bef9aa7d391  index.html
47cb636141e1b11c0b84c9a90740099cda82ed89eb6e950481361bef9aa7d391  served root
e16c93413ddcaa61141929d423b72a415792aa7d7be9ee1512bbddf7dcbed47e  intro/index.html
e16c93413ddcaa61141929d423b72a415792aa7d7be9ee1512bbddf7dcbed47e  served intro
```

The served intro contained all three expected relative targets at lines 41, 45 and 49.

## Browser acceptance

Using one in-app browser session and one semantic Playwright control path:

- Root `/` redirected to `/demo/index.html` with title `CSS·FX — 网页互动素材库`.
- Normal `/intro/` reached `data-intro-state="revealed"`; a fresh direct session had no page console errors or warnings.
- A fresh root-to-intro session also reached `revealed` with no page console errors or warnings.
- Skip/replay controls were present and the three real click paths navigated to:
  - `/demo/index.html#L0`
  - `/demo/index.html#L1`
  - `/demo/index.html#L3`
- `?motion=reduce` reached `revealed` within the initial check.
- `?fallback=1` displayed the static fallback panel. Its intentional diagnostic `console.error` was not counted as a normal-path failure.
- At 390×844, document and body scroll widths were both 390; canvas dimensions were 390×844; no horizontal overflow was observed.

One earlier reused tab emitted a non-reproducible `MutationObserver.observe` TypeError. The page has no MutationObserver code, and two fresh sessions (direct intro and root-to-intro) produced empty page logs. It is recorded as browser-tooling noise rather than fixed by changing application code.

## Changed commits

```text
ce17401 test: define integrated cinematic intro contract
bb7a0e6 feat: add optional cinematic intro experience
1d0f1ca docs: document cinematic intro entry and attribution
524c39a fix: keep root redirect accessible
524ed0f feat: serve integrated intro from demo service
a038e86 docs: clarify local preview links
```

## Public README link audit

- Scope: 13 other first-party GitHub remotes across 14 local checkout paths under `/Users/mac/Documents/完项目`.
- Files checked: `README*` and Markdown documentation, excluding `.git/`, `.worktrees/` and `node_modules/`.
- Result: 0 occurrences of `localhost`, `127.0.0.1` or `0.0.0.0` in those first-party public documents.
- Two non-first-party local clones contain development URLs: `systemchester/FrameRonin` has clickable localhost links, and `andrewyng/openworker` has bare localhost text. Neither was modified.

## Rollback

The source experiment remains untouched. To roll back this feature branch locally,
remove the added root `index.html`, `intro/`, the integration test, the service-sync
lines, README/notice additions and this run record; retain the existing `demo/`,
`atoms/`, `registry/` and catalog build outputs. Do not deploy this branch without
separate authorization.
