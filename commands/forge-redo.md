---
description: design-forge · 重做页面（保留文案/链接/字段/handler，只换体系）
argument-hint: "[目标路径]"
skills: design-forge
---
Use the `design-forge` skill (load it first), then run its **redesign** path — read `<skill-dir>/references/audit.md` (重做 section) first.

Target: $ARGUMENTS
If the argument is empty, ask which page to redo and which strength (只修毛病 / 重做视觉 / 整体重做), then wait.

Rules for this run:
- Before editing: record what must survive — links (`href`), form field names, handlers, heading text, image alt — into `.forge/before.json`.
- After editing: run `node <skill-dir>/scripts/forge.mjs <target> --json > .forge/after.json` and prove nothing from the before-list disappeared. If something did, restore it before reporting.
- Strength defaults to 重做视觉 (restyle) when the user did not say; state which one you took.
- Never delete routes or component trees without a file-level plan the user approved.
- Report: what changed, what was preserved (with evidence), and the real `forge.mjs` summary.
