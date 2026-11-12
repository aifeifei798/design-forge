#!/usr/bin/env node
// tools/check-manifest.mjs
// 契约测试：manifest 里声明的能力，必须和真实行为一致。
//
//   1) 每个声明的参数都能被解析器接受（不会飘成「文档有、代码没有」）
//   2) 每个声明的错误码都能真实触发，且没有未登记的出口
//   3) --list-rules / manifest / floor.md 三处规则清单同步
//   4) check.report 的 JSON 信封字段不漂移
//
// 无依赖。跑法：node tools/check-manifest.mjs

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FORGE = join(ROOT, "skill", "scripts", "forge.mjs");
const GOOD = join(ROOT, "fixtures", "good.html");
const BAD = join(ROOT, "fixtures", "bad.html");
const FLOOR = join(ROOT, "skill", "references", "floor.md");
const MISSING = "does-not-exist.html";

const run = (...args) => spawnSync(process.execPath, [FORGE, ...args], { encoding: "utf8", cwd: ROOT });
const parse = (res) => { try { return JSON.parse(res.stdout); } catch { return null; } };

let passed = 0;
let total = 0;
const check = (name, ok, detail = "") => {
  total++;
  if (ok) passed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : ` — ${detail}`}`);
};

/* ---------------------------------------------------------------- 清单形状 */

const manifestRes = run("--manifest", "--json");
const manifest = parse(manifestRes);
check("manifest: 退出 0 且是合法 JSON", manifestRes.status === 0 && manifest != null);
if (!manifest) { console.log(`\n0/${total} checks`); process.exit(1); }

check("manifest: apiVersion 1 · type=manifest", manifest.apiVersion === 1 && manifest.type === "manifest");
const data = manifest.data;
check("manifest: 版本号与 package.json 一致", data.version === JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version, `${data.version}`);
check("manifest: options 非空且无重复 flag", data.options.length > 0 && new Set(data.options.map((o) => o.flag)).size === data.options.length);
check("manifest: 三种退出码齐全", [0, 1, 2].every((c) => data.exitCodes.some((e) => e.code === c)));
check("manifest: errorCodes 非空且都是 ERR_ 前缀", Object.keys(data.errorCodes).length > 0 && Object.keys(data.errorCodes).every((c) => /^ERR_[A-Z_]+$/.test(c)));

/* --------------------------------------------- 每个声明参数都能被解析器接受 */
// 用不存在的目标跑：路径检查发生在参数解析之后，所以「不是 ERR_UNKNOWN_FLAG /
// ERR_MISSING_ARGUMENT」就证明该参数确实被认识，同时不会触发渲染或写文件。

for (const o of data.options) {
  let args;
  if (o.flag === "--list-rules" || o.flag === "--manifest") args = [o.flag, "--json", MISSING];
  else if (o.choices) args = [o.flag, o.choices[0], MISSING, "--json"];
  else if (o.value === "id,id") args = [o.flag, "craft/z-index", MISSING, "--json"];
  else if (o.type === "boolean") args = [o.flag, MISSING, "--json"];
  else args = [o.flag, "x", MISSING, "--json"];

  const res = run(...args);
  const body = parse(res);
  const ok = o.flag === "--list-rules" || o.flag === "--manifest"
    ? res.status === 0 && body?.type !== "error"
    : res.status === 1 && body?.code === "ERR_TARGET_NOT_FOUND";
  check(`参数可解析 ${o.flag}`, ok, `exit ${res.status} · ${body?.code ?? body?.type ?? res.stdout.slice(0, 60)}`);
}

/* ------------------------------------------------------------ 错误码可达性 */

const emptyDir = mkdtempSync(join(tmpdir(), "forge-manifest-"));
const reachable = {
  ERR_NO_TARGET: [],
  ERR_UNKNOWN_FLAG: ["--nope", GOOD],
  ERR_MISSING_ARGUMENT: ["--detail"],
  ERR_INVALID_OPTION: ["--detail", "verbose", GOOD],
  ERR_UNKNOWN_RECIPE: ["--recipe", "nope", GOOD],
  ERR_TARGET_NOT_FOUND: [MISSING],
  ERR_NO_FILES: [emptyDir],
};

for (const [code, args] of Object.entries(reachable)) {
  const res = run(...args, "--json");
  const body = parse(res);
  const ok = res.status === 1 && body?.type === "error" && body?.code === code;
  check(`错误码可达 ${code}`, ok, `exit ${res.status} · ${body?.code ?? body?.type ?? res.stdout.slice(0, 60)}`);
}

const documented = new Set(Object.keys(data.errorCodes));
const emitted = new Set(Object.keys(reachable));
check(
  "错误码：文档与真实出口一致（双向）",
  documented.size === emitted.size && [...documented].every((c) => emitted.has(c)),
  `文档多出 ${[...documented].filter((c) => !emitted.has(c)).join(",") || "无"} · 代码多出 ${[...emitted].filter((c) => !documented.has(c)).join(",") || "无"}`,
);

/* ---------------------------------------------------------------- 规则同步 */

const rulesRes = run("--list-rules", "--json");
const rules = parse(rulesRes);
check("rules.list: 退出 0 且是合法 JSON", rulesRes.status === 0 && rules != null);
check("rules.list: count 与 rules 长度一致", rules?.count === rules?.rules?.length);
check("rules.list: id 无重复", new Set(rules.rules.map((r) => r.id)).size === rules.rules.length);
check("rules.list: 每条都有 tier / title / fix", rules.rules.every((r) => ["FAIL", "REFLEX", "WARN"].includes(r.tier) && r.title && r.fix));
check("manifest.rules 与 rules.list 一致", JSON.stringify(data.rules) === JSON.stringify(rules.rules));

const floor = readFileSync(FLOOR, "utf8");
const undocumented = rules.rules.filter((r) => r.tier === "FAIL" && !floor.includes(r.id)).map((r) => r.id);
check("floor.md 覆盖全部 FAIL 规则", undocumented.length === 0, `缺 ${undocumented.join(", ")}`);

/* --------------------------------------------------------- check.report 形状 */

const badRes = run(BAD, "--json");
const report = parse(badRes);
check("check.report: 有 FAIL 时退出 2", badRes.status === 2, `exit ${badRes.status}`);
check("check.report: apiVersion 1 · type=check.report", report?.apiVersion === 1 && report?.type === "check.report");

const SUMMARY_KEYS = ["fail", "files", "reflex", "waived", "warn"];
check("check.report: summary 字段稳定", JSON.stringify(Object.keys(report.summary).sort()) === JSON.stringify(SUMMARY_KEYS));
check(
  "check.report: 计数自洽（active=FAIL+REFLEX+WARN）",
  report.summary.fail + report.summary.reflex + report.summary.warn === report.findings.length && report.summary.waived === report.waived.length,
);
check("check.report: 每条 finding 字段齐全", report.findings.every((f) => f.file && f.id && f.tier && "line" in f && f.message && f.fix));
check("check.report: 排序为 FAIL→REFLEX→WARN", report.findings.every((f, i, a) => i === 0 || ["FAIL", "REFLEX", "WARN"].indexOf(a[i - 1].tier) <= ["FAIL", "REFLEX", "WARN"].indexOf(f.tier)));
check("check.report: meta 字段存在", ["version", "node", "detail", "recipe", "render", "waivedBy"].every((k) => k in (report.meta ?? {})));

/* ------------------------------------------------------------ 分档输出可用 */

const brief = run(BAD, "--detail", "brief");
check("--detail brief: 退出 2 且不打印 fix 行", brief.status === 2 && !brief.stdout.includes("→ fix"));
const full = run(BAD, "--detail", "full");
check("--detail full: 每个 finding 都带 fix 行", (full.stdout.match(/→ fix/g) ?? []).length === report.findings.length);
const waived = run(BAD, "--waive", "craft/z-index", "--json");
check("--waive: 命中条目进入 waived 且不计数", waived.status === 2 && parse(waived).summary.waived === 1);
const noFail = run(BAD, "--no-fail");
check("--no-fail: 有 FAIL 也退出 0", noFail.status === 0);

console.log(`\n${passed}/${total} checks`);
process.exit(passed === total ? 0 : 1);
