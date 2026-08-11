# CSS.FX 电影开场整合设计

## 状态

- 设计状态：待用户审阅
- 目标仓库：`/Users/mac/Documents/完项目/38-css-effects-atoms/css-effects-atoms`
- 当前基线：`main`，工作树干净
- 发布边界：只设计本地合并；GitHub 推送、Pages 部署和公开发布另行授权

## 目标

将已经验证过的 Three.js 电影感开场从独立实验整理成主仓库内的可选体验：

- CSS.FX 原素材库继续是默认首页。
- 电影开场通过 `/intro/` 进入。
- 开场菜单进入同一仓库内真实的 CSS.FX 分类页面。
- 原有素材库、目录数据、构建脚本和单 HTML 产物保持可用。
- 合并后可在本地静态服务和 GitHub Pages 相对路径下运行。

## 非目标与边界

- 不新建第二个 GitHub 仓库。
- 不把 CSS.FX 仓库嵌套为子仓库或 Git submodule。
- 不把实验目录的 `launchctl` 服务、临时 `/library/` 打包逻辑、隔离合同和调试过程文件带入主运行路径。
- 不修改 CSS.FX 原有素材的内容、数据口径或构建产物语义。
- 不在本设计阶段推送、部署、改变仓库可见性或发送外部消息。
- 不复制外部作品的模型、纹理、代码、品牌或精确构图；开场继续使用原创程序化场景。

## 仓库结构

```text
css-effects-atoms/
├── index.html                  # 默认入口：自动进入 ./demo/index.html
├── intro/
│   ├── index.html              # 电影感开场
│   ├── src/
│   │   ├── cinematic-intro.js
│   │   ├── scene.js
│   │   └── styles.css
│   ├── vendor/
│   │   ├── three.module.js
│   │   ├── three.core.js
│   │   └── THREE-LICENSE.txt
│   └── README.md
├── demo/                       # 原 CSS.FX 素材库，路径与内部结构保持不变
├── atoms/
├── registry/
├── tests/
└── tools/
```

实验中的截图、浏览器测量和过程性结果保留在原隔离目录，主仓库只接收运行所需文件和面向使用者的 `intro/README.md`。若需要展示证据，另行选择进入 `docs/`，不与运行时资源混放。

## 入口与导航

### 根入口

新增根目录 `index.html`，提供可访问的自动跳转和手动后备链接：

```text
根地址 → ./demo/index.html
```

跳转页不依赖服务器重写规则，适配本地 `python3 -m http.server` 和 GitHub Pages。若 JavaScript 或 meta refresh 被禁用，页面仍显示“进入 CSS.FX 素材库”的普通链接。

### 电影开场入口

```text
/intro/
```

开场菜单使用同仓库相对路径：

```text
ATOMS        → ../demo/index.html#L0
INTERACTIONS → ../demo/index.html#L1
SCENES       → ../demo/index.html#L3
```

不使用绝对域名、不使用新标签页、不使用 JavaScript 拦截导航。这样本地目录、GitHub Pages 项目路径和后续自定义域名都只依赖相对路径。

## 组件与数据流

1. 根 `index.html` 将访问者送入现有 `demo/index.html`。
2. 主 README 的体验入口指向 `intro/index.html`。
3. `intro/index.html` 加载本地 Three.js、场景模块和开场状态机。
4. 开场状态机负责播放、跳过、重播、减弱动效、页面隐藏暂停和 WebGL 降级。
5. 开场菜单只负责普通 HTML 导航，目标由 `demo/app.js` 读取 `#L0/#L1/#L3` 并渲染现有分类。
6. CSS.FX 原有 `demo/`、`registry/` 和构建脚本不需要知道 `intro/` 的内部实现。

每个目录保持单向依赖：`intro/` 可以链接到 `demo/`，但 `demo/` 不反向依赖开场脚本、Three.js 或实验服务。

## 运行与错误处理

- 入口跳转失败：根页保留可见手动链接；静态服务器返回错误时不伪造成功状态。
- WebGL 不可用：开场显示已有静态降级入口，仍可进入 `demo/`。
- 用户偏好减弱动效：直接显示可用的开场界面，不依赖 8 秒动画完成。
- 资源缺失：测试在静态层检查 `intro` 的模块、Three.js 核心文件和许可证文件；浏览器验收记录控制台错误与空白画布。
- GitHub Pages 子路径：所有开场资源和菜单目标使用相对路径，禁止写死 `/demo/` 或域名根路径。

## 许可证与归属

- 主仓库现有个人非商业参考许可继续适用于新增原创整理、界面和开场代码。
- `intro/vendor/THREE-LICENSE.txt` 随运行时保留。
- `THIRD_PARTY_NOTICES.md` 增加 Three.js 版本、来源和 MIT 许可说明。
- 不把 CSS.FX 项目声明为 Three.js 或任何外部作品的官方项目。
- README 明确开场是 CSS.FX 的原创实验入口，第三方素材权利不因整合而扩大。

## 测试与验收

### 静态合同

- 根入口存在并指向 `./demo/index.html`。
- `intro/` 的模块、Three.js 文件、许可证和本地资源全部存在。
- 不再出现 `/library/`、临时服务端口或实验路径。
- 三个开场菜单准确指向 `../demo/index.html#L0/L1/L3`。
- 运行时无远程依赖 URL。

### 回归测试

- CSS.FX 原有 41 项测试必须全部通过。
- 将隔离实验中仍适用于主仓库的开场行为测试迁移到 `tests/`，删除仅用于证明“不能修改 CSS.FX”的隔离测试。
- 增加根入口、相对路径和开场到真实目录的联合测试。
- `git diff --check`、JavaScript 语法检查和主仓库构建检查必须通过。

### 浏览器验收

- `/demo/index.html` 默认首页正常加载并能按 `#L0/#L1/#L3` 定位。
- `/intro/` 在桌面和 390×844 移动视口无横向溢出。
- 正常开场在 10 秒内进入可用界面；跳过在 1 秒内生效。
- `?motion=reduce` 和 WebGL 降级入口可用。
- 通过开场菜单实际进入三个 CSS.FX 分类；记录控制台错误、HTTP 资源状态和最终地址。

整体完成条件是实施、本地回归、浏览器端到端验收和发布状态分别有证据；未授权的推送或部署不影响本地合并验收，但必须保持 `not_authorized`。

## 回滚

本地回滚范围只包含新增的根 `index.html`、`intro/` 文件、测试和文档。删除这些新增内容并恢复 README、第三方声明和测试即可回到当前 CSS.FX 基线；`demo/`、`atoms/`、`registry/` 和既有构建脚本不需要恢复。

## 变更清单（实现阶段）

- 新增根 `index.html`。
- 新增 `intro/` 运行时目录及面向使用者的 README。
- 修改开场菜单相对路径。
- 修改主 README 的入口、运行和许可证说明。
- 修改 `THIRD_PARTY_NOTICES.md`。
- 新增或迁移开场与入口合同测试。
- 不修改 CSS.FX 目录数据和既有 demo 实现。
