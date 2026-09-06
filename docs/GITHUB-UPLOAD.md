# GitHub 上传说明

这个目录是完整源码包，可以上传到 Song 自己的 GitHub。建议仓库名：`source-atlas-desktop`。

## 上传前包含的内容

- `apps/desktop`：Electron + React + TypeScript 正式桌面应用。
- `apps/prototype`：产品交互原型。
- `docs`：PRD、架构、技术手册和交付清单。
- `assets/reference`：视觉参考素材。
- `.github/workflows/desktop-ci.yml`：GitHub 自动检查配置。
- `README.md` 和 `.gitignore`：项目首页与上传排除规则。

## 已排除的本地内容

- `node_modules`、`dist`、`.vite`、`.next`、`.wrangler` 等依赖、构建结果和缓存。
- `.env` 和 API Key。
- SQLite 数据库、Electron `userData` 以及用户导入的私人文件。
- 本机应用数据与构建产物不会进入 Git；提交前仍应检查 `git status`。

## 方式一：使用 GitHub CLI

本项目保留原仓库历史。建议先保留原作者仓库为 `upstream`，再把自己的仓库设为 `origin`：

```bash
git add .
git commit -m "Initial SourceAtlas desktop release"
git remote rename origin upstream
gh repo create source-atlas-desktop --private --source=. --remote=origin --push
```

如果希望公开仓库，把 `--private` 改为 `--public`。

## 方式二：使用 GitHub 网页

1. 在 GitHub 创建一个空仓库，不要勾选自动创建 README。
2. 在本目录执行：

```bash
git add .
git commit -m "Initial SourceAtlas desktop release"
git remote rename origin upstream
git remote add origin https://github.com/你的账号/source-atlas-desktop.git
git push -u origin main
```

## 上传后本地运行

```bash
cd apps/desktop
npm install
npm run dev
```
