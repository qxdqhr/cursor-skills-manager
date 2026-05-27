# Cursor Skills Manager — 平台选型：Web 与桌面端对比

| 项目 | 内容 |
|------|------|
| 文档版本 | v0.1 |
| 更新日期 | 2026-05-26 |
| 关联 | [01-cursor-skills-manager-需求文档.md](./01-cursor-skills-manager-需求文档.md) |

---

## 1. 选型背景

CSM 的核心操作都针对**本机目录** `~/.cursor/skills`（Git 仓库）：

- 递归扫描 `SKILL.md`
- 读写 Markdown 与附属脚本
- 执行 shell（`git`、`npx skills`、归并脚本）
- 检查 `~/.agents/skills` 符号链接

因此任何「纯浏览器、无后端」的方案**无法完成 MVP**，必须在「本地后端」或「桌面壳 + 原生 FS API」之间选择。

---

## 2. 候选方案定义

| 方案 | 架构简述 |
|------|----------|
| **A. 本地 Web** | 浏览器访问 `http://127.0.0.1:<port>`；Vite/React 前端 + Node/Bun 本地 API 读写磁盘、调 git |
| **B. 桌面端 Tauri** | Rust 壳 + WebView；前端同上，FS/Git 通过 Tauri command 或 sidecar Node |
| **C. 桌面端 Electron** | Chromium + Node 主进程；`fs`/`child_process` 直接可用 |
| **D. 云端 Web** | 部署在服务器；用户上传/同步 skill 仓库 |
| **E. CLI/TUI** | Go/Rust/Node 终端工具；`fzf` + 编辑器 |

---

## 3. 对比维度

### 3.1 总表

| 维度 | A 本地 Web | B Tauri | C Electron | D 云端 Web | E CLI |
|------|------------|---------|------------|------------|-------|
| **访问本机 `~/.cursor/skills`** | ✅ API | ✅ 原生 | ✅ 主进程 | ⚠️ 需上传/同步 | ✅ |
| **开发速度（MVP）** | ⭐⭐⭐ 快 | ⭐⭐ 中 | ⭐⭐ 中 | ⭐ 慢 | ⭐⭐⭐ 快但 UI 弱 |
| **编辑/预览体验** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| **安装分发** | 需启动命令 | 单可执行文件 | 体积大 | 打开 URL | 一条命令 |
| **内存占用** | 中（浏览器+Node） | 低～中 | 高 | 无本地 | 极低 |
| **Linux 适配** | ✅ 你当前环境 | ✅ | ✅ | ✅ | ✅ |
| **隐私** | ✅ 全本地 | ✅ 全本地 | ✅ 全本地 | ❌ 需信任服务端 | ✅ |
| **调用 git / shell** | ✅ child_process | ✅ | ✅ | ⚠️ 服务端代跑 | ✅ |
| **系统托盘/全局快捷键** | ❌ 弱 | ✅ | ✅ | ❌ | ✅ 弱 |
| **与现有技术栈重合** | React 高 | React 高 | 你有 Electron skill | 需新后端 | 低 |

### 3.2 针对 CSM 关键能力

| 能力 | 本地 Web | 桌面 (Tauri/Electron) |
|------|----------|------------------------|
| 分类树 + 列表 UI | 同样用 React 组件库即可 | 同左 |
| Monaco 编辑器 | 成熟 | 成熟 |
| 文件监听（保存后刷新索引） | chokidar on API | 原生 watcher 更顺 |
| 打开系统默认编辑器 | API `xdg-open` | 更简单 |
| 打包给「非技术」自用 | 需写 systemd/脚本 | 双击图标 |
| 远程访问同一台机器 | 可 SSH 隧道 | 一般不需要 |

---

## 4. 分方案说明

### 4.1 方案 A：本地 Web（推荐 MVP）

```text
┌──────────────┐     HTTP      ┌─────────────────────┐
│   Browser    │ ◄──────────► │  Local API :3847     │
│  React/Vite  │   localhost  │  Node/Bun + Fastify  │
└──────────────┘               │  · scan skills       │
                               │  · fs read/write     │
                               │  · git / scripts     │
                               └──────────┬──────────┘
                                          │
                               ~/.cursor/skills (git)
                               ~/.agents/skills (symlinks)
```

**优点**

- 与你现有 `profile-v1`、RN 等 **React 技术栈一致**，组件库（shadcn/ui）可复用。
- 热更新快，调试方便（浏览器 DevTools）。
- 未来若要「局域网另一台机器管理 NAS 上的 skills」，只需改 bind 地址（加鉴权）。
- 可先不打包，用 `pnpm dev` + `csm serve` 即可自用。

**缺点**

- 需要**常驻本地进程**；用户可能忘记关端口（可用随机端口 + 仅 127.0.0.1 缓解）。
- 不是「一个图标」的桌面应用体验；需终端或 `.desktop` 启动器。

**适用**：你希望 **2～4 周内出可用 MVP**，且主要在自己 Linux 工作站上用。

---

### 4.2 方案 B：Tauri 2.x

**优点**

- 安装包小、内存低于 Electron；Linux 上表现好。
- 最终可分发 `.AppImage` / `.deb`，符合「管理工具」产品形态。
- UI 仍用 Web 技术，**与方案 A 前端代码大量复用**。

**缺点**

- 需维护 Rust 工具链；FS/Git 逻辑要写 Tauri command 或 sidecar，**首期比重更高**。
- 调试链路比纯 Web 多一层。

**适用**：MVP 验证后，想要 **桌面图标 + 不暴露 HTTP 端口** 的正式版。

---

### 4.3 方案 C：Electron

**优点**

- Node 与 Chromium 一体，`fs`/`git`/`child_process` 最直接。
- 你已有 `electron-hello-cross-installer` skill，团队熟悉度可能更高。

**缺点**

- 包体积与内存明显大于 Tauri。
- 对「只管理本地 markdown」而言略重。

**适用**：若你计划 **顺便做跨平台安装包** 且不介意体积，可选；否则不如 Tauri。

---

### 4.4 方案 D：云端 Web — 不推荐

**原因**

- Skill 常含路径、脚本、个人工作流，上传云端有**隐私与误提交**风险。
- 仍需在本地 Cursor 使用，云端编辑与 IDE 侧文件**双源同步**复杂。
- 无法直接执行 `~/.cursor/skills/scripts/*.sh` 与真实 agents 目录归并。

**仅当有「团队共享 skill 库 + 审核发布」需求时再考虑**，且应作为 **Git 远端（GitHub）** 协作，而非把 CSM 做成 SaaS。

---

### 4.5 方案 E：CLI — 作补充

可后续提供 `csm list`、`csm search`、`csm validate`，与 GUI 共用核心库（`packages/core`）。**不适合**作为主编辑界面。

---

## 5. 推荐决策

### 5.1 结论

| 阶段 | 推荐方案 |
|------|----------|
| **MVP（v0.1）** | **方案 A：本地 Web** |
| **产品化（v0.3）** | 在 A 的前端之上加 **方案 B：Tauri 壳**，或提供 Electron 构建（二选一） |
| **不推荐** | 纯云端 Web |
| **可选增强** | CLI 与 GUI 共享 `packages/core` |

### 5.2 理由（结合你的环境）

1. **主库已在本地 Git**，本地 API 是最短路径，无需解决同步冲突。
2. **需求侧重搜索、表单编辑、Git 面板**，浏览器 + React 最省时间。
3. 你已有 **React / Tailwind / Next** 项目经验，MVP 可复用 UI 习惯。
4. **Linux 主力机**；本地 Web 绑定 `127.0.0.1` 即可，安全边界清晰。
5. Tauri/Electron 放在第二期，避免首版陷入打包与签名，而核心功能未验证。

### 5.3 建议技术栈（MVP）

| 层级 | 选型 |
|------|------|
| 前端 | Vite + React + TypeScript + Tailwind + shadcn/ui |
| 编辑器 | Monaco Editor 或 CodeMirror 6 |
| 后端 | Bun 或 Node + Fastify（仅 localhost） |
| 索引 | 启动时扫描 + chokidar；可选 SQLite FTS5 |
| Git | `simple-git` 或调用 CLI |
| 元数据 | `.csm/*.json` 存于主库或项目配置目录 |
| 包管理 | pnpm monorepo：`apps/web` + `apps/api` + `packages/core` |

### 5.4 若你更在意「桌面感」的折中

**Tauri + 内嵌本地 API**：壳内启动 sidecar Node 服务，WebView 访问 `localhost`——开发复杂度上升，但 UX 接近原生。可作为 v0.2 目标，**不必作为 MVP 第一天方案**。

---

## 6. 决策树

```text
是否需要多人云端协作同一 skill 库？
├─ 是 → GitHub + PR，CSM 仍建议本地 Web 编辑后 push
└─ 否 → 是否首期就要双击图标、无终端？
    ├─ 是 → Tauri / Electron（优先 Tauri）
    └─ 否 → 本地 Web MVP ✅
```

---

## 7. 下一步（文档通过后）

1. 确认 [01-需求文档](./01-cursor-skills-manager-需求文档.md) 中「待确认问题」。
2. 输出 `04-接口与数据字典草案.md`、`05-开发子任务拆分清单.md`（若需要进入开发）。
3. 在 `cursor-skills-manager` 初始化 monorepo 骨架（`apps/web`、`apps/api`、`packages/core`）。

---

## 8. 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.1 | 2026-05-26 | 初稿：Web vs 桌面对比与 MVP 推荐 |
