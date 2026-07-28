import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  expansionItems,
  legacyRecipeVisuals,
} from "../registry/expansion-definitions.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function atomToLayeredItem(atom) {
  return {
    id: atom.id,
    name: atom.name,
    level: "L0",
    engine: "css-dom",
    family: atom.family,
    summary: atom.description,
    tags: atom.tags || [],
    source: {
      kind: "atom",
      label: atom.source,
    },
    preview: {
      mode: "inline",
      html: atom.snippet.html,
      css: atom.snippet.preview_css,
    },
    copy: {
      snippet: atom.snippet.copy_code,
    },
    dependencies: [],
    inputs: atom.snippet.behavior ? ["pointer"] : [],
    performance: {
      cost: "low",
      fallback: "static style",
    },
    accessibility: {
      reducedMotion: "pause CSS animation",
      keyboard: false,
    },
    maturity: "stable",
    quality: atom.quality,
    qualityScore: atom.quality_score,
  };
}

const signaturePreviewTargets = {
  "physics-curtain": "scenes/tengwang-curtain.html",
  "particle-network-panel": "scenes/three-particle-network.html",
};

function normalizeInteractivePreview(item) {
  if (item.level !== "L1" && item.level !== "L2") return item;
  const target =
    signaturePreviewTargets[item.id] ||
    `previews/variant-runner.html?preset=${item.id}`;
  return {
    ...item,
    preview: {
      ...item.preview,
      mode: "runner",
      runner: target,
    },
    copy: {
      ...item.copy,
      standalone: `demo/${target}`,
    },
  };
}

export function buildCatalog({ atoms, source, trends = null }) {
  const atomItems = atoms.atoms.map(atomToLayeredItem);
  const sourceItems = source.items.map((item) => {
    const visual = legacyRecipeVisuals[item.id];
    const normalized = normalizeInteractivePreview(item);
    if (!visual) return normalized;
    return {
      ...normalized,
      recipe: {
        ...normalized.recipe,
        visual,
      },
    };
  });
  const items = [...atomItems, ...sourceItems, ...expansionItems];
  const ids = new Set();

  for (const item of items) {
    if (ids.has(item.id)) throw new Error(`Duplicate item id: ${item.id}`);
    ids.add(item.id);
  }

  const countsByLevel = Object.fromEntries(
    ["L0", "L1", "L2", "L3", "L4"].map((level) => [
      level,
      items.filter((item) => item.level === level).length,
    ]),
  );
  const countsByEngine = Object.fromEntries(
    ["css-dom", "canvas-2d", "media", "three-webgl"].map((engine) => [
      engine,
      items.filter((item) => item.engine === engine).length,
    ]),
  );

  return {
    schemaVersion: source.schemaVersion,
    generatedAt: new Date().toISOString(),
    stats: {
      total: items.length,
      countsByLevel,
      countsByEngine,
    },
    trends,
    items,
  };
}

export function writeCatalog(catalog) {
  const json = `${JSON.stringify(catalog, null, 2)}\n`;
  fs.writeFileSync(path.join(root, "registry/layered-library.json"), json);

  const browserJson = JSON.stringify(catalog)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
  fs.writeFileSync(
    path.join(root, "demo/generated-data.js"),
    `window.FX_LIBRARY = ${browserJson};\n`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const catalog = buildCatalog({
    atoms: readJson("registry/curated-atoms.json"),
    source: readJson("registry/layered-library.source.json"),
    trends: readJson("registry/github-trend-scan.json"),
  });
  writeCatalog(catalog);
  process.stdout.write(
    `Built ${catalog.stats.total} items: ${JSON.stringify(catalog.stats.countsByLevel)}\n`,
  );
}
