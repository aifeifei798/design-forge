---
description: design-forge · 查看/生成视觉配方 token（不发散、不改页面）
---
Load the `design-forge` skill, then run its **tokens** path — read `~/.agents/skills/design-forge/references/recipes.md`.

Request: $ARGUMENTS
If $ARGUMENTS is empty, list the 8 recipes (`node ~/.agents/skills/design-forge/scripts/tokens.mjs recipes`) and ask which one, or deal three candidates by genre.

Rules for this run:
- Only produce tokens: `tokens.mjs show <slug>` for inspection, `tokens.mjs emit <slug> [--tailwind] --out <path>` for files.
- Do not rewrite page markup. If the target project already has tokens, merge names instead of replacing the system.
- Report: recipe chosen, why it fits the material, the emitted file path, and which existing token names were reused.
