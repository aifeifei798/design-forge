# 参与 / 维护

这是一个自用工具，但结构是照着"能长期维护"设计的。所有改动都要过同一道门：`npm test`。

## 快速开始

```bash
git clone https://github.com/aifeifei798/design-forge.git
cd design-forge
npm test          # 不需要 npm install：零依赖
```

Node 18+（CI 用 22）。没有构建步骤，没有打包，没有 lint 工具链——`forge.mjs` 自己就是 lint。

## 改动的三条规矩

1. **规则和配方都是数据/单点函数**：加规则改 `RULES` 表 + 扫描，加配方改 JSON。别引入框架。
2. **文档是生成的**：`docs/` 由 `tools/build-docs.mjs` 从规则表与配方库产出，不要手改 `docs/index.html`。改了规则/配方要重跑 `node tools/build-docs.mjs` 并提交。
3. **测出来才算数**：新增规则必须在 `fixtures/bad.html` 里加真实触发点，并把 `package.json` 里 `test:bad` 的期望数字改对；新增配方必须能 `emit` 出 token。交付里贴的检查结果必须是真跑的数字。

## 提交信息

中文，一行主题 + 要点列表。前缀照常用：

- `feat:` 新规则 / 新配方 / 新命令
- `fix:` 检查器误报、漏报、生成器 bug
- `docs:` 参考文档、README、EXTENDING
- `ci:` workflow
- `chore:` 版本号、忽略文件

## 加东西之前先读

[EXTENDING.md](EXTENDING.md)：加规则、加配方、加参考文档、加命令各自要改哪里、要同步哪些文件、怎么验证。

## 许可

提交即同意以 [MIT](LICENSE) 发布。引入第三方代码必须在 [NOTICE.md](NOTICE.md) 里登记来源、许可证与"用了哪一部分"，并在文件头注明；Apache-2.0 的代码要附许可证副本。
