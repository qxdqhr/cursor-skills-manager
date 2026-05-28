#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MONOREPO_ROOT="$(cd "${DESKTOP_ROOT}/../.." && pwd)"
SPEC_IN="${DESKTOP_ROOT}/packaging/rpm/cursor-skills-manager.spec.in"

cd "${DESKTOP_ROOT}"

if [ ! -f "${SPEC_IN}" ]; then
  echo "[pack:rpm] 缺少 ${SPEC_IN}" >&2
  exit 1
fi

if [ ! -d "${MONOREPO_ROOT}/node_modules" ]; then
  if command -v gg >/dev/null 2>&1; then
    echo "[pack:rpm] node_modules 不存在，使用 gg 安装依赖..."
    (cd "${MONOREPO_ROOT}" && gg pnpm install)
  else
    echo "[pack:rpm] 未找到 gg，改用 pnpm install 安装依赖..."
    (cd "${MONOREPO_ROOT}" && pnpm install)
  fi
fi

if ! command -v rpmbuild >/dev/null 2>&1; then
  echo "[pack:rpm] 未找到 rpmbuild。openSUSE 请安装: sudo zypper in rpm-build" >&2
  exit 1
fi

VERSION="$(node -p "require('./package.json').version")"
RPMTOP="${DESKTOP_ROOT}/dist/rpm-work"
STAGING_PARENT="${RPMTOP}/staging"
STAGING="${STAGING_PARENT}/cursor-skills-manager-${VERSION}"

echo "[pack:rpm] 版本: ${VERSION}"
echo "[pack:rpm] 生成 linux-unpacked（electron-builder --dir）..."
pnpm pack:dir

if [ ! -x "${DESKTOP_ROOT}/dist/linux-unpacked/cursor-skills-manager" ]; then
  echo "[pack:rpm] 未找到可执行文件 dist/linux-unpacked/cursor-skills-manager" >&2
  exit 1
fi

echo "[pack:rpm] 准备 rpmbuild 工作目录: ${RPMTOP}"
rm -rf "${RPMTOP}"
mkdir -p "${RPMTOP}/"{BUILD,RPMS,SOURCES,SPECS,SRPMS} "${STAGING}"

cp -a "${DESKTOP_ROOT}/dist/linux-unpacked"/. "${STAGING}/"

tar -czf "${RPMTOP}/SOURCES/cursor-skills-manager-${VERSION}.tar.gz" \
  -C "${STAGING_PARENT}" "cursor-skills-manager-${VERSION}"

sed "s/@VERSION@/${VERSION}/g" "${SPEC_IN}" >"${RPMTOP}/SPECS/cursor-skills-manager.spec"

echo "[pack:rpm] 执行 rpmbuild（不依赖 fpm，适配 openSUSE / RPM 4.2x）..."
rpmbuild --define "_topdir ${RPMTOP}" -bb "${RPMTOP}/SPECS/cursor-skills-manager.spec"

RPM_OUT="$(find "${RPMTOP}/RPMS" -maxdepth 3 -name '*.rpm' -print)"
if [ -z "${RPM_OUT}" ]; then
  echo "[pack:rpm] 未在 ${RPMTOP}/RPMS 下找到产物" >&2
  exit 1
fi

mkdir -p "${DESKTOP_ROOT}/dist"
while IFS= read -r f; do
  cp -a "${f}" "${DESKTOP_ROOT}/dist/"
  echo "[pack:rpm] 已复制: ${DESKTOP_ROOT}/dist/$(basename "${f}")"
done <<<"${RPM_OUT}"

echo "[pack:rpm] 完成。安装示例: sudo zypper in --allow-unsigned-rpm ./dist/cursor-skills-manager-${VERSION}-1.*.rpm"
