# Changelog

本仓库记录 Cursor Skills Manager（CSM）开发历程。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

## [Unreleased]

### Added

- Web 三栏布局：浏览/列表/详情均可折叠、拖拽调宽，宽度持久化到 localStorage
- 左侧「浏览与筛选」面板：分类树 + 多维快捷筛选（未提交、校验失败、scripts、agents 异常）
- 列表区活跃筛选 chips，可逐项清除
- 分类树按**文件夹路径**分组（不再把 skill 名称当作分类节点）；根目录 skill 归入「未分类」
- 个人主库 / 项目分类区块及子文件夹均可折叠，折叠状态持久化

### Fixed

- 在线编辑器页：补全语言/主题切换（`HeaderPreferences`）；Frontmatter、预览、CodeMirror、文件列表改为跟随浅色/深色主题，不再写死深色样式
- Linux「打开目录/编辑器」：从 plasmashell/kwin 读取真实 `XAUTHORITY`；Linux 不再调用 `xdg-open`/`kde-open`（KDE 优先 `dolphin`，否则 `gio`）；API dev 监听 `@csm/core/dist` 变更并自动重启

### Changed

- 主页面三栏布局：最多同时收起 2 个面板（至少保留 1 个展开）；超出时折叠按钮禁用并提示
- 主页面三栏布局：展开的列自动均分填满宽度，收起列仅占窄条，不再留下右侧空白
- 主页面三栏收起/展开箭头：三栏统一为「收起时 ←、展开时 →」
- 主页面 Git：由右侧折叠侧栏改为居中弹窗（与 Sync Agents 一致）；点击顶栏 Git 打开，Esc / 点击遮罩 / 关闭按钮可退出
- 顶栏仅保留全文搜索；来源筛选改由分类树隐式推导，移除冗余下拉框
- Web 样式移除 `@layer components` 自定义类（`.csm-*`），统一为 `lib/ui.ts` Tailwind 工具类常量 + 组件内 `className`

- `apps/desktop`：Electron 壳内嵌 `apps/web` + API sidecar（`pnpm dev:desktop` / `pack:desktop`）
- v0.2 backlog 功能（见 doc/05 §8）

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
