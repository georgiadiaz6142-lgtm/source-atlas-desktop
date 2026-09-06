# 源码整理与验证报告

验证日期：2026-09-06

## 整理内容

- 清除 ZIP 中的 `__MACOSX` 目录和 `._*` AppleDouble 元数据文件。
- 保留 `apps/desktop`、`apps/prototype`、`docs`、`assets/reference` 和 `.github/workflows` 的分类结构。
- 将正式桌面端和原型包名统一为 `source-atlas-desktop` 与 `source-atlas-prototype`。
- 产品显示名称统一为“知源星图”，内部英文名称统一为 `SourceAtlas`。
- 将 GitHub 上传说明归档为 `docs/GITHUB-UPLOAD.md`。
- 未发现被 Git 跟踪的 `node_modules`、构建产物、超过 50 MB 的大文件、常见 API Key 或私钥特征。

## 验证结果

### `apps/desktop`

- `npm run typecheck`：通过。
- `npm test`：通过，共 24 项测试（15 项 Vitest + 9 项 Node.js 测试）。
- `npm run build`：通过。

### `apps/prototype`

- `npm run build`：通过。
- `npm run lint`：未通过，现有 UI 组件库中有 19 个规则报错，主要为 JSX 可访问性、React effect 与 TypeScript 模板字符串规则。这些问题不阻断当前生产构建，但建议在将原型并入正式产品前修复。

## 依赖安全审计

`npm ci` 的审计摘要：

- 桌面端：8 个漏洞（4 个中危、3 个高危、1 个严重）。
- 原型端：11 个漏洞（1 个低危、2 个中危、8 个高危）。

本次未执行 `npm audit fix --force`，因为强制升级可能产生破坏性依赖变更。建议后续单独建立依赖升级分支处理并重新回归测试。
