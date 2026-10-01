# Markdown GitHub Anchor

让 VS Code 的 Markdown 支持 **GitHub 风格的行数锚点链接**：

```markdown
[查看实现](src/commands.ts#L12-L15)
[单行](docs/guide.md#L42)
```

> 上面两行本身就是本插件的演示：把它们写进任一 Markdown 文件，即可点击跳转到对应文件的行区间。

## 解决的问题

GitHub 上可以用 `path/to/file.md#L12-L15` 精确指向某文件的行区间，并高亮显示。
VS Code 原生既不识别这种链接（点击无反应），也没有在预览中高亮行区间的能力。
本插件补齐这两点。

## 用法示例

在任意 Markdown 文件里写下面这类链接即可（`#L12-L15` 表示第 12 至 15 行）：

```
[查看实现](src/commands.ts#L12-L15)
[区间终点不带 L](src/commands.ts#L12-15)
[单行](docs/guide.md#L42)
```

在编辑器里按住 `Ctrl/Cmd` 点击链接，即可跳转到目标文件并高亮对应行区间。

## 安装

- **Open VSX**（Trae / code-server / Theia / Gitpod 默认市场）：<https://open-vsx.org/extension/frcoder-lh/md-github-anchor>
- **GitHub Release**（手动安装 `.vsix`）：<https://github.com/frcoder-lh/md-github-anchor/releases>
- 在 Trae / VS Code 扩展市场搜索 `md-github-anchor` 亦可。

## 发布

版本号在 `package.json` 的 `version` 字段；更新后通过 **GitHub Actions 自动发布**到 Open VSX 与 GitHub Release：

1. 修改 `version`（如 `1.0.0` → `1.0.1`），提交并推送。
2. 打 tag：`git tag v1.0.1 && git push origin tag v1.0.1`
3. 或手动触发：仓库 **Actions → Publish → Run workflow**。

流水线 `.github/workflows/publish.yml` 会：`npm ci` → 编译 → 单测 → 打包 → `ovsx publish`（Open VSX）→ 上传 `.vsix` 到 GitHub Release。

> 需要发布权限时，在仓库 **Settings → Secrets → Actions** 配置 `OVSX_TOKEN`（open-vsx.org 生成的 Personal Access Token）。Open VSX 不允许覆盖同一版本，重复发布会因 `--skip-duplicate` 自动跳过。

