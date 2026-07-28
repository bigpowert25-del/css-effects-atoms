import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("all catalog L1 and L2 presets are registered in the polished runner", () => {
  const runnerPath = path.join(root, "demo", "previews", "variant-runner.html");
  assert.equal(fs.existsSync(runnerPath), true, "variant runner must exist");
  const runner = fs.readFileSync(runnerPath, "utf8");
  const catalog = JSON.parse(
    fs.readFileSync(path.join(root, "registry", "layered-library.json"), "utf8"),
  );
  const variants = catalog.items.filter(
    (item) =>
      (item.level === "L1" || item.level === "L2") &&
      item.preview?.runner?.includes("variant-runner.html"),
  );

  assert.equal(variants.length, 46);
  for (const item of variants) {
    assert.match(item.preview.runner, new RegExp(`preset=${item.id}$`));
    assert.match(runner, new RegExp(`["']${item.id}["']`));
  }
  assert.match(runner, /prefers-reduced-motion/);
  assert.match(runner, /pointermove/);
  assert.match(runner, /fx:dispose/);
  assert.match(runner, /setupScramble/);
  assert.match(runner, /AudioContext/);
  assert.match(runner, /setupComparison/);
  assert.match(runner, /setupTabs/);
  assert.match(runner, /setupThreeVariant/);
  assert.match(runner, /charge/);
  assert.match(runner, /fx:activate/);
  assert.match(runner, /fx:deactivate/);
  assert.match(runner, /cover=1|params\.get\("cover"\)/);
});
