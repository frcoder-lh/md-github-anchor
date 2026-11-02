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

**裸文本锚点**：无需写 `[]()`，直接在正文里写路径即可被识别为可点击链接：

```
详见 src/commands.ts#L12-L15 即可跳转。
也可以直接写 demo/target.md#L3 或 #L1-L2。
```

插件会自动识别以下三种形式：

| 形式 | 示例 | 说明 |
|------|------|------|
| 行内链接 | `[文字](src/file.ts#L12-L15)` | 标准 Markdown 链接 |
| 自动链接 | `<src/file.ts#L12-L15>` | 尖括号包裹 |
| **裸文本** | `src/file.ts#L12-L15` | 正文中直接书写 |

在编辑器里按住 `Ctrl/Cmd` 点击链接，即可跳转到目标文件并高亮对应行区间。

## 安装

- **VS Code Marketplace**（VS Code / Cursor 默认市场）：<https://marketplace.visualstudio.com/items?itemName=frcoder-lh.md-github-anchor>
- **Open VSX**（Trae / code-server / Theia / Gitpod 默认市场）：<https://open-vsx.org/extension/frcoder-lh/md-github-anchor>
- **GitHub Release**（手动安装 `.vsix`）：<https://github.com/frcoder-lh/md-github-anchor/releases>
- 在 VS Code / Trae 扩展市场搜索 `md-github-anchor` 亦可。

