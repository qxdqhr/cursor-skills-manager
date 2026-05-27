# Cursor Skills Manager

基于 `~/.cursor/skills` Git 主库的 Skill 管理工具（规划阶段）。

## 文档

| 文件 | 说明 |
|------|------|
| [doc/01-cursor-skills-manager-需求文档.md](./doc/01-cursor-skills-manager-需求文档.md) | 产品需求、功能范围、验收标准 |
| [doc/03-平台选型-Web与桌面端对比.md](./doc/03-平台选型-Web与桌面端对比.md) | Web / 桌面 / 混合方案对比与推荐 |
| [doc/04-接口与数据字典草案.md](./doc/04-接口与数据字典草案.md) | REST API、SQLite、文件 schema |
| [doc/05-开发子任务拆分清单.md](./doc/05-开发子任务拆分清单.md) | MVP 分阶段任务与 backlog |

**评审状态**：Q1～Q5 已确认（2026-05-26），见需求文档 [§13 已确认决策](doc/01-cursor-skills-manager-需求文档.md#13-已确认决策)。

| 项 | 选择 |
|----|------|
| Q1 | C — `.csm/` 含索引库全部进 Git |
| Q2 | B — 项目 skill 只读 |
| Q3 | A — 双栏编辑 |
| Q4 | C — 独立 Web，扩展后续 |
| Q5 | C — UI 中英切换 |

## 关联资产

- Skill 主库：`~/.cursor/skills`（Git，`main`）
- 桌面入口：`~/Desktop/cursor-skills`
- 归并脚本：`~/.cursor/skills/scripts/sync-from-agents-skills.sh`
