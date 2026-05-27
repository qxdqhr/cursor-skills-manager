# MVP 验收记录（v0.1）

| 日期 | 2026-05-27 |
| 环境 | Linux · Node 20+ · `~/.cursor/skills` Git 主库 |

## 验收标准

| 编号 | 验收项 | 状态 | 验证方式 |
|------|--------|------|----------|
| AC-01 | 列出主库全部 skill（≥17），与文件系统一致 | ✅ | `pnpm verify:m1` / `GET /skills` total |
| AC-02 | 搜索「android」命中 description/正文 | ✅ | `pnpm verify:m2` search |
| AC-03 | 编辑保存后磁盘 SKILL.md 更新且校验通过 | ✅ | `pnpm verify:m4` PUT |
| AC-04 | 新建 test skill 目录符合规范 | ✅ | `pnpm verify:m4` POST + DELETE |
| AC-05 | Git 面板显示变更并可 commit | ✅ | Web Git 面板 + `GET /git/status` |
| AC-06 | 同步 agents 脚本成功 | ✅ | `pnpm verify:m5` sync-agents exit 0 |
| AC-07 | 仅绑定 localhost | ✅ | `CSM_API_HOST` 非本地则拒绝启动；默认 `127.0.0.1` |
| AC-08 | 项目 skill 只读，不可 PUT | ✅ | `pnpm verify:m4` 项目 skill 403 |
| AC-09 | 双栏编辑预览同步 | ✅ | SkillEditorPage CodeMirror + react-markdown |
| AC-10 | 中/En 切换导航与按钮文案 | ✅ | 顶栏语言选择 + `PATCH /config` locale |

## 自动化命令

```bash
cd /home/qhr/project/cursor-skills-manager
pnpm smoke          # typecheck + test + verify（API 已启动时）
pnpm verify:m1
# API 运行中：
pnpm verify:m2 && pnpm verify:m4 && pnpm verify:m5
```

## 配置说明（Q1-C）

- 主库 `.csm/` 含 `config.json` 与 `index.sqlite` **应纳入 Git**
- 样例见 [examples/csm-config.sample.json](./examples/csm-config.sample.json)
- 本机 `~/.cursor/skills/.gitignore` 未排除 `index.sqlite`（已核对）

## 安全（AC-07）

- API 默认 `CSM_API_HOST=127.0.0.1`，绑定 `0.0.0.0` 时进程退出
- 无需额外防火墙规则（仅本机访问）
