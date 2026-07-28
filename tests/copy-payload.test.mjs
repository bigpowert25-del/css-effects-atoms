import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  embedRunnerMode,
  embedRuntimeSelection,
} from "../demo/copy-payload.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = fs.readFileSync(
  path.join(root, "demo", "previews", "interaction-runner.html"),
  "utf8",
);

test("copied interaction runner pins the selected effect mode", () => {
  const output = embedRunnerMode(
    runner,
    "demo/previews/interaction-runner.html?mode=shader-poster",
  );

  assert.match(output, /const mode = "shader-poster";/);
  assert.doesNotMatch(output, /URLSearchParams\(location\.search\)/);
});

test("standalone scenes without a mode query are not rewritten", () => {
  assert.equal(
    embedRunnerMode(runner, "demo/scenes/rolling-tape.html"),
    runner,
  );
});

test("copied preset runner pins the selected preset", () => {
  const presetRunner = `
    <script type="module">
      const preset = new URLSearchParams(location.search).get("preset") || "tilt-card";
    </script>`;
  const output = embedRuntimeSelection(
    presetRunner,
    "demo/previews/variant-runner.html?preset=proximity-grid",
  );

  assert.match(output, /const preset = "proximity-grid";/);
  assert.doesNotMatch(output, /URLSearchParams\(location\.search\)/);
});

test("current polished runner can be embedded after cover-mode parsing was added", () => {
  const presetRunner = fs.readFileSync(
    path.join(root, "demo", "previews", "variant-runner.html"),
    "utf8",
  );
  const output = embedRuntimeSelection(
    presetRunner,
    "demo/previews/variant-runner.html?preset=magnetic-field&cover=1",
  );

  assert.match(output, /const preset = "magnetic-field";/);
  assert.doesNotMatch(output, /const preset = params\.get\("preset"\)/);
});
