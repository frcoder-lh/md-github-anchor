# AGENTS — 发布操作指令

当用户说「**发布**」「**发版**」「**重新发布**」「**发新版本**」或提及"发布"时，按本文件流程执行。

## 一、确定版本号

1. 读取根目录 `package.json` 的 `version` 字段作为当前版本（当前基准：`1.0.0`）。
2. 二选一：
   - 用户**没有**给出版本号 → 自动把 `patch` +1（例如 `1.0.0` → `1.0.1`；`1.0.5` → `1.0.6`）。
   - 用户**给出**了版本号 → 使用用户给的（格式须为 `X.Y.Z` 或 `X.Y.Z-n`，tag 统一加 `v` 前缀）。
3. 更新 `package.json` 的 `version` 字段，并同步更新 README / 相关元数据中的版本号（若提及）。

## 二、本地验证与打包

在项目根目录执行，全部通过后才可发布：

```bash
npm test                 # 编译 + 单测（anchor 13 / linkprovider 12 全绿）
npm run package          # 产出 md-github-anchor-<X.Y.Z>.vsix
```

## 三、提交并触发流水线

```bash
git add -A
git commit -m "release: v<X.Y.Z>"
git push origin master:main
git tag v<X.Y.Z>
git push origin tag v<X.Y.Z>
```

推送 `v*` tag 会触发 GitHub Actions `Publish` workflow（`.github/workflows/publish.yml`），它自动完成：

1. `npm ci` → 编译 → 单测 → 打包。
2. `ovsx publish`（发布到 **Open VSX**，用 secret `OVSX_TOKEN`，`--skip-duplicate` 防版本冲突）。
3. `softprops/action-gh-release` 创建 **GitHub Release** 并附上 `.vsix`。

等待 workflow 完成后，向用户交付：
- Open VSX 扩展页：<https://open-vsx.org/extension/frcoder-lh/md-github-anchor>
- GitHub Release 页：<https://github.com/frcoder-lh/md-github-anchor/releases/tag/v<X.Y.Z>>
- 最新 `.vsix` 文件

## 四、备选：仅发 Open VSX（不建 GitHub Release）

无 tag 时可用手动触发：

```bash
gh workflow run publish.yml --repo frcoder-lh/md-github-anchor
```

此时只发布到 Open VSX，`Attach VSIX to GitHub Release` 步骤会因无 tag 跳过。

## 五、注意事项

- **Open VSX 不允许覆盖同一版本**：重复发布同一版本会因 `--skip-duplicate` 自动跳过（不算失败）。
- **版本号语义**：补丁修复 `+1`；新功能/破坏性变更按语义化版本（SemVer）调整 `minor` / `major`，用户有明确要求时按用户要求。
- **发布前确认**：`package.json` 的 `publisher` 为 `frcoder-lh`，`repository` 指向 `frcoder-lh/md-github-anchor`，否则 Open VSX 发布会失败。
- 若发布失败，先读 workflow 日志定位（多为版本重复、token 失效、网络）。
