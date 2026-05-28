# Cursor Skills Manager

基于 `~/.cursor/skills` Git 主库的 Skill 管理工具（**MVP v0.1**）。

**技术栈**：Vite + React（Web）· Hono（API）· Electron（Desktop）· `packages/core`（共享逻辑）

**当前进度**：M0～M6 已完成。验收见 [doc/ACCEPTANCE-v0.1.md](./doc/ACCEPTANCE-v0.1.md)。

## 快速开始

```bash
cd /home/qhr/project/cursor-skills-manager
cp .env.example .env   # 可选
pnpm install
pnpm dev               # API :3847 + Web :5173
```

1. 打开 <http://127.0.0.1:5173>
2. **设置** 中粘贴 `~/.cursor/skills/.csm/config.json` 里的 `api.token`
3. 顶栏可切换 **中文/English** 与 **浅色/深色** 主题

| 服务 | 地址 |
|------|------|
| Web | http://127.0.0.1:5173 |
| API Health | http://127.0.0.1:3847/api/v1/health |

## 主要功能

- 浏览 / 搜索个人主库与项目 skill（项目只读）
- 双栏编辑 SKILL.md（校验 + 预览）
- Git 变更、diff、commit
- 一键执行 `sync-from-agents-skills.sh`
- 新建 / 删除个人 skill

## 桌面端

Electron 壳自动连接本地 API，开发模式复用 Vite dev server：

```bash
pnpm dev:desktop          # API + Web + Electron 窗口
pnpm pack:desktop         # 打包 linux-unpacked（含 sidecar bundle）
```

打包产物：`apps/desktop/dist/linux-unpacked/cursor-skills-manager`  
RPM（openSUSE）：`pnpm --filter @csm/desktop pack:rpm`

## 开发命令

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:desktop
pnpm typecheck
pnpm test
pnpm smoke              # 全量自检（API 已启动时含 verify:m2/m4/m5）
pnpm verify:m1          # 扫描主库
pnpm verify:m2          # API 列表/搜索（需 API）
```

### API 鉴权

Token 位于主库 `~/.cursor/skills/.csm/config.json`（首次启动 API 自动生成）：

```bash
TOKEN=$(jq -r '.api.token' ~/.cursor/skills/.csm/config.json)
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3847/api/v1/skills | jq '.data.total'
```

### 安全

- API **仅绑定** `127.0.0.1`（`CSM_API_HOST` 设为其他地址将拒绝启动）
- 无需对外开放防火墙端口

### 主库配置样例

见 [doc/examples/csm-config.sample.json](./doc/examples/csm-config.sample.json)。`.csm/index.sqlite` 应随主库 Git 提交（勿加入 `.gitignore`）。

## 文档

| 文件 | 说明 |
|------|------|
| [doc/00-开发进度.md](./doc/00-开发进度.md) | 里程碑与自测 |
| [doc/ACCEPTANCE-v0.1.md](./doc/ACCEPTANCE-v0.1.md) | MVP 验收 AC-01～10 |
| [doc/01-cursor-skills-manager-需求文档.md](./doc/01-cursor-skills-manager-需求文档.md) | 产品需求 |
| [CHANGELOG.md](./CHANGELOG.md) | 版本历史 |

## 关联资产

- Skill 主库：`~/.cursor/skills`（Git）
- 归并脚本：`~/.cursor/skills/scripts/sync-from-agents-skills.sh`
