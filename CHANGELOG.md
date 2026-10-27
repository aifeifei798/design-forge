# Changelog

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

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
