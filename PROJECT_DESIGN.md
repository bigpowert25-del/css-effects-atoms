# CSS·FX Layered Library — Project Design

## 1. Project Promise

- Source request or signal: expand the existing CSS atom gallery with interactive props, complete scenes, Three.js/WebGL work, and prompt-derived page recipes.
- User-visible outcome: one local library where a user can browse from a tiny visual atom to a complete interactive page, run heavy scenes safely, and copy the right kind of implementation package.
- Why this is worth doing now: the current 170-card gallery proves atom curation, but it flattens interactions and complete scenes into the wrong shape.
- Project type: local creative-development tool.

## 2. Boundary Card

```yaml
status: bounded
task_goal: "Upgrade css-effects-atoms into an L0-L4 layered interaction library."
in_scope:
  - current 170 curated atoms
  - 405 local MotionSites prompts
  - the supplied rolling-tape and Tengwang-curtain HTML examples
  - read-only GitHub trend research
  - local demo, registries, tests, screenshots, and build tools
out_of_scope:
  - modifying the NAS source library
  - publishing, pushing, deploying, or sending externally
  - bulk-converting every prompt into production code in the first checkpoint
allowed_reads:
  - css-effects-atoms local copy
  - motionsites_661/prompts local copy
  - two supplied HTML files
  - public GitHub and official library documentation
allowed_writes:
  - Local project checkout
external_actions: "read-only research; no remote writes"
success_evidence:
  - all L0-L4 layers are visible and filterable
  - representative interactions run with pointer and touch
  - rolling tape and Tengwang curtain run from isolated scene pages
  - heavy previews start only after an explicit action
  - schema and build tests pass
  - desktop and mobile browser acceptance screenshots exist
stop_conditions:
  - an implementation requires credentials, paid assets, or remote publication
  - supplied source ownership or license becomes ambiguous enough to block local use
next_action: "Build the local layered-library checkpoint."
```

## 3. Product Model

Complexity and rendering technology are separate axes.

| Level | Meaning | First-checkpoint content |
| --- | --- | --- |
| L0 Atom | One visual primitive | 170 curated CSS atoms |
| L1 Behavior | One reusable input-response mechanic | magnetic pull, cursor reveal, drag, pointer parallax, physics curtain, video scrub |
| L2 Component | A bounded interactive UI object | drag carousel, lens viewer, kinetic type, particle panel |
| L3 Scene | A complete immersive viewport or section | rolling tape, Tengwang curtain, Three particle network |
| L4 Recipe | Composition guidance for a complete page | selected MotionSites prompt recipes with stack, assets, interaction map, and copy prompt |

Every item also declares one primary engine:

`css-dom | canvas-2d | media | three-webgl`

Three.js is therefore not treated as a higher level than Canvas. A tiny shader can be L0, while a complete Three.js portfolio can be L3 or L4.

## 4. Core Loop

```text
choose level or engine -> inspect a real preview -> run isolated interaction ->
copy snippet / standalone page / implementation prompt -> return to filtered library
```

The first 30 seconds should let a user:

1. switch from Atoms to Interactions or Scenes;
2. see which engine and input method each item uses;
3. run one real interaction;
4. copy the appropriate payload.

## 5. Preview And Runtime Contract

- L0 previews remain scoped inline because they are cheap and already sanitized.
- L1/L2 previews use a reusable sandbox runner with pointer and touch support.
- L3 previews show a poster first and create an iframe only after `Run`.
- Only one heavy iframe may run at a time.
- Removing or replacing a heavy iframe is the hard cleanup boundary.
- Three scenes must cap device pixel ratio at 2, expose a pause path, and include a non-WebGL fallback.
- `prefers-reduced-motion` disables autonomous motion or replaces it with user-driven motion.
- The supplied rolling-tape scene remains on Three r128 inside its iframe. New Three scenes use a current isolated ESM runtime.

## 6. Copy Contract

The copy action follows the level:

- L0: HTML + scoped CSS.
- L1/L2: standalone HTML or reusable module, plus dependency list.
- L3: full standalone page, runtime notes, and fallback requirements.
- L4: implementation prompt, stack, source prompt path, assets, and acceptance checklist.

Copying a scene never silently copies only its CSS.

## 7. Data Model

All entries use one discriminated schema:

```text
id, name, level, engine, family, summary, tags, source,
preview, copy, dependencies, inputs, performance, accessibility,
maturity, trend, provenance
```

Required level-specific fields:

- L0: `snippet`.
- L1/L2: `preview.runner` and `inputs`.
- L3: `preview.scene`, `performance.fallback`, and cleanup notes.
- L4: `recipe.stack`, `recipe.sections`, and `copy.prompt`.

## 8. Reuse Scan

```text
reuse_decision: adapt
reason: preserve the existing vanilla gallery and isolate proven runtime libraries per scene.
checked_at: 2026-07-27
sources: Three.js, Motion, GSAP ScrollTrigger, MDN iframe lazy loading, MotionSites prompts, GitHub trend scan
```

- Adopt Three.js for 3D rendering; do not hand-roll a 3D engine.
- Use native Pointer Events and Canvas 2D for small mechanics.
- Reference Motion/GSAP patterns where physics or scroll orchestration benefits, without forcing React into the existing vanilla app.
- Use lazy sandboxed iframes for heavy previews.
- Treat external component galleries as trend and interaction references; copy no code without a compatible license.

## 9. Architecture

```text
registry/layered-library.source.json
registry/layered-library.schema.json
                 |
                 v
tools/build-layered-library.mjs
                 |
     +-----------+-------------+
     v                         v
registry/layered-library.json  demo/generated-data.js
                                  |
                                  v
demo/index.html + app.css + app.js
     |                    |
     |                    +-- previews/interaction-runner.html
     +-- scenes/*.html (isolated heavy scenes)
```

The build tool merges existing curated atoms with hand-selected L1-L4 manifests and rejects incomplete scene metadata.

## 10. First Checkpoint

- Keep all 170 existing curated atoms.
- Add at least 10 L1 behaviors.
- Add at least 6 L2 components.
- Add at least 3 L3 scenes, including both supplied examples.
- Add at least 8 L4 recipes selected from the 405 prompts.
- Add a trend radar that explains which GitHub-backed directions influenced the selection.
- Provide search, level filter, engine filter, run/stop, and level-aware copy actions.

Expansion beyond this checkpoint requires the first schema and runtime acceptance to pass.

## 11. Risks And Fallbacks

- GPU overload: poster-first previews and one-heavy-scene limit.
- Version conflicts: iframe isolation and pinned per-scene dependencies.
- Unclear prompt completeness: label recipe maturity instead of claiming it is runnable.
- Mobile interaction mismatch: every pointer mechanic gets a touch path or explicit desktop-only label.
- WebGL unavailable: show poster and implementation details; do not leave a blank canvas.
- CDN unavailable: scene reports dependency failure and keeps the gallery usable.

Rollback is local: restore the previous `demo/index.html`; all new registry and scene files are additive. NAS source material remains untouched.

## 12. Acceptance

- Node tests validate schema, counts, source paths, preview files, and heavy-scene metadata.
- Browser smoke verifies filters, search, copy flow, run/stop lifecycle, and no console errors.
- Desktop and 390px mobile screenshots show no overlap or horizontal overflow.
- Canvas and Three scenes produce nonblank pixels.
- Reduced-motion and WebGL fallback states are manually checked.
- Final status distinguishes implementation, local verification, and browser acceptance.
