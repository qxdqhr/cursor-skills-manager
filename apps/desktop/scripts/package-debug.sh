#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MONOREPO_ROOT="$(cd "${DESKTOP_ROOT}/../.." && pwd)"

cd "${DESKTOP_ROOT}"

if [ ! -d "${MONOREPO_ROOT}/node_modules" ]; then
  if command -v gg >/dev/null 2>&1; then
    echo "[pack:debug] node_modules 不存在，使用 gg 安装依赖..."
    (cd "${MONOREPO_ROOT}" && gg pnpm install)
  else
    echo "[pack:debug] 未找到 gg，改用 pnpm install 安装依赖..."
    (cd "${MONOREPO_ROOT}" && pnpm install)
  fi
fi

echo "[pack:debug] 开始构建 Linux unpacked 调试包..."
pnpm pack:dir
echo "[pack:debug] 构建完成：${DESKTOP_ROOT}/dist/linux-unpacked"
echo "[pack:debug] 启动：${DESKTOP_ROOT}/dist/linux-unpacked/cursor-skills-manager"
