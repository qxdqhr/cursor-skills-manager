import { useEffect, useState } from 'react';
import { ApiClientError, fetchConfig, fetchHealth } from '../lib/api.js';
import { clearStoredToken, getStoredToken, setStoredToken } from '../lib/token.js';
import type { PublicConfig } from '../types.js';

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const [token, setToken] = useState(getStoredToken() ?? '');
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [health, setHealth] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [configVersion, setConfigVersion] = useState(0);

  useEffect(() => {
    fetchHealth()
      .then((h) => setHealth(`API ${h.status} · ${h.personalRoot}`))
      .catch(() => setHealth('API 未连接'));
  }, []);

  useEffect(() => {
    if (!getStoredToken()) {
      setConfig(null);
      return;
    }
    fetchConfig()
      .then(setConfig)
      .catch((e: unknown) => {
        if (e instanceof ApiClientError && e.status === 401) {
          setError('Token 无效，请重新填写');
        }
      });
  }, [configVersion]);

  function handleSaveToken() {
    setStoredToken(token);
    setConfigVersion((v) => v + 1);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 text-sm text-zinc-400 hover:text-zinc-200"
      >
        ← 返回列表
      </button>
      <h1 className="text-2xl font-semibold text-zinc-100">设置</h1>
      <p className="mt-1 text-sm text-zinc-500">{health}</p>

      <section className="mt-8 space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-medium text-zinc-300">API Token</h2>
        <p className="text-xs text-zinc-500">
          从主库 <code className="text-zinc-400">~/.cursor/skills/.csm/config.json</code>{' '}
          复制 <code className="text-zinc-400">api.token</code> 粘贴到下方。
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Bearer token"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-200"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSaveToken}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            保存 Token
          </button>
          <button
            type="button"
            onClick={() => {
              clearStoredToken();
              setToken('');
            }}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
          >
            清除
          </button>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </section>

      {config && (
        <section className="mt-6 space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm">
          <h2 className="font-medium text-zinc-300">当前配置（只读）</h2>
          <Row label="主库" value={config.paths.personalRoot} mono />
          <Row label="Agents" value={config.paths.agentsRoot ?? '—'} mono />
          <Row label="扫描路径" value={config.paths.projectScanGlobs?.join(', ') ?? '—'} />
          <Row label="API 端口" value={String(config.api.port)} />
          <Row label="服务端 Token" value={config.api.hasToken ? '已配置' : '未配置'} />
        </section>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="w-24 shrink-0 text-zinc-500">{label}</span>
      <span className={mono ? 'break-all font-mono text-xs text-zinc-400' : 'text-zinc-300'}>
        {value}
      </span>
    </div>
  );
}
