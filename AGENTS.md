# AGENTS — 发布操作指令

当用户说「**发布**」「**发版**」「**发新版本**」时，按本文件执行。

## 发版步骤

1. **定版本**：读 `package.json` 的 `version`，patch +1（用户指定则用用户的）。
2. **改版本号**：`package.json` 的 `version` 字段。
3. **本地验证**：`npm test`（anchor + linkprovider 全绿）。
4. **提交打 tag**：
   ```bash
   git add -A && git commit -m "release: v<X.Y.Z>"
   git tag v<X.Y.Z>
   git push origin main && git push origin v<X.Y.Z>
   ```

推送 `v*` tag 触发 GitHub Actions，自动完成：

```
build ──┬── publish-openvsx ──┐
        └── publish-vsmarketplace ──┴── github-release
```

两个市场并行发布，互不阻塞；都成功后才附 GitHub Release。

## 交付链接

- Open VSX：<https://open-vsx.org/extension/frcoder-lh/md-github-anchor>
- VS Marketplace：<https://marketplace.visualstudio.com/items?itemName=frcoder-lh.md-github-anchor>
- Release：<https://github.com/frcoder-lh/md-github-anchor/releases/tag/v<X.Y.Z>>

## 踩坑记录

| 问题 | 原因 | 解法 |
|------|------|------|
| `ovsx: unknown option --trusted-publishing` | npx 拉到旧版 ovsx | workflow 中显式写 `npx ovsx@1.3.0` |
| `vsce: Invalid version xxx.vsix` | 位置参数传 vsix 文件，`--oidc` 不兼容 | 用 `--packagePath "$VSIX"` |
| `vsce: unknown option --oidc` | 本地 devDependency 的 vsce 太旧 | 发布 job 用 `npx @vscode/vsce@4.1.0` |
| `category 'Markdown' is not available` | VS Marketplace 不认此分类 | categories 用 `Other` / `Programming Languages` |
| README 链接被重写成 GitHub blob URL | vsce 自动重写 `[文字](相对路径)`，**代码块里也不放过** | README 示例避开 `[文字](路径)` 写法，用空格分隔或纯代码块 |
| `--baseContentUrl` 影响文字链接 | 它重写所有链接 | 用 `--baseImagesUrl` 只重写图片 |

## 前提

- 可信发布（OIDC）已在 Open VSX 和 VS Marketplace publisher 页面配置好（owner=`frcoder-lh`、repo=`md-github-anchor`、workflow=`publish.yml`），仓库无需存任何 token secret。
- Git 提交身份：`frcoder-lh <frcoder.lh@hotmail.com>`。
