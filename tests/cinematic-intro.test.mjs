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

test("README separates local preview addresses from repository links", () => {
  const readme = readRoot("README.md");
  assert.match(readme, /本地预览（仅在本机启动服务后有效）/);
  assert.doesNotMatch(readme, /<https?:\/\/127\.0\.0\.1:[^>]+>/);
  for (const sourcePath of ["index.html", "demo/index.html", "intro/index.html"]) {
    assert.match(readme, new RegExp(`\\.\\/${sourcePath.replace("/", "\\/")}`));
  }
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

test("the local demo service syncs the integrated root and intro", () => {
  const script = readRoot("tools/start-demo.sh");
  assert.ok(script.includes('"$ROOT_DIR/index.html"'));
  assert.ok(
    script.includes('rsync -a --delete "$ROOT_DIR/intro/" "$RUNTIME_ROOT/intro/"'),
  );
});
