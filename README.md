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

点击（编辑器内 `Ctrl/Cmd+Click`，或预览中直接点击）即可跳转到目标文件并高亮对应行区间。

## 自定义预览（替换默认预览）

Trae 等宿主的内置 Markdown 预览不加载本插件的 markdown 扩展点，预览中锚点无法跳转。
本插件自带一个**自定义预览面板**（用 markdown-it 渲染，链接跳转 100% 可控，在任何 VS Code 兼容编辑器内都生效）：

- **打开方式**：命令面板执行 `Markdown Anchor: Open GitHub Anchor Preview`，或快捷键 `Ctrl+Shift+H`（mac: `Cmd+Shift+H`）。
- **替换默认预览**：本插件已把 `Ctrl+Shift+V`（Windows/Linux）和 `Cmd+Shift+V`（mac）在 Markdown 文件下绑定到自定义预览，按它即打开自定义预览。
- 如果 `Ctrl+Shift+V` 仍打开内置预览（快捷键冲突），请在你的 `keybindings.json` 中覆盖一次：

```jsonc
{
  "key": "ctrl+shift+v",
  "command": "md-github-anchor.openPreview",
  "when": "editorLangId == 'markdown'"
}
```

> 说明：编辑器标题栏的"打开预览"按钮和命令面板中的 `Markdown: Open Preview` 仍走宿主内置预览（VS Code 的 `previewHandler` 替换点在 Trae 上不被支持）。日常用 `Ctrl+Shift+V` 即可获得带锚点跳转的自定义预览。
