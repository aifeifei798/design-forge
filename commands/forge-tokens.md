---
description: design-forge · 查看/生成视觉配方 token（只出 token，不动页面）
argument-hint: "[配方 slug]"
skills: design-forge
---
Use the `design-forge` skill (load it first), then run its **tokens** path — read `<skill-dir>/references/recipes.md`.

Request: $ARGUMENTS
If the argument is empty, list the 8 recipes (`node <skill-dir>/scripts/tokens.mjs recipes`) and ask which one, or deal three candidates by genre.

Rules for this run:
- Only produce tokens: `tokens.mjs show <slug>` for inspection, `tokens.mjs emit <slug> [--tailwind] --out <path>` for files.
- Do not rewrite page markup. If the target project already has tokens, merge names instead of replacing the system.
- Report: recipe chosen, why it fits the material, the emitted file path, and which existing token names were reused.
