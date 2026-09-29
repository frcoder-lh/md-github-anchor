# Open VSX 发布检查清单（md-github-anchor）

目标：把 `md-github-anchor` 发布到 [open-vsx.org](https://open-vsx.org)。Open VSX 是 Trae、code-server、Theia、Gitpod 等默认对接的 VS Code 扩展市场，也是国内访问最顺的发布渠道。

## ✅ 仓库字段（已替换）

`package.json` 的 `repository` / `homepage` / `bugs` 已指向 `frcoder-lh`。发布前确认仓库已创建并推送；`publisher` 已设为 `frcoder-lh`（与 Open VSX 命名空间一致）。

## 一、本地校验清单（每次发布前跑）

| # | 检查项 | 命令 / 方式 | 通过标准 |
|---|---|---|---|
| 1 | TypeScript 编译 | `npm run compile` | 退出码 0 |
| 2 | 锚点解析单测 | `npm test` | `PASS=13 FAIL=0` |
| 3 | 包内容完整 | `npx vsce ls` | 包含 `out/*.js`、`icon.png`、`LICENSE`、`README.md` |
| 4 | 打包无告警 | `npm run package` | 输出 `DONE Packaged`，无 `ERROR` |
| 5 | package.json 合法 | `node -e "JSON.parse(require('fs').readFileSync('package.json'))"` | 无报错 |
| 6 | 占位符已替换 | `grep -c "YOUR-USERNAME" package.json` | 结果为 0（现为 `frcoder-lh`） |

## 二、Open VSX 发布流程

前置条件：一个 GitHub 账号（用作命名空间）、本地 Node ≥ 16 + `npx`。

1. **登录 open-vsx.org 生成令牌**
   - 打开 <https://open-vsx.org/>，用 GitHub 账号 OAuth 登录。
   - 右上角个人设置 → **Publish an extension** / 生成 Access Token（Token 与你的 GitHub 用户名绑定为命名空间）。

2. **发布**（在项目根目录执行）
   ```bash
   npx ovsx publish -p <YOUR_TOKEN>
   ```
   - 首次发布会自动创建命名空间并上传 `.vsix`。
   - 若提示 publisher 与命名空间不符：把 `package.json` 的 `"publisher"` 改成你的 GitHub 用户名后再发布。

3. **验证**
   - 打开 <https://open-vsx.org/extension/frcoder-lh/md-github-anchor>（路径为 `命名空间/扩展名`）。
   - 检查：图标、描述、README 已渲染；版本号 `0.1.0` 正确。

4. **更新版本**：改 `version` 后重新 `npm run package && npx ovsx publish -p <token>`（Open VSX 不允许覆盖已发布的同一版本）。

## 三、发布到 VS Code Marketplace（可选加分项）

两者共用同一份 `.vsix`，可后续再发：

1. 注册 Azure DevOps 组织 + Microsoft 账号，在 `marketplace.visualstudio.com` 创建 publisher。
2. 生成个人访问令牌（PAT，权限选 Marketplace → Manage），替换 `"publisher"` 为注册的 publisher 名。
3. `npm run package && npx vsce publish -p <PAT>`。

> 注意：国内网络访问 marketplace.visualstudio.com 与 Azure DevOps 通常需代理；且微软官方市场要求额外审核。

## 四、常见问题

- **`Couldn't detect the repository`**：README 里有相对链接，`package.json` 必须有 `repository` 字段（本仓库已指向 `frcoder-lh/md-github-anchor`）。
- **命名空间冲突**：Open VSX 命名空间 = GitHub 用户名，一个账号一个命名空间。
- **打包含 `node_modules`**：`vsce` 默认排除，且发布用 `--no-dependencies`，产物保持干净。
- **想改图标**：替换根目录 `icon.png`（建议 128×128 或 256×256，PNG）。
