import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runnerPath = path.join(root, "demo", "previews", "interaction-runner.html");

function readRunner() {
  assert.equal(fs.existsSync(runnerPath), true, "interaction runner must exist");
  return fs.readFileSync(runnerPath, "utf8");
}

test("runner contains every registered L1 and L2 mechanic", () => {
  const html = readRunner();
  const source = JSON.parse(
    fs.readFileSync(path.join(root, "registry", "layered-library.source.json"), "utf8"),
  );
  const mechanics = source.items.filter((item) => ["L1", "L2"].includes(item.level));

  assert.ok(mechanics.length >= 16);
  for (const mechanic of mechanics) {
    assert.match(html, new RegExp(mechanic.id), `${mechanic.id} is not implemented`);
  }
});

test("runner supports responsive pointer and touch-compatible input", () => {
  const html = readRunner();
  assert.match(html, /pointermove/);
  assert.match(html, /pointerdown/);
  assert.match(html, /setPointerCapture/);
  assert.match(html, /ResizeObserver/);
});

test("runner has reduced-motion and explicit disposal paths", () => {
  const html = readRunner();
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /fx:dispose/);
  assert.match(html, /cancelAnimationFrame/);
  assert.match(html, /dispose\(\)/);
});
