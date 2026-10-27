---
name: design-forge
description: "前端界面设计与视觉质量的统一工作流（自建：规则 + 配方 + 确定性检查器）：新建或改造网页、落地页、官网、产品界面、仪表盘、组件、表单、空态、设计系统与 token。包含抗 AI 味红线（Floor）、排版/色彩/间距/动效手艺规则、Tailwind v4 CSS-first token 方案、8 套视觉配方、检查器 forge.mjs（静态 + 可选八宽度渲染）。中文触发：做页面、做官网、做落地页、写 UI、调样式、配色、排版、动效、空态、设计系统、审查界面。不用于纯图片提示词生成或后端任务。"
version: 0.3.0
license: MIT
metadata:
  forge/version: "0.3.0"
---

# design-forge

一个自建的 UI 设计工作流：**判断层（Floor）→ 手艺层（craft）→ 工程层（Tailwind v4）→ 工具层（forge.mjs / tokens.mjs）**。
目标是让生成出来的界面像人做的：有一处值得记住的东西，没有模板痕迹，并且能被机器查出问题。

原则三条：
1. **先定做什么，再定长什么样。** 页面为"访客来干什么"服务，不为"展示我会排版"服务。
2. **事实不编。** 数字、客户名、评价、logo、指标，没有就是没有，用留白或占了位的槽位。
3. **能被检查的才算完成。** `forge.mjs` 的 FAIL 必须清零；REFLEX 要么修，要么在交付里写明豁免理由。

## 何时用 / 何时不用

用：网页、落地页、官网、定价页、产品 UI、仪表盘、设置页、表单、空态、组件库、token 体系、现有界面重做或审查。

不用：纯图片提示词（走 image-prompt-router）、后端 / CLI / 数据管道、只改文案标点。

## 三档规则

| 档 | 含义 | 处理 |
|---|---|---|
| **Floor** | 不可豁免：对比度、焦点、reduced-motion、横向溢出、编造事实、可访问名称 | 必须修，不许交付 |
| **Reflex** | 模型的条件反射，有理由可以豁免 | 修，或写明理由后豁免 |
| **Finish** | 手艺细节，只记录不阻塞 | 逐条回答 yes/no |

细则：[references/floor.md](references/floor.md)。检查器实现：`skill/scripts/forge.mjs`（`--list-rules` 看全部 id）。

## 流程

### 0. Pre-flight（先读，别问）

按顺序看：项目里有没有 `design-forge.json` / `DESIGN.md`（锁定的体系，优先于本 skill 的一切风格建议）→ `package.json`（框架、Tailwind 版本）→ 现有样式入口（`globals.css` / `app.css` / `tailwind.config.*`）→ 现有 `:root` 或 `@theme` token → `.forge/state.json`（上一次的配方、signature、豁免记录）→ 能不能跑起来（`dev` 脚本、端口）。

输出一行事实：用了什么框架、Tailwind 版本、已有 token 名、可复用的组件、不能碰的东西。

### 1. 一次问清（只有一次）

只在信息不足时问，一条消息问完：

> 1. **素材**：页面能展示什么？（截图 / 真实照片路径 / 真实数字 / 客户名 / 可用的 logo；没有就说没有）
> 2. **给谁看**：谁用、他关心什么？
> 3. **动作**：这一页要促成的那一件事是什么？
> 4. **调性**：选一个极端（编辑部 / 工业 / 温和 / 奢华 / 活泼 / 技术 / 极简），"干净现代"不算答案。

用户说"你定"就自己定，并在开头一行说明推断了什么。素材缺口绝不推断成假事实。

### 2. 定型（命名，不写代码）

- **任务**：这一页让访客做什么（订阅 / 预约 / 试用 / 购买 / 联系），动作放在类别该在的位置，页面在动作处收尾。
- **签名**：访客会记住的那一个东西（一张真实照片、一个能点的控件、一个大到成为主张的价格）。最多一个，放首屏。
- **骨架**：6–9 个区块（含首屏和页脚），每个区块一件真实内容；不要"功能三连 + 邮件订阅"的默认流水线。

写在回复顶部的一个小块里（Shape / Recipe / Signature / Sections），这是用户唯一一次纠偏机会。

### 3. 出配方

```bash
node <skill-dir>/scripts/tokens.mjs deal --genre <genre>    # 三选一，带 signature
node <skill-dir>/scripts/tokens.mjs show <slug>             # 看完整 token 与禁忌
```

配方是**材料**不是排版方案：定纸、墨、强调色、字体、圆角、密度、动效曲线；不定区块顺序。用户点名配方就用它；都不合适就用 `--genre` 重发，或按 [references/recipes.md](references/recipes.md) 的规则自建一套并在交付里说明。

### 4. 落 token

```bash
node <skill-dir>/scripts/tokens.mjs emit <slug> --out <项目样式目录>/forge-tokens.css            # 纯 CSS
node <skill-dir>/scripts/tokens.mjs emit <slug> --tailwind --out <项目样式目录>/forge-tokens.css  # Tailwind v4
```

- 已有 token 体系时**复用现有名字**，只补缺的，不另起一套。
- 追加位置：`@import` 之后、任何规则之前；Tailwind 项目里 `@theme` 必须能在编译期被读到。
- 所有颜色/字体只允许出现在 token 块里，其余地方一律 `var(--x)` / 语义类。

### 5. 建（首屏先单独成立）

先写导航 + 首屏，跑一次静态检查，确认标题、一句说明、主操作在 1280×800 里不需要滚动；再往下建。要求见 [references/craft.md](references/craft.md)，Tailwind 写法见 [references/tailwind.md](references/tailwind.md)，交互/表单/空态见 [references/states.md](references/states.md)。

### 6. 查

```bash
node <skill-dir>/scripts/forge.mjs <文件或目录>              # 静态：永远先跑这个
node <skill-dir>/scripts/forge.mjs <文件或目录> --render      # 八宽度渲染（需 puppeteer-core + Chrome，先征得同意）
```

- FAIL 清零；REFLEX 逐条修或豁免（豁免用 `--waive id` 并在交付里列出来）；WARN 至少看一眼。
- 渲染档只在需要验证横向溢出 / 控制台报错 / 真实断点时用；`--shots` 会落盘截图到 `.forge/shots/`，按本机截图政策先问。
- 交付前跑 `--json`，把 summary 原样贴进交付（`0 FAIL · 0 REFLEX` 这种），**不许手写没跑过的数字**。

### 7. 交付

- 一句结论 + 改了哪些文件 + 检查结果 + 剩下的素材缺口（每个槽位多大、该放什么）。
- 用户说"就这样"就停；不要自作主张继续加区块。

## 重做 / 审查

只有用户点名"重做"或"审查"时才进这两条：`references/audit.md`。
- **重做**保留内容与接线（链接、表单字段、handler、heading 文本），只换视觉体系和布局；改完必须证明原有关键元素一个没少。
- **审查**只出报告：按 Floor / Reflex / Finish 分档，给文件:行号，不改代码。

## 产物约定

| 产物 | 位置 | 说明 |
|---|---|---|
| 配方 token | 项目样式目录 `forge-tokens.css` | 可重生成，别手改 |
| 项目状态 | `.forge/state.json` | 配方、signature、豁免、上次检查结果 |
| 渲染截图 | `.forge/shots/` | 仅 `--shots` 时产生，不该进 git |
| 设计体系锁定 | 项目根 `DESIGN.md` | 用户说"锁定体系"时写，之后优先于配方 |

## 硬约束（本机）

- 不联网、不装二进制、不传遥测；`tokens.mjs` 与 `forge.mjs` 只用 Node 标准库，`--render` 复用已装的全局 `puppeteer-core`。
- 截图类操作先说明目的并得到同意再跑（渲染档、`--shots`）。
- 生成物（`forge-tokens.css`、`.forge/`）由脚本产生，不属于手工改文件。
- 上下文预算：本 skill 的参考文档按需加载，一次构建只加载用到的（floor + craft + 一个工程层 + 需要时 states/audit），不要把 references 全量读一遍。
