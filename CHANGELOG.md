# Changelog

本仓库记录 Cursor Skills Manager（CSM）开发历程。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

## [Unreleased]

### Added

- M2（工作区，待提交）：`.csm/config.json`、SQLite FTS、`Bearer` 鉴权、skills/tree/search/index API
- M1：`packages/core` 扫描/解析/校验、项目 skill 只读扫描、`GET /api/v1/skills`
- 项目规则：子任务完成后本地 git 提交（`.cursor/rules/git-commit-after-subtask.mdc`）
- 开发进度文档：`doc/00-开发进度.md`

### Changed

- API 重构为 `app.ts` + `context` + 路由服务层（相对 M1 单文件 `index.ts`）

## [0.0.2] - 2026-05-26

### Added

- M0：pnpm monorepo（`apps/api` Hono、`apps/web` Vite+React、`packages/core`）
- M1：`packages/core` 全量扫描/校验；`GET /api/v1/skills`（M1 提交 `88dfd23`）

## [0.0.1] - 2026-05-26

### Added

- 产品需求文档、平台选型、接口草案、开发任务拆分（`doc/`）
