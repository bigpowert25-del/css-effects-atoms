# CSS·FX 内容密度扩容设计

## 状态与授权

- 状态：已批准执行
- 授权来源：用户于 2026-07-28 明确选择“展现形式好”的混合方案，并要求无需再次确认、直接完成。
- 基线：当前目录不是 Git 仓库；40 个项目文件的基线清单哈希为 `601c22c0859d4d0d10a2c6117b851e14f9c2da88b0f41de1caf6a6575d2576f0`。

## 目标

把当前“架构证明”升级为有实际浏览密度的互动素材库：

| 层级 | 当前 | 本轮目标 |
| --- | ---: | ---: |
| L1 互动行为 | 10 | 24 |
| L2 互动组件 | 6 | 24 |
| L3 完整场景 | 3 | 20 |
| L4 页面配方 | 8 | 24 |

另外交付一个自包含的单文件 HTML，双击即可浏览目录和轻量预览。

## 边界

```yaml
status: bounded
task_goal: "扩充 L1-L4 内容密度，修复 L4 空预览，并生成单文件交付。"
in_scope:
  - 当前 css-effects-atoms 本地项目
  - MotionSites prompts 的只读选材
  - 共享互动运行器、场景运行器、L4 微型页面预览
  - 单 HTML 构建器、测试、截图和本地运行镜像
out_of_scope:
  - 修改 NAS 原始 prompts
  - 复制许可证受限的第三方组件源码
  - 发布、推送、上传或部署到公网
success_evidence:
  - L1/L2/L3/L4 分别达到 24/24/20/24
  - L4 每张卡片有非空且不同的页面构图
  - 20 个 L3 入口均可启动，且只运行一个重型 iframe
  - 单文件 HTML 不依赖项目目录中的本地文件
  - 自动测试、桌面与 390px 手机验收通过
```

## 方案

采用混合方案 C：

1. **L1/L2：共享引擎，独立预设**
   - 新增 `variant-runner.html`。
   - 互动按 proximity、drag、reveal、scroll、canvas、type、audio、spatial 等家族实现。
   - 每条预设声明自己的版式、颜色、文案、输入和降级路径。

2. **L3：招牌独立场景 + 高差异场景预设**
   - 保留滚动胶带、滕王阁字帘、脉冲星图三个独立作品。
   - 新增 `scene-runner.html`，承载 17 个场景预设。
   - 预设覆盖 Three/WebGL、Canvas 2D、Media 三类运行路径；共享生命周期和销毁协议。

3. **L4：真实微型页面构图**
   - 每个 recipe 增加 `recipe.visual`：布局、色板、焦点媒体、模块节奏和装饰语言。
   - 卡片直接渲染 nav、hero、media、proof、grid、CTA 等微型页面结构。
   - 不启动 iframe，不使用统一空骨架。

4. **展厅式并行展示**
   - L0-L4 均提供有辨识度的动态封面或完整微缩构图。
   - L1/L2 每张卡片独立运行和停止，启动新预览不关闭其他卡片。
   - L3 同时只保留一个重型场景，但不会关闭已经运行的 L1/L2 轻量预览。

5. **单文件交付**
   - 构建器内联 CSS、目录数据、应用脚本、运行器 HTML、场景 HTML和海报图片。
   - iframe 使用 `srcdoc`，复制动作从内嵌资源读取。
   - 输出 `demo/downloads/css-fx-library-single.html`。

## 数据流

```text
base source JSON + expansion definitions
                  |
                  v
        build-layered-library.mjs
                  |
          merged catalog JSON
             /            \
            v              v
      server demo     build-single-html.mjs
                           |
                           v
             css-fx-library-single.html
```

## 视觉规则

- 主库继续使用克制的编辑式工具界面。
- L4 缩略页必须至少有四个结构模块，且相邻卡片不能共享同一布局与色板组合。
- L3 海报必须体现对应场景的形状语言，不允许统一占位圆。
- 卡片仍保持 8px 以下圆角，不增加装饰性大渐变 Hero。

## 错误与降级

- WebGL 或 CDN 失败：保留场景海报和 Canvas/DOM 降级。
- 单文件 `file://` 环境：所有本地资源通过内联映射读取；外部 Three CDN 不可用时显示静态场景。
- 复制失败：保留现有 toast 和错误数组，不伪造复制成功。
- 未知预设：运行器显示明确错误卡片，不空白。

## 验收

- Node 测试检查数量、唯一 ID、预设存在、L4 visual 差异和文件引用。
- 浏览器检查 L2/L3/L4 切换、运行/停止、复制和控制台。
- 桌面与 390px 手机无横向溢出。
- 单文件通过 `file://` 或本地 HTTP 打开后，四层数量一致，L4 非空。

## 回滚

- 移除 expansion definitions、两个新增运行器和单文件构建器。
- 恢复构建工具、应用脚本和测试到基线哈希清单。
- 原有 197 条目录、三个独立场景和 NAS 源材料不受影响。
