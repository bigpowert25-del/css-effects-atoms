import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("single-file library contains its local runtime and previews", () => {
  const filePath = path.join(
    root,
    "demo",
    "downloads",
    "css-fx-library-single.html",
  );
  assert.equal(fs.existsSync(filePath), true, "build the single HTML artifact");
  const html = fs.readFileSync(filePath, "utf8");

  assert.match(html, /window\.FX_SINGLE_FILE\s*=\s*true/);
  assert.match(html, /window\.FX_EMBEDDED_PREVIEWS/);
  assert.match(html, /window\.FX_LIBRARY/);
  assert.match(html, /variant-runner\.html/);
  assert.match(html, /scene-runner\.html/);
  for (const page of [
    "pages/ai-automation.html",
    "pages/arise.html",
    "pages/aetheris-voyage.html",
    "pages/3d-collectible-hero.html",
    "pages/apex-saas.html",
    "pages/ink-pavilion.html",
  ]) {
    assert.match(html, new RegExp(page.replaceAll(".", "\\.")));
  }
  assert.match(html, /const \$\$ =/);
  assert.equal(
    (html.match(/const \$ =/g) || []).length,
    1,
    "bundling must not collapse $$ into a second $ declaration",
  );
  const moduleScripts = [
    ...html.matchAll(/<script type="module">\s*([\s\S]*?)<\/script>/g),
  ];
  assert.equal(moduleScripts.length, 1);
  assert.doesNotThrow(
    () => new Function(moduleScripts[0][1]),
    "the inlined app module must parse",
  );
  assert.doesNotMatch(html, /(?:src|href)="\.\/(?:app|generated-data|previews|scenes|posters)\//);
  const previewLine = html
    .split("\n")
    .find((line) => line.startsWith("window.FX_EMBEDDED_PREVIEWS = "));
  assert.ok(previewLine, "embedded preview map should be present");
  const embeddedPreviews = JSON.parse(
    previewLine.slice("window.FX_EMBEDDED_PREVIEWS = ".length, -1),
  );
  const finishedPageHtml = Object.entries(embeddedPreviews)
    .filter(([key]) => key.startsWith("pages/"))
    .map(([, value]) => value)
    .join("\n");
  for (const remoteDependency of [
    "cdn.tailwindcss.com",
    "fonts.googleapis.com",
    "db.onlinewebfonts.com",
    "d8j0ntlcm91z4.cloudfront.net",
    "strvid.nyc3.cdn.digitaloceanspaces.com",
    "fifth-gentle-45902158.figma.site",
    "images.unsplash.com",
  ]) {
    assert.doesNotMatch(
      finishedPageHtml,
      new RegExp(remoteDependency.replaceAll(".", "\\.")),
    );
  }
  assert.ok(html.length > 1_000_000, "artifact should include full local scenes");
});
