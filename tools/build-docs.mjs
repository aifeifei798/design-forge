#!/usr/bin/env node
// tools/build-docs.mjs
// 生成 docs/ 静态规则手册。数据来自 forge.mjs 的规则目录与 tokens.mjs 的配方库。
// 产物被 forge.mjs 自己检查（docs 必须是 0 FAIL），这是最直接的狗粮验证。

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FORGE = join(ROOT, "skill", "scripts", "forge.mjs");
const TOKENS = join(ROOT, "skill", "scripts", "tokens.mjs");
const DOCS = join(ROOT, "docs");

const run = (file, args) =>
  execFileSync(process.execPath, [file, ...args], { encoding: "utf8", cwd: ROOT });

const rules = JSON.parse(run(FORGE, ["--list-rules", "--json"]));
const { recipes } = JSON.parse(readFileSync(join(ROOT, "skill", "data", "recipes.json"), "utf8"));
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

const oklch = ({ l, c, h }) => `oklch(${l}% ${c} ${h})`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const byTier = { FAIL: [], REFLEX: [], WARN: [] };
for (const r of rules.rules) byTier[r.tier].push(r);

/* ---------------------------------------------------------------- 样式 */

const base = run(TOKENS, ["emit", "harbor"]); // harbor 的 token 块

const extraTokens = `
:root {
  /* 状态色（文档站自用，不进配方） */
  --ok: oklch(55% 0.12 150);
  --warn: oklch(62% 0.14 75);
  --alert: oklch(52% 0.19 25);

  /* 配方色板（由 recipes.json 生成） */
${recipes
  .map(
    (r) => `  --sw-${r.slug}-paper: ${oklch(r.paper)};
  --sw-${r.slug}-ink: ${oklch(r.ink)};
  --sw-${r.slug}-accent: ${oklch(r.accent)};`,
  )
  .join("\n")}
}
`;

const layout = `
* { box-sizing: border-box; }

html {
  scrollbar-color: var(--muted) transparent;
  caret-color: var(--accent);
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}

::selection { background: var(--accent); color: var(--paper); }

a { color: var(--ink); text-underline-offset: 3px; text-decoration-thickness: 1px; }
a:focus-visible,
button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
a:hover { color: var(--accent); }

.wrap { max-width: var(--container); margin: 0 auto; padding: 0 var(--space-6); }

header.site {
  border-bottom: 1px solid var(--border);
  padding: var(--space-4) 0;
}
header.site .wrap { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
header.site .brand { font-family: var(--font-mono); font-size: var(--text-sm); letter-spacing: 0; }
header.site nav { display: flex; gap: var(--space-6); font-size: var(--text-sm); }

.hero { padding: var(--space-24) 0 var(--space-16); border-bottom: 1px solid var(--border); }
.hero h1 {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  line-height: 1.05;
  margin: 0 0 var(--space-6);
  max-width: 18ch;
  overflow-wrap: break-word;
  min-width: 0;
}
.hero p { max-width: 62ch; color: var(--muted); margin: 0 0 var(--space-8); }
.hero .stats { display: flex; gap: var(--space-8); flex-wrap: wrap; font-family: var(--font-mono); font-size: var(--text-sm); }
.hero .stats strong { display: block; font-family: var(--font-display); font-size: var(--text-xl); font-weight: 600; }

section { padding: var(--space-16) 0; border-bottom: 1px solid var(--border); }
section > .wrap > h2 {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  margin: 0 0 var(--space-3);
  min-width: 0;
}
section > .wrap > p.lede { color: var(--muted); max-width: var(--measure); margin: 0 0 var(--space-8); }

table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
caption { text-align: left; color: var(--muted); padding-bottom: var(--space-3); }
th, td { text-align: left; padding: var(--space-3) var(--space-3); border-bottom: 1px solid var(--border); vertical-align: top; }
th { font-weight: 600; color: var(--muted); }
td code, p code, li code { font-family: var(--font-mono); font-size: var(--text-sm); }
td.n { font-variant-numeric: tabular-nums; color: var(--muted); width: 3ch; }

.tier { font-family: var(--font-mono); font-size: var(--text-xs); padding: 2px 6px; border-radius: var(--radius-sm); border: 1px solid currentColor; white-space: nowrap; }
.tier.fail { color: var(--alert); }
.tier.reflex { color: var(--warn); }
.tier.warn { color: var(--muted); }

.grid-recipes { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 260px)); gap: var(--space-6); }
.recipe { border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-4); min-width: 0; }
.recipe h3 { margin: 0 0 var(--space-2); font-family: var(--font-display); font-size: var(--text-lg); }
.recipe .slug { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--muted); }
.recipe p { margin: var(--space-3) 0 0; color: var(--muted); font-size: var(--text-sm); }
.chips { display: flex; gap: 6px; margin-top: var(--space-3); }
.chip { width: 28px; height: 28px; border-radius: var(--radius-sm); border: 1px solid var(--border); }

pre {
  margin: var(--space-4) 0 0;
  padding: var(--space-4);
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow-x: clip;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: 1.6;
}

footer.site { padding: var(--space-12) 0; color: var(--muted); font-size: var(--text-sm); }
footer.site .wrap { display: flex; justify-content: space-between; gap: var(--space-6); flex-wrap: wrap; }

@media (max-width: 640px) {
  :root { --space-section: 64px; }
  .hero { padding: var(--space-16) 0 var(--space-12); }
  table, thead, tbody, th, td, tr { display: block; }
  thead { display: none; }
  tr { border-bottom: 1px solid var(--border); padding: var(--space-3) 0; }
  td { border: 0; padding: 2px 0; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
`;

/* ---------------------------------------------------------------- 页面 */

const ruleRows = (list) =>
  list
    .map(
      (r, i) => `          <tr>
            <td class="n">${i + 1}</td>
            <td><code>${esc(r.id)}</code></td>
            <td>${esc(r.title)}<br><span class="slug">${esc(r.fix)}</span></td>
          </tr>`,
    )
    .join("\n");

const recipeCards = recipes
  .map(
    (r) => `        <article class="recipe">
          <h3>${esc(r.name)}</h3>
          <span class="slug">${esc(r.slug)} · ${esc(r.genre)} · ${esc(r.density)}</span>
          <div class="chips">
            <span class="chip" style="background: var(--sw-${r.slug}-paper)" aria-hidden="true"></span>
            <span class="chip" style="background: var(--sw-${r.slug}-ink)" aria-hidden="true"></span>
            <span class="chip" style="background: var(--sw-${r.slug}-accent)" aria-hidden="true"></span>
          </div>
          <p>${esc(r.mood)}。签名：${esc(r.signature)}</p>
        </article>`,
  )
  .join("\n");

const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>design-forge · 规则手册</title>
<meta name="description" content="design-forge 的规则目录、视觉配方与用法：${rules.count} 条确定性检查规则，8 套 OKLCH 配方。">
<link rel="stylesheet" href="docs.css">
</head>
<body>

<header class="site">
  <div class="wrap">
    <span class="brand">design-forge v${esc(pkg.version)}</span>
    <nav aria-label="页面导航">
      <a href="#rules">规则</a>
      <a href="#recipes">配方</a>
      <a href="#use">用法</a>
      <a href="#extend">扩展</a>
      <a href="https://github.com/aifeifei798/design-forge">GitHub</a>
    </nav>
  </div>
</header>

<main>
  <div class="hero wrap">
    <h1>把 AI 味当缺陷处理</h1>
    <p>一套自建的前端界面工作流：不可豁免的红线、可执行的确定性检查器、八套材料配方。没有二进制、没有遥测、没有联网；规则跑在 Node 上，三十秒出结果。</p>
    <div class="stats">
      <div><strong>${byTier.FAIL.length}</strong>Floor 红线</div>
      <div><strong>${byTier.REFLEX.length}</strong>Reflex 默认</div>
      <div><strong>${byTier.WARN.length}</strong>Warn 提示</div>
      <div><strong>${recipes.length}</strong>套配方</div>
    </div>
  </div>

  <section id="rules">
    <div class="wrap">
      <h2>规则目录</h2>
      <p class="lede">Floor 必须清零；Reflex 要么修，要么在交付里写明豁免理由；Warn 至少看一眼。检查器退出码：<code>0</code> 无 FAIL，<code>2</code> 有 FAIL。</p>

      <h3><span class="tier fail">FAIL</span> 不可豁免</h3>
      <table>
        <caption>${byTier.FAIL.length} 条，任何情况下都必须修。</caption>
        <thead><tr><th class="n">#</th><th>规则 id</th><th>问题与改法</th></tr></thead>
        <tbody>
${ruleRows(byTier.FAIL)}
        </tbody>
      </table>

      <h3><span class="tier reflex">REFLEX</span> 有理由可豁免</h3>
      <table>
        <caption>${byTier.REFLEX.length} 条，是模型的默认反射，有真实理由可以保留。</caption>
        <thead><tr><th class="n">#</th><th>规则 id</th><th>问题与改法</th></tr></thead>
        <tbody>
${ruleRows(byTier.REFLEX)}
        </tbody>
      </table>

      <h3><span class="tier warn">WARN</span> 提示</h3>
      <table>
        <caption>${byTier.WARN.length} 条，只提示不阻塞。</caption>
        <thead><tr><th class="n">#</th><th>规则 id</th><th>问题与改法</th></tr></thead>
        <tbody>
${ruleRows(byTier.WARN)}
        </tbody>
      </table>
    </div>
  </section>

  <section id="recipes">
    <div class="wrap">
      <h2>八套配方</h2>
      <p class="lede">配方是材料，不是排版稿：它定纸、墨、强调色、字体、圆角、密度与动效曲线，不定区块顺序。发牌命令会给三个候选，选那个能扛住你素材的。</p>
      <div class="grid-recipes">
${recipeCards}
      </div>
    </div>
  </section>

  <section id="use">
    <div class="wrap">
      <h2>用法</h2>
      <p class="lede">作为 OpenCode / Claude Code / Codex 的 skill 安装，或者只把它当命令行 linter 用。</p>
      <pre><code>git clone https://github.com/aifeifei798/design-forge.git
cd design-forge
ln -sfn "$PWD/skill" ~/.agents/skills/design-forge

node skill/scripts/tokens.mjs deal --genre product
node skill/scripts/tokens.mjs emit harbor --tailwind --out src/forge-tokens.css
node skill/scripts/forge.mjs src/            # 静态检查
node skill/scripts/forge.mjs src/ --render   # 八宽度渲染（需 Chrome + puppeteer-core）</code></pre>
      <p class="lede">会话里说「做个落地页」会自动加载；也可以 <code>/forge</code>、<code>/forge-audit</code>、<code>/forge-tokens</code> 直接进对应流程。</p>
    </div>
  <section id="extend">
    <div class="wrap">
      <h2>扩展</h2>
      <p class="lede">规则是表里的一行 + 一段扫描；配方是 JSON 里的一条数据。两个都不需要动框架。</p>
      <pre><code>// 加一条规则：skill/scripts/forge.mjs 顶部的 RULES 表
"type/line-height": ["REFLEX", "正文行高不在 1.5–1.65", "用 --leading-body token"],

// 加一套配方：skill/data/recipes.json
{ "slug": "kiln", "name": "Kiln", "genre": "editorial",
  "paper": { "l": 95, "c": 0.015, "h": 60 }, ... }</code></pre>
      <p class="lede">加规则必须同时在 <code>fixtures/bad.html</code> 放一个触发点，并把 <code>npm test</code> 的期望数字改对；加配方要能 <code>emit</code> 出 token。完整步骤见 <a href="https://github.com/aifeifei798/design-forge/blob/main/EXTENDING.md">EXTENDING.md</a>。</p>
    </div>
  </section>
</main>

<footer class="site">
  <div class="wrap">
    <span>MIT · 借鉴来源见 <a href="https://github.com/aifeifei798/design-forge/blob/main/NOTICE.md">NOTICE.md</a></span>
    <span>规则与配方由脚本生成，本页也被自家检查器检查过（0 FAIL）</span>
  </div>
</footer>

</body>
</html>
`;

mkdirSync(DOCS, { recursive: true });
writeFileSync(join(DOCS, "docs.css"), `${base}\n${extraTokens}\n${layout}`);
writeFileSync(join(DOCS, "index.html"), html);
console.log(`docs: ${rules.count} rules, ${recipes.length} recipes → docs/index.html + docs/docs.css`);
