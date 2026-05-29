# Changelog

本仓库记录 Cursor Skills Manager（CSM）开发历程。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

## [Unreleased]

## [0.3.0] - 2026-05-29 — 多 Agent 统一

### Added

- **M9**：`platforms/probe.ts` CLI 探测；`GET /platforms` 返回 `cliInstalled` / `cliPath`
- **M9**：设置页 CLI 状态 + 官方文档链接；`resolveEffectiveGlobalRoot`（OpenCode alternateRoots）
- **M9**：`doc/ACCEPTANCE-v0.3.md`、`pnpm verify:m9`；smoke 扩展 m7/m8/m9
- **M8**：`platforms/publish.ts`、publish/repair/sync-platforms API、Web 发布 UI
- **M7**：Platform Registry、config v2、binding 检查与索引

### Changed

- 顶栏「同步 agents」→「发布到平台」；`agentsLink` 字段 deprecated，以 `bindings[]` 为准
- README 增加多平台发布说明

## [1.0.0] - 2026-05-27 — MVP

### Added

- M6：react-i18next 中英切换、浅色/深色主题、localhost 安全约束
- `pnpm smoke`、`doc/ACCEPTANCE-v0.1.md`、`doc/examples/csm-config.sample.json`

## [0.0.6] - 2026-05-27

### Added

- M5：Git status/diff/commit/log、sync-agents、agents-links、POST /open
- Web Git 侧栏、同步 agents Modal、未提交筛选与打开目录

## [0.0.5] - 2026-05-27

### Added

- M4：主库 skill 写入（validate / PUT / POST / DELETE / files）
- `indexUpsert` / `indexDelete` 单条索引更新
- Web 双栏编辑：CodeMirror + react-markdown 预览、新建与删除

## [0.0.4] - 2026-05-27

### Added

- M3：Web 列表/树/搜索/设置页；API client + localStorage Token
- 来源筛选、防抖搜索、只读徽章、校验状态展示

## [0.0.3] - 2026-05-27

### Added

- M2：`/.csm/config.json`、SQLite FTS 索引、Bearer 鉴权
- API：`GET/PATCH /config`、`/skills/tree`、`/skills/:id`、`/search`、`POST /index/rebuild`
- `pnpm verify:m2` 验收脚本
- 开发进度文档：`doc/00-开发进度.md`

### Changed

- API 重构为 `app.ts` + `context` + `services`（相对 M1 单文件 `index.ts`）

## [0.0.2] - 2026-05-26

### Added

- M1：`packages/core` 扫描/解析/校验、项目 skill 只读扫描（`88dfd23`）
- 项目规则：子任务完成后本地 git 提交（`0340385`）

## [0.0.2] - 2026-05-26

### Added

- M0：pnpm monorepo（`apps/api` Hono、`apps/web` Vite+React、`packages/core`）

## [0.0.1] - 2026-05-26

### Added

- 产品需求文档、平台选型、接口草案、开发任务拆分（`doc/`）
