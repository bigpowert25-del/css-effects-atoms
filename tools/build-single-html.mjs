import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demoRoot = path.join(root, "demo");
const outputPath = path.join(
  demoRoot,
  "downloads",
  "css-fx-library-single.html",
);
const emptyImage =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
const emptyVideo = "data:video/mp4;base64,";
const offlinePreviewStyle = `
<style data-offline-preview>
  video { background: #111820; }
  .carousel-item {
    border-radius: 46% 46% 28% 28%;
    background: #f05d3f;
    box-shadow: inset -18px -24px 0 rgb(0 0 0 / 15%), 0 24px 40px rgb(0 0 0 / 20%);
  }
  .carousel-item:nth-child(2) { background: #75a7d8; }
  .carousel-item:nth-child(3) { background: #f1c84c; }
  .carousel-item:nth-child(4) { background: #79b680; }
  .carousel-item::before {
    position: absolute;
    z-index: 2;
    left: 22%;
    top: 8%;
    width: 56%;
    aspect-ratio: 1;
    border: 3px solid rgb(255 255 255 / 75%);
    border-radius: 50%;
    background: rgb(255 255 255 / 24%);
    content: "";
  }
  .carousel-item img[src^="data:"] { opacity: 0; }
</style>`;

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function mimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
  }[extension] || "application/octet-stream";
}

function dataUrl(relativeDemoPath) {
  const filePath = path.join(demoRoot, relativeDemoPath);
  const payload = fs.readFileSync(filePath).toString("base64");
  return `data:${mimeType(filePath)};base64,${payload}`;
}

function scriptSafeJson(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function offlinePreviewDocument(html) {
  const tailwindRuntime = read("demo/vendor/tailwindcss-browser.js").replaceAll(
    "cdn.tailwindcss.com",
    "local.tailwind.runtime",
  );
  return html
    .replace(
      /<script\s+src=["']https:\/\/cdn\.tailwindcss\.com["']\s*><\/script>/gi,
      () => `<script>${tailwindRuntime}</script>`,
    )
    .replace(
      /<link\b[^>]*href=["']https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^"']*["'][^>]*>/gi,
      "",
    )
    .replace(
      /@import\s+url\(["']?https:\/\/db\.onlinewebfonts\.com[^;]+;/gi,
      "",
    )
    .replace(
      /https:\/\/(?:d8j0ntlcm91z4\.cloudfront\.net|strvid\.nyc3\.cdn\.digitaloceanspaces\.com)[^\s"'<>)}]+/gi,
      emptyVideo,
    )
    .replace(
      /https:\/\/(?:fifth-gentle-45902158\.figma\.site|images\.unsplash\.com)[^\s"'<>)}]+/gi,
      emptyImage,
    )
    .replace(/<\/head>/i, `${offlinePreviewStyle}</head>`);
}

function embeddedCatalog() {
  const catalog = JSON.parse(read("registry/layered-library.json"));
  for (const item of catalog.items) {
    if (item.preview?.poster) item.preview.poster = dataUrl(item.preview.poster);
  }
  return catalog;
}

function embeddedPrompts() {
  return JSON.parse(read("registry/motionsites-prompt-library.json"));
}

function embeddedPreviews() {
  const files = [
    "previews/interaction-runner.html",
    "previews/variant-runner.html",
    "scenes/rolling-tape.html",
    "scenes/tengwang-curtain.html",
    "scenes/three-particle-network.html",
    "scenes/scene-runner.html",
    "pages/ai-automation.html",
    "pages/arise.html",
    "pages/aetheris-voyage.html",
    "pages/3d-collectible-hero.html",
    "pages/apex-saas.html",
    "pages/ink-pavilion.html",
  ];
  return Object.fromEntries(
    files.map((relativePath) => [
      relativePath,
      relativePath.startsWith("pages/")
        ? offlinePreviewDocument(
            fs.readFileSync(path.join(demoRoot, relativePath), "utf8"),
          )
        : fs.readFileSync(path.join(demoRoot, relativePath), "utf8"),
    ]),
  );
}

function build() {
  const css = read("demo/app.css");
  const copyHelper = read("demo/copy-payload.mjs").replaceAll(
    "export function",
    "function",
  );
  const app = read("demo/app.js").replace(
    /^import\s+\{[^}]+\}\s+from\s+"\.\/copy-payload\.mjs";\s*/u,
    "",
  );
  const bootstrap = [
    "window.FX_SINGLE_FILE = true;",
    `window.FX_LIBRARY = ${scriptSafeJson(embeddedCatalog())};`,
    `window.FX_PROMPTS = ${scriptSafeJson(embeddedPrompts())};`,
    `window.FX_EMBEDDED_PREVIEWS = ${scriptSafeJson(embeddedPreviews())};`,
  ].join("\n");

  let html = read("demo/index.html");
  html = html
    .replace(
      '<link rel="stylesheet" href="./app.css?v=20260728.7" />',
      `<style>\n${css}\n</style>`,
    )
    .replace(
      'href="./downloads/css-fx-library-single.html" download',
      'href="#" hidden',
    )
    .replace('href="./index.html"', 'href="#L1"')
    .replace(
      '    <script src="./generated-data.js?v=20260728.7"></script>\n    <script src="./generated-prompts.js?v=20260728.7"></script>\n    <script type="module" src="./app.js?v=20260728.7"></script>',
      () =>
        `    <script>\n${bootstrap}\n</script>\n    <script type="module">\n${copyHelper}\n${app}\n</script>`,
    );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
  return html.length;
}

const bytes = build();
process.stdout.write(
  `Built demo/downloads/css-fx-library-single.html (${(bytes / 1024 / 1024).toFixed(2)} MiB)\n`,
);
