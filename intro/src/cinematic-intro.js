import { createScene } from "./scene.js";

const INTRO_DURATION_MS = 8000;
const root = document.documentElement;
const canvas = document.querySelector("#cinematicCanvas");
const skipIntro = document.querySelector("#skipIntro");
const replayIntro = document.querySelector("#replayIntro");
const status = document.querySelector("#status");
const fallback = document.querySelector("#fallback");
const parameters = new URLSearchParams(window.location.search);
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const reducedMotion = parameters.get("motion") === "reduce" || motionPreference.matches;

let sceneController;
let frameRequest = 0;
let startedAt = 0;
let state = "boot";
let disposed = false;

function setState(nextState, message) {
  state = nextState;
  root.dataset.introState = nextState;
  if (message) status.textContent = message;
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function requestFrame() {
  if (!frameRequest && !disposed && document.visibilityState !== "hidden") {
    frameRequest = window.requestAnimationFrame(frame);
  }
}

function reveal() {
  if (!sceneController || disposed) return;
  sceneController.setProgress(1);
  sceneController.render(performance.now());
  setState("revealed", "CSS.FX 互动界面已进入");
  window.cancelAnimationFrame(frameRequest);
  frameRequest = 0;
}

function frame(time) {
  frameRequest = 0;
  if (disposed || !sceneController) return;

  if (state === "playing") {
    const rawProgress = Math.min(1, (time - startedAt) / INTRO_DURATION_MS);
    sceneController.setProgress(easeInOutCubic(rawProgress));
    sceneController.render(time);
    status.textContent = `正在进入 CSS.FX 场景 · ${String(
      Math.round(rawProgress * 100),
    ).padStart(2, "0")}%`;
    if (rawProgress >= 1) {
      reveal();
      return;
    }
    requestFrame();
  }
}

function playIntro() {
  if (!sceneController || disposed) return;
  if (reducedMotion) {
    reveal();
    return;
  }
  window.cancelAnimationFrame(frameRequest);
  frameRequest = 0;
  sceneController.setActive(true);
  sceneController.setProgress(0);
  sceneController.render(performance.now());
  startedAt = performance.now();
  setState("playing", "正在进入 CSS.FX 场景 · 00%");
  requestFrame();
}

function handleSkipIntro() {
  reveal();
}

function handleReplayIntro() {
  playIntro();
}

function handleResize() {
  sceneController?.resize(window.innerWidth, window.innerHeight);
  sceneController?.render(performance.now());
}

function handleVisibilityChange() {
  if (!sceneController || disposed) return;
  const visible = document.visibilityState !== "hidden";
  sceneController.setActive(visible);
  if (!visible) {
    window.cancelAnimationFrame(frameRequest);
    frameRequest = 0;
    return;
  }
  if (state === "playing") {
    startedAt = performance.now();
    requestFrame();
  } else {
    sceneController.render(performance.now());
  }
}

function dispose() {
  if (disposed) return;
  disposed = true;
  window.cancelAnimationFrame(frameRequest);
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  skipIntro.removeEventListener("click", handleSkipIntro);
  replayIntro.removeEventListener("click", handleReplayIntro);
  sceneController?.dispose();
}

function activateFallback(error) {
  console.error("Cinematic intro fallback:", error);
  fallback.hidden = false;
  canvas.hidden = true;
  setState("fallback", "WebGL 不可用，已显示静态入口");
}

function boot() {
  try {
    if (parameters.get("fallback") === "1") {
      throw new Error("Diagnostic fallback requested");
    }
    sceneController = createScene(canvas, { reducedMotion });
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", dispose, { once: true });
    skipIntro.addEventListener("click", handleSkipIntro);
    replayIntro.addEventListener("click", handleReplayIntro);
    playIntro();
  } catch (error) {
    activateFallback(error);
  }
}

window.__cinematicIntro = {
  getState: () => state,
  getProgress: () => sceneController?.getProgress() ?? 0,
  getRendererInfo: () => sceneController?.getRendererInfo() ?? null,
  isReducedMotion: () => reducedMotion,
  skip: handleSkipIntro,
  replay: handleReplayIntro,
  dispose,
};

boot();
