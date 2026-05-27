import { useCallback, useEffect, useState } from 'react';
import {
  ApiClientError,
  fetchGitDiff,
  fetchGitLog,
  fetchGitStatus,
  postGitCommit,
} from '../lib/api.js';
import type { GitLogEntry } from '../lib/api.js';

export function GitPanel({
  open,
  onClose,
  onCommitted,
}: {
  open: boolean;
  onClose: () => void;
  onCommitted?: () => void;
}) {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof fetchGitStatus>> | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [diff, setDiff] = useState('');
  const [log, setLog] = useState<GitLogEntry[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'changes' | 'log'>('changes');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const st = await fetchGitStatus();
      setStatus(st);
      if (selectedPath && !st.files.some((f) => f.path === selectedPath)) {
        setSelectedPath(null);
        setDiff('');
      }
      const logData = await fetchGitLog({ limit: 15 });
      setLog(logData.items);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Git 状态加载失败');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [selectedPath]);

  useEffect(() => {
    if (!open) return;
    refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open || !selectedPath) return;
    fetchGitDiff(selectedPath)
      .then((r) => setDiff(r.diff || '（无 diff）'))
      .catch(() => setDiff('无法加载 diff'));
  }, [open, selectedPath]);

  async function handleCommit(all: boolean) {
    if (!message.trim()) {
      setError('请填写 commit message');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await postGitCommit({
        message: message.trim(),
        paths: all ? undefined : selectedPath ? [selectedPath] : undefined,
      });
      setMessage('');
      setSelectedPath(null);
      setDiff('');
      await refresh();
      onCommitted?.();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : '提交失败');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <aside className="flex w-96 shrink-0 flex-col border-l border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
        <div>
          <h2 className="text-sm font-medium text-zinc-100">Git</h2>
          {status && (
            <p className="text-xs text-zinc-500">
              {status.branch} · {status.clean ? '干净' : `${status.files.length} 个变更`}
            </p>
          )}
        </div>
        <button type="button" onClick={onClose} className="text-xs text-zinc-500 hover:text-zinc-300">
          关闭
        </button>
      </div>

      <div className="flex border-b border-zinc-800 text-xs">
        <button
          type="button"
          onClick={() => setTab('changes')}
          className={`flex-1 py-2 ${tab === 'changes' ? 'text-emerald-400' : 'text-zinc-500'}`}
        >
          变更
        </button>
        <button
          type="button"
          onClick={() => setTab('log')}
          className={`flex-1 py-2 ${tab === 'log' ? 'text-emerald-400' : 'text-zinc-500'}`}
        >
          历史
        </button>
        <button
          type="button"
          onClick={() => refresh()}
          className="px-3 text-zinc-500 hover:text-zinc-300"
        >
          刷新
        </button>
      </div>

      {error && (
        <p className="border-b border-red-900/30 bg-red-950/20 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      {tab === 'log' ? (
        <ul className="flex-1 overflow-y-auto divide-y divide-zinc-800/80 text-xs">
          {log.map((entry) => (
            <li key={entry.hash} className="px-3 py-2">
              <p className="font-mono text-zinc-500">{entry.hash.slice(0, 7)}</p>
              <p className="mt-1 text-zinc-300">{entry.message}</p>
              <p className="mt-0.5 text-zinc-600">
                {entry.author} · {entry.date}
              </p>
            </li>
          ))}
          {log.length === 0 && !loading && (
            <li className="p-4 text-zinc-600">暂无提交记录</li>
          )}
        </ul>
      ) : (
        <>
          <ul className="max-h-40 overflow-y-auto divide-y divide-zinc-800/80 text-sm">
            {status?.files.map((f) => (
              <li key={f.path}>
                <button
                  type="button"
                  onClick={() => setSelectedPath(f.path)}
                  className={`w-full px-3 py-2 text-left hover:bg-zinc-900 ${
                    selectedPath === f.path ? 'bg-zinc-900' : ''
                  }`}
                >
                  <span className="text-xs text-amber-400/90">{f.status}</span>{' '}
                  <span className="font-mono text-zinc-300">{f.path}</span>
                </button>
              </li>
            ))}
            {status?.clean && (
              <li className="px-3 py-4 text-center text-xs text-zinc-600">工作区干净</li>
            )}
          </ul>
          <pre className="min-h-0 flex-1 overflow-auto border-t border-zinc-800 bg-zinc-900/40 p-3 font-mono text-xs text-zinc-400">
            {selectedPath ? diff || '加载 diff…' : '选择文件查看 diff'}
          </pre>
          <div className="shrink-0 border-t border-zinc-800 p-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="feat(skills): …"
              rows={2}
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={loading || !selectedPath}
                onClick={() => handleCommit(false)}
                className="flex-1 rounded-lg border border-zinc-700 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
              >
                提交选中
              </button>
              <button
                type="button"
                disabled={loading || status?.clean}
                onClick={() => handleCommit(true)}
                className="flex-1 rounded-lg bg-emerald-800 py-1.5 text-xs text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                全部提交
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
