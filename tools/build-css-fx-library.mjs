import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ATOMS_DIR = path.join(ROOT, "atoms");
const REGISTRY_DIR = path.join(ROOT, "registry");
const DEMO_DIR = path.join(ROOT, "demo");

const FAMILY_DEFS = [
  { id: "glass", name: "毛玻璃", category: "filter", match: ["backdrop-filter", "-webkit-backdrop-filter", "blur(", "glass"] },
  { id: "liquid", name: "液态玻璃", category: "filter", match: ["liquid", "luminosity", "mask-composite", "-webkit-mask"] },
  { id: "blend", name: "混合滤镜", category: "filter", match: ["mix-blend-mode", "background-blend-mode", "filter:"] },
  { id: "gradient-border", name: "渐变边框", category: "border", match: ["conic-gradient", "border", "mask-composite", "outline"] },
  { id: "lighting", name: "光影发光", category: "lighting", match: ["box-shadow", "drop-shadow", "glow", "shadow"] },
  { id: "gradient-text", name: "渐变文字", category: "text", match: ["background-clip:text", "-webkit-background-clip:text", "text-fill-color", "gradient-text"] },
  { id: "neon", name: "霓虹文字", category: "text", match: ["text-shadow", "neon"] },
  { id: "reveal", name: "入场动效", category: "transition", match: ["fade", "reveal", "opacity: 0", "translateY", "animation"] },
  { id: "marquee", name: "跑马灯", category: "transition", match: ["marquee", "translateX", "infinite linear"] },
  { id: "float", name: "浮动悬停", category: "transition", match: ["float", "translateY", "ease-in-out infinite", "bounce"] },
  { id: "shimmer", name: "流光扫光", category: "transition", match: ["shimmer", "shine", "background-position", "background-size"] },
  { id: "pulse", name: "脉冲光圈", category: "transition", match: ["pulse", "scale", "opacity", "ring"] },
  { id: "tilt", name: "3D 倾斜", category: "3d", match: ["perspective", "rotateX", "rotateY", "preserve-3d", "transform-style"] },
  { id: "magnetic", name: "磁吸跟随", category: "interactive", match: ["magnetic", "mousemove", "clientX", "getBoundingClientRect"] },
  { id: "pattern", name: "图案纹理", category: "background", match: ["repeating-linear-gradient", "radial-gradient", "background-size", "pattern", "grid"] },
  { id: "noise", name: "噪点颗粒", category: "background", match: ["feTurbulence", "fractalNoise", "noise", "grain"] },
  { id: "bento", name: "Bento 网格", category: "layout", match: ["grid-template", "grid-column", "grid-row", "bento"] },
  { id: "parallax", name: "滚动视差", category: "interactive", match: ["parallax", "background-attachment", "translateZ", "scroll"] },
  { id: "particles", name: "粒子拖尾", category: "particles", match: ["particle", "cursor", "trail", "radial-gradient(circle"] },
  { id: "mask", name: "遮罩切层", category: "filter", match: ["clip-path", "mask", "-webkit-mask", "inset("] },
];

const CATEGORY_ORDER = [
  "filter",
  "border",
  "lighting",
  "text",
  "transition",
  "3d",
  "interactive",
  "background",
  "layout",
  "particles",
];

const STOP_IDS = new Set([
  "active",
  "collapsed",
  "entering",
  "exiting",
  "is-active",
  "is-visible",
  "light",
  "monthly",
  "no-discount",
  "content",
  "inner",
  "overlay",
  "page-wrapper",
]);

const CSS_VAR_RE = /var\((--[a-zA-Z0-9-_]+)(?:,\s*([^)]+))?\)/g;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    if (entry.isFile() && entry.name.endsWith(".json")) files.push(full);
  }
  return files;
}

function includesAny(haystack, needles) {
  const text = haystack.toLowerCase();
  return needles.some((needle) => text.includes(needle.toLowerCase()));
}

function familyFor(atom) {
  const text = [atom.id, atom.name, atom.category, atom.subcategory, atom.description, atom.css, atom.js, ...(atom.tags || [])].join(" ");
  const lower = text.toLowerCase();
  if (atom.category === "particles") return FAMILY_DEFS.find((family) => family.id === "particles");
  const directRules = [
    ["liquid", /liquid|luminosity/],
    ["gradient-text", /background-clip\s*:\s*text|-webkit-background-clip\s*:\s*text|text-fill-color|gradient-text/],
    ["neon", /text-shadow|neon/],
    ["marquee", /marquee|ticker/],
    ["magnetic", /magnetic|mousemove|clientx|getboundingclientrect/],
    ["tilt", /perspective|rotatex|rotatey|preserve-3d|transform-style/],
    ["blend", /mix-blend-mode|background-blend-mode/],
    ["noise", /feturbulence|fractalnoise|noise|grain/],
    ["bento", /bento|grid-template|grid-column|grid-row/],
    ["shimmer", /shimmer|shine|sweep|background-position/],
    ["float", /float|bounce|translatey\([^)]*-\d|ease-in-out\s+infinite/],
    ["pulse", /pulse|scale\(|ring/],
  ];
  for (const [id, rule] of directRules) {
    if (rule.test(lower)) return FAMILY_DEFS.find((family) => family.id === id);
  }
  const matches = FAMILY_DEFS
    .map((family) => ({
      family,
      hits: family.match.filter((needle) => lower.includes(needle.toLowerCase())).length,
    }))
    .filter((item) => item.hits > 0)
    .sort((a, b) => b.hits - a.hits);
  return matches[0]?.family || null;
}

function cssVars(css = "") {
  const vars = {};
  for (const match of css.matchAll(CSS_VAR_RE)) {
    vars[match[1]] = (match[2] || "").trim() || "initial";
  }
  return vars;
}

function scoreAtom(atom, family) {
  const css = atom.css || "";
  const js = atom.js || "";
  const id = atom.id || "";
  const text = [id, atom.name, atom.description, css, js].join(" ").toLowerCase();
  let visual = 1;
  let standalone = 1;
  let compat = 4;

  const visualSignals = [
    "backdrop-filter", "blur(", "box-shadow", "text-shadow", "linear-gradient", "radial-gradient",
    "conic-gradient", "mix-blend-mode", "mask", "clip-path", "transform", "animation", "transition",
    "perspective", "filter:", "background-size", "feTurbulence",
  ];
  visual += Math.min(4, visualSignals.filter((signal) => text.includes(signal.toLowerCase())).length);
  if (family?.id === "glass" || family?.id === "liquid") visual += 0.5;
  if (css.length > 80 && css.length < 1800) standalone += 1;
  if (/[.#][a-zA-Z0-9_-]+\s*\{/.test(css)) standalone += 1;
  if (atom.html || family?.id) standalone += 1;
  if (js && /(document\.querySelector\(|window\.|document\.)/.test(js)) standalone -= 1;
  if (/(position:\s*fixed|height:\s*100vh|width:\s*100vw)/i.test(css)) standalone -= 0.5;
  if (STOP_IDS.has(id) || id.length < 4) standalone -= 1.5;
  if (/font-|header|footer|nav|logo|paragraph|title|section|wrapper|container|left|right/i.test(id)) standalone -= 0.5;
  if (/backdrop-filter|-webkit-mask|mask-composite|mix-blend-mode|clip-path/i.test(css)) compat -= 0.5;
  if (/feTurbulence|filter:\s*url/i.test(css)) compat -= 0.5;

  visual = Math.max(1, Math.min(5, Math.round(visual)));
  standalone = Math.max(1, Math.min(5, Math.round(standalone)));
  compat = Math.max(1, Math.min(5, Math.round(compat)));
  const total = Math.round(((visual * 0.45 + standalone * 0.35 + compat * 0.2) + Number.EPSILON) * 10) / 10;
  return { visual, standalone, compat, total };
}

function firstClass(css = "") {
  return css.match(/\.([_a-zA-Z][-_a-zA-Z0-9]*)/)?.[1] || "fx-sample";
}

function safeClass(id) {
  return `fx-${String(id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function prefixKeyframes(css, prefix) {
  const names = [...css.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);
  let out = css;
  for (const name of names) {
    const next = `${prefix}-${name}`;
    out = out.replace(new RegExp(`@keyframes\\s+${escapeRegExp(name)}\\b`, "g"), `@keyframes ${next}`);
    out = out.replace(new RegExp(`(animation(?:-name)?\\s*:[^;{}]*)\\b${escapeRegExp(name)}\\b`, "g"), `$1${next}`);
  }
  return out;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renameMainClass(css, original, renamed) {
  if (!original) return css;
  return css.replace(new RegExp(`\\.${escapeRegExp(original)}\\b`, "g"), `.${renamed}`);
}

function scopeCss(css, scope) {
  let out = "";
  let cursor = 0;
  const keyframeRe = /@keyframes\s+[^{]+\{(?:[^{}]|\{[^{}]*\})*\}/g;
  for (const match of css.matchAll(keyframeRe)) {
    out += prefixRules(css.slice(cursor, match.index), scope);
    out += match[0];
    cursor = match.index + match[0].length;
  }
  out += prefixRules(css.slice(cursor), scope);
  return out;
}

function prefixRules(css, scope) {
  return css.replace(/(^|})([^@{}]+)\{/g, (all, close, selectors) => {
    const scoped = selectors
      .split(",")
      .map((selector) => selector.trim())
      .filter(Boolean)
      .map((selector) => selector.startsWith(scope) ? selector : `${scope} ${selector}`)
      .join(", ");
    return `${close}${scoped}{`;
  });
}

function browserCompat(atom, family) {
  const css = atom.css || "";
  const compat = { chrome: 90, safari: 15, firefox: 90 };
  if (/backdrop-filter/i.test(css)) {
    compat.chrome = 76;
    compat.safari = 15.4;
    compat.firefox = 103;
  }
  if (/mix-blend-mode/i.test(css)) {
    compat.chrome = 41;
    compat.safari = 8;
    compat.firefox = 32;
  }
  if (/conic-gradient/i.test(css)) {
    compat.chrome = 69;
    compat.safari = 12.1;
    compat.firefox = 83;
  }
  if (family?.id === "tilt" || family?.id === "magnetic") {
    compat.chrome = 90;
    compat.safari = 15;
    compat.firefox = 90;
  }
  return compat;
}

function fallbackHtml(atom, family, className) {
  const label = atom.name || atom.id;
  if (family?.id === "gradient-text" || family?.id === "neon") return `<div class="${className}">${label}</div>`;
  if (family?.id === "marquee") return `<div class="${className}">VORTEX · NIMBUS · PRYSMA · CSS FX · VORTEX · NIMBUS · PRYSMA · CSS FX</div>`;
  if (family?.id === "pattern" || family?.id === "noise") return `<div class="${className}"><span>${label}</span></div>`;
  if (family?.id === "bento") return `<div class="${className}"><i></i><i></i><i></i><i></i></div>`;
  if (family?.id === "pulse") return `<div class="${className}"><span></span></div>`;
  return `<div class="${className}"><span>${label}</span></div>`;
}

function enhanceSnippet(atom, family, className) {
  const base = `
.${className}{
  min-width: 148px;
  min-height: 86px;
  display: grid;
  place-items: center;
  padding: 18px;
  border-radius: 18px;
  color: #f8fafc;
  position: relative;
  overflow: hidden;
}`;
  const familyCss = {
    glass: `.${className}{background:rgba(255,255,255,.08);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.16),0 24px 60px rgba(0,0,0,.24)}@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){.${className}{background:rgba(25,31,45,.86)}}`,
    liquid: `.${className}{background:rgba(255,255,255,.035);backdrop-filter:blur(18px) saturate(1.35);-webkit-backdrop-filter:blur(18px) saturate(1.35);border:1px solid rgba(255,255,255,.2);box-shadow:inset 0 1px 1px rgba(255,255,255,.22),inset 0 -18px 44px rgba(255,255,255,.045),0 26px 80px rgba(18,26,39,.3)}.${className}::before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(135deg,rgba(255,255,255,.2),transparent 36%,rgba(255,255,255,.08));pointer-events:none}`,
    blend: `.${className}{background:linear-gradient(135deg,#fb7185,#22d3ee);filter:saturate(1.3) contrast(1.05);mix-blend-mode:normal}.fx-stage-orb{mix-blend-mode:screen}`,
    "gradient-border": `.${className}{background:#111827;border:1px solid transparent}.${className}::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;background:conic-gradient(from var(--fx-angle,0deg),#34d399,#38bdf8,#f472b6,#f59e0b,#34d399);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:${className}-spin 4s linear infinite}@keyframes ${className}-spin{to{--fx-angle:360deg}}`,
    lighting: `.${className}{background:linear-gradient(145deg,#151a24,#0d1119);box-shadow:0 0 0 1px rgba(255,255,255,.08),0 18px 60px rgba(56,189,248,.24),inset 0 1px 0 rgba(255,255,255,.12)}.${className}::after{content:"";position:absolute;inset:auto 20% -20% 20%;height:46px;background:#38bdf8;filter:blur(34px);opacity:.45}`,
    "gradient-text": `.${className}{font-size:clamp(24px,4vw,42px);font-weight:900;letter-spacing:0;background:linear-gradient(90deg,#111827,#0f766e,#2563eb,#be123c,#111827);background-size:260% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:${className}-move 4s linear infinite}@keyframes ${className}-move{to{background-position:260% center}}`,
    neon: `.${className}{font-size:clamp(24px,4vw,42px);font-weight:900;color:#f8fafc;text-shadow:0 0 6px rgba(248,250,252,.88),0 0 20px rgba(20,184,166,.72),0 0 54px rgba(244,63,94,.44);animation:${className}-pulse 2.4s ease-in-out infinite alternate}@keyframes ${className}-pulse{to{text-shadow:0 0 4px rgba(248,250,252,.9),0 0 28px rgba(20,184,166,.86),0 0 74px rgba(244,63,94,.55)}}`,
    reveal: `.${className}{background:#101827;border:1px solid rgba(255,255,255,.08);opacity:0;transform:translateY(24px) scale(.96);animation:${className}-reveal .9s cubic-bezier(.22,1,.36,1) forwards}@keyframes ${className}-reveal{to{opacity:1;transform:translateY(0) scale(1)}}`,
    marquee: `.${className}{display:block;white-space:nowrap;min-width:100%;font:800 18px/1 ui-monospace,monospace;color:#0f766e;animation:${className}-marquee 9s linear infinite}@keyframes ${className}-marquee{to{transform:translateX(-50%)}}`,
    float: `.${className}{background:linear-gradient(135deg,#2563eb,#14b8a6);box-shadow:0 18px 44px rgba(20,184,166,.24);animation:${className}-float 3.2s ease-in-out infinite}@keyframes ${className}-float{50%{transform:translateY(-16px) rotate(-1.5deg)}}`,
    shimmer: `.${className}{background:#111827;border:1px solid rgba(255,255,255,.1)}.${className}::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 25%,rgba(255,255,255,.24) 45%,transparent 65%);transform:translateX(-120%);animation:${className}-shine 2.4s ease-in-out infinite}@keyframes ${className}-shine{55%,100%{transform:translateX(120%)}}`,
    pulse: `.${className}{background:transparent;overflow:visible}.${className} span{width:34px;height:34px;border-radius:50%;background:#2563eb;box-shadow:0 0 0 0 rgba(37,99,235,.42);animation:${className}-pulse 2s ease-out infinite}@keyframes ${className}-pulse{to{box-shadow:0 0 0 36px rgba(37,99,235,0)}}`,
    tilt: `.${className}{background:linear-gradient(145deg,#111827,#172033);border:1px solid rgba(255,255,255,.1);transform-style:preserve-3d;transition:transform .18s ease,box-shadow .18s ease;box-shadow:0 22px 54px rgba(2,6,23,.22)}.${className} span{transform:translateZ(30px)}`,
    magnetic: `.${className}{background:#111827;border:1px solid rgba(255,255,255,.1);transition:transform .22s cubic-bezier(.2,.8,.2,1),box-shadow .22s;box-shadow:0 16px 42px rgba(15,23,42,.22)}`,
    pattern: `.${className}{width:100%;height:100%;background-color:#f8fafc;background-image:radial-gradient(rgba(15,118,110,.28) 1.5px,transparent 1.5px),linear-gradient(rgba(15,23,42,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(15,23,42,.08) 1px,transparent 1px);background-size:22px 22px,44px 44px,44px 44px;color:#0f172a}.${className} span{background:rgba(255,255,255,.78);padding:6px 9px;border-radius:999px}`,
    noise: `.${className}{background:linear-gradient(135deg,#172033,#0f172a);color:#fff}.${className}::before{content:"";position:absolute;inset:0;opacity:.12;background-image:url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="4"/></filter><rect width="100%" height="100%" filter="url(%23n)"/></svg>')}`,
    bento: `.${className}{width:100%;height:120px;display:grid;grid-template-columns:1.4fr 1fr 1fr;grid-template-rows:1fr 1fr;gap:8px;background:transparent;padding:0}.${className} i{border-radius:12px;background:rgba(15,118,110,.16);border:1px solid rgba(15,118,110,.18)}.${className} i:first-child{grid-row:span 2;background:rgba(37,99,235,.16)}.${className} i:last-child{grid-column:span 2;background:rgba(190,18,60,.14)}`,
    parallax: `.${className}{background:linear-gradient(135deg,#172033,#020617);isolation:isolate}.${className}::before,.${className}::after{content:"";position:absolute;border-radius:22px;background:rgba(56,189,248,.28);inset:28px 46% 34px 16%;animation:${className}-p1 4s ease-in-out infinite alternate}.${className}::after{inset:44px 16% 22px 48%;background:rgba(244,63,94,.22);animation-name:${className}-p2}@keyframes ${className}-p1{to{transform:translate3d(16px,-12px,0)}}@keyframes ${className}-p2{to{transform:translate3d(-12px,12px,0)}}`,
    particles: `.${className}{background:#0f172a}.${className}::before{content:"";width:12px;height:12px;border-radius:50%;background:#38bdf8;box-shadow:26px 8px 0 rgba(20,184,166,.55),-24px 18px 0 rgba(244,63,94,.5),8px -24px 0 rgba(245,158,11,.45);animation:${className}-drift 3s ease-in-out infinite alternate}@keyframes ${className}-drift{to{transform:translate(18px,-10px) scale(1.1)}}`,
    mask: `.${className}{background:linear-gradient(135deg,#111827,#0f766e);clip-path:polygon(8% 0,100% 0,92% 100%,0 100%);border-radius:8px}`,
  }[family?.id] || "";
  return `${base}\n${familyCss}`;
}

function snippetFor(atom, family) {
  const original = firstClass(atom.css || "");
  const cls = safeClass(atom.id);
  const renamed = prefixKeyframes(renameMainClass(atom.css || "", original, cls), cls);
  const demoCss = enhanceSnippet(atom, family, cls).trim();
  const sourceNote = renamed ? `\n\n/* Original source atom reference, kept inactive for safety:\n${renamed.replace(/\*\//g, "* /")}\n*/` : "";
  const css = `${demoCss}${sourceNote}`.trim();
  const html = atom.html ? String(atom.html).replace(new RegExp(`\\b${escapeRegExp(original)}\\b`, "g"), cls) : fallbackHtml(atom, family, cls);
  const behavior = family?.id === "tilt" ? "tilt" : family?.id === "magnetic" ? "magnetic" : "";
  const js = behavior === "tilt"
    ? `document.querySelectorAll('.${cls}').forEach((card)=>{card.addEventListener('mousemove',(event)=>{const rect=card.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width-.5;const y=(event.clientY-rect.top)/rect.height-.5;card.style.transform='perspective(900px) rotateX('+(-y*14)+'deg) rotateY('+(x*18)+'deg)';});card.addEventListener('mouseleave',()=>{card.style.transform='perspective(900px) rotateX(0) rotateY(0)';});});`
    : behavior === "magnetic"
      ? `document.querySelectorAll('.${cls}').forEach((item)=>{item.addEventListener('mousemove',(event)=>{const rect=item.getBoundingClientRect();const x=(event.clientX-rect.left-rect.width/2)*.22;const y=(event.clientY-rect.top-rect.height/2)*.22;item.style.transform='translate('+x+'px,'+y+'px)';});item.addEventListener('mouseleave',()=>{item.style.transform='translate(0,0)';});});`
      : "";
  const scope = `[data-preview-id="${atom.id}"]`;
  return {
    class_name: cls,
    html,
    css,
    js,
    behavior,
    preview_css: scopeCss(demoCss, scope),
    copy_code: [`<!-- ${atom.name || atom.id} | ${atom.source || "unknown"} -->`, html, "<style>", css, "</style>", js ? `<script>\n${js}\n</script>` : ""].filter(Boolean).join("\n"),
  };
}

function normalize(atom, file, family, score) {
  const snippet = snippetFor(atom, family);
  const tags = [...new Set([family?.id, atom.category, atom.subcategory, ...(atom.tags || []), ...(atom.keywords || [])].filter(Boolean).map(String))].slice(0, 10);
  return {
    id: atom.id,
    name: atom.name || atom.id,
    category: family?.category || atom.category || "unknown",
    subcategory: family?.id || atom.subcategory || "general",
    description: atom.description || `${family?.name || "视觉特效"} CSS atom`,
    css: atom.css || "",
    css_vars: cssVars(atom.css || ""),
    html: snippet.html,
    js: snippet.js,
    browser_compat: browserCompat(atom, family),
    tags,
    source: atom.source || "motionsites/unknown",
    quality_score: score.total,
    quality: {
      visual: score.visual,
      compatibility: score.compat,
      standalone: score.standalone,
    },
    family: family?.id || "uncategorized",
    family_name: family?.name || "未分类",
    original_path: path.relative(ROOT, file),
    snippet,
  };
}

function buildSchema() {
  return {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://local.css-fx/registry/effect.schema.json",
    title: "CSS FX Atom",
    type: "object",
    required: ["id", "name", "category", "subcategory", "description", "css", "html", "browser_compat", "tags", "source", "quality_score"],
    additionalProperties: true,
    properties: {
      id: { type: "string", pattern: "^[a-z0-9][a-z0-9-]*$" },
      name: { type: "string", minLength: 1 },
      category: { type: "string", enum: CATEGORY_ORDER },
      subcategory: { type: "string", minLength: 1 },
      description: { type: "string" },
      css: { type: "string" },
      css_vars: { type: "object", additionalProperties: { type: "string" } },
      html: { type: "string" },
      js: { type: "string" },
      browser_compat: {
        type: "object",
        required: ["chrome", "safari", "firefox"],
        properties: {
          chrome: { type: "number" },
          safari: { type: "number" },
          firefox: { type: "number" },
        },
      },
      tags: { type: "array", items: { type: "string" } },
      source: { type: "string" },
      quality_score: { type: "number", minimum: 1, maximum: 5 },
      quality: {
        type: "object",
        properties: {
          visual: { type: "number", minimum: 1, maximum: 5 },
          compatibility: { type: "number", minimum: 1, maximum: 5 },
          standalone: { type: "number", minimum: 1, maximum: 5 },
        },
      },
    },
  };
}

function htmlFor(atoms, stats) {
  const pageData = atoms.map((atom) => ({
    id: atom.id,
    name: atom.name,
    category: atom.category,
    subcategory: atom.subcategory,
    description: atom.description,
    browser_compat: atom.browser_compat,
    tags: atom.tags,
    source: atom.source,
    quality_score: atom.quality_score,
    quality: atom.quality,
    family: atom.family,
    family_name: atom.family_name,
    snippet: atom.snippet,
  }));
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CSS FX 原子特效素材库</title>
<style>
:root{color-scheme:light;--bg:#f7f8fb;--panel:#ffffff;--panel-2:#f1f4f8;--text:#162033;--muted:#667085;--line:#d9e0ea;--accent:#0f766e;--accent-2:#2563eb;--hot:#be123c;--warn:#b45309;--shadow:0 18px 50px rgba(16,24,40,.09);--stage:#ecf1f7}
:root[data-theme="dark"]{color-scheme:dark;--bg:#0d1118;--panel:#121821;--panel-2:#0f141c;--text:#e5ebf5;--muted:#94a3b8;--line:#253142;--accent:#2dd4bf;--accent-2:#60a5fa;--hot:#fb7185;--warn:#f59e0b;--shadow:0 22px 70px rgba(0,0,0,.32);--stage:#0b1018}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:0}button,input{font:inherit}button{cursor:pointer}
.shell{display:grid;grid-template-columns:260px minmax(0,1fr);min-height:100vh}.sidebar{position:sticky;top:0;height:100vh;overflow:auto;border-right:1px solid var(--line);background:var(--panel);padding:18px 14px}.brand{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 4px 18px}.brand strong{font-size:17px}.brand span{font:700 11px/1 ui-monospace,monospace;color:var(--accent);border:1px solid var(--line);padding:6px 8px;border-radius:999px}
.nav{display:grid;gap:4px}.nav a{display:grid;grid-template-columns:1fr auto;gap:8px;padding:9px 10px;border-radius:8px;color:var(--muted);text-decoration:none}.nav a:hover,.nav a.active{background:var(--panel-2);color:var(--text)}.nav b{font-weight:700}.nav small{color:var(--muted)}.side-meta{margin-top:18px;padding:12px 10px;border-top:1px solid var(--line);color:var(--muted);font-size:12px}
.main{min-width:0}.topbar{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--line);padding:18px 24px}.title-row{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:14px}h1{margin:0;font-size:24px;line-height:1.15}p{margin:0}.sub{color:var(--muted);margin-top:6px}.actions{display:flex;gap:8px;align-items:center}.icon-btn,.copy-btn,.pill{border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:8px;min-height:36px;padding:0 12px}.icon-btn{width:38px;padding:0;display:grid;place-items:center}.icon-btn svg{width:17px;height:17px}
.filters{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:10px}.search{position:relative}.search input{width:100%;height:42px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--text);padding:0 14px 0 38px;outline:none}.search svg{position:absolute;left:12px;top:12px;width:18px;height:18px;color:var(--muted)}.chips{display:flex;gap:8px;overflow:auto;padding-bottom:2px}.pill{white-space:nowrap;color:var(--muted)}.pill.active{background:var(--text);border-color:var(--text);color:var(--bg)}
.content{padding:24px}.family{scroll-margin-top:122px;margin-bottom:34px}.family-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin:0 0 12px}.family h2{font-size:18px;margin:0}.family .meta{color:var(--muted);font-size:12px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:8px;overflow:hidden;box-shadow:var(--shadow);min-width:0}.stage{height:184px;background:var(--stage);display:grid;place-items:center;position:relative;overflow:hidden;color:var(--text);padding:18px}.stage::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 18% 22%,rgba(37,99,235,.18),transparent 28%),radial-gradient(circle at 78% 76%,rgba(190,18,60,.12),transparent 30%),linear-gradient(135deg,rgba(15,118,110,.08),transparent);pointer-events:none}.stage>*{position:relative}.fx-stage-orb{position:absolute;width:118px;height:118px;border-radius:50%;background:linear-gradient(135deg,var(--accent-2),var(--hot));filter:blur(1px);opacity:.34;left:18px;top:20px}.card-body{padding:13px 14px 14px}.card-title{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:7px}.card h3{font-size:14px;margin:0;line-height:1.25}.score{font:800 12px/1 ui-monospace,monospace;color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent);padding:5px 7px;border-radius:7px}.desc{color:var(--muted);font-size:12px;min-height:36px}.tags{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.tag{font-size:11px;color:var(--muted);background:var(--panel-2);border-radius:999px;padding:4px 7px}.card-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid var(--line);padding-top:10px}.src{font:11px/1.3 ui-monospace,monospace;color:var(--muted);min-width:0;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.copy-btn{min-width:74px;color:var(--text)}.copy-btn.done{border-color:var(--accent);color:var(--accent)}.empty{display:none;padding:48px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:8px;background:var(--panel)}
@media (max-width:900px){.shell{grid-template-columns:1fr}.sidebar{position:relative;height:auto;border-right:0;border-bottom:1px solid var(--line)}.nav{grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}.filters{grid-template-columns:1fr}.title-row{display:grid}.content{padding:16px}.topbar{padding:16px}.grid{grid-template-columns:1fr}.family{scroll-margin-top:180px}}
</style>
</head>
<body>
<div class="shell">
  <aside class="sidebar">
    <div class="brand"><strong>CSS FX</strong><span>${stats.curated} / ${stats.total}</span></div>
    <nav class="nav" id="nav"></nav>
    <div class="side-meta">405 prompts · ${stats.curated} selected atoms · schema v1</div>
  </aside>
  <main class="main">
    <header class="topbar">
      <div class="title-row">
        <div>
          <h1>原子级视觉特效素材库</h1>
          <p class="sub">按效果家族对比预览，复制后可直接嵌入任意 HTML/CSS/JS 页面。</p>
        </div>
        <div class="actions">
          <button class="icon-btn" id="themeBtn" title="切换明暗主题" aria-label="切换明暗主题">${icon("sun")}</button>
          <button class="icon-btn" id="resetBtn" title="重置筛选" aria-label="重置筛选">${icon("rotate")}</button>
        </div>
      </div>
      <div class="filters">
        <label class="search">${icon("search")}<input id="searchInput" placeholder="搜索 effect、tag、来源 prompt" autocomplete="off"></label>
        <div class="chips" id="chips"></div>
      </div>
    </header>
    <section class="content">
      <div id="families"></div>
      <div class="empty" id="empty">没有匹配的原子</div>
    </section>
  </main>
</div>
<script>
const ATOMS = ${JSON.stringify(pageData).replace(/</g, "\\u003c")};
const FAMILY_ORDER = ${JSON.stringify(FAMILY_DEFS.map(({ id, name, category }) => ({ id, name, category })))};
const state = {query:"", family:"all"};
const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

function icon(name){
  const paths = {
    search:'<circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>',
    sun:'<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>',
    rotate:'<path d="M21 12a9 9 0 1 1-2.64-6.36"></path><path d="M21 3v6h-6"></path>'
  };
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+paths[name]+'</svg>';
}

function groupAtoms(list){
  return FAMILY_ORDER.map(family => ({...family, atoms:list.filter(atom => atom.family === family.id)})).filter(group => group.atoms.length);
}

function matches(atom){
  const query = state.query.trim().toLowerCase();
  const familyOk = state.family === "all" || atom.family === state.family;
  if(!familyOk) return false;
  if(!query) return true;
  return [atom.id, atom.name, atom.description, atom.source, atom.category, atom.subcategory, ...(atom.tags || [])].join(" ").toLowerCase().includes(query);
}

function renderNav(groups){
  $("#nav").innerHTML = groups.map(group => '<a href="#family-'+group.id+'" data-family="'+group.id+'"><b>'+group.name+'</b><small>'+group.atoms.length+'</small></a>').join("");
}

function renderChips(groups){
  $("#chips").innerHTML = ['<button class="pill active" data-family="all">全部</button>'].concat(groups.map(group => '<button class="pill" data-family="'+group.id+'">'+group.name+'</button>')).join("");
  $$("#chips .pill").forEach(button => button.addEventListener("click", () => {
    state.family = button.dataset.family;
    $$("#chips .pill").forEach(item => item.classList.toggle("active", item === button));
    render();
  }));
}

function card(atom){
  return '<article class="card" data-atom="'+atom.id+'">'+
    '<div class="stage" data-preview-id="'+atom.id+'"><div class="fx-stage-orb"></div><style>'+atom.snippet.preview_css+'</style>'+atom.snippet.html+'</div>'+
    '<div class="card-body"><div class="card-title"><h3>'+escapeHtml(atom.name)+'</h3><span class="score">'+atom.quality_score.toFixed(1)+'</span></div>'+
    '<p class="desc">'+escapeHtml(atom.description)+'</p>'+
    '<div class="tags">'+atom.tags.slice(0,4).map(tag => '<span class="tag">'+escapeHtml(tag)+'</span>').join("")+'</div>'+
    '<div class="card-foot"><span class="src">'+escapeHtml(atom.source)+'</span><button class="copy-btn" data-copy="'+atom.id+'">复制</button></div></div>'+
  '</article>';
}

function render(){
  const filtered = ATOMS.filter(matches);
  const groups = groupAtoms(filtered);
  $("#families").innerHTML = groups.map(group =>
    '<section class="family" id="family-'+group.id+'"><div class="family-head"><h2>'+group.name+'</h2><span class="meta">'+group.category+' · '+group.atoms.length+' atoms</span></div><div class="grid">'+group.atoms.map(card).join("")+'</div></section>'
  ).join("");
  $("#empty").style.display = filtered.length ? "none" : "block";
  bindCards();
  observeSections();
}

function bindCards(){
  $$("[data-copy]").forEach(button => button.addEventListener("click", async () => {
    const atom = ATOMS.find(item => item.id === button.dataset.copy);
    try {
      await copyText(atom.snippet.copy_code);
      button.textContent = "已复制";
      button.classList.add("done");
      setTimeout(() => { button.textContent = "复制"; button.classList.remove("done"); }, 1100);
    } catch (error) {
      window.__copyErrors = window.__copyErrors || [];
      window.__copyErrors.push(String(error && error.message || error));
      button.textContent = "未复制";
      setTimeout(() => { button.textContent = "复制"; }, 1300);
    }
  }));
  $$("[data-atom]").forEach(root => {
    const atom = ATOMS.find(item => item.id === root.dataset.atom);
    const target = $("."+atom.snippet.class_name, root);
    if(!target) return;
    if(atom.snippet.behavior === "tilt"){
      target.addEventListener("mousemove", event => {
        const rect = target.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        target.style.transform = 'perspective(900px) rotateX('+(-y*14)+'deg) rotateY('+(x*18)+'deg)';
      });
      target.addEventListener("mouseleave", () => target.style.transform = 'perspective(900px) rotateX(0) rotateY(0)');
    }
    if(atom.snippet.behavior === "magnetic"){
      target.addEventListener("mousemove", event => {
        const rect = target.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * .22;
        const y = (event.clientY - rect.top - rect.height / 2) * .22;
        target.style.transform = 'translate('+x+'px,'+y+'px)';
      });
      target.addEventListener("mouseleave", () => target.style.transform = 'translate(0,0)');
    }
  });
}

async function copyText(text){
  if(window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText){
    await navigator.clipboard.writeText(text);
    return true;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  area.style.top = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if(!ok) throw new Error("copy command rejected");
  return true;
}

let sectionObserver;
function observeSections(){
  sectionObserver?.disconnect();
  sectionObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if(!visible) return;
    const id = visible.target.id.replace("family-", "");
    $$("#nav a").forEach(link => link.classList.toggle("active", link.dataset.family === id));
  }, {rootMargin:"-18% 0px -68% 0px", threshold:[0.1,0.25,0.5]});
  $$(".family").forEach(section => sectionObserver.observe(section));
}

function escapeHtml(value){
  return String(value || "").replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

const initialGroups = groupAtoms(ATOMS);
renderNav(initialGroups);
renderChips(initialGroups);
render();
$("#searchInput").addEventListener("input", event => { state.query = event.target.value; render(); });
$("#themeBtn").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "" : "dark";
  document.documentElement.dataset.theme = next;
});
$("#resetBtn").addEventListener("click", () => {
  state.query = ""; state.family = "all"; $("#searchInput").value = "";
  $$("#chips .pill").forEach(item => item.classList.toggle("active", item.dataset.family === "all"));
  render();
});
</script>
</body>
</html>`;
}

function icon(name) {
  const paths = {
    search: '<circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path>',
    sun: '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>',
    rotate: '<path d="M21 12a9 9 0 1 1-2.64-6.36"></path><path d="M21 3v6h-6"></path>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}

async function main() {
  const files = await walk(ATOMS_DIR);
  const raw = [];
  for (const file of files) {
    try {
      const atom = JSON.parse(await fs.readFile(file, "utf8"));
      if (!atom.id || !atom.css) continue;
      const family = familyFor(atom);
      if (!family) continue;
      const score = scoreAtom(atom, family);
      raw.push({ atom, file, family, score });
    } catch {
      // Skip malformed source atoms; the curation report keeps total counts separate.
    }
  }

  const grouped = new Map();
  for (const item of raw) {
    const list = grouped.get(item.family.id) || [];
    list.push(item);
    grouped.set(item.family.id, list);
  }

  const selected = [];
  for (const family of FAMILY_DEFS) {
    const list = (grouped.get(family.id) || [])
      .filter((item) => item.score.total >= 2.3)
      .sort((a, b) => b.score.total - a.score.total || (b.atom.css || "").length - (a.atom.css || "").length);
    selected.push(...list.slice(0, 12));
  }

  const seen = new Set();
  const balanced = selected.filter((item) => {
    if (seen.has(item.atom.id)) return false;
    seen.add(item.atom.id);
    return true;
  });
  for (const item of raw.sort((a, b) => b.score.total - a.score.total || (b.atom.css || "").length - (a.atom.css || "").length)) {
    if (balanced.length >= 170) break;
    if (seen.has(item.atom.id)) continue;
    seen.add(item.atom.id);
    balanced.push(item);
  }

  const curated = balanced
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.family.category) - CATEGORY_ORDER.indexOf(b.family.category) || a.family.id.localeCompare(b.family.id) || b.score.total - a.score.total)
    .map((item) => normalize(item.atom, item.file, item.family, item.score));

  await fs.mkdir(REGISTRY_DIR, { recursive: true });
  await fs.mkdir(DEMO_DIR, { recursive: true });
  await fs.mkdir(path.join(ROOT, "tools"), { recursive: true });

  const stats = {
    total: files.length,
    candidates: raw.length,
    curated: curated.length,
    families: Object.fromEntries(FAMILY_DEFS.map((family) => [family.id, curated.filter((atom) => atom.family === family.id).length])),
    generated_at: new Date().toISOString(),
  };

  await fs.writeFile(path.join(REGISTRY_DIR, "effect.schema.json"), `${JSON.stringify(buildSchema(), null, 2)}\n`);
  await fs.writeFile(path.join(REGISTRY_DIR, "curated-atoms.json"), `${JSON.stringify({ schema: "effect.schema.json", stats, atoms: curated }, null, 2)}\n`);
  await fs.writeFile(path.join(REGISTRY_DIR, "curation-report.md"), reportFor(stats, curated));
  await fs.writeFile(path.join(DEMO_DIR, "index.html"), htmlFor(curated, stats));
  console.log(JSON.stringify(stats, null, 2));
}

function reportFor(stats, atoms) {
  const lines = [
    "# CSS FX Atom Curation Report",
    "",
    `Generated at: ${stats.generated_at}`,
    `Source atoms: ${stats.total}`,
    `Matched candidates: ${stats.candidates}`,
    `Curated atoms: ${stats.curated}`,
    "",
    "## Families",
    "",
    "| Family | Count |",
    "| --- | ---: |",
    ...FAMILY_DEFS.map((family) => `| ${family.name} (${family.id}) | ${stats.families[family.id] || 0} |`),
    "",
    "## Selection Rules",
    "",
    "- Prefer real visual CSS signals: blur, shadow, gradients, masks, transforms, keyframes, blend modes, grid patterns, noise, and pointer-driven effects.",
    "- Penalize generic page layout classes, navigation/header/footer fragments, state-only classes, full-screen wrappers, and global selectors.",
    "- Normalize browser compatibility from CSS features instead of trusting free-text source fields.",
    "- Preview code is scoped per card and raw document-level JS is replaced with local handlers for tilt and magnetic effects.",
    "",
    "## Top Atoms",
    "",
    ...atoms.slice(0, 40).map((atom) => `- ${atom.name} (${atom.id}) · ${atom.family_name} · score ${atom.quality_score} · ${atom.source}`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
