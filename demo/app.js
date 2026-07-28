import { embedRuntimeSelection } from "./copy-payload.mjs";

(() => {
  "use strict";

  const catalog = window.FX_LIBRARY;
  const PROMPTS = window.FX_PROMPTS;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const LEVELS = [
    { id: "L0", name: "视觉原子", note: "一段样式", kicker: "ATOM", description: "一个元素，一种明确的视觉变化。" },
    { id: "L1", name: "互动行为", note: "一次输入", kicker: "BEHAVIOR", description: "一个输入，对应一个清晰反馈。" },
    { id: "L2", name: "互动组件", note: "一个道具", kicker: "COMPONENT", description: "有边界、可复用、能完成一次小交互。" },
    { id: "L3", name: "完整场景", note: "一段体验", kicker: "SCENE", description: "独立运行的 Canvas 或 Three.js 沉浸场景。" },
    { id: "L4", name: "页面配方", note: "一套组合", kicker: "RECIPE", description: "把引擎、互动、资源与页面结构组合成可执行提示词。" },
  ];

  const ENGINES = [
    { id: "all", name: "全部" },
    { id: "css-dom", name: "CSS / DOM" },
    { id: "canvas-2d", name: "Canvas 2D" },
    { id: "media", name: "Media" },
    { id: "three-webgl", name: "Three / WebGL" },
  ];

  const TRENDS = catalog.trends?.directions || [];
  const PROJECTS = new Map(
    (catalog.trends?.projects || []).map((project) => [project.id, project]),
  );
  const promptHash = location.hash.slice(1);

  const state = {
    view: promptHash === "PROMPTS" ? "prompts" : "catalog",
    level: ["L0", "L1", "L2", "L3", "L4"].includes(promptHash)
      ? promptHash
      : "L1",
    engine: "all",
    query: "",
    promptIndustry: "all",
    promptPageType: "all",
    promptStyle: "all",
    promptLimit: 48,
  };

  const promptSearchIndex = new Map();
  const activePreviewFrames = new Map();
  let previewObserver = null;
  let toastTimer = 0;

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
    );
  }

  function levelInfo(level) {
    return LEVELS.find((item) => item.id === level);
  }

  function formatStars(value) {
    if (value >= 100000) return `${Math.round(value / 1000)}k`;
    if (value >= 10000) return `${(value / 1000).toFixed(1)}k`;
    return value.toLocaleString("zh-CN");
  }

  function renderNavigation() {
    const levels = LEVELS.map((level) => {
      const count = catalog.stats.countsByLevel[level.id];
      return `
        <button class="level-button ${state.view === "catalog" && level.id === state.level ? "active" : ""}" data-level="${level.id}" type="button">
          <span class="level-code">${level.id}</span>
          <span><span class="level-name">${level.name}</span><span class="level-note">${level.note}</span></span>
          <span class="level-count">${count}</span>
        </button>`;
    }).join("");
    const promptButton = `
      <button class="level-button prompt-nav-button ${state.view === "prompts" ? "active" : ""}" data-view="prompts" type="button">
        <span class="level-code">P</span>
        <span><span class="level-name">Prompt 库</span><span class="level-note">完整网页提示词</span></span>
        <span class="level-count">${PROMPTS?.sourceCount || 0}</span>
      </button>`;
    $("#levelNav").innerHTML = `${levels}${promptButton}`;
    if (window.matchMedia("(max-width: 840px)").matches) {
      requestAnimationFrame(() =>
        $("#levelNav .active")?.scrollIntoView({
          block: "nearest",
          inline: "center",
        }),
      );
    }

    $("#engineFilters").innerHTML = ENGINES.map(
      (engine) =>
        `<button class="engine-button ${engine.id === state.engine ? "active" : ""}" data-engine="${engine.id}" type="button">${engine.name}</button>`,
    ).join("");

    $("#engineFilters").closest(".side-section").hidden = state.view === "prompts";
    $("#sideMetrics").hidden = state.view === "prompts";
  }

  function renderOverview() {
    const stats = [
      [catalog.stats.total, "目录素材"],
      [catalog.stats.countsByLevel.L1 + catalog.stats.countsByLevel.L2, "互动道具"],
      [catalog.stats.countsByLevel.L3, "完整场景"],
      [catalog.stats.countsByLevel.L4, "页面配方"],
    ];
    $("#overviewStats").innerHTML = stats
      .map(([value, label]) => `<div class="overview-stat"><b>${value}</b><span>${label}</span></div>`)
      .join("");

    $("#sideMetrics").innerHTML = [
      [catalog.stats.countsByEngine["css-dom"], "CSS / DOM"],
      [catalog.stats.countsByEngine["canvas-2d"], "Canvas"],
      [catalog.stats.countsByEngine.media, "Media"],
      [catalog.stats.countsByEngine["three-webgl"], "Three"],
    ]
      .map(([value, label]) => `<div class="side-metric"><span class="metric-value">${value}</span><span class="metric-label">${label}</span></div>`)
      .join("");

    $("#trendUpdated").textContent = catalog.trends?.checkedAt
      ? `数据 ${new Date(catalog.trends.checkedAt).toLocaleDateString("zh-CN")}`
      : "";
    $("#trendList").innerHTML = TRENDS.map((trend, index) => {
      const projects = (trend.projectIds || [])
        .map((id) => PROJECTS.get(id))
        .filter(Boolean)
        .slice(0, 2);
      return `
        <div class="trend-item">
          <span class="trend-index">0${index + 1}</span>
          <b>${trend.name}</b>
          <span>${trend.note}</span>
          <div class="trend-projects">
            ${projects
              .map(
                (project) => `
                  <a href="${escapeHtml(project.url)}" target="_blank" rel="noreferrer" title="${escapeHtml(project.license)} · 复用风险 ${escapeHtml(project.reuseRisk)}">
                    ${escapeHtml(project.name)} <small>★ ${formatStars(project.stars)}</small>
                  </a>`,
              )
              .join("")}
          </div>
        </div>`;
    }).join("");
  }

  function matches(item) {
    if (item.level !== state.level) return false;
    if (state.engine !== "all" && item.engine !== state.engine) return false;
    const query = state.query.trim().toLowerCase();
    if (!query) return true;
    return [
      item.id,
      item.name,
      item.summary,
      item.engine,
      item.family,
      item.source?.label,
      ...(item.tags || []),
      ...(item.inputs || []),
      ...(item.dependencies || []),
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);
  }

  function inlinePreview(item) {
    return `
      <div class="preview atom-preview" data-preview-id="${escapeHtml(item.id)}">
        <span class="fx-stage-orb"></span>
        <style>${item.preview.css || ""}</style>
        ${item.preview.html || ""}
      </div>`;
  }

  function liveCardPreview(item) {
    const isFinishedPage = item.maturity === "finished-page";
    const label =
      isFinishedPage
        ? "PAGE"
        : item.engine === "three-webgl"
        ? "THREE"
        : item.engine === "canvas-2d"
          ? "CANVAS"
          : item.engine === "media"
            ? "MEDIA"
            : "DOM";
    const target = previewUrl(item);
    return `
      <div class="preview live-card-preview">
        <iframe class="ambient-frame"
          data-preview-frame="${escapeHtml(item.id)}"
          data-preview-target="${escapeHtml(target)}"
          title="${escapeHtml(item.name)} 实时预览"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"></iframe>
        <div class="preview-chrome">
          <span class="engine-glyph">${label}</span>
          <button class="run-button" data-activate="${escapeHtml(item.id)}" type="button">${isFinishedPage ? "浏览整页 ↓" : "进入互动 ↗"}</button>
        </div>
      </div>`;
  }

  function recipeVisualPreview(item) {
    const visual = item.recipe.visual;
    const [background, foreground, accent, secondary] = visual.palette;
    return `
      <div class="preview">
        <div class="recipe-scroll layout-${escapeHtml(visual.layout)}" tabindex="0"
          aria-label="${escapeHtml(item.name)} 微型页面，可在此区域内滚动"
          style="--r0:${escapeHtml(background)};--r1:${escapeHtml(foreground)};--r2:${escapeHtml(accent)};--r3:${escapeHtml(secondary)}">
          <div class="recipe-preview">
            <div class="mini-nav"><b>FX/${item.id.slice(-2).toUpperCase()}</b><span>INDEX</span><span>WORK</span><i></i></div>
            <section class="mini-hero">
              <div class="mini-copy"><small>${escapeHtml(visual.layout)}</small><strong>${escapeHtml(item.name)}</strong><i></i></div>
              <div class="mini-focal focal-${escapeHtml(visual.focal)}"><span></span><span></span><span></span></div>
            </section>
            <section class="mini-proof"><b>01</b><span>IMMERSIVE</span><b>24</b><span>SELECTED</span></section>
            <section class="mini-feature">
              <small>FEATURED / EXPERIENCE</small>
              <strong>${escapeHtml(item.recipe.sections?.[0] || "Interactive stage")}</strong>
              <div><i></i><i></i><i></i></div>
            </section>
            <section class="mini-media"><i></i><i></i><i></i><b>${escapeHtml(visual.focal)}</b></section>
            <section class="mini-detail">
              <span>02 / SYSTEM</span>
              <strong>${escapeHtml((item.recipe.stack || []).join(" + "))}</strong>
              <p>${escapeHtml(item.recipe.sections?.slice(1).join(" · ") || item.summary)}</p>
            </section>
            <section class="mini-cta"><small>NEXT PROJECT</small><b>EXPLORE THE EXPERIENCE ↗</b></section>
            <footer class="mini-footer"><i></i><b>CSS·FX / 2026</b></footer>
          </div>
        </div>
      </div>`;
  }

  function previewFor(item) {
    if (item.preview.mode === "inline") return inlinePreview(item);
    if (item.preview.mode === "recipe") return recipeVisualPreview(item);
    return liveCardPreview(item);
  }

  function itemCard(item, index) {
    const stacks = item.recipe?.stack || [];
    const isFinishedPage = item.maturity === "finished-page";
    const featured =
      (item.level === "L3" && index === 0) ||
      (item.level === "L2" && index === 0) ||
      (isFinishedPage && index === 0);
    return `
      <article class="item-card ${featured ? "featured" : ""} ${isFinishedPage ? "finished-page" : ""}" data-item="${escapeHtml(item.id)}">
        ${previewFor(item)}
        <div class="item-body">
          <div class="card-meta">
            <span class="level">${item.level}</span>
            <span class="engine-code">${escapeHtml(item.engine)}</span>
          </div>
          <h3 class="item-title">${escapeHtml(item.name)}</h3>
          <p class="item-summary">${escapeHtml(item.summary)}</p>
          ${
            isFinishedPage
              ? `<div class="finished-page-meta"><span>${escapeHtml(item.industry)}</span><span>${escapeHtml(item.recipe?.styleId)}</span></div>`
              : ""
          }
          ${
            stacks.length
              ? `<div class="stack-row">${stacks.map((stack) => `<span class="stack">${escapeHtml(stack)}</span>`).join("")}</div>`
              : `<div class="tag-row">${(item.tags || []).slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>`
          }
          <div class="input-row">${(item.inputs || []).slice(0, 4).map((input) => `<span class="input">${escapeHtml(input)}</span>`).join("")}</div>
          <div class="card-actions">
            <span class="source-label">${escapeHtml(item.source?.label)}</span>
            <button class="copy-button" data-copy="${escapeHtml(item.id)}" type="button">${isFinishedPage ? "复制成品页" : item.level === "L4" ? "复制提示词" : item.level === "L0" ? "复制片段" : "复制实现"}</button>
          </div>
        </div>
      </article>`;
  }

  function renderCatalog() {
    stopAllPreviews();
    const info = levelInfo(state.level);
    const items = catalog.items
      .filter(matches)
      .sort(
        (a, b) =>
          Number(b.maturity === "finished-page") -
          Number(a.maturity === "finished-page"),
      );

    $("#catalogKicker").textContent = `${info.id} / ${info.kicker}`;
    $("#catalogTitle").textContent = info.name;
    $("#catalogDescription").textContent = info.description;
    $("#resultCount").textContent = `${items.length} ITEMS`;
    $("#catalogGrid").innerHTML = items.map(itemCard).join("");
    $("#emptyState").hidden = items.length !== 0;
    $("#catalogGrid").hidden = items.length === 0;

    bindCardActions();
    setupLivePreviews();
  }

  const PROMPT_LABELS = {
    all: "全部",
    other: "综合",
    technology: "科技 / AI",
    finance: "金融",
    retail: "零售 / 电商",
    travel: "旅行 / 酒店",
    creative: "创意 / 作品集",
    health: "医疗 / 健康",
    education: "教育",
    "real-estate": "地产 / 建筑",
    automotive: "汽车 / 出行",
    culture: "文化 / 艺术",
    agriculture: "农业",
    food: "餐饮",
    "landing-page": "完整落地页",
    hero: "Hero 首屏",
    section: "页面区块",
    dashboard: "后台 / 数据看板",
    portfolio: "作品集",
    commerce: "电商页",
    pricing: "定价页",
    event: "活动页",
    "21st_dev": "21st.dev 组件",
    horizonx: "HorizonX 组件",
    superdesign: "Superdesign",
    "clean-commercial": "清爽商业",
    "future-tech": "未来科技",
    "spatial-3d": "3D / 空间",
    "luxury-minimal": "奢华极简",
    "editorial-type": "编辑排版",
    "cinematic-story": "电影叙事",
    "data-terminal": "数据终端",
    "nature-immersive": "自然沉浸",
    "playful-color": "活泼彩色",
    "industrial-brutalist": "工业粗野",
  };

  function promptLabel(value) {
    return PROMPT_LABELS[value] || value;
  }

  function promptFilterOptions(values) {
    return [
      '<option value="all">全部</option>',
      ...Object.entries(values)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "en"))
        .map(
          ([value, count]) =>
            `<option value="${escapeHtml(value)}">${escapeHtml(promptLabel(value))} · ${count}</option>`,
        ),
    ].join("");
  }

  function setupPromptFilters() {
    if ($("#promptIndustry").options.length) return;
    $("#promptIndustry").innerHTML = promptFilterOptions(PROMPTS.stats.byIndustry);
    $("#promptPageType").innerHTML = promptFilterOptions(PROMPTS.stats.byPageType);
    $("#promptStyle").innerHTML = promptFilterOptions(PROMPTS.stats.byStyle);
  }

  function promptSearchText(item) {
    if (!promptSearchIndex.has(item.id)) {
      promptSearchIndex.set(
        item.id,
        [
          item.title,
          item.summary,
          item.collection,
          item.industry,
          item.pageType,
          item.style,
          item.sourcePath,
          ...(item.engines || []),
          ...(item.signals || []),
          item.content,
        ]
          .join("\n")
          .toLowerCase(),
      );
    }
    return promptSearchIndex.get(item.id);
  }

  function matchesPrompt(item) {
    if (
      state.promptIndustry !== "all" &&
      item.industry !== state.promptIndustry
    ) {
      return false;
    }
    if (
      state.promptPageType !== "all" &&
      item.pageType !== state.promptPageType
    ) {
      return false;
    }
    if (state.promptStyle !== "all" && item.style !== state.promptStyle) {
      return false;
    }
    const query = state.query.trim().toLowerCase();
    return !query || promptSearchText(item).includes(query);
  }

  function promptCard(item) {
    const aliases = item.aliases?.length
      ? `<span class="prompt-alias">另含 ${item.aliases.length} 个重复来源</span>`
      : "";
    const availability =
      item.status === "available"
        ? `
          <details class="prompt-details">
            <summary>查看完整 PROMPT</summary>
            <pre>${escapeHtml(item.content)}</pre>
          </details>`
        : `
          <div class="prompt-unavailable">
            源记录存在，但上游没有提供可用正文。
          </div>`;

    return `
      <article class="prompt-card ${item.status === "available" ? "" : "is-unavailable"}" data-prompt="${escapeHtml(item.id)}">
        <div class="prompt-card-top">
          <span class="prompt-collection">${escapeHtml(item.collection)}</span>
          <span class="prompt-status">${item.status === "available" ? "READY" : "SOURCE EMPTY"}</span>
        </div>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.summary)}</p>
        <div class="prompt-tags">
          <span>${escapeHtml(promptLabel(item.industry))}</span>
          <span>${escapeHtml(promptLabel(item.pageType))}</span>
          <span>${escapeHtml(promptLabel(item.style))}</span>
        </div>
        ${availability}
        <footer class="prompt-card-actions">
          <a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noreferrer">查看来源 ↗</a>
          ${aliases}
          <button class="copy-button" data-prompt-copy="${escapeHtml(item.id)}" type="button" ${item.status === "available" ? "" : "disabled"}>复制 PROMPT</button>
        </footer>
      </article>`;
  }

  function renderPromptLibrary() {
    setupPromptFilters();
    const matches = PROMPTS.items
      .filter(matchesPrompt)
      .sort(
        (a, b) =>
          Number(b.status === "available") - Number(a.status === "available") ||
          Number(!/^\d+$/.test(b.title.trim())) -
            Number(!/^\d+$/.test(a.title.trim())) ||
          a.title.localeCompare(b.title, "en", { sensitivity: "base" }),
      );
    const visible = matches.slice(0, state.promptLimit);

    $("#promptResultCount").textContent = `${matches.length} RESULTS`;
    $("#promptGrid").innerHTML = visible.map(promptCard).join("");
    $("#promptEmptyState").hidden = matches.length !== 0;
    $("#promptGrid").hidden = matches.length === 0;
    $("#promptLoadMore").hidden = visible.length >= matches.length;
    if (visible.length < matches.length) {
      $("#promptLoadMore").textContent =
        `加载更多 · 已显示 ${visible.length} / ${matches.length}`;
    }

    $$("[data-prompt-copy]").forEach((button) =>
      button.addEventListener("click", () =>
        copyPrompt(button.dataset.promptCopy, button),
      ),
    );
  }

  function renderCurrentView() {
    const promptMode = state.view === "prompts";
    $(".overview").hidden = promptMode;
    $("#trendRadar").hidden = promptMode;
    $("#catalog").hidden = promptMode;
    $("#promptLibrary").hidden = !promptMode;
    $("#searchInput").placeholder = promptMode
      ? "搜索 661 条 Prompt 的标题、正文、技术或交互"
      : "搜索效果、输入方式、引擎或来源";
    $("#searchInput").setAttribute(
      "aria-label",
      promptMode ? "搜索 Prompt 库" : "搜索素材",
    );
    if (promptMode) {
      stopAllPreviews();
      renderPromptLibrary();
    } else {
      renderCatalog();
    }
  }

  function previewUrl(item) {
    if (item.preview.page) return `./${item.preview.page}`;
    if (item.preview.scene) return `./${item.preview.scene}`;
    if (item.preview.runner) return `./${item.preview.runner}`;
    return "";
  }

  function embeddedPreviewFor(target) {
    const key = target.replace(/^\.\//, "").split("?")[0];
    return window.FX_EMBEDDED_PREVIEWS?.[key] || "";
  }

  function withCoverMode(target) {
    const separator = target.includes("?") ? "&" : "?";
    return `${target}${separator}cover=1&fxv=20260728.7`;
  }

  function embeddedPreviewDocument(html, target) {
    const selected = embedRuntimeSelection(html, target);
    return selected.replace(
      /<head(\s[^>]*)?>/i,
      (head) => `${head}<script>window.__FX_COVER__=true;<\/script>`,
    );
  }

  function loadLiveFrame(frame) {
    if (!frame || frame.dataset.loaded === "true") return;
    frame.dataset.loaded = "true";
    const target = withCoverMode(frame.dataset.previewTarget);
    const embedded = embeddedPreviewFor(target);
    if (embedded) frame.srcdoc = embeddedPreviewDocument(embedded, target);
    else frame.src = target;
  }

  function setupLivePreviews() {
    previewObserver?.disconnect();
    const frames = $$(".ambient-frame");
    previewObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          loadLiveFrame(entry.target);
          previewObserver?.unobserve(entry.target);
        });
      },
      { rootMargin: "320px 0px" },
    );
    frames.forEach((frame) => previewObserver.observe(frame));
  }

  function activatePreview(itemId) {
    const item = catalog.items.find((candidate) => candidate.id === itemId);
    const card = document.querySelector(`[data-item="${CSS.escape(itemId)}"]`);
    const frame = card ? $(".ambient-frame", card) : null;
    const button = card ? $("[data-activate]", card) : null;
    if (!item || !card || !frame || !button) return;

    if (card.classList.contains("is-running")) {
      deactivatePreview(itemId);
      return;
    }
    if (item.level === "L3") deactivateHeavyScenesExcept(itemId);
    loadLiveFrame(frame);
    card.classList.add("is-running");
    button.textContent =
      item.maturity === "finished-page" ? "退出整页 ×" : "退出互动 ×";
    frame.contentWindow?.postMessage({ type: "fx:activate" }, "*");
    frame.addEventListener(
      "load",
      () => {
        if (card.classList.contains("is-running")) {
          frame.contentWindow?.postMessage({ type: "fx:activate" }, "*");
        }
      },
      { once: true },
    );
    activePreviewFrames.set(itemId, {
      frame,
      card,
      button,
      level: item.level,
      maturity: item.maturity,
    });
    frame.focus();
    card.scrollIntoView({
      block: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  function deactivateHeavyScenesExcept(itemId) {
    for (const [activeId, active] of activePreviewFrames) {
      if (active.level === "L3" && activeId !== itemId) deactivatePreview(activeId);
    }
  }

  function deactivatePreview(itemId) {
    const active = activePreviewFrames.get(itemId);
    if (!active) return;
    active.frame.contentWindow?.postMessage({ type: "fx:deactivate" }, "*");
    active.card.classList.remove("is-running");
    active.button.textContent =
      active.maturity === "finished-page" ? "浏览整页 ↓" : "进入互动 ↗";
    activePreviewFrames.delete(itemId);
  }

  function stopAllPreviews() {
    previewObserver?.disconnect();
    previewObserver = null;
    $$(".ambient-frame").forEach((frame) =>
      frame.contentWindow?.postMessage({ type: "fx:dispose" }, "*"),
    );
    activePreviewFrames.clear();
  }

  function bindCardActions() {
    $$("[data-activate]").forEach((button) =>
      button.addEventListener("click", () => activatePreview(button.dataset.activate)),
    );
    $$("[data-copy]").forEach((button) =>
      button.addEventListener("click", () => copyItem(button.dataset.copy, button)),
    );
  }

  async function copyPayload(item) {
    if (item.copy.snippet) return item.copy.snippet;
    if (item.copy.prompt) return item.copy.prompt;
    const target = item.copy.standalone || item.copy.module;
    if (!target) throw new Error("没有可复制内容");

    const relativeTarget = target.replace(/^demo\//, "./");
    if (/\.html(?:\?|$)/.test(relativeTarget)) {
      const embedded = embeddedPreviewFor(relativeTarget);
      if (embedded) return embedRuntimeSelection(embedded, target);
      const response = await fetch(relativeTarget.split("?")[0]);
      if (response.ok) {
        const html = await response.text();
        return embedRuntimeSelection(html, target);
      }
    }
    return target;
  }

  async function copyItem(itemId, button) {
    const item = catalog.items.find((candidate) => candidate.id === itemId);
    if (!item) return;
    try {
      const payload = await copyPayload(item);
      await copyText(payload);
      button.textContent = "已复制";
      showToast(`${item.name} 已复制`);
          setTimeout(() => {
            button.textContent =
              item.maturity === "finished-page"
                ? "复制成品页"
                : item.level === "L4"
                  ? "复制提示词"
                  : item.level === "L0"
                    ? "复制片段"
                    : "复制实现";
          }, 1200);
    } catch (error) {
      window.__copyErrors = window.__copyErrors || [];
      window.__copyErrors.push(String(error?.message || error));
      button.textContent = "复制失败";
      showToast("浏览器拒绝了复制，请在本地服务器中打开");
    }
  }

  async function copyPrompt(itemId, button) {
    const item = PROMPTS.items.find((candidate) => candidate.id === itemId);
    if (!item || item.status !== "available") return;
    try {
      await copyText(item.content);
      button.textContent = "已复制";
      showToast(`${item.title} Prompt 已复制`);
      setTimeout(() => {
        button.textContent = "复制 PROMPT";
      }, 1200);
    } catch (error) {
      window.__copyErrors = window.__copyErrors || [];
      window.__copyErrors.push(String(error?.message || error));
      button.textContent = "复制失败";
      showToast("浏览器拒绝了复制，请在本地服务器中打开");
    }
  }

  async function copyText(text) {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.readOnly = true;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    if (!copied) throw new Error("copy command rejected");
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
  }

  function setLevel(level) {
    state.view = "catalog";
    state.level = level;
    history.replaceState(null, "", `#${level}`);
    renderNavigation();
    renderCurrentView();
    $("#catalog").scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function setPromptView() {
    state.view = "prompts";
    state.promptLimit = 48;
    history.replaceState(null, "", "#PROMPTS");
    renderNavigation();
    renderCurrentView();
    $("#promptLibrary").scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function resetFilters() {
    state.engine = "all";
    state.query = "";
    state.promptIndustry = "all";
    state.promptPageType = "all";
    state.promptStyle = "all";
    state.promptLimit = 48;
    $("#searchInput").value = "";
    if (PROMPTS?.items?.length) {
      $("#promptIndustry").value = "all";
      $("#promptPageType").value = "all";
      $("#promptStyle").value = "all";
    }
    renderNavigation();
    renderCurrentView();
  }

  function bindShell() {
    $("#levelNav").addEventListener("click", (event) => {
      const button = event.target.closest("[data-level]");
      if (button) setLevel(button.dataset.level);
      const promptButton = event.target.closest('[data-view="prompts"]');
      if (promptButton) setPromptView();
    });
    $("#engineFilters").addEventListener("click", (event) => {
      const button = event.target.closest("[data-engine]");
      if (!button) return;
      state.engine = button.dataset.engine;
      renderNavigation();
      renderCurrentView();
    });
    $("#searchInput").addEventListener("input", (event) => {
      state.query = event.target.value;
      state.promptLimit = 48;
      renderCurrentView();
    });
    for (const [selector, key] of [
      ["#promptIndustry", "promptIndustry"],
      ["#promptPageType", "promptPageType"],
      ["#promptStyle", "promptStyle"],
    ]) {
      $(selector).addEventListener("change", (event) => {
        state[key] = event.target.value;
        state.promptLimit = 48;
        renderPromptLibrary();
      });
    }
    $("#promptLoadMore").addEventListener("click", () => {
      state.promptLimit += 48;
      renderPromptLibrary();
    });
    $("#resetButton").addEventListener("click", resetFilters);
    $("#themeButton").addEventListener("click", () => {
      document.documentElement.dataset.theme =
        document.documentElement.dataset.theme === "dark" ? "" : "dark";
    });
    window.addEventListener("pagehide", stopAllPreviews);
  }

  if (!catalog?.items?.length) {
    document.body.innerHTML = "<p>素材目录加载失败。</p>";
    return;
  }

  renderNavigation();
  renderOverview();
  renderCurrentView();
  bindShell();
  if (window.FX_SINGLE_FILE) $("#singleFileDownload")?.setAttribute("hidden", "");
})();
