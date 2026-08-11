# CSS.FX 电影感开场

这是 CSS.FX 的可选 Three.js 入口。默认首页仍然是上一级的素材库：

`../demo/index.html`

## 本地运行

从仓库根目录启动：

```bash
./tools/start-demo.sh 9876
```

打开：

```text
http://127.0.0.1:9876/intro/
```

## 导航

- `ATOMS` → `../demo/index.html#L0`
- `INTERACTIONS` → `../demo/index.html#L1`
- `SCENES` → `../demo/index.html#L3`

## 控制与降级

- “跳过开场”：立即进入可用界面。
- “重播镜头”：重新播放 8 秒镜头。
- `?motion=reduce`：使用减弱动效路径。
- `?fallback=1`：检查静态降级入口。

Three.js 运行时已随仓库放在 `vendor/`，许可证见
`vendor/THREE-LICENSE.txt`。
