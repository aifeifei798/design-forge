---
description: design-forge · 只审查不改代码（Floor/Reflex/Finish 分档报告）
argument-hint: "[目标路径]"
skills: design-forge
---
Use the `design-forge` skill (load it first), then run its **audit** path — read `<skill-dir>/references/audit.md` and `<skill-dir>/references/floor.md`.

Target: $ARGUMENTS
If the argument is empty, audit the current directory's UI entry points and say which files you picked.

Rules for this run:
- Read-only: do not modify any file, do not create tokens, do not reformat.
- Run `node <skill-dir>/scripts/forge.mjs <target> --json` first and paste the real `summary`.
- Do not run `--render` / `--shots` (no browser).
- Report in the audit.md format: Floor (must fix) / Reflex (should fix) / Finish (record only) / next steps, each item with `file:line`.
- Facts are not inferred: if a number, quote or logo has no source, say it is invented rather than guessing.
