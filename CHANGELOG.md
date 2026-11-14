# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [0.6.0] - 2026-11-15

### Added

- 每条 REFLEX 规则带 `waiveWhen` 豁免条件：`RULES` 表改四元组 `[tier, title, fix, waiveWhen?]`，出现在 `--list-rules --detail full` 的"豁免:"行与 `--json` 的 findings / rules.list 可选字段（只挂在 REFLEX 上）；`--waive` 的说明指向它，豁免从"自由写理由"升级为"对照条件判定"。`tools/check-manifest.mjs` 契约新增三项：REFLEX 必带且非空（FAIL/WARN 必不带）、check.report 同形状、REFLEX id 纳入 floor.md 覆盖断言（契约共 43 项）。
- SKILL.md 触发描述改三段式：强制句 + 触发词 + 排除列表进 frontmatter（排除项原来只在正文，agent 不加载 skill 就看不到；触发词与排除列表落在 ZCode 注入截断的前 250 字符内）。
- 交付约定升级：summary 行自带 forge 版本戳（`· forge v<版本>`）；交付里逐条披露实际影响改动的规则 id，禁止 context 压缩后凭记忆补写。
- 防作弊条款与覆盖声明进 SKILL.md：不为清零改语义正确的代码、不翻检查器源码绕过；静态档只覆盖确定性规则，craft / Finish 靠对照 references 自查。
- `DESIGN.md` 锁定的建议时机：用户在调性 / 配色上反复摇摆（两次以上推翻已定选择）时主动建议锁定。
- EXTENDING.md 新增「规则的准入与退出」：eval 裁剪——新规则必须先证明当前主力模型会做错才准入，模型天然遵守的 REFLEX / WARN 定期降级或删除。

### Changed

- references 交叉引用升级为规则 id（craft / states / audit / floor），审查报告格式要求每条 Reflex 附豁免条件。
- `tools/build-docs.mjs` 规则表 REFLEX 行显示豁免条件，扩展示例同步四元组。
- NOTICE.md 登记 modern-web-guidance（思想借鉴，未使用其代码）。
- 版本 0.6.0。

## [0.5.0] - 2026-11-12

### Added

- `forge.mjs --manifest`（人读 / `--json`）：自描述能力清单，从 `FLAGS` 参数表与 `RULES` 规则表派生——模式、参数、可选值、退出码、稳定错误码、输出形状、规则与配方，一条命令交给 agent 自己读。
- `forge.mjs --detail brief|compact|full`：人读输出分档。`brief` 按档去重只列 id，`compact` 带文件:行号（默认，与旧输出一致），`full` 每条附改法；`--json` 始终完整。
- 稳定错误码（`ERR_NO_TARGET` / `ERR_UNKNOWN_FLAG` / `ERR_MISSING_ARGUMENT` / `ERR_INVALID_OPTION` / `ERR_UNKNOWN_RECIPE` / `ERR_TARGET_NOT_FOUND` / `ERR_NO_FILES`），只增不改；人读时附「是不是想写」建议。
- 未知参数 / 未知配方 / 非法 `--detail` 不再静默接受：拼错 `--recipe quar` 会提示 `quarry`。
- `tools/check-manifest.mjs`（并入 `npm test`）：契约测试 40 项——每个声明参数都能被解析、每个声明错误码都能真实触发、`--list-rules` 与 manifest 与 `floor.md` 三处规则清单同步、`check.report` 信封字段不漂移。

### Changed

- `--json` 从裸对象升级为带版本的信封：`{ apiVersion: 1, type: "check.report", summary, findings, waived, render, meta }`；用法错误为 `{ apiVersion: 1, type: "error", error, code, suggestions? }`。旧的 `summary` / `findings` 字段位置不变，`tools/expect.mjs` 与 `tools/build-docs.mjs` 无需改动。
- `--shots` 现在等同 `--render` + 截图（之前只认写在 `--render` 之后）。
- `tokens.mjs` 用法错误退出码从 2 改为 1，与 `forge.mjs` 一致（2 只表示「检查出 FAIL」）。
- 配方豁免从逐文件循环内移到循环之后，只生效一次。
- 渲染档加载全局 `puppeteer-core` 时用 `fileURLToPath`，路径含空格不再出错。
- 版本 0.5.0。

## [0.4.0] - 2026-10-27

### Added

- `tools/link.mjs`：一条命令把 skill 与命令链到 OpenCode / ZCode / Claude Code / Codex 的发现目录，`--dry-run` 先看路径。
- `HARNESSES.md`：四个 harness 的安装路径、调用方式、上下文与体积限制对照。
- 命令文件改为 harness 中立：新增 `argument-hint` 与 `skills: design-forge`（ZCode 认），正文不再写死 OpenCode 专用路径。

### Changed

- `description` 重写并前移触发词：ZCode 注入描述时截断到 250 字符，触发词必须落在前 250 内。
- `SKILL.md` 增加脚本目录解析规则（多个 harness 的安装路径不同，`<skill-dir>` 按顺序探测）。
- 版本 0.4.0。

## [0.3.0] - 2026-10-27

### Added

- `EXTENDING.md`：加规则 / 加配方 / 加参考文档 / 加命令的完整步骤，含"必须同步 fixtures 与期望数字"的硬约束。
- `CONTRIBUTING.md`：维护约定、提交信息前缀、许可与第三方代码登记规则。
- 仓库级 `AGENTS.md`：给编码助手的本仓约定（不引入依赖、不手改生成物、规则必须带测试、数字要真）。
- `tools/expect.mjs`：断言 FAIL 精确数量与退出码，`npm test` 因此从"只要失败就行"升级为"失败数必须正好是 18"。
- 文档站新增「扩展」一节与导航项。
- `.editorconfig`。

## [0.2.0] - 2026-10-27

### Added

- `tools/build-docs.mjs`：从规则目录与配方库生成 `docs/` 静态手册（规则表、配方色板、用法），产物由自家检查器验收。
- `docs/`：规则手册页（31 条规则分三档 + 8 套配方色板），可用 GitHub Pages 直接发布。
- 命令文件：`/forge-audit`（只审查，子代理运行）、`/forge-redo`（重做，带保留清单）、`/forge-tokens`（只看/生成 token）。
- `forge.mjs --list-rules --json`：规则目录机器可读，供文档生成与外部集成使用。
- GitHub Actions `pages` workflow（发布 `docs/`）。

### Fixed

- 检查器在标记语言里只扫描"代码"（标签与 `<style>` 块），不再把自然语言正文当规则命中——文档页曾被自己的规则误杀。
- `font-family: var(--x)` 不再被判为 `font/literal`（已经是 token 引用）。

## [0.1.0] - 2026-10-27

### Added

- 规则体系：Floor（不可豁免）/ Reflex（有理由可豁免）/ Finish（只记录）三档，共 31 条检查规则。
- `skill/scripts/forge.mjs`：确定性检查器，支持 `--json`、`--waive`、`--recipe`、`--render`（八宽度）、`--shots`；退出码 0/1/2。
- `skill/scripts/tokens.mjs`：配方发牌（`deal` / `show` / `emit` / `recipes`），输出纯 CSS token 或 Tailwind v4 `@theme`。
- `skill/data/recipes.json`：8 套视觉配方（broadsheet / signal / linen / atelier / arcade / quarry / harbor / nocturne）。
- 参考文档：`floor.md` / `craft.md` / `tailwind.md` / `states.md` / `audit.md` / `recipes.md`。
- `skill/SKILL.md`：pre-flight → 一次问清 → 定型 → 出配方 → 落 token → 建 → 查 → 交付 的主流程。
- `fixtures/bad.html`（18 项违规）与 `fixtures/good.html`（干净样例）作为回归基线。
- GitHub Actions `test` workflow。
- MIT 许可与 `NOTICE.md` 致谢（hallmark / impeccable / tailwind-design-system / Tailwind CSS / Agent Skills 文档）。
