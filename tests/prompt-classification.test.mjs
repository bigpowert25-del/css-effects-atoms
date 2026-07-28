import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  classifyPrompt,
  classifyPromptDirectory,
} from "../tools/classify-motionsites-prompts.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const cases = [
  ["AI_Automation.md", "Build an AI automation SaaS landing page with workflow nodes.", "technology"],
  ["Crypto_Wealth.md", "Create a premium responsive website.", "finance"],
  ["Bali.md", "Design an immersive Bali resort and travel booking website.", "travel"],
  ["Car_Shine.md", "Build a premium responsive website.", "automotive"],
  ["Neo_Museum.md", "Create a contemporary museum exhibition and archive website.", "culture"],
  ["beauty-products.md", "Build a luxury skincare ecommerce product showcase.", "retail"],
  ["CodeYoung.md", "Create an EdTech course platform for students and teachers.", "education"],
  ["mystery.md", "A minimal abstract interaction with no commercial context.", "other"],
];

test("classifier assigns representative industries without inventing unknown context", () => {
  for (const [fileName, content, industry] of cases) {
    const result = classifyPrompt({ fileName, content });
    assert.equal(result.industry, industry, fileName);
    assert.ok(result.pageType);
    assert.ok(result.style);
    assert.ok(Array.isArray(result.engines));
    assert.ok(result.engines.length > 0);
    assert.ok(!("content" in result));
  }
});

test("full-page prompts outrank internal section mentions unless the filename is explicit", () => {
  const voyage = classifyPrompt({
    fileName: "Aetheris_Voyage.md",
    content: "# Aetheris Voyage\nBuild a full page website with a hero, pricing section, FAQ and footer.",
  });
  const pricing = classifyPrompt({
    fileName: "Pricing_Calculator.md",
    content: "# Pricing Calculator\nBuild a full page website around an interactive price calculator.",
  });
  const section = classifyPrompt({
    fileName: "Feature_Section.md",
    content: "# Feature Section\nA full page website reference with one services section.",
  });
  const museum = classifyPrompt({
    fileName: "Neo_Museum.md",
    content: "# Neo Museum\nSECTION 1: HERO\nSECTION 2: CHAPTERS\nSECTION 3: VISIT",
  });

  assert.equal(voyage.pageType, "landing-page");
  assert.equal(pricing.pageType, "pricing");
  assert.equal(section.pageType, "section");
  assert.equal(museum.pageType, "landing-page");
});

test("directory classification is deterministic and preserves relative source paths", () => {
  const sourceDir = path.join(root, "tests", "fixtures", "prompt-classification");
  const records = classifyPromptDirectory(sourceDir);

  assert.equal(records.length, 3);
  assert.deepEqual(
    records.map((record) => record.fileName),
    ["AI_Workflow.md", "Bali_Resort.md", "Unknown.md"],
  );
  assert.equal(new Set(records.map((record) => record.id)).size, 3);
  assert.equal(records[0].sourcePath, "AI_Workflow.md");
  assert.equal(records[1].industry, "travel");
  assert.equal(records[2].industry, "other");
});

test("generated MotionSites catalog contains every currently available NAS prompt", () => {
  const catalogPath = path.join(root, "registry", "motionsites-prompt-catalog.json");
  assert.equal(fs.existsSync(catalogPath), true);
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

  assert.equal(catalog.sourceCount, 405);
  assert.equal(catalog.items.length, 405);
  assert.equal(new Set(catalog.items.map((item) => item.id)).size, 405);
  assert.ok(Object.keys(catalog.stats.byIndustry).length >= 8);
  assert.ok(Object.keys(catalog.stats.byPageType).length >= 6);
  assert.ok(Object.keys(catalog.stats.byStyle).length >= 7);
  assert.ok(catalog.items.every((item) => !("content" in item)));
});
