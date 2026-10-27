# Floor（不可豁免）与 Reflex（有理由可豁免）

规则 id 与 `forge.mjs --list-rules` 一一对应（共 31 个 id：15 FAIL / 12 REFLEX / 4 WARN；下表第 14 条含渲染档的两个 id）。**Floor 不清零不算交付。**

## Floor：14 条，任何情况下都修

| # | id | 规则 | 为什么 |
|---|---|---|---|
| 1 | `color/literal` | 颜色只能出现在 token 块（`:root` / `@theme` / `[data-theme]`），其他地方用 `var(--x)` 或语义类 | 一套界面里出现第二个色值来源，就没法统一改暗色/换皮 |
| 2 | `tokens/missing` | 页面有颜色但项目没有 token 块 | 同上；先建 token 再写第一行样式 |
| 3 | `motion/transition-all` | 禁止 `transition: all` / `transition-all` | 会把 `width`/`height`/`box-shadow` 一起过渡，掉帧且难排查 |
| 4 | `motion/layout-property` | 禁止过渡 `width/height/top/left/right/bottom/margin/padding/inset` | 触发布局重排；改用 `transform` / `opacity` / `clip-path` |
| 5 | `motion/no-reduced-motion` | 有 `@keyframes` / `animation` / `animate-*` 就必须有 `prefers-reduced-motion` 兜底 | 前庭失调用户会眩晕；系统设置必须被尊重 |
| 6 | `layout/overflow-x-hidden` | 禁止 `overflow-x: hidden`，要 `clip` | `hidden` 会创建滚动容器，毁掉 `position: sticky` 与内部滚动 |
| 7 | `layout/100vw` | 禁止 `100vw` | 桌面带滚动条时会多出滚动条宽度的横向溢出 |
| 8 | `a11y/html-lang` | `<html>` 必须有 `lang` | 读屏发音、翻译、断词都依赖它 |
| 9 | `a11y/img-alt` | `<img>` 必须有 `alt`（装饰图写 `alt=""`） | 图片没 alt 等于对读屏用户不存在 |
| 10 | `a11y/heading-skip` | 标题不许跳级（h1→h2→h3） | 读屏的目录导航靠层级，跳级等于坏掉导航 |
| 11 | `a11y/focus-visible` | 项目里必须存在 `:focus-visible` 样式，且不做延迟/不依赖 `:hover` | 键盘用户唯一的位置指示 |
| 12 | `slop/purple-blue-gradient` | 紫→蓝渐变（`from-violet/indigo/purple` + `to-blue/cyan`，或同名 CSS 渐变） | 最常见的一条"AI 生成"指纹 |
| 13 | `slop/eyebrow` | 标题上方的 eyebrow / 逐字间距小标签（`uppercase` + `tracking-*` + `text-xs`/CSS 同款组合） | 模板痕迹；标题自己扛得住就不需要上面那行小字 |
| 14 | `render/overflow-x` / `render/console-error` | 渲染后不许横向溢出、不许控制台报错 | 静态档看不出的真实问题；渲染档可用时必须跑 |

**编造事实**（数字、客户名、评价、logo 墙、指标）同样是 Floor，只是检查器抓不到 —— 由你负责。

## Reflex：模型的默认反射，可以豁免但要写理由

| id | 反射 | 更好的做法 |
|---|---|---|
| `color/pure-extreme` | `#fff` / `#000` 直接当底色 | 往纸/墨的色相里偏 1–3% 明度 |
| `font/literal` | 规则里直接写 `font-family` | 字体也只走 `--font-*` token |
| `motion/bounce-easing` | `bounce` / 弹性 / 过冲 `cubic-bezier` | 指数型 `ease-out`：`cubic-bezier(0.16, 1, 0.3, 1)` |
| `layout/viewport-height` | `100vh` / `h-screen` / `min-h-screen` 当首屏 | `100svh` / `100dvh`，或让内容决定高度 |
| `a11y/outline-none` | `outline: none` 后没有补偿焦点样式 | `:focus-visible { outline: 2px solid var(--accent) }` |
| `a11y/input-label` | 输入框只有 placeholder | `<label for>` 或 `aria-label`；placeholder 只做例子 |
| `slop/side-accent-border` | 卡片/提示条左侧 1px 以上彩色竖条 | 背景分层、留白、或整块色底 |
| `slop/hard-shadow` | 零模糊 `4px 4px 0` 硬阴影 | 只有配方明确声明硬阴影（如 quarry）才允许 |
| `slop/nested-card` | 卡片套卡片 | 内层去掉边框和底色，用排版分层 |
| `slop/gradient-text` | 渐变文字 | 字重、字号、或一个真实色块 |
| `type/tiny-text` | 小于 12px 的文字 | 正文 ≥14px，说明文字 ≥12px |
| `type/measure` | 正文行宽 >78ch | 65–75ch，`max-width: var(--measure)` |

## Finish：只回答 yes/no，不阻塞交付

- 首屏标题 ≤7 个词（中文 ≤12 字），说明 ≤1 句，操作 ≤2 个。
- 一屏可见文字 ≤80 词（中文 ≤120 字）；超出就删，不加区块。
- 一个主按钮样式贯穿全站；一个容器宽度；一层圆角；一个栅格间距。
- 每屏只有一个"大"的东西；相邻两屏不要都用图。
- 图片占页面（首屏以下）不超过三分之一，且相邻两个区块不要都是图。
- 交互控件八态齐全（见 [states.md](states.md)），表单错误说清"哪里错 + 怎么改"。
- 浏览器自带件也被设计过：选区色、光标色、滚动条、焦点环、下划线偏移、表格数字对齐。
- 文案是产品自己的语言，按钮写动作（"开始导入"），不写"提交"。
- 没有一个字号是手调的魔数：全部落在 token 的 `--text-*` 上。

## 豁免怎么写

在交付里一行：

```
Reflex 豁免：slop/hard-shadow（quarry 配方明确允许）· layout/viewport-height（固定 100vh 的看板截图页，不需要移动端）
```

豁免只对当次构建有效；写进 `.forge/state.json` 的 `waivers` 才跨次生效。
