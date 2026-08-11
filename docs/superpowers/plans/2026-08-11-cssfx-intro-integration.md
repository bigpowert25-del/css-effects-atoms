# CSS.FX Cinematic Intro Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the verified cinematic intro into the existing CSS.FX repository as an optional /intro/ experience while keeping the existing /demo/ library as the default homepage.

**Architecture:** Add a small root redirect page that sends visitors to ./demo/index.html; copy only the intro runtime into intro/; update the intro's three ordinary HTML links to ../demo/index.html#L0/L1/L3. Keep the existing demo/, registry, single-file output, and repository license boundary unchanged; extend only the 9876 launch-service sync in tools/start-demo.sh so the new root and intro paths are actually served.

**Tech Stack:** Static HTML, CSS, browser-native ES modules, vendored Three.js 0.182.0, Node built-in test runner, Python http.server, curl, GitHub Pages-compatible relative URLs.

---

## Scope and Baseline

Repository root:

~~~
/Users/mac/Documents/完项目/38-css-effects-atoms/css-effects-atoms
~~~

Source experiment (read-only reference during implementation):

~~~
/Users/mac/Documents/完项目/38-css-effects-atoms/experiments/exp-20260728-cssfx-cinematic-intro
~~~

Baseline evidence:

- Git branch: main
- Baseline HEAD before this feature: eb90504 after the approved design spec commit
- Existing CSS.FX test count: 41 passing
- Existing GitHub remote: https://github.com/bigpowert25-del/css-effects-atoms.git
- The source experiment is not deleted or modified by this plan.

Allowed implementation paths:

- index.html
- intro/
- tests/cinematic-intro.test.mjs
- README.md
- THIRD_PARTY_NOTICES.md
- tools/start-demo.sh
- docs/superpowers/plans/2026-08-11-cssfx-intro-integration.md
- docs/superpowers/runs/20260811-cssfx-intro-integration.md

Excluded implementation paths:

- Existing demo/, atoms/, registry/ runtime and data files
- Existing CSS.FX build scripts except the minimal 9876 runtime sync change in tools/start-demo.sh
- The source experiment directory
- GitHub remote, visibility, Pages settings, releases, and outbound messages

## Task 1: Add the Failing Integration Contract

**Files:**

- Create: tests/cinematic-intro.test.mjs
- Test: tests/cinematic-intro.test.mjs

- [ ] **Step 1: Write the failing test file**

Create the test file with this complete contract. It deliberately reads the future intro/ directory and root index.html; the first run must fail because those files do not yet exist.

~~~
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const introRoot = path.join(root, "intro");
const readRoot = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");
const readIntro = (relativePath) =>
  fs.readFileSync(path.join(introRoot, relativePath), "utf8");

test("integrated intro runtime files exist", () => {
  for (const relativePath of [
    "index.html",
    "src/styles.css",
    "src/cinematic-intro.js",
    "src/scene.js",
    "vendor/three.core.js",
    "vendor/three.module.js",
    "vendor/THREE-LICENSE.txt",
  ]) {
    assert.ok(
      fs.existsSync(path.join(introRoot, relativePath)),
      "intro/" + relativePath,
    );
  }
});

test("root entry keeps the CSS.FX catalog as the default homepage", () => {
  const html = readRoot("index.html");
  assert.ok(html.includes('href="./demo/index.html"'));
  assert.ok(html.includes("url=./demo/index.html"));
  assert.ok(!html.includes("intro/index.html"));
});

test("intro keeps semantic controls and local runtime paths", () => {
  const html = readIntro("index.html");
  const runtime = [
    html,
    readIntro("src/styles.css"),
    readIntro("src/cinematic-intro.js"),
    readIntro("src/scene.js"),
  ].join("\n");
  assert.match(html, /id="skipIntro"/);
  assert.match(html, /id="replayIntro"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /id="fallback"/);
  assert.doesNotMatch(runtime, /https?:\/\//);
  assert.match(readIntro("src/scene.js"), /\.\.\/vendor\/three\.module\.js/);
  assert.doesNotMatch(
    runtime,
    /cssfx-cinematic-bundle-9886|serve-local-bundle|\/library\//,
  );
});

test("intro duration and state-management paths remain deterministic", () => {
  const runtime = readIntro("src/cinematic-intro.js");
  const match = runtime.match(/INTRO_DURATION_MS\s*=\s*(\d+)/);
  assert.ok(match, "INTRO_DURATION_MS is required");
  assert.equal(Number(match[1]), 8000);
  assert.match(runtime, /prefers-reduced-motion/);
  assert.match(runtime, /skipIntro/);
  assert.match(runtime, /replayIntro/);
  assert.match(runtime, /visibilitychange/);
  assert.match(runtime, /pagehide/);
  assert.match(runtime, /dispose/);
});

test("intro scene and styles retain the verified visual safety contracts", () => {
  const scene = readIntro("src/scene.js");
  const css = readIntro("src/styles.css");
  assert.match(scene, /createScene/);
  assert.match(scene, /CRT/);
  assert.match(scene, /Venetian blinds/);
  assert.match(scene, /setProgress/);
  assert.match(scene, /setActive/);
  assert.match(scene, /resize/);
  assert.match(scene, /\.dispose\(\)/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /\.fallback/);
  assert.match(css, /\.film-grain/);
  assert.match(css, /\.scanlines/);
  assert.match(css, /100svh/);
});

test("intro menu links enter the real CSS.FX catalog levels", () => {
  const html = readIntro("index.html");
  for (const [label, target] of [
    ["ATOMS", "../demo/index.html#L0"],
    ["INTERACTIONS", "../demo/index.html#L1"],
    ["SCENES", "../demo/index.html#L3"],
  ]) {
    assert.ok(
      html.includes('href="' + target + '"'),
      label + " must route to " + target,
    );
  }
  assert.ok(!html.includes('href="./library/'));
});

test("intro keeps Three.js licensing and does not alter the existing demo path", () => {
  assert.match(readIntro("vendor/THREE-LICENSE.txt"), /MIT License/);
  assert.ok(fs.existsSync(path.join(root, "demo/index.html")));
  assert.ok(fs.existsSync(path.join(root, "demo/app.js")));
});
~~~

- [ ] **Step 2: Run the new contract to verify RED**

Run:

~~~
node --test tests/cinematic-intro.test.mjs
~~~

Expected: the command fails because index.html and intro/ are absent. The failure must identify a missing integrated runtime file, not a syntax error in the test itself.

- [ ] **Step 3: Commit the failing contract**

~~~
git add tests/cinematic-intro.test.mjs
git commit -m "test: define integrated cinematic intro contract"
~~~

## Task 2: Port the Runtime and Add the Default Root Entry

**Files:**

- Create: index.html
- Create: intro/index.html
- Create: intro/src/cinematic-intro.js
- Create: intro/src/scene.js
- Create: intro/src/styles.css
- Create: intro/vendor/three.module.js
- Create: intro/vendor/three.core.js
- Create: intro/vendor/THREE-LICENSE.txt
- Modify: intro/index.html
- Modify: tools/start-demo.sh

- [ ] **Step 1: Copy only the runtime files from the isolated experiment**

Run from the repository root:

~~~
mkdir -p intro/src intro/vendor
cp /Users/mac/Documents/完项目/38-css-effects-atoms/experiments/exp-20260728-cssfx-cinematic-intro/src/cinematic-intro.js intro/src/cinematic-intro.js
cp /Users/mac/Documents/完项目/38-css-effects-atoms/experiments/exp-20260728-cssfx-cinematic-intro/src/scene.js intro/src/scene.js
cp /Users/mac/Documents/完项目/38-css-effects-atoms/experiments/exp-20260728-cssfx-cinematic-intro/src/styles.css intro/src/styles.css
cp /Users/mac/Documents/完项目/38-css-effects-atoms/experiments/exp-20260728-cssfx-cinematic-intro/vendor/three.module.js intro/vendor/three.module.js
cp /Users/mac/Documents/完项目/38-css-effects-atoms/experiments/exp-20260728-cssfx-cinematic-intro/vendor/three.core.js intro/vendor/three.core.js
cp /Users/mac/Documents/完项目/38-css-effects-atoms/experiments/exp-20260728-cssfx-cinematic-intro/vendor/THREE-LICENSE.txt intro/vendor/THREE-LICENSE.txt
cp /Users/mac/Documents/完项目/38-css-effects-atoms/experiments/exp-20260728-cssfx-cinematic-intro/index.html intro/index.html
~~~

Do not copy the experiment's scripts/, tests/, evidence/, EXPERIMENT_CONTRACT.yaml, PROJECT_DESIGN.md or RESULTS.md.

- [ ] **Step 2: Change the three intro routes to the main repository demo**

In intro/index.html, replace the three href values with exactly:

~~~
href="../demo/index.html#L0"
href="../demo/index.html#L1"
href="../demo/index.html#L3"
~~~

Update the page description and title to remove the word 隔离实验 / Experiment; keep all existing controls, canvas markup, and local module paths unchanged.

- [ ] **Step 3: Add the root fallback redirect page**

Create index.html with this exact accessible fallback:

~~~
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0; url=./demo/index.html" />
    <title>CSS.FX — 网页互动素材库</title>
  </head>
  <body>
    <main>
      <p>正在进入 CSS.FX 素材库……</p>
      <p><a href="./demo/index.html">进入 CSS.FX 素材库</a></p>
    </main>
    <script>
      window.location.replace("./demo/index.html");
    </script>
  </body>
</html>
~~~

- [ ] **Step 4: Run the integration contract to verify GREEN**

Run:

~~~
node --test tests/cinematic-intro.test.mjs
~~~

Expected: 8/8 integrated intro tests pass, including the existing 9876 service sync contract.

- [ ] **Step 5: Commit the runtime port**

~~~
git add index.html intro tools/start-demo.sh tests/cinematic-intro.test.mjs
git commit -m "feat: add optional cinematic intro experience"
~~~

## Task 3: Update User Documentation and Third-Party Notices

**Files:**

- Modify: README.md
- Modify: THIRD_PARTY_NOTICES.md
- Create: intro/README.md

- [ ] **Step 1: Document the two public local paths**

Update the README run section to show:

~~~
http://127.0.0.1:9876/              # default redirect to the library
http://127.0.0.1:9876/demo/index.html
http://127.0.0.1:9876/intro/
~~~

Add a short “电影感开场” section that explains the intro is optional, uses local Three.js, supports skip/replay/reduced-motion/fallback, and links to ./intro/.

- [ ] **Step 2: Add the integrated intro README**

Create intro/README.md with the runtime purpose, local URL, navigation mapping, controls, and a note that the CSS.FX demo remains at ../demo/index.html. Do not mention the temporary 9886 bundle or the isolated experiment service.

- [ ] **Step 3: Add Three.js attribution**

Append a Three.js section to THIRD_PARTY_NOTICES.md identifying the vendored version as 0.182.0, the local files under intro/vendor/, and the MIT license preserved in intro/vendor/THREE-LICENSE.txt.

- [ ] **Step 4: Run documentation and source checks**

Run:

~~~
git diff --check
node --check intro/src/cinematic-intro.js
node --check intro/src/scene.js
~~~

Expected: all commands exit 0 with no whitespace or syntax errors.

- [ ] **Step 5: Commit documentation and attribution**

~~~
git add README.md THIRD_PARTY_NOTICES.md intro/README.md
git commit -m "docs: document cinematic intro entry and attribution"
~~~

## Task 4: Run Full Automated Regression and Static UI Gates

**Files:**

- Test: tests/*.test.mjs
- Inspect: index.html, intro/, demo/

- [ ] **Step 1: Run the full Node test suite**

~~~
node --test tests/*.test.mjs
~~~

Expected: existing 41 CSS.FX tests plus 8 integration tests, 49 passed, 0 failed.

- [ ] **Step 2: Run the UI source scanner**

~~~
node /Users/mac/.codex/skills/audit-ui-quality/scripts/scan-ui.mjs . --strict --json
~~~

Expected: status: "pass", errors: 0, and no warnings introduced by the integration. The pre-existing repository baseline has 6 warnings in demo/; the new root entry must not add another warning. If the scanner reports a new issue caused by the root redirect page, fix the source before continuing; do not weaken the scanner invocation.

- [ ] **Step 3: Verify the main demo source is unchanged**

~~~
git diff -- demo atoms registry
git diff 43139c8..HEAD -- tools/start-demo.sh
~~~

Expected: the first command has no output; the second shows only the approved sync of root index.html and intro/ into the existing 9876 runtime directory. No existing CSS.FX runtime or data file may change.

- [ ] **Step 4: Commit the verified test state**

~~~
git add tests/cinematic-intro.test.mjs
git commit -m "test: cover cssfx intro integration and root routing"
~~~

## Task 5: Verify Local Server and Browser Paths

**Files:**

- Runtime only: local port 9876
- Evidence: docs/superpowers/runs/20260811-cssfx-intro-integration.md

- [ ] **Step 1: Start the existing demo server**

~~~
./tools/start-demo.sh 9876
~~~

Expected: the existing CSS.FX demo is available at http://127.0.0.1:9876/demo/index.html.

- [ ] **Step 2: Verify HTTP resources**

~~~
curl -fsS -o /dev/null -w 'root %{http_code}\n' http://127.0.0.1:9876/
curl -fsS -o /dev/null -w 'demo %{http_code}\n' http://127.0.0.1:9876/demo/index.html
curl -fsS -o /dev/null -w 'intro %{http_code}\n' http://127.0.0.1:9876/intro/
curl -fsS -o /dev/null -w 'intro_app %{http_code}\n' http://127.0.0.1:9876/intro/src/cinematic-intro.js
curl -fsS -o /dev/null -w 'three %{http_code}\n' http://127.0.0.1:9876/intro/vendor/three.module.js
~~~

Expected: all five statuses are HTTP 200.

- [ ] **Step 3: Perform browser acceptance**

Check in one browser session:

1. Open / and confirm it reaches the existing CSS.FX library.
2. Open /intro/ and confirm the 8-second scene reaches the interface.
3. Confirm Skip and Replay work.
4. Confirm ?motion=reduce starts in a usable static state.
5. Click ATOMS, INTERACTIONS and SCENES; record the final URLs as /demo/index.html#L0, /demo/index.html#L1 and /demo/index.html#L3.
6. Repeat at 390×844 and record horizontal overflow and console status.

If the in-app browser blocks local URL automation, preserve e2e_acceptance: pending and report the exact limitation; do not use a second browser automation mechanism to bypass it.

- [ ] **Step 4: Write the run record**

Create docs/superpowers/runs/20260811-cssfx-intro-integration.md with the observed test totals, HTTP statuses, browser results, changed paths, rollback steps, and these independent fields:

~~~
implementation_status: passed
local_verification: passed
e2e_acceptance: set to the observed value passed, pending, or failed
publish_status: not_authorized
rollback_status: ready
~~~

- [ ] **Step 5: Commit the local verification record**

~~~
git add docs/superpowers/runs/20260811-cssfx-intro-integration.md
git commit -m "docs: record cinematic intro integration verification"
~~~

## Task 6: Final Handoff Without Remote Publication

- [ ] **Step 1: Review the complete local diff**

~~~
git status --short --branch
git log --oneline --decorate -6
git diff eb90504..HEAD --stat
git diff --check eb90504..HEAD
~~~

Expected: only the approved root entry, intro/, service-sync change, tests, README, third-party notice, plan/spec and run record are present; no remote action has occurred.

- [ ] **Step 2: Report the state by dimension**

Report implementation, local verification, browser end-to-end acceptance, publication authorization, and rollback separately. Do not call the whole GitHub release complete while publish_status is not_authorized or browser evidence is pending.

- [ ] **Step 3: Stop before push or Pages deployment**

Do not run git push, GitHub APIs, Pages configuration, release creation or external messages in this plan. Those actions require a new explicit user authorization after local review.

## Rollback Procedure

The isolated experiment remains untouched. To roll back the local integration, remove the added root index.html, intro/, tests/cinematic-intro.test.mjs, integrated documentation and run record, then verify demo/, atoms/, registry/ and existing tests against the baseline commit eb90504. Do not use git reset --hard; restore only the listed feature paths.
