import { useState } from 'react';
import { ApiClientError, postSyncAgents } from '../lib/api.js';

export function SyncAgentsModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [stdout, setStdout] = useState('');
  const [stderr, setStderr] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleRun() {
    setRunning(true);
    setStdout('');
    setStderr('');
    setError(null);
    try {
      const result = await postSyncAgents();
      setStdout(result.stdout);
      setStderr(result.stderr);
      if (result.exitCode !== 0) {
        setError(`脚本退出码 ${result.exitCode}`);
      } else {
        onDone?.();
      }
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : e instanceof Error ? e.message : '同步失败');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-lg font-medium text-zinc-100">同步 agents</h2>
          <button type="button" onClick={onClose} className="text-sm text-zinc-500 hover:text-zinc-300">
            关闭
          </button>
        </div>
        <p className="px-4 py-2 text-xs text-zinc-500">
          执行 <code className="text-zinc-400">scripts/sync-from-agents-skills.sh</code>
        </p>
        {error && <p className="px-4 text-sm text-red-400">{error}</p>}
        <pre className="mx-4 mb-2 min-h-[120px] flex-1 overflow-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs text-zinc-400">
          {running ? '运行中…' : stdout || stderr || '（尚无输出）'}
          {stderr && stdout ? `\n--- stderr ---\n${stderr}` : ''}
        </pre>
        <div className="flex justify-end gap-2 border-t border-zinc-800 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            取消
          </button>
          <button
            type="button"
            disabled={running}
            onClick={handleRun}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {running ? '同步中…' : '开始同步'}
          </button>
        </div>
      </div>
    </div>
  );
}
