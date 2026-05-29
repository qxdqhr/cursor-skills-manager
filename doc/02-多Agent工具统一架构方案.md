# 多 Agent 工具统一架构方案

| 项目 | 内容 |
|------|------|
| 文档版本 | v0.1 |
| 更新日期 | 2026-05-29 |
| 状态 | **M7 已交付；M8 开发中** |
| 关联 | [01-需求文档](./01-cursor-skills-manager-需求文档.md)、[04-接口与数据字典](./04-接口与数据字典草案.md)、[05-开发子任务拆分清单](./05-开发子任务拆分清单.md) |

---

## 1. 背景与目标

### 1.1 现状（v0.1）

CSM 以 **`~/.cursor/skills` Git 主库** 为唯一可写数据源，并：

- 只读扫描 `~/project/**/.cursor/skills`
- 通过 `~/.agents/skills` symlink 做 **单一** 兼容层检查（`checkAgentsLink`）
- `skillId` 仅区分 `personal:` / `project:`

### 1.2 新目标（v0.3）

在**不破坏现有主库 Git 工作流**的前提下，支持多种 Agent 工具（Cursor IDE/CLI、OpenCode、Claude Code、Codex、`npx skills` 等）的 skill **统一浏览、编辑、发布与健康检查**。

| 目标 | 说明 |
|------|------|
| **统一视图** | 一个列表/树看到「主库 skill + 各平台已发布副本 + 项目 skill」 |
| **单一真相源** | 可编辑内容仍从主库写入；平台目录以「发布目标」而非第二套真相源 |
| **可扩展** | 新平台通过注册表添加，不改 core 扫描主流程 |
| **可观测** | 每个 skill 在各平台的 link/mirror 状态可见，一键修复 |

### 1.3 非目标（v0.3 不做）

- 云端同步、多用户协作
- 自动双向合并各平台目录里的 diverged 副本
- 替代各 Agent 内置的 skill 发现机制（仍遵循各工具原生路径约定）

---

## 2. 主流 Agent 工具路径对照（调研摘要）

> 规范均以 **`SKILL.md` + 目录名 = skill 名** 为基础；差异在**发现路径**与**单/复数目录名**。

| 平台 ID | 工具 | 全局 skill 根（常见） | 项目 skill 根（常见） | 备注 |
|---------|------|----------------------|----------------------|------|
| `cursor` | Cursor IDE / Cursor CLI | `~/.cursor/skills` | `<repo>/.cursor/skills` | 官方文档；亦读 `~/.agents/skills` |
| `agents` | `npx skills` / Open Agent Skills | `~/.agents/skills` | `<repo>/.agents/skills` | 当前 CSM 已部分支持 symlink |
| `opencode` | OpenCode CLI | `~/.config/opencode/skills` | `<repo>/.opencode/skills` | 亦兼容 `.claude/skills`、`.agents/skills` |
| `claude` | Claude Code | `~/.claude/skills` | `<repo>/.claude/skills` | Agent Skills 开放规范 |
| `codex` | Codex（Cursor 兼容） | `~/.codex/skills` | `<repo>/.codex/skills` | Cursor 文档列兼容 |

**结论**：各平台路径不同，但 **skill 包结构相同**。适合「主库编辑 + 多目标发布」，而非「每个平台各维护一套 Git」。

---

## 3. 推荐架构：Canonical Hub + Platform Bindings

### 3.1 核心原则

```text
                    ┌─────────────────────────────┐
                    │  Canonical Hub（唯一可写）     │
                    │  ~/.cursor/skills (Git)      │
                    │  · SKILL.md 编辑/校验/提交    │
                    └──────────────┬──────────────┘
                                   │ publish / sync
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
  ~/.agents/skills/          ~/.config/opencode/skills/   ~/.claude/skills/
  (symlink 目标)              (symlink 或 mirror)          (symlink 或 mirror)
         │                         │                         │
         ▼                         ▼                         ▼
   npx skills / Cursor        OpenCode CLI               Claude Code
```

1. **Canonical Hub** 不变：`paths.personalRoot` = `~/.cursor/skills`，Git 面板仍只针对主库。
2. **Platform** 是可配置的发布/发现目标，每个平台有 `globalRoot`、可选 `projectGlobs`、默认 `syncMode`。
3. **Binding** 描述「主库 skill X → 平台 P 的路径 Y」的同步关系与健康状况。
4. **Project skills** 仍为只读扫描源；可选「复制到主库」向导（沿用 V2-03 backlog）。

### 3.2 为何不用「多主库并列扫描」

| 方案 | 优点 | 缺点 |
|------|------|------|
| 多主库并列 | 实现直观 | 同名 skill 冲突、Git 分散、编辑入口不清 |
| **Hub + Bindings（推荐）** | 与现有 CSM 一致；Git 单一；symlink 零拷贝 | 需维护发布/健康检查 |
| 实时 bi-directional sync | 理论最灵活 | 冲突难处理，超出 MVP |

---

## 4. 数据模型（v2）

### 4.1 配置 `.csm/config.json` → `version: 2`

```json
{
  "version": 2,
  "locale": "zh",
  "theme": "system",
  "api": { "port": 3847, "token": "…" },
  "paths": {
    "personalRoot": "/home/user/.cursor/skills",
    "projectScanGlobs": ["~/project/**/.cursor/skills"],
    "editor": "code",
    "fileManager": "dolphin"
  },
  "platforms": {
    "enabled": ["cursor", "agents", "opencode", "claude"],
    "definitions": {
      "cursor": {
        "label": "Cursor",
        "globalRoot": "~/.cursor/skills",
        "role": "canonical",
        "syncMode": "none"
      },
      "agents": {
        "label": "Open Agent Skills (npx skills)",
        "globalRoot": "~/.agents/skills",
        "syncMode": "symlink",
        "publishFrom": "canonical"
      },
      "opencode": {
        "label": "OpenCode",
        "globalRoot": "~/.config/opencode/skills",
        "syncMode": "symlink",
        "publishFrom": "canonical"
      },
      "claude": {
        "label": "Claude Code",
        "globalRoot": "~/.claude/skills",
        "syncMode": "symlink",
        "publishFrom": "canonical",
        "enabled": false
      }
    }
  }
}
```

| 字段 | 说明 |
|------|------|
| `role: canonical` | 该平台 globalRoot 与 `personalRoot` 相同，无需 publish |
| `syncMode` | `none` \| `symlink` \| `mirror`（v0.3 先实现 symlink） |
| `publishFrom` | 固定 `canonical`（v0.3） |
| `enabled` | 用户可在设置页关闭某平台 |

**迁移**：`loadConfig` 读 v1 时自动补全 `platforms`，`agentsRoot` 映射为 `agents` 平台。

### 4.2 Skill 标识 `skillId`（向后兼容扩展）

保留现有：

```text
personal:<relPath>                 # 主库 canonical
project:<workspaceId>:<relPath>    # 项目只读
```

新增（索引与 API 可选返回，v0.3 后期）：

```text
platform:<platformId>:<skillName>  # 平台 globalRoot 下的视图（按 skill 名扁平化）
```

列表 UI 以 **`personal:*` 为主键**；平台状态挂在 `bindings[]` 上，避免一次 breaking change 改遍 skillId。

### 4.3 Binding 状态（取代单一 `agentsLink`）

```typescript
type PlatformBindingStatus = {
  platformId: string;
  mode: 'symlink' | 'mirror' | 'none';
  expectedPath: string;   // 平台侧路径
  exists: boolean;
  ok: boolean;            // symlink 目标正确 / mirror 内容一致
  target: string | null;  // 实际指向
  issue?: 'missing' | 'wrong_target' | 'not_symlink' | 'content_drift';
};
```

`SkillSummary` 扩展：

```typescript
bindings?: PlatformBindingStatus[];  // 替代单独 agentsLink 字段（agentsLink 作 alias 保留一版）
platforms?: string[];                // 该 skill 已发布到的平台 id 列表，便于筛选
```

### 4.4 索引 SQLite

新增表（草案）：

```sql
-- platform_bindings: 缓存检查结果，重建索引时刷新
CREATE TABLE platform_bindings (
  skill_id TEXT NOT NULL,
  platform_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  status_json TEXT NOT NULL,
  checked_at INTEGER NOT NULL,
  PRIMARY KEY (skill_id, platform_id)
);
```

FTS 仍索引 canonical skill；平台名写入 `skills_meta` 辅助列供筛选。

---

## 5. `packages/core` 模块划分

```text
packages/core/src/
├── platforms/
│   ├── registry.ts       # 内置平台定义 + 合并用户 config
│   ├── types.ts          # PlatformDefinition, BindingStatus
│   ├── probe.ts          # CLI 是否存在（which opencode/cursor）
│   ├── publish.ts        # symlink 创建/修复/删除
│   └── checkBinding.ts   # 单 skill × 单平台健康检查
├── scan.ts               # 现有 personal/project（不变）
├── agentsLink.ts         # 薄封装 → checkBinding('agents')
└── integrations.ts       # open / sync 脚本（扩展 sync-all-platforms）
```

| 模块 | 职责 |
|------|------|
| `registry` | 内置 Cursor/OpenCode/Claude/Codex/Agents 路径模板 |
| `publish` | `publishSkill(platformId, skillName)` / `unpublish` / `repair` |
| `checkBinding` | 泛化 `checkAgentsLink` |
| `probe` | 设置页展示「本机已安装 CLI」 |

---

## 6. API 扩展（摘要，详见 04 文档 §12）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/platforms` | 已启用平台 + CLI 探测结果 |
| GET | `/platforms/:id/bindings` | 该平台全部 binding 摘要 |
| POST | `/platforms/:id/publish` | body: `{ skillIds?: string[], all?: boolean }` |
| POST | `/platforms/:id/repair` | 修复错误 symlink |
| POST | `/integrations/sync-platforms` | 替代/扩展 sync-agents，按 config 批量 publish |
| GET | `/skills` | 增加 query `platform=`、`bindingIssue=` |

---

## 7. Web UI 变更（摘要）

| 区域 | 变更 |
|------|------|
| 设置页 | 平台开关、globalRoot 覆盖、CLI 探测状态 |
| 浏览面板 | 来源树增加「按平台」分组；筛选「某平台未发布 / binding 异常」 |
| 列表/详情 | 平台 badges（✓ agents · ✗ opencode）；「发布到…」操作 |
| 顶栏 | 「同步 agents」→ **「发布到 Agent 平台」** Modal（多选平台 + 日志） |
| Git | 仍仅 canonical 主库（不变） |

---

## 8. 分阶段交付（里程碑）

```text
M7  Platform Registry + Binding 检查（只读）
 └─► M8  Publish/Repair + UI
      └─► M9  CLI 探测 + 批量策略 + 文档/验收
```

| 里程碑 | 交付物 | 用户可见价值 |
|--------|--------|--------------|
| **M7** | core registry/checkBinding、config v2 迁移、API GET platforms/bindings | 列表能看到各平台 link 状态 |
| **M8** | publish/repair API、Web 发布 Modal、详情页单 skill 发布 | 一键把主库 skill 同步到 OpenCode 等 |
| **M9** | CLI probe、冲突策略文档、`pnpm verify:m7` | 安装/OpenCode 后自动提示未发布 skill |

**建议版本号**：M7–M9 合称 **v0.3**（多 Agent 统一）；v0.2 仍保留标签/复制到主库等 backlog。

---

## 9. 风险与对策

| 风险 | 对策 |
|------|------|
| OpenCode 文档路径单复数不一致 | registry 支持 `alternateRoots[]`；probe 时检测实际存在目录 |
| symlink 在 Windows 权限不足 | v0.3 仍 Linux 优先；Windows 回退 `mirror` 模式（M8 后期） |
| 平台侧已有同名非 symlink 目录 | publish 前 dry-run + 确认；repair 不自动删除非空目录 |
| skillId 变更影响 API 客户端 | `personal:` 保持不变；bindings 为增量字段 |
| config v2 迁移 | 启动时自动升级；保留 v1 字段 aliases |

---

## 10. 决策项（请确认）

| ID | 问题 | 建议默认 | 备选 |
|----|------|----------|------|
| D1 | Canonical 主库是否继续用 `~/.cursor/skills` | **是** | 改为 `~/.agents/skills` |
| D2 | 默认启用平台 | cursor + agents + opencode | 仅 cursor + agents |
| D3 | v0.3 同步方式 | **symlink only** | 增加 mirror |
| D4 | 项目 skill 是否支持「发布到平台」 | 否（须先复制到主库） | 只读发布 symlink |
| D5 | 产品名是否从 CSM 泛化为「Agent Skills Hub」 | 文档先改，代码后续 | 保持 CSM |

---

## 11. 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v0.2 | 2026-05-29 | M7 状态更新 |
| v0.1 | 2026-05-29 | 初稿：Hub + Bindings 架构、数据模型、M7–M9 拆分 |
