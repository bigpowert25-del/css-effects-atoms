import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INDUSTRIES = [
  ["finance", /\b(finance|fintech|wealth|crypto|bank|banking|invest|trading|market terminal|invoice|insurance|accounting)\b/i],
  ["travel", /\b(travel|voyage|tourism|destination|bali|resort|hotel|lodge|booking|airline|private jet|hospitality)\b/i],
  ["automotive", /\b(automotive|vehicle|electric car|car|car launch|mobility|motor|transportation)\b/i],
  ["education", /\b(edtech|education|course|student|teacher|school|learning platform|academy)\b/i],
  ["health", /\b(health|medical|clinic|wellness|therapy|fitness|pharma|care platform)\b/i],
  ["food", /\b(restaurant|ramen|dining|food|coffee|cafe|bakery|culinary)\b/i],
  ["real-estate", /\b(real estate|property|housing|architecture studio|construction|interior design)\b/i],
  ["agriculture", /\b(farming|agriculture|acreage|precision farming|agritech)\b/i],
  ["culture", /\b(museum|exhibition|cultural|heritage|art archive|art gallery|pavilion|theatre|theater)\b/i],
  ["retail", /\b(ecommerce|e-commerce|shop|store|retail|beauty|skincare|cosmetic|fashion|nike|sneaker|jewelry|collectible)\b/i],
  ["technology", /\b(ai\b|artificial intelligence|saas|software|automation|cyber|security|developer|cloud|workflow|data platform|robot|no-code|nocode)\b/i],
  ["creative", /\b(creative agency|digital agency|design agency|design studio|portfolio|designer|creator|video agency|branding)\b/i],
];

const PAGE_TYPES = [
  ["pricing", /\b(pricing|price calculator|rates)\b/i],
  ["dashboard", /\b(dashboard|admin|analytics|terminal|data visualization)\b/i],
  ["portfolio", /\b(portfolio|projects section|work showcase|case studies)\b/i],
  ["commerce", /\b(ecommerce|e-commerce|product catalog|shop|store|product showcase)\b/i],
  ["event", /\b(event|festival|conference|premiere|launch event)\b/i],
  ["section", /\b(footer|cta|faq|testimonials|features? section|services? section|about section|navbar)\b/i],
  ["hero", /\b(hero section|hero landing|hero page|\bhero\b)\b/i],
  ["landing-page", /\b(landing page|website|full page|single page)\b/i],
];

const STYLES = [
  ["spatial-3d", /\b(three\.?js|webgl|r3f|react three fiber|3d|spatial|orbit)\b/i],
  ["industrial-brutalist", /\b(brutalist|industrial|raw grid|neo-brutal)\b/i],
  ["luxury-minimal", /\b(luxury|premium|elegant|monochrome|black and gold|black & gold)\b/i],
  ["nature-immersive", /\b(nature|botanical|landscape|organic|farming|earth|garden)\b/i],
  ["cinematic-story", /\b(cinematic|movie|film|video background|scroll story|storytelling)\b/i],
  ["data-terminal", /\b(dashboard|terminal|analytics|data visualization|cyber|network)\b/i],
  ["playful-color", /\b(playful|colorful|duolingo|cartoon|toy|collectible|friendly)\b/i],
  ["editorial-type", /\b(editorial|magazine|typography|serif|gridline|newspaper)\b/i],
  ["future-tech", /\b(futuristic|future|neon|sci-fi|space|ai\b|technology)\b/i],
  ["clean-commercial", /\b(clean|minimal|corporate|saas|conversion)\b/i],
];

function firstMatch(rules, text, fallback) {
  return rules.find(([, pattern]) => pattern.test(text))?.[0] || fallback;
}

function inferPageType(fileName, content) {
  const normalizedFileName = fileName.replaceAll(/[_-]+/g, " ");
  const explicitFileType = firstMatch(PAGE_TYPES, normalizedFileName, "");
  if (explicitFileType) return explicitFileType;

  const landingPageRule = PAGE_TYPES.find(([name]) => name === "landing-page");
  if (landingPageRule?.[1].test(content)) return "landing-page";
  if ((content.match(/\bSECTION\s+\d+/gi) || []).length >= 2) {
    return "landing-page";
  }
  return firstMatch(PAGE_TYPES, content, "landing-page");
}

function matchedSignals(text) {
  const signals = [];
  for (const [name, pattern] of [...INDUSTRIES, ...PAGE_TYPES, ...STYLES]) {
    if (pattern.test(text) && !signals.includes(name)) signals.push(name);
    if (signals.length >= 8) break;
  }
  return signals;
}

function inferEngines(text) {
  const engines = ["css-dom"];
  if (/\b(canvas|particles|generative|pixi|p5\.?js)\b/i.test(text)) engines.push("canvas-2d");
  if (/\b(video|image|media|hls|webp|gif|photography)\b/i.test(text)) engines.push("media");
  if (/\b(three\.?js|webgl|r3f|react three fiber|drei|glsl|shader)\b/i.test(text)) engines.push("three-webgl");
  if (/\b(framer motion|motion\/react|gsap|scrolltrigger|animation|parallax)\b/i.test(text)) engines.push("motion");
  return engines;
}

function titleFrom(fileName, content) {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading && heading.length <= 100) return heading;
  return path.basename(fileName, path.extname(fileName)).replaceAll(/[_-]+/g, " ").trim();
}

function slug(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 64) || "prompt";
}

export function classifyPrompt({ fileName, content, sourcePath = fileName }) {
  const normalizedFileName = fileName.replaceAll(/[_-]+/g, " ");
  const sample = `${normalizedFileName}\n${content.slice(0, 24000)}`;
  const digest = crypto.createHash("sha1").update(sourcePath).digest("hex").slice(0, 8);
  return {
    id: `prompt-${slug(path.basename(fileName, path.extname(fileName)))}-${digest}`,
    fileName,
    title: titleFrom(fileName, content),
    industry: firstMatch(INDUSTRIES, sample, "other"),
    pageType: inferPageType(fileName, content.slice(0, 24000)),
    style: firstMatch(STYLES, sample, "clean-commercial"),
    engines: inferEngines(sample),
    signals: matchedSignals(sample),
    sourcePath,
  };
}

function walkMarkdown(sourceDir, currentDir = sourceDir) {
  return fs.readdirSync(currentDir, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) return walkMarkdown(sourceDir, absolutePath);
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".md") return [];
    return [absolutePath];
  });
}

export function classifyPromptDirectory(sourceDir) {
  return walkMarkdown(sourceDir)
    .map((absolutePath) => {
      const sourcePath = path.relative(sourceDir, absolutePath).split(path.sep).join("/");
      return classifyPrompt({
        fileName: path.basename(absolutePath),
        content: fs.readFileSync(absolutePath, "utf8"),
        sourcePath,
      });
    })
    .sort((a, b) => a.fileName.localeCompare(b.fileName, "en"));
}

function countBy(items, key) {
  return Object.fromEntries(
    [...new Set(items.map((item) => item[key]))]
      .sort()
      .map((value) => [value, items.filter((item) => item[key] === value).length]),
  );
}

export function buildCatalog(sourceDir) {
  const items = classifyPromptDirectory(sourceDir);
  return {
    schemaVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    source: "motionsites_661/prompts",
    sourceCount: items.length,
    stats: {
      byIndustry: countBy(items, "industry"),
      byPageType: countBy(items, "pageType"),
      byStyle: countBy(items, "style"),
    },
    items,
  };
}

export function reportFor(catalog) {
  const table = (values) =>
    Object.entries(values)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => `| ${name} | ${count} |`)
      .join("\n");
  return `# MotionSites Prompt Classification

- Actual source files: ${catalog.sourceCount}
- Source: read-only NAS snapshot
- Generated: ${catalog.generatedAt}
- Note: the directory name references 661, but only ${catalog.sourceCount} Markdown prompts were present.

## Industry

| Category | Count |
| --- | ---: |
${table(catalog.stats.byIndustry)}

## Page Type

| Category | Count |
| --- | ---: |
${table(catalog.stats.byPageType)}

## Style

| Category | Count |
| --- | ---: |
${table(catalog.stats.byStyle)}
`;
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    values[argv[index]?.replace(/^--/, "")] = argv[index + 1];
  }
  return values;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.source || !args.output) {
    throw new Error("Usage: node tools/classify-motionsites-prompts.mjs --source <dir> --output <json>");
  }
  const catalog = buildCatalog(path.resolve(args.source));
  const outputPath = path.resolve(args.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
  const reportPath = args.report
    ? path.resolve(args.report)
    : path.join(path.dirname(outputPath), "motionsites-prompt-report.md");
  fs.writeFileSync(reportPath, reportFor(catalog));
  process.stdout.write(`Classified ${catalog.sourceCount} prompts into ${outputPath}\n`);
}
