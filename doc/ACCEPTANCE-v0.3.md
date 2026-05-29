# v0.3 验收记录（多 Agent 统一）

| 日期 | 2026-05-29 |
| 环境 | Linux · Node 20+ · `~/.cursor/skills` Git 主库 |
| 范围 | M7 Platform Registry · M8 Publish/Repair · M9 CLI 探测 |

## 验收标准

| 编号 | 验收项 | 状态 | 验证方式 |
|------|--------|------|----------|
| AC-11 | 列表可见各平台 binding 状态（agents/opencode 等） | ✅ | Web 列表 badges；`GET /skills` 含 `bindings[]` |
| AC-12 | config v1 自动迁移 v2，platforms 配置可读 | ✅ | `pnpm verify:m7` config version 2 |
| AC-13 | 筛选「平台绑定异常」与 `?bindingIssue=true` 一致 | ✅ | Web 快捷筛选 + API query |
| AC-14 | 主库 skill 可 publish 到 agents（symlink） | ✅ | `pnpm verify:m8` publish summary |
| AC-15 | repair 可修复错误 symlink | ✅ | core `publish.test.ts` repair case |
| AC-16 | 顶栏「发布到平台」多选 + dry-run 预览 | ✅ | Web PublishPlatformsModal |
| AC-17 | 详情页单 skill 发布/修复 | ✅ | SkillDetailPanel 平台操作 |
| AC-18 | `GET /platforms` 返回 `cliInstalled` | ✅ | `pnpm verify:m9` |
| AC-19 | 设置页展示 CLI 状态与文档链接 | ✅ | SettingsPage 平台区块 |
| AC-20 | OpenCode alternateRoots 生效（skill/skills） | ✅ | core `probe.test.ts` effective root |

## 自动化命令

```bash
cd /home/qhr/project/cursor-skills-manager
pnpm typecheck && pnpm test

# API 运行中（pnpm dev:api）：
pnpm verify:m7
pnpm verify:m8    # 会对一条 skill 执行真实 publish
pnpm verify:m9
pnpm smoke        # 含 m7/m8（API 可达时）
```

## 与 v0.1 的关系

- Git 提交仍仅针对 canonical 主库 `~/.cursor/skills`
- 项目 skill 只读；发布前须位于 personal 主库
- 遗留 `POST /integrations/sync-agents` 保留；推荐使用 `POST /integrations/sync-platforms`

## 已知限制

- CLI 探测依赖 `PATH` 中的可执行文件；Cursor IDE 未装 CLI 时 `cliInstalled` 可能为 false
- Windows symlink 发布未实现（v0.4 mirror 模式 backlog）
- agents 平台 CLI 探测以 `npx` 存在为近似（非严格 `npx skills` 调用）
