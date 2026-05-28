# @csm/desktop

Cursor Skills Manager 的 Electron 桌面壳：内嵌现有 Web UI，并以 sidecar 方式启动 `@csm/api`。

## 架构

```text
┌──────────────────────────────┐
│ Electron 主进程               │
│  · 启动 API sidecar (:3847)   │
│  · bundled 模式：静态 UI 服务  │ (:5173, 代理 /api)
│  · dev 模式：加载 Vite :5173   │
└──────────────────────────────┘
```

- **开发**：`pnpm dev:desktop`（根目录）并行启动 API、Web、Electron
- **独立调试 Electron**：需 API/Web 已运行，或 Electron 会自动拉起 API（`pnpm --filter @csm/api dev`）
- **打包**：`pnpm prepare-bundle` 构建并 deploy API + 复制 web dist → `electron-builder`

## 命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动 Electron（开发） |
| `pnpm prepare-bundle` | 生成 `.bundle/api` + `.bundle/web` |
| `pnpm pack:dir` | Linux unpacked 目录包 |
| `pnpm pack:debug` | 一键依赖检查 + pack:dir |
| `pnpm pack:rpm` | 原生 rpmbuild RPM（openSUSE） |

## 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `CSM_API_PORT` | `3847` | API 端口 |
| `CSM_DESKTOP_UI_PORT` | `5173` | UI 端口（bundled 静态服务） |
| `CSM_DESKTOP_FORCE_BUNDLE` | — | 设为 `1` 时 dev 也走 `.bundle` |

安装 Electron 若下载失败，可设置镜像：

```bash
ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" pnpm install
```
