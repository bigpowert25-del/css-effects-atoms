import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sceneDir = path.join(root, "demo", "scenes");
const sceneFiles = [
  "rolling-tape.html",
  "tengwang-curtain.html",
  "three-particle-network.html",
];

function readScene(fileName) {
  const filePath = path.join(sceneDir, fileName);
  assert.equal(fs.existsSync(filePath), true, `${fileName} must exist`);
  return fs.readFileSync(filePath, "utf8");
}

test("all registered scene files contain a named canvas experience", () => {
  for (const fileName of sceneFiles) {
    const html = readScene(fileName);
    assert.match(html, /<title>[^<]+<\/title>/i);
    assert.match(html, /<canvas/i);
    assert.match(html, /devicePixelRatio/i);
    assert.match(html, /Math\.min\([^)]*2/i);
  }
});

test("rolling tape keeps its isolated legacy runtime", () => {
  const html = readScene("rolling-tape.html");
  assert.match(html, /three\.js\/r128/);
  assert.match(html, /gsap\/3\.12\.5/);
  assert.match(html, /fx:dispose/);
});

test("Tengwang curtain keeps Canvas physics and supports disposal", () => {
  const html = readScene("tengwang-curtain.html");
  assert.match(html, /defaultGlyphs/);
  assert.match(html, /function constrain/);
  assert.match(html, /fx:dispose/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /sound\.context\.close/);
  assert.match(html, /Math\.max\(\s*2,\s*Math\.floor/);
  assert.match(html, /if \(!anchor\) continue/);
});

test("new particle network uses current Three and a visible fallback", () => {
  const html = readScene("three-particle-network.html");
  assert.match(html, /three@0\.185\.0/);
  assert.match(html, /WebGLRenderer/);
  assert.match(html, /Raycaster/);
  assert.match(html, /class="fallback"/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /fx:dispose/);
  assert.match(html, /\.dispose\(\)/);
});
