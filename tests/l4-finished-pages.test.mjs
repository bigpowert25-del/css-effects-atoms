import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("L4 contains six finished pages for distinct industries and visual styles", () => {
  const catalog = JSON.parse(read("registry/layered-library.json"));
  const pages = catalog.items.filter(
    (item) => item.level === "L4" && item.maturity === "finished-page",
  );

  assert.equal(pages.length, 6);
  assert.equal(new Set(pages.map((item) => item.industry)).size, 6);
  assert.equal(new Set(pages.map((item) => item.recipe.styleId)).size, 6);
  for (const item of pages) {
    assert.equal(item.preview.mode, "page");
    assert.ok(item.preview.page);
    assert.equal(
      fs.existsSync(path.join(root, "demo", item.preview.page.split("?")[0])),
      true,
      item.preview.page,
    );
  }
});

test("Ink Pavilion is a complete responsive cultural page", () => {
  const html = read("demo/pages/ink-pavilion.html");
  assert.match(html, /<title>Ink Pavilion/);
  assert.match(html, /<canvas/);
  assert.match(html, /pointermove/);
  assert.match(html, /touch-action/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /fx:dispose/);
  for (const section of ["hero", "manifesto", "collection", "archive", "visit"]) {
    assert.match(html, new RegExp(`id="${section}"`));
  }
});

test("catalog UI treats finished pages as first-class scrollable previews", () => {
  const app = read("demo/app.js");
  const css = read("demo/app.css");

  assert.match(app, /item\.preview\.page/);
  assert.match(app, /maturity === "finished-page"/);
  assert.match(app, /浏览整页/);
  assert.match(css, /\.item-card\.finished-page/);
  assert.match(css, /\.finished-page-meta/);
});

test("Aetheris travel page is standalone and keeps a full voyage flow", () => {
  const html = read("demo/pages/aetheris-voyage.html");

  assert.doesNotMatch(html, /react|babel|tailwindcss\.com/i);
  assert.match(html, /<canvas/i);
  assert.match(html, /<h1/i);
  assert.match(html, /data-section="hero"/);
  assert.match(html, /data-section="routes"/);
  assert.match(html, /data-section="cabins"/);
  assert.match(html, /data-section="destinations"/);
  assert.match(html, /data-section="booking"/);
  assert.match(html, /pointermove/);
  assert.match(html, /prefers-reduced-motion/);
  assert.doesNotMatch(html, /class="map-label destination"/);
  assert.match(html, /cancelAnimationFrame\(frame\)/);
  assert.match(html, /active = false/);
  assert.match(html, /active = true/);
});

test("finished-page lifecycle ignores late iframe loads and keeps source metadata honest", () => {
  const app = read("demo/app.js");
  const definitions = read("registry/expansion-definitions.mjs");

  assert.match(
    app,
    /if \(card\.classList\.contains\("is-running"\)\)[\s\S]{0,180}fx:activate/,
  );
  assert.match(definitions, /source: "Aetheris_Voyage\.md"/);
  assert.match(definitions, /source: "Apex_SaaS\.md"/);
  assert.doesNotMatch(definitions, /stack: \["HTML", "CSS", "React", "Media"\]/);
});
