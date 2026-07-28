import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "registry", "layered-library.source.json");
const builtPath = path.join(root, "registry", "layered-library.json");
const trendPath = path.join(root, "registry", "github-trend-scan.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readBuiltCatalog() {
  assert.equal(fs.existsSync(builtPath), true, "build the layered catalog first");
  return readJson(builtPath);
}

test("layered source registry exists", () => {
  assert.equal(
    fs.existsSync(sourcePath),
    true,
    "registry/layered-library.source.json must exist",
  );
});

test("built catalog covers every level and engine", () => {
  const catalog = readBuiltCatalog();
  const levels = new Set(catalog.items.map((item) => item.level));
  const engines = new Set(catalog.items.map((item) => item.engine));

  assert.deepEqual([...levels].sort(), ["L0", "L1", "L2", "L3", "L4"]);
  assert.deepEqual([...engines].sort(), [
    "canvas-2d",
    "css-dom",
    "media",
    "three-webgl",
  ]);
});

test("first checkpoint has enough real material at every layer", () => {
  const catalog = readBuiltCatalog();
  const counts = Object.fromEntries(
    ["L0", "L1", "L2", "L3", "L4"].map((level) => [
      level,
      catalog.items.filter((item) => item.level === level).length,
    ]),
  );

  assert.ok(counts.L0 >= 170, `expected >=170 L0 items, got ${counts.L0}`);
  assert.ok(counts.L1 >= 24, `expected >=24 L1 items, got ${counts.L1}`);
  assert.ok(counts.L2 >= 24, `expected >=24 L2 items, got ${counts.L2}`);
  assert.ok(counts.L3 >= 20, `expected >=20 L3 items, got ${counts.L3}`);
  assert.ok(counts.L4 >= 24, `expected >=24 L4 items, got ${counts.L4}`);
});

test("heavy scenes are launch-only and declare cleanup and fallback", () => {
  const catalog = readBuiltCatalog();
  const scenes = catalog.items.filter((item) => item.level === "L3");
  assert.ok(scenes.length >= 20);

  for (const scene of scenes) {
    assert.equal(scene.preview.mode, "launch");
    assert.ok(scene.preview.scene, `${scene.id} needs a scene file`);
    assert.ok(
      scene.preview.poster || scene.preview.posterVisual,
      `${scene.id} needs a poster or generated poster visual`,
    );
    if (scene.preview.poster) {
      assert.equal(
        fs.existsSync(path.join(root, "demo", scene.preview.poster)),
        true,
        `${scene.id} poster must exist`,
      );
    }
    assert.ok(scene.performance?.fallback, `${scene.id} needs a fallback`);
    assert.ok(scene.performance?.cleanup, `${scene.id} needs cleanup notes`);
  }
});

test("L4 recipes expose genuinely varied visual compositions", () => {
  const catalog = readBuiltCatalog();
  const recipes = catalog.items.filter((item) => item.level === "L4");
  const layouts = new Set();
  const signatures = new Set();

  assert.ok(recipes.length >= 24);
  for (const recipe of recipes) {
    const visual = recipe.recipe?.visual;
    assert.ok(visual, `${recipe.id} needs recipe.visual`);
    assert.ok(visual.layout, `${recipe.id} needs a layout`);
    assert.ok(Array.isArray(visual.palette) && visual.palette.length >= 4);
    assert.ok(visual.focal, `${recipe.id} needs a focal treatment`);
    layouts.add(visual.layout);
    signatures.add(`${visual.layout}:${visual.palette.join(",")}:${visual.focal}`);
  }

  assert.ok(layouts.size >= 8, `expected >=8 layouts, got ${layouts.size}`);
  assert.ok(
    signatures.size >= 20,
    `expected >=20 distinct recipe visuals, got ${signatures.size}`,
  );
});

test("copy payload matches the composition level", () => {
  const catalog = readBuiltCatalog();
  for (const item of catalog.items) {
    if (item.level === "L0") assert.ok(item.copy?.snippet);
    if (item.level === "L1" || item.level === "L2") {
      assert.ok(item.copy?.standalone || item.copy?.module);
    }
    if (item.level === "L3") assert.ok(item.copy?.standalone);
    if (item.level === "L4") {
      if (item.maturity === "finished-page") assert.ok(item.copy?.standalone);
      else assert.ok(item.copy?.prompt);
    }
  }
});

test("GitHub trend scan is structured, licensed and bundled into the catalog", () => {
  assert.equal(fs.existsSync(trendPath), true, "GitHub trend scan must exist");
  const trends = readJson(trendPath);
  const catalog = readBuiltCatalog();

  assert.ok(trends.projects.length >= 12);
  assert.ok(trends.directions.length >= 5);
  for (const project of trends.projects) {
    assert.match(project.url, /^https:\/\/github\.com\//);
    assert.ok(Number.isInteger(project.stars) && project.stars > 0);
    assert.ok(project.license);
    assert.ok(["low", "medium", "high"].includes(project.reuseRisk));
    assert.ok(project.levelFit.length > 0);
  }
  assert.equal(catalog.trends.checkedAt, trends.checkedAt);
  assert.equal(catalog.trends.projects.length, trends.projects.length);
});

test("every preview and standalone file reference resolves locally", () => {
  const catalog = readBuiltCatalog();
  for (const item of catalog.items) {
    for (const reference of [
      item.preview?.runner,
      item.preview?.scene,
      item.preview?.poster,
    ].filter(Boolean)) {
      const filePath = path.join(root, "demo", reference.split("?")[0]);
      assert.equal(fs.existsSync(filePath), true, `${item.id}: ${reference}`);
    }

    if (item.copy?.standalone) {
      const reference = item.copy.standalone
        .replace(/^demo\//, "")
        .split("?")[0];
      assert.equal(
        fs.existsSync(path.join(root, "demo", reference)),
        true,
        `${item.id}: ${item.copy.standalone}`,
      );
    }
  }
});
