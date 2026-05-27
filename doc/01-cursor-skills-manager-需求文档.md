# Cursor Skills Manager — 需求文档

| 项目 | 内容 |
|------|------|
| 文档版本 | v0.2 |
| 更新日期 | 2026-05-26 |
| 项目目录 | `/home/qhr/project/cursor-skills-manager` |
| 状态 | **已评审**（决策见 [§13](#13-已确认决策)） |

---

## 1. 背景与动机

### 1.1 现状

个人 Cursor Agent Skills 已统一收纳在 Git 主库：

- **主库路径**：`~/.cursor/skills/`（分支 `main`，约 17+ 个 skill）
- **兼容入口**：`~/.agents/skills/`（符号链接，供 `npx skills` 发现）
- **桌面快捷方式**：`~/Desktop/cursor-skills`
- **已有脚本**：`sync-from-agents-skills.sh`、`skills-add.sh`（安装后归并）

Skill 支持 Cursor 官方约定的嵌套目录（如 `category/my-skill/SKILL.md`），但**调用名仅为叶子目录名**（`/my-skill`），分类目录仅作组织用途。

### 1.2 痛点

| 痛点 | 说明 |
|------|------|
| 查找困难 | 仅靠文件树或 `skills-inventory.md`，无法按分类/标签/触发词快速检索 |
| 编辑分散 | 需手动打开目录、编辑 `SKILL.md`，缺少 frontmatter 校验与预览 |
| 分类弱 | 物理目录可嵌套，但无统一「分类元数据」与跨分类视图 |
| 更新链路长 | 安装社区 skill → 归并 → 手改 → 手提交 Git，步骤多且易漏 |
| 状态不可视 | 未提交变更、与 agents 链接是否一致、frontmatter 是否合法，缺少仪表盘 |

### 1.3 产品定位

**Cursor Skills Manager（CSM）**：面向个人开发者的**本地优先** Skill 工作台，以 `~/.cursor/skills` Git 仓库为唯一数据源，提供分类、搜索、编辑、更新与 Git 工作流的一体化 GUI/CLI。

---

## 2. 目标与非目标

### 2.1 产品目标

1. **可发现**：按名称、描述、分类、标签、路径、Git 状态快速找到 skill。
2. **可维护**：可视化编辑 `SKILL.md` 与附属文件，保存前校验 Cursor 规范。
3. **可组织**：支持「物理目录分类」与「逻辑分类/标签」双层管理。
4. **可演进**：对接 `npx skills add` 与现有归并脚本，形成安装—归并—编辑—提交闭环。
5. **可审计**：展示 diff、提交历史、未同步到 `~/.agents/skills` 的异常项。

### 2.2 非目标（本期不做）

- 多用户协作、权限、云端托管主库（MVP 仅本机单用户）。
- 替代 Cursor IDE 内置 Skills 设置页（CSM 是增强工具，不是 Cursor 插件替代品）。
- 管理 `~/.cursor/skills-cursor/` 内置 skill（只读提示，禁止写入）。
- 完整的 Agent Skills 市场镜像（可跳转 skills.sh，不做爬取与付费分发）。
- 自动改写 skill 正文内容的 AI 批量生成（可作为后续迭代）。

---

## 3. 用户与场景

### 3.1 目标用户

| 角色 | 描述 |
|------|------|
| 主用户 | 本机 Cursor 使用者，维护个人 `~/.cursor/skills` Git 仓库 |
| 次要用户（远期） | 团队共享 monorepo 内 `.cursor/skills` 的贡献者 |

### 3.2 核心用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-01 | 作为用户，我想在列表里按分类浏览所有 skill，以便了解我有哪些能力包 | P0 |
| US-02 | 作为用户，我想用关键词搜索 name/description/正文，以便快速定位 skill | P0 |
| US-03 | 作为用户，我想编辑 `SKILL.md` 的 frontmatter 与正文并实时预览，以便减少格式错误 | P0 |
| US-04 | 作为用户，我想新建 skill 时自动生成符合规范的目录与模板，以便统一结构 | P0 |
| US-05 | 作为用户，我想一键执行「安装社区 skill → 归并主库」，以便少记 shell 命令 | P1 |
| US-06 | 作为用户，我想查看 Git 未提交变更并提交，以便版本可追溯 | P0 |
| US-07 | 作为用户，我想给 skill 打标签/归入逻辑分类，以便跨物理目录聚合 | P1 |
| US-08 | 作为用户，我想校验 name 与目录名一致、description 非空，以便 Cursor 能正确发现 | P0 |
| US-09 | 作为用户，我想看到 agents 侧 symlink 是否与主库一致，以便排查兼容问题 | P1 |
| US-10 | 作为用户，我想打开 skill 附属的 `scripts/` 并运行常用脚本，以便调试归并流程 | P2 |

---

## 4. 功能需求

### 4.1 仓库与数据源

| 编号 | 需求 | 说明 |
|------|------|------|
| FR-01 | 绑定主库路径 | 默认 `~/.cursor/skills`，可配置；启动时检测是否为 Git 仓库 |
| FR-02 | 扫描 skill | 递归发现所有含 `SKILL.md` 的目录；叶子目录名为 skill 身份 |
| FR-03 | 排除保留项 | 忽略 `.git`、`scripts`（仓库级）、`README.md` 等非 skill 根项 |
| FR-04 | 项目级只读源 | 配置扫描路径（默认 `~/project/**/.cursor/skills`）；**仅浏览/搜索/打开**，禁止写入与 Git 提交（见 Q2-B） |

### 4.2 分类与组织

| 编号 | 需求 | 说明 |
|------|------|------|
| FR-10 | 物理分类 | 从相对路径解析分类，如 `rn/rn-android-apk-flow` → 分类 `rn` |
| FR-11 | 逻辑分类 | 在 `.csm/meta.json`（或 skill 内 `metadata`）维护分类/标签，不移动文件也可归类 |
| FR-12 | 标签 | 支持多标签；预置标签：`android`、`rn`、`web`、`docs`、`git`、`design` 等 |
| FR-13 | 收藏 / 常用 | 用户标记常用 skill，列表置顶 |

**分类模型（建议）**

```text
物理路径:  ~/.cursor/skills/<category...>/<skill-name>/SKILL.md
逻辑元数据: .csm/skills/<skill-name>.json  → { categories[], tags[], favorite }
展示名:    frontmatter.name（必须与 <skill-name> 一致）
```

### 4.3 搜索与筛选

| 编号 | 需求 | 说明 |
|------|------|------|
| FR-20 | 全文搜索 | 匹配 name、description、SKILL.md 正文、附属 md 文件名 |
| FR-21 | 筛选器 | 按分类、标签、是否有 scripts、是否未提交、是否缺 frontmatter |
| FR-22 | 排序 | 按名称、最近修改、最近 Git 提交、目录路径 |
| FR-23 | 快捷打开 | 从结果跳转 Cursor/VS Code 打开目录（调用 `xdg-open` 或配置编辑器） |

### 4.4 查看与编辑

| 编号 | 需求 | 说明 |
|------|------|------|
| FR-30 | 详情页 | 展示 frontmatter、渲染后 Markdown 预览、目录树（scripts/references/assets） |
| FR-31 | 结构化编辑 | 表单编辑 name、description、paths、disable-model-invocation、metadata |
| FR-32 | 源码编辑 | Monaco/CodeMirror 编辑 `SKILL.md` 及附属文件 |
| FR-33 | 新建 skill | 向导：目录名、分类路径、模板（空白 / 从现有复制） |
| FR-34 | 重命名 | 重命名目录并同步 frontmatter `name`；提示 Cursor 调用名变化 |
| FR-35 | 移动分类 | 移动子目录实现物理分类变更；可选更新逻辑分类 |
| FR-36 | 删除 | 软删除（移入 `.csm/trash/`）或硬删除（二次确认） |

### 4.5 校验与规范

| 编号 | 需求 | 说明 |
|------|------|------|
| FR-40 | Frontmatter 校验 | 必填 `name`、`description`；name 正则 `^[a-z0-9-]+$` 且等于目录名 |
| FR-41 | 路径校验 | 禁止写入 `skills-cursor`；禁止破坏仓库级 `scripts/` |
| FR-42 | 保存前检查 | 未通过校验禁止写入或强提示 |
| FR-43 | 索引重建 | 保存后更新本地搜索索引 |

### 4.6 更新与外部集成

| 编号 | 需求 | 说明 |
|------|------|------|
| FR-50 | 归并脚本 | 调用 `scripts/sync-from-agents-skills.sh`，展示 stdout/stderr |
| FR-51 | 社区安装 | 封装 `scripts/skills-add.sh` 或 `npx skills add`，参数表单化 |
| FR-52 | Symlink 状态 | 列表展示 `~/.agents/skills/<name>` 是否指向主库对应目录 |
| FR-53 | 清单导出 | 重新生成 `skills-inventory.md` 或导出 JSON |

### 4.7 Git 工作流

| 编号 | 需求 | 说明 |
|------|------|------|
| FR-60 | 状态面板 | 显示 modified/untracked/deleted 文件 |
| FR-61 | Diff 查看 | 单文件与整体 diff（调用 git 或 libgit2） |
| FR-62 | 提交 | 填写 message 后 `git add` + `git commit`（不默认 push） |
| FR-63 | 历史 | 查看某 skill 相关文件的 `git log` |
| FR-64 | 分支（P2） | 可选支持 skill 实验分支 |

### 4.8 系统配置

| 编号 | 需求 | 说明 |
|------|------|------|
| FR-70 | 路径配置 | 主库、agents 目录、默认编辑器、终端 |
| FR-71 | 主题 | 浅色/深色，跟随系统 |
| FR-72 | 国际化 | UI **中文 / 英文可切换**；偏好写入 `.csm/config.json`（`locale: zh \| en`） |
| FR-73 | 启动 | 可选开机自启（桌面端）或 CLI `csm serve` |
| FR-74 | 集成形态 | MVP 为**独立本地 Web**；v0.3+ 评估 Cursor 扩展（见 Q4-C） |

---

## 5. 非功能需求

| 类别 | 要求 |
|------|------|
| 安全 | 仅监听 localhost；不将 skill 内容上传第三方；API 需本地 token（若用 HTTP） |
| 性能 | 17～200 个 skill 规模下，索引构建 < 2s；搜索响应 < 200ms（本地索引） |
| 可靠 | 写入采用「先写临时文件再 rename」；Git 操作失败时保留工作区 |
| 兼容 | Linux 优先；路径处理符合 Cursor Skills 规范 |
| 可维护 | `.csm/` **整体纳入主库 Git**（含 `index.sqlite`，见 Q1-C）；冲突时支持索引重建 |

---

## 6. 数据与元数据设计（草案）

### 6.1 主数据（文件系统 + Git）

- 真相源：`~/.cursor/skills/**/SKILL.md` 及同级附属文件
- 版本历史：Git commit

### 6.2 辅助数据（应用层，已确认 Q1-C）

```text
~/.cursor/skills/
├── .csm/                      # 全部纳入 Git 跟踪
│   ├── config.json            # 端口、主题、locale、项目扫描路径等
│   ├── index.sqlite           # 全文索引（FTS），随仓库同步
│   └── skills/
│       └── <skill-name>.json  # 逻辑分类、标签、备注、收藏
```

**已确认（Q1-C）**：`.csm/` 目录下所有文件（含 `index.sqlite`）均提交进主库 Git。

**实现注意**：

- `index.sqlite` 为二进制文件，多机并行编辑可能产生合并冲突；提供「重建索引」操作，启动时若检测到冲突或校验失败则自动重建。
- 提交前可选运行索引增量更新，保证仓库内索引与 `SKILL.md` 大致同步。

---

## 7. 界面与信息架构（已确认 Q3-A、Q5-C）

```text
┌──────────────────────────────────────────────────────────────────┐
│  [搜索] [分类▾] [标签▾] [来源: 主库|项目▾] [中/En]  Git·3  [+新建] │
├──────────┬───────────────────────────────────────────────────────┤
│ 分类树   │  Skill 列表                                            │
│ · 主库   │  · 主库 skill → 可编辑                                 │
│ · 项目   │  · 项目 skill → 只读徽章，不可保存                     │
├──────────┴───────────────────────────────────────────────────────┤
│  编辑（双栏 Q3-A）                                                │
│  ┌─────────────────────┬──────────────────────────────────────┐ │
│  │ Frontmatter 表单     │  Markdown 实时预览                    │ │
│  │ + 源码（可折叠）     │                                      │ │
│  └─────────────────────┴──────────────────────────────────────┘ │
│  [文件树] [Git]                                                   │
└──────────────────────────────────────────────────────────────────┘
```

- **语言（Q5-C）**：顶栏切换中/英；文案走 i18n 资源文件，不硬编码在组件内。
- **来源（Q2-B）**：列表区分「个人主库」与「项目只读」；项目 skill 详情页隐藏保存按钮，提供「复制到主库」向导（P1，可放 v0.2）。

---

## 8. MVP 范围与迭代

### 8.1 MVP（v0.1）

- 绑定主库、扫描列表、物理分类树
- **项目 skill 只读浏览**（`~/project/**/.cursor/skills`，可配置路径）（Q2-B）
- 关键词搜索（主库 + 项目索引；`index.sqlite` 入库 Git）（Q1-C）
- **双栏编辑**：左 frontmatter 表单 + 右 Markdown 预览（Q3-A）
- **UI 中/英切换**（Q5-C）
- 主库 `SKILL.md` 新建 / 编辑 / 删除 + 基础校验
- Git 状态、diff、提交（仅主库仓库）
- 调用 `sync-from-agents-skills.sh`
- 独立本地 Web（`localhost`）（Q4-C 第一期）

### 8.2 v0.2

- 逻辑分类与标签（`.csm/skills/*.json`）
- 项目 skill →「复制到主库」向导
- `skills-add` 安装向导
- agents symlink 健康检查
- 导出 inventory
- 索引冲突检测与一键重建

### 8.3 v0.3+

- **Cursor IDE 扩展**（可选，与本地 Web 共用 API）（Q4-C）
- 多 workspace 配置模板
- 模板市场快捷入口（跳转 skills.sh）
- 可选 AI 辅助写 description

---

## 9. 验收标准（MVP）

| 编号 | 验收项 |
|------|--------|
| AC-01 | 启动后能列出主库全部 skill（≥ 当前 17 个），且与文件系统一致 |
| AC-02 | 搜索「android」能返回所有 description/正文匹配的 skill |
| AC-03 | 编辑并保存后，磁盘 `SKILL.md` 更新且通过 frontmatter 校验 |
| AC-04 | 新建 `test-skill` 后目录结构符合 Cursor 规范，可从列表打开 |
| AC-05 | Git 面板能显示未提交文件，完成一次 commit 后 `git status` 干净 |
| AC-06 | 点击「同步 agents」能成功执行归并脚本且无报错 |
| AC-07 | 应用仅绑定 localhost，关闭进程后端口不可访问 |
| AC-08 | 配置项目扫描路径后，能列出项目内 skill且保存按钮禁用/提示只读（Q2-B） |
| AC-09 | 编辑页为双栏：修改 Markdown 后右侧预览同步更新（Q3-A） |
| AC-10 | 切换中/En 后主导航与按钮文案随之切换（Q5-C） |

---

## 10. 风险与假设

| 类型 | 内容 |
|------|------|
| 假设 | 用户单机使用，主库路径固定或可配置一次 |
| 假设 | 已安装 git、node（用于 `npx skills`） |
| 风险 | 浏览器无法直接读写 home 目录 → 必须本地后端或桌面壳 |
| 风险 | `name` 与目录名不一致导致 Cursor 无法发现 → 校验器必须强制 |
| 风险 | 与 `skills-cursor` 内置目录混淆 → UI 明确区分「个人 / 内置 / 项目」 |
| 风险 | `index.sqlite` 进 Git 可能二进制冲突 → 提供重建索引与合并策略说明（Q1-C） |
| 假设 | MVP 不提供 Cursor 扩展，仅独立 Web；扩展列入 v0.3+（Q4-C） |

---

## 11. 平台选型结论（摘要）

详细对比见 [03-平台选型-Web与桌面端对比.md](./03-平台选型-Web与桌面端对比.md)。

| 方案 | MVP 推荐度 | 一句话 |
|------|------------|--------|
| **本地 Web（前端 + 本机 API）** | ⭐⭐⭐ 首选 | 开发快、UI 灵活、需 Node 本地服务读写 `~/.cursor/skills` |
| **桌面端（Tauri / Electron）** | ⭐⭐ 次选 | 体验更「应用化」、可打包单文件；开发量略高 |
| **纯云端 Web** | ❌ 不推荐 | 涉及上传个人 skill，隐私与路径映射复杂 |
| **仅 CLI / TUI** | ⭐ 辅助 | 适合脚本化，不适合「编辑 + 预览」主流程 |

**推荐路径**：MVP 采用 **本地 Web（Vite + React + 本地 Express/Fastify/Bun API）**；验证产品后再用 **Tauri 包一层** 得到桌面安装包（可复用同一套前端）。

---

## 12. 待确认问题（评审清单）

**状态：已全部确认（2026-05-26）** → 见 [§13 已确认决策](#13-已确认决策)。

| # | 问题 | 你的选择 |
|---|------|----------|
| Q1 | `.csm/` 是否纳入 Git | **C** — 含 `index.sqlite` 全部提交 |
| Q2 | 项目级 skill | **B** — MVP 只读浏览，写入仅主库 |
| Q3 | 编辑页布局 | **A** — 双栏表单 + 预览 |
| Q4 | 与 Cursor 关系 | **C** — 独立 Web MVP，扩展后续 |
| Q5 | 界面语言 | **C** — 中英可切换 |

---

## 13. 已确认决策

| # | 决策 | 确认日期 | 说明 |
|---|------|----------|------|
| **Q1** | **C** | 2026-05-26 | `.csm/` 全量进 Git（含 `index.sqlite`）；需索引重建与冲突处理 |
| **Q2** | **B** | 2026-05-26 | 扫描 `~/project/**/.cursor/skills` 等路径；UI 只读；Git/保存仅针对 `~/.cursor/skills` |
| **Q3** | **A** | 2026-05-26 | 编辑页固定双栏：frontmatter 表单 + Markdown 预览 |
| **Q4** | **C** | 2026-05-26 | MVP：独立本地 Web；v0.3+ 评估 Cursor 扩展（可复用同一 API） |
| **Q5** | **C** | 2026-05-26 | UI 中文/英文切换；`locale` 存 `.csm/config.json`；skill 正文语言不限 |

### 对 MVP 的直接影响（摘要）

1. 主库需跟踪 `.csm/`，且不把 `index.sqlite` 加入 `.gitignore`。
2. 列表与搜索覆盖「主库 + 项目」，但写操作仅主库。
3. 编辑器按双栏实现；i18n 为 MVP 必做项，非二期。
4. 不做 Cursor 扩展直至 v0.3+。

---

## 14. 相关文档

- [03-平台选型-Web与桌面端对比.md](./03-平台选型-Web与桌面端对比.md)
- [04-接口与数据字典草案.md](./04-接口与数据字典草案.md)
- [05-开发子任务拆分清单.md](./05-开发子任务拆分清单.md)
- Cursor 官方：https://cursor.com/docs/skills
- 现有主库 README：`~/.cursor/skills/README.md`
