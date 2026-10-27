#!/usr/bin/env node
// tools/expect.mjs <target> <expected-fail-count>
// 断言某个目标跑出来的 FAIL 数量正好等于期望值，防止规则悄悄失效或放水。

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [target, expectedRaw] = process.argv.slice(2);
const expected = Number(expectedRaw);

if (!target || Number.isNaN(expected)) {
  console.error("usage: node tools/expect.mjs <target> <expected-fail-count>");
  process.exit(1);
}

const res = spawnSync(process.execPath, [join(ROOT, "skill", "scripts", "forge.mjs"), target, "--json"], {
  encoding: "utf8",
  cwd: ROOT,
});

let parsed;
try {
  parsed = JSON.parse(res.stdout);
} catch {
  console.error(`expect: forge.mjs did not return JSON for ${target}\n${res.stdout}\n${res.stderr}`);
  process.exit(1);
}

const { fail, reflex, warn, files } = parsed.summary;
const ok = fail === expected;

console.log(`${ok ? "PASS" : "FAIL"}  ${target}: ${fail} FAIL (expected ${expected}) · ${reflex} REFLEX · ${warn} WARN · ${files} file(s)`);

// 有 FAIL 时退出码必须是 2，没有时必须是 0，这个也一起断言
const expectedExit = expected > 0 ? 2 : 0;
if (res.status !== expectedExit) {
  console.log(`FAIL  exit code ${res.status} (expected ${expectedExit})`);
  process.exit(1);
}

process.exit(ok ? 0 : 1);
