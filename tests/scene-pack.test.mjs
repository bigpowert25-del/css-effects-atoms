import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("expanded L3 presets are registered in the scene runner", () => {
  const runnerPath = path.join(root, "demo", "scenes", "scene-runner.html");
  assert.equal(fs.existsSync(runnerPath), true, "scene runner must exist");
  const runner = fs.readFileSync(runnerPath, "utf8");
  const catalog = JSON.parse(
    fs.readFileSync(path.join(root, "registry", "layered-library.json"), "utf8"),
  );
  const scenes = catalog.items.filter((item) =>
    item.preview?.scene?.includes("scene-runner.html"),
  );

  assert.equal(scenes.length, 17);
  for (const item of scenes) {
    assert.match(item.preview.scene, new RegExp(`preset=${item.id}$`));
    assert.match(runner, new RegExp(`["']${item.id}["']`));
  }
  assert.match(runner, /devicePixelRatio/);
  assert.match(runner, /prefers-reduced-motion/);
  assert.match(runner, /pointermove/);
  assert.match(runner, /fx:dispose/);
});
