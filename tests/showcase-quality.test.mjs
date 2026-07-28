import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("L1-L3 cards use lazy same-source frames instead of replacement posters", () => {
  const app = read("demo/app.js");
  const css = read("demo/app.css");

  assert.match(app, /function liveCardPreview/);
  assert.match(app, /class="ambient-frame"/);
  assert.match(app, /IntersectionObserver/);
  assert.match(app, /function activatePreview/);
  assert.match(app, /data-activate/);
  assert.doesNotMatch(app, /function runPreview/);
  assert.match(css, /\.ambient-frame/);
  assert.match(css, /\.item-card\.is-running[\s\S]*?pointer-events:\s*auto/);
});

test("all L1 and L2 entries use the polished runner or approved signature scenes", () => {
  const catalog = JSON.parse(read("registry/layered-library.json"));
  const items = catalog.items.filter(
    (item) => item.level === "L1" || item.level === "L2",
  );
  const approved = new Set([
    "previews/variant-runner.html",
    "scenes/tengwang-curtain.html",
    "scenes/three-particle-network.html",
  ]);

  assert.equal(items.length, 48);
  for (const item of items) {
    const target = (item.preview.runner || item.preview.scene || "").split("?")[0];
    assert.ok(approved.has(target), `${item.id} still uses ${target}`);
  }
});

test("L4 previews are focusable miniature long pages with internal scrolling", () => {
  const app = read("demo/app.js");
  const css = read("demo/app.css");

  assert.match(app, /class="recipe-scroll/);
  assert.match(app, /tabindex="0"/);
  for (const section of [
    "mini-nav",
    "mini-hero",
    "mini-proof",
    "mini-feature",
    "mini-media",
    "mini-detail",
    "mini-cta",
    "mini-footer",
  ]) {
    assert.match(app, new RegExp(section));
  }
  assert.match(css, /\.recipe-scroll[\s\S]*?overflow-y:\s*auto/);
  assert.match(css, /overscroll-behavior:\s*contain/);
  assert.match(css, /scrollbar-width/);
});

test("shared L3 runner keeps an editorial scene identity in cover and active modes", () => {
  const scene = read("demo/scenes/scene-runner.html");

  assert.match(scene, /params\.get\("cover"\)/);
  assert.match(scene, /fx:activate/);
  assert.match(scene, /fx:deactivate/);
  assert.match(scene, /class="scene-index"/);
  assert.match(scene, /class="scene-spec"/);
  assert.match(scene, /SCENE_NOTES/);
});
