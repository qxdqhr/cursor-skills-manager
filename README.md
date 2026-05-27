# Cursor Skills Manager

基于 `~/.cursor/skills` Git 主库的 Skill 管理工具。

**技术栈**：Vite + React（Web）· Hono（API）· `packages/core`（共享逻辑）

**当前进度**：M0～M4 已提交；下一步 **M5**（Git 与脚本）。详见 [doc/00-开发进度.md](./doc/00-开发进度.md)。

## 开发

```bash
cd /home/qhr/project/cursor-skills-manager
cp .env.example .env   # 可选，默认已指向 ~/.cursor/skills
gg pnpm install
pnpm dev               # API :3847 + Web :5173
```

- Web：<http://127.0.0.1:5173>
- API Health：<http://127.0.0.1:3847/api/v1/health>

```bash
pnpm dev:api    # 仅 API
pnpm dev:web    # 仅 Web（需 API 或代理目标已启动）
pnpm typecheck
pnpm test
pnpm verify:m1   # 对真实 ~/.cursor/skills 扫描验收
pnpm verify:m2   # API 鉴权 + 列表/搜索/索引（需先 pnpm dev:api）
```

### API 鉴权（M2）

Token 写在主库 `~/.cursor/skills/.csm/config.json` 的 `api.token`（首次启动 API 自动生成）：

```bash
TOKEN=$(jq -r '.api.token' ~/.cursor/skills/.csm/config.json)
curl -s -H "Authorization: Bearer $TOKEN" http://127.0.0.1:3847/api/v1/skills
```

## 文档

| 文件 | 说明 |
|------|------|
| [doc/00-开发进度.md](./doc/00-开发进度.md) | **当前里程碑、自测结果、下一步** |
| [doc/01-cursor-skills-manager-需求文档.md](./doc/01-cursor-skills-manager-需求文档.md) | 产品需求、功能范围、验收标准 |
| [doc/03-平台选型-Web与桌面端对比.md](./doc/03-平台选型-Web与桌面端对比.md) | Web / 桌面 / 混合方案对比与推荐 |
| [doc/04-接口与数据字典草案.md](./doc/04-接口与数据字典草案.md) | REST API、SQLite、文件 schema |
| [doc/05-开发子任务拆分清单.md](./doc/05-开发子任务拆分清单.md) | MVP 分阶段任务与 backlog |
| [CHANGELOG.md](./CHANGELOG.md) | 开发历程 |

**评审状态**：Q1～Q5 已确认（2026-05-26），见需求文档 [§13 已确认决策](doc/01-cursor-skills-manager-需求文档.md#13-已确认决策)。

## 关联资产

- Skill 主库：`~/.cursor/skills`（Git，`main`）
- 桌面入口：`~/Desktop/cursor-skills`
- 归并脚本：`~/.cursor/skills/scripts/sync-from-agents-skills.sh`
