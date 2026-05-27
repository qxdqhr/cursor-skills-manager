# Changelog

本仓库记录 Cursor Skills Manager（CSM）开发历程。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

## [Unreleased]

### Added

- （下一步 M3）Web 列表/树/搜索 UI

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
