import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { classifyPrompt } from "./classify-motionsites-prompts.mjs";

const REPOSITORY =
  "https://github.com/nomaan5541/motionsites-prompt-collection";

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    values[argv[index]?.replace(/^--/, "")] = argv[index + 1];
  }
  return values;
}

function countBy(items, key) {
  return Object.fromEntries(
    [...new Set(items.map((item) => item[key]))]
      .sort()
      .map((value) => [value, items.filter((item) => item[key] === value).length]),
  );
}

function promptFile(directory) {
  return fs
    .readdirSync(directory)
    .find((fileName) => path.extname(fileName).toLowerCase() === ".md");
}

function normalizedContent(content) {
  return content.replaceAll("\r\n", "\n").trim();
}

function contentHash(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function summaryFrom(content, fallback) {
  const paragraph = content
    .replace(/```[\s\S]*?```/g, " ")
    .split(/\n\s*\n/)
    .map((value) =>
      value
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/^[-*>]\s*/gm, "")
        .replace(/[`*_]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .find((value) => value.length > 24);
  return (paragraph || fallback).slice(0, 220);
}

function sourceAlias(record, directoryName, sourcePath) {
  return {
    id: record.id || directoryName,
    title: record.title || directoryName,
    sourcePath,
  };
}

function buildRecord(sourceRoot, directoryName) {
  const directory = path.join(sourceRoot, directoryName);
  const metadata = JSON.parse(
    fs.readFileSync(path.join(directory, "metadata.json"), "utf8"),
  );
  const markdownFile = promptFile(directory);
  if (!markdownFile) throw new Error(`Missing Markdown prompt: ${directoryName}`);

  const content = normalizedContent(
    fs.readFileSync(path.join(directory, markdownFile), "utf8"),
  );
  const record = metadata.record || {};
  const sourcePath = `motionsites-prompts/${directoryName}/${markdownFile}`;
  const virtualFileName = `${record.title || record.id || directoryName}.md`;
  const classification = classifyPrompt({
    fileName: virtualFileName,
    content,
    sourcePath,
  });

  return {
    id: `motion-${directoryName}`,
    fileName: markdownFile,
    title: record.title || classification.title || directoryName,
    summary: summaryFrom(content, record.title || directoryName),
    industry: classification.industry,
    pageType:
      record.page_type === "landing"
        ? classification.pageType
        : record.page_type || classification.pageType,
    style: classification.style,
    engines: classification.engines,
    signals: classification.signals,
    collection: record.category || "MotionSites",
    sourceType: record.type || record.page_type || "prompt",
    sourceOrder: Number.isFinite(record.sort_order)
      ? record.sort_order
      : Number.MAX_SAFE_INTEGER,
    sourcePath,
    sourceUrl: `${REPOSITORY}/blob/main/${sourcePath}`,
    status: content.length > 120 ? "available" : "unavailable",
    content,
    contentHash: contentHash(content),
    aliases: [],
  };
}

export function buildPromptLibrary(sourceRoot, options = {}) {
  const sourceDirectories = fs
    .readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const records = sourceDirectories
    .map((directoryName) => buildRecord(sourceRoot, directoryName))
    .sort(
      (a, b) =>
        a.sourceOrder - b.sourceOrder ||
        a.title.localeCompare(b.title, "en", { sensitivity: "base" }),
    );

  const unique = new Map();
  for (const record of records) {
    const existing = unique.get(record.contentHash);
    if (!existing) {
      unique.set(record.contentHash, record);
      continue;
    }
    existing.aliases.push(
      sourceAlias(
        { id: record.id.replace(/^motion-/, ""), title: record.title },
        record.id,
        record.sourcePath,
      ),
    );
  }

  const items = [...unique.values()].map((item) => {
    const { sourceOrder, ...publicItem } = item;
    return publicItem;
  });
  const usableCount = items.filter((item) => item.status === "available").length;

  return {
    schemaVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    source: {
      repository: REPOSITORY,
      commit: options.commit || "unknown",
      commitDate: options.commitDate || null,
      license: "MIT",
      path: "motionsites-prompts",
    },
    sourceCount: records.length,
    uniqueCount: items.length,
    usableCount,
    unavailableCount: items.length - usableCount,
    duplicateCount: records.length - items.length,
    stats: {
      byCollection: countBy(items, "collection"),
      byIndustry: countBy(items, "industry"),
      byPageType: countBy(items, "pageType"),
      byStyle: countBy(items, "style"),
      byStatus: countBy(items, "status"),
    },
    items,
  };
}

function scriptSafeJson(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function writeLibrary(library, outputPath, browserOutputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(library, null, 2)}\n`);
  fs.mkdirSync(path.dirname(browserOutputPath), { recursive: true });
  fs.writeFileSync(
    browserOutputPath,
    `window.FX_PROMPTS = ${scriptSafeJson(library)};\n`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.source || !args.output || !args["browser-output"]) {
    throw new Error(
      "Usage: node tools/build-prompt-library.mjs --source <motionsites-prompts> --output <json> --browser-output <js> [--commit <sha>] [--commit-date <iso>]",
    );
  }

  const library = buildPromptLibrary(path.resolve(args.source), {
    commit: args.commit,
    commitDate: args["commit-date"],
  });
  writeLibrary(
    library,
    path.resolve(args.output),
    path.resolve(args["browser-output"]),
  );
  process.stdout.write(
    `Built ${library.uniqueCount} unique prompts from ${library.sourceCount} source records (${library.usableCount} usable)\n`,
  );
}
