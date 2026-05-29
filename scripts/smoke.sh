#!/usr/bin/env bash
# MVP smoke: typecheck, unit tests, optional API verify when server is up.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> typecheck"
pnpm typecheck

echo "==> core tests"
pnpm test

echo "==> core build"
pnpm --filter @csm/core build

if curl -sf "http://127.0.0.1:${CSM_API_PORT:-3847}/api/v1/health" >/dev/null 2>&1; then
  echo "==> API reachable, running verify scripts"
  pnpm verify:m2
  pnpm verify:m4
  pnpm verify:m5
  pnpm verify:m7
  pnpm verify:m8
  pnpm verify:m9
else
  echo "==> API not running; skip verify:m2/m4/m5/m7/m8/m9 (start with: pnpm dev:api)"
fi

echo "smoke ok"
