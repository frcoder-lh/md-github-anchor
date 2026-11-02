# Markdown GitHub Anchor

让 VS Code Markdown 支持 **GitHub 风格的行数锚点链接**，点击即可跳转并高亮目标行区间。

## 效果

```markdown
[查看实现](src/commands.ts#L12-L15)
详见 src/commands.ts#L12-L15 即可跳转。
```

按住 `Ctrl/Cmd` 点击链接，跳转到目标文件并高亮第 12–15 行。

## 支持的链接形式

| 形式 | 示例 | 说明 |
|------|------|------|
| 行内链接 | `[文字](src/file.ts#L12-L15)` | 标准 Markdown |
| 自动链接 | `<src/file.ts#L12-L15>` | 尖括号包裹 |
| 裸文本 | `src/file.ts#L12-L15` | 正文里直接写即可 |

行号语法：

| 写法 | 含义 |
|------|------|
| `file.ts#L42` | 第 42 行 |
| `file.ts#L12-L15` | 第 12–15 行 |
| `file.ts#L12-15` | 同上（终点省略 `L`） |
| `#L7-L9` | 同文件第 7–9 行 |

## 安装

- **VS Code Marketplace**：<https://marketplace.visualstudio.com/items?itemName=frcoder-lh.md-github-anchor>
- **Open VSX**（Trae / code-server / Theia）：<https://open-vsx.org/extension/frcoder-lh/md-github-anchor>
- **手动安装**：从 [Releases](https://github.com/frcoder-lh/md-github-anchor/releases) 下载 `.vsix`

## 快捷键

命令面板 (`Ctrl/Cmd+Shift+P`) → `Markdown Anchor: Open GitHub-Style Anchor Link`，可从剪贴板读取锚点链接并跳转。
