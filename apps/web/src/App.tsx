import { useEffect, useState } from 'react';

type HealthData = {
  status: string;
  version: string;
  personalRoot: string;
  personalRootExists: boolean;
  isGitRepo: boolean;
};

type HealthResponse = {
  ok: boolean;
  data?: HealthData;
  error?: { message: string };
};

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/health')
      .then((r) => r.json())
      .then((json: HealthResponse) => setHealth(json))
      .catch((err: Error) => setHealth({ ok: false, error: { message: err.message } }))
      .finally(() => setLoading(false));
  }, []);

  const data = health?.data;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-wider text-emerald-400">M0</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Cursor Skills Manager</h1>
        <p className="mt-2 text-zinc-400">本地管理 ~/.cursor/skills Git 主库</p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-medium">API 状态</h2>
        {loading && <p className="mt-4 text-zinc-500">连接中…</p>}
        {!loading && health?.ok && data && (
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="状态" value={data.status} />
            <Row label="版本" value={data.version} />
            <Row label="主库路径" value={data.personalRoot} mono />
            <Row label="主库存在" value={data.personalRootExists ? '是' : '否'} />
            <Row label="Git 仓库" value={data.isGitRepo ? '是' : '否'} />
          </dl>
        )}
        {!loading && !health?.ok && (
          <p className="mt-4 text-red-400">
            无法连接 API：{health?.error?.message ?? '未知错误'}。请先运行{' '}
            <code className="rounded bg-zinc-800 px-1">pnpm dev:api</code>
          </p>
        )}
      </section>

      <p className="mt-8 text-center text-xs text-zinc-600">
        Web :5173 · API :3847 · 下一步 M1 扫描 skills
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <dt className="w-28 shrink-0 text-zinc-500">{label}</dt>
      <dd className={mono ? 'break-all font-mono text-zinc-300' : 'text-zinc-200'}>{value}</dd>
    </div>
  );
}
