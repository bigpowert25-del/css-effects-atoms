import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readRequired(relativePath) {
  const filePath = path.join(root, relativePath);
  assert.equal(fs.existsSync(filePath), true, `${relativePath} must exist`);
  return fs.readFileSync(filePath, "utf8");
}

test("demo shell exposes layered navigation and engine filters", () => {
  const html = readRequired("demo/index.html");
  assert.match(html, /id="levelNav"/);
  assert.match(html, /id="engineFilters"/);
  assert.match(html, /id="searchInput"/);
  assert.match(html, /id="searchInput"[\s\S]*?aria-label=/);
  assert.match(html, /id="trendRadar"/);
  assert.match(html, /id="singleFileDownload"/);
  assert.match(html, /generated-data\.js/);
  assert.match(html, /app\.js/);
  assert.match(html, /app\.css/);
});

test("app renders all five levels and level-aware actions", () => {
  const js = readRequired("demo/app.js");
  for (const level of ["L0", "L1", "L2", "L3", "L4"]) {
    assert.match(js, new RegExp(level));
  }
  assert.match(js, /data-activate/);
  assert.match(js, /copyPayload/);
  assert.match(js, /embedRuntimeSelection/);
  assert.match(js, /activePreviewFrames\s*=\s*new Map/);
  assert.match(js, /deactivatePreview/);
  assert.match(js, /deactivateHeavyScenesExcept/);
  assert.match(js, /recipeVisualPreview/);
  assert.match(js, /FX_EMBEDDED_PREVIEWS/);
});

test("live previews are lazy and not eagerly sourced in static HTML", () => {
  const js = readRequired("demo/app.js");
  assert.match(js, /class="ambient-frame"/);
  assert.match(js, /data-preview-target/);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /addEventListener\(["']click["']/);
  assert.doesNotMatch(
    readRequired("demo/index.html"),
    /<iframe[^>]+src=/,
    "index must not eagerly load a heavy scene",
  );
});
