# Cursor Skills Manager — Agent 指引

## 开发约定

- 子任务清单：[doc/05-开发子任务拆分清单.md](./doc/05-开发子任务拆分清单.md)
- **每完成一条子任务必须本地 `git commit`**（见 `.cursor/rules/git-commit-after-subtask.mdc`）
- 技术栈：`apps/web`（Vite+React）、`apps/api`（Hono）、`packages/core`
- 主库路径默认：`~/.cursor/skills`

## 常用命令

```bash
pnpm dev
pnpm typecheck
pnpm --filter @csm/core test
```
