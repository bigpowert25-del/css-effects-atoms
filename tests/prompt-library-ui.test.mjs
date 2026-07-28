import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

test("full prompt library contains every classified prompt and its source text", () => {
  const library = JSON.parse(read("registry/motionsites-prompt-library.json"));

  assert.equal(library.sourceCount, 661);
  assert.equal(library.uniqueCount, 659);
  assert.equal(library.usableCount, 656);
  assert.equal(library.unavailableCount, 3);
  assert.equal(library.duplicateCount, 2);
  assert.equal(library.items.length, 659);
  assert.equal(new Set(library.items.map((item) => item.id)).size, 659);
  assert.equal(library.source.commit.length, 40);
  assert.equal(library.source.license, "MIT");
  for (const item of library.items) {
    if (item.status === "available") {
      assert.ok(item.content.length > 80, `${item.fileName} should contain prompt text`);
    } else {
      assert.equal(item.status, "unavailable");
      assert.ok(item.content.length <= 120);
    }
    assert.ok(item.industry);
    assert.ok(item.pageType);
    assert.ok(item.style);
    assert.ok(item.sourcePath);
    assert.match(item.sourcePath, /^motionsites-prompts\//);
  }
});

test("demo exposes a dedicated prompt library with filters and progressive rendering", () => {
  const html = read("demo/index.html");
  const app = read("demo/app.js");

  assert.match(html, /generated-prompts\.js/);
  assert.match(html, /id="promptLibrary"/);
  assert.match(html, /id="promptIndustry"/);
  assert.match(html, /id="promptPageType"/);
  assert.match(html, /id="promptStyle"/);
  assert.match(html, /id="promptGrid"/);
  assert.match(html, /id="promptLoadMore"/);
  assert.match(html, />661<|661 条/);

  assert.match(app, /PROMPTS/);
  assert.match(app, /window\.FX_PROMPTS/);
  assert.match(app, /renderPromptLibrary/);
  assert.match(app, /promptIndustry/);
  assert.match(app, /promptPageType/);
  assert.match(app, /promptStyle/);
  assert.match(app, /复制 PROMPT/);
  assert.match(app, /promptLimit/);
  assert.match(app, /#PROMPTS|PROMPTS/);
});

test("single HTML embeds the complete prompt library", () => {
  const html = read("demo/downloads/css-fx-library-single.html");

  assert.match(html, /window\.FX_PROMPTS/);
  assert.doesNotMatch(html, /src="\.\/generated-prompts\.js/);
  assert.match(html, /"sourceCount":661/);
  assert.ok(html.length > 10_000_000);
});
