# CSS.FX 网页互动素材库

CSS.FX 是一个从视觉原子扩展到完整互动页面的本地网页素材库。它把
CSS、Canvas 2D、Media 和 Three/WebGL 放进同一套分层目录，并提供实时
预览、搜索、筛选、完整 Prompt 展开和一键复制。

> 使用限制：本项目新增的整理、分类、界面、演示和构建代码仅供个人
> 学习、研究与练习参考，禁止商业使用、转售或作为付费产品重新打包。
> 第三方材料仍遵循各自原始许可证，详见
> [LICENSE.md](./LICENSE.md) 和
> [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

## 内容规模

| 层级 | 内容 | 数量 |
| --- | --- | ---: |
| L0 | 视觉原子 | 170 |
| L1 | 互动行为 | 24 |
| L2 | 互动组件 | 24 |
| L3 | 完整场景 | 20 |
| L4 | 页面配方与成品页 | 30 |
| Prompt 库 | MotionSites 源记录 | 661 |

Prompt 库的真实数据口径：

- 661 条上游源记录
- 659 条去重记录
- 656 条含完整正文、可直接复制
- 3 条上游记录没有可用 Prompt 正文
- 2 组正文完全重复，展示时合并并保留来源信息

## Prompt 来源

完整 Prompt 数据来自：

- 上游仓库：
  [nomaan5541/motionsites-prompt-collection](https://github.com/nomaan5541/motionsites-prompt-collection)
- 上游目录：
  [`motionsites-prompts/`](https://github.com/nomaan5541/motionsites-prompt-collection/tree/main/motionsites-prompts)
- 固定版本：
  `2a8c639aff9007999afb4243db3e0fec28bb4a31`
- 上游许可证：MIT

本项目没有声称创作这些原始 Prompt。项目所做的是分类、去重、Schema
整理、搜索索引、展示界面、交互预览和单文件打包。上游 MotionSites
内容仍保留其 MIT 权利，不受本项目额外的非商用限制影响。

早期本地快照只有 405 个 Markdown 文件；仓库中的完整 Prompt Library
改用上游 `motionsites-prompts/` 目录重新核验，因此最终源记录数为 661。

## 运行

```bash
./tools/start-demo.sh 9876
```

打开：

- 默认入口：<http://127.0.0.1:9876/>
- 素材库：<http://127.0.0.1:9876/demo/index.html>
- 电影感开场：<http://127.0.0.1:9876/intro/>
- Prompt 库：<http://127.0.0.1:9876/demo/index.html#PROMPTS>

Prompt 库支持：

- 标题、正文、技术栈、交互方式和来源全文搜索
- 行业、页面类型和视觉风格筛选
- 展开查看完整 Prompt
- 一键复制 Prompt
- 每批 48 条渐进加载

## 电影感开场

电影感开场是 CSS.FX 的可选 Three.js 入口，不改变素材库的默认首页。
它使用仓库内的本地 Three.js 文件，包含跳过、重播、减弱动效和 WebGL
静态降级；开场中的 ATOMS、INTERACTIONS 和 SCENES 会进入真实素材库的
L0、L1 和 L3 分类。

体验入口：<http://127.0.0.1:9876/intro/>

## 单 HTML

无需项目环境即可打开：

```text
demo/downloads/css-fx-library-single.html
```

该文件内嵌目录数据、661 条 Prompt 来源数据、交互运行器、场景和成品页
预览，当前大小约 11.84 MB。

## 构建

从已取得的 MotionSites `motionsites-prompts/` 目录生成 Prompt 数据：

```bash
node tools/build-prompt-library.mjs \
  --source /path/to/motionsites-prompts \
  --output registry/motionsites-prompt-library.json \
  --browser-output demo/generated-prompts.js \
  --commit 2a8c639aff9007999afb4243db3e0fec28bb4a31 \
  --commit-date 2026-07-22T02:43:07-07:00
```

重新生成分层目录与单文件：

```bash
node tools/build-layered-library.mjs
node tools/build-single-html.mjs
```

## 验证

```bash
node --test tests/*.test.mjs
```

当前验收结果：

- 41/41 自动化测试通过
- 桌面版无横向溢出
- 390 x 844 手机视口通过
- Prompt 筛选、全文搜索、展开、复制和渐进加载通过
- 项目文件与本地运行副本哈希一致

## 目录

```text
atoms/       自动提取的视觉原子
registry/    精选目录、Schema、Prompt 数据和来源报告
demo/        展示页、运行器、完整场景和单 HTML
tests/       数据、交互、预览和打包测试
tools/       分类、构建、打包和本地服务脚本
docs/        设计、实施与验收记录
```

## 使用边界

- 可以：个人学习、非商业研究、课堂练习、私下修改和本地试验。
- 不可以：商业项目、收费服务、转售、付费课程素材包、二次打包销售。
- 不授予任何第三方商标、图片、视频、字体或网页设计的额外权利。
- 准备公开发布衍生作品前，请自行替换不确定来源的媒体并复核许可证。
