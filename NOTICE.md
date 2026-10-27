# NOTICE · 致谢与来源

design-forge 是原创实现：`skill/scripts/forge.mjs`（检查器）、`skill/scripts/tokens.mjs`（发牌器）、`skill/data/recipes.json`（配方数据）、全部参考文档与规则 id，均为本项目自行编写。

**未复制任何第三方源码、文档正文、主题文件、图片或字体二进制。** 下面列出的是设计思想上公开借鉴过的项目——"哪些缺陷不可接受"、"用确定性检查代替自觉"、"配方是材料不是排版"这类判断层面的启发，属于不受版权保护的方法与思想。逐条写出来是为了署名，也为了以后追溯。

## 借鉴清单

### hallmark — MIT — Nutlope / Together AI

- https://github.com/Nutlope/hallmark
- 借鉴：三档门槛的划分方式（Floor 不可豁免 / Reflex 有理由可豁免 / Finish 只记录）、"配方是材料不是排版方案"、"signature / 一个记忆点"的概念、把构建决策写进产物（stamp / log）的做法、检查器分"静态 + 多宽度渲染"两档、渲染档只依赖全局 `puppeteer-core` 的策略。
- 未使用：其 48 套主题文件、图片资源、`sloplint.mjs` / `theme.mjs` 源码、参考文档正文。

### impeccable — Apache-2.0 — Paul Bakaus

- https://github.com/pbakaus/impeccable
- 借鉴：确定性检测器配退出码门禁（0 干净 / 2 命中）的 CI 用法、用 `commands/<name>.md` 承载斜杠命令而不是靠 SKILL.md frontmatter（OpenCode 不读后者）、交互控件八态与"浏览器自带件也要被设计"（选区/光标/滚动条/焦点环/下划线偏移/表格数字）这两份审查清单、把"审查(audit)"与"重做(redesign)"分成两个独立动词、以及"改动前后记录并核对关键元素不丢"的重做流程。
- 未使用：其 Rust 引擎、62 条规则的实现、`PRODUCT.md`/`DESIGN.md` 模板正文、live 模式代码、遥测与远端发牌 API。

### tailwind-design-system — 社区 skill（原安装于 `~/.agents/skills`）

- 借鉴：Tailwind CSS v4 CSS-first 的写法约定——`@theme` 定义语义 token、`@custom-variant` 做暗色、`cva` 做组件变体、`@container` 做组件级自适应，以及 v3 → v4 的迁移对照表。
- 未使用：其 `details.md` / `advanced-patterns.md` 正文、示例组件代码。

### Tailwind CSS — MIT — Tailwind Labs

- https://tailwindcss.com
- 借鉴：语义 token 与工具类的映射规则（`--color-*` → `bg-*`/`text-*`、`--radius-*` → `rounded-*`）、v4 的 `@import "tailwindcss"` 入口方式。

### Agent Skills / OpenCode 文档

- https://agentskills.io/specification · https://opencode.ai/docs/skills/
- 借鉴：`SKILL.md` 的 frontmatter 约定（`name` / `description` 驱动发现）、OpenCode 只识别 spec 子集且用 `commands/` 承载斜杠入口这一事实、skills 搜索路径（`~/.agents/skills`、`~/.config/opencode/skills`、`~/.claude/skills`、项目内 `.opencode/skills`）。

## 许可选择说明

本项目用 **MIT**：

- 上述借鉴对象是 MIT 与 Apache-2.0，二者都允许在 MIT 项目中借鉴思想与接口约定；本项目没有复制 Apache-2.0 的代码，因此不触发其 NOTICE 传递义务。
- MIT 与 skill 生态（hallmark、Tailwind 均为 MIT）一致，使用和二次分发最简单。
- 如果将来真的引入 Apache-2.0 的源码片段，会在本文件里单独标注来源文件、附带其许可证副本，并把相应文件的许可改为 Apache-2.0（文件级双许可），而不是整体换协议。

## 字体与颜色

配方里的字体名只是 CSS `font-family` 的字符串建议，不随仓库分发任何字体文件；字体本身的许可见各字体项目（Fraunces、Newsreader、Instrument Sans、Space Grotesk、IBM Plex Sans、Cormorant Garamond、Karla、Bricolage Grotesque、Figtree、Archivo、Playfair Display、Manrope、JetBrains Mono 等，多为 SIL OFL 或 Apache-2.0）。自托管前请自行确认对应许可。

配色为自行选定的 OKLCH 数值，不含第三方调色板文件。
