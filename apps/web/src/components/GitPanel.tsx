import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setError(e instanceof ApiClientError ? e.message : t('git.statusFailed'));
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [selectedPath, t]);

  useEffect(() => {
    if (!open) return;
    refresh();
  }, [open, refresh]);

  useEffect(() => {
    if (!open || !selectedPath) return;
    fetchGitDiff(selectedPath)
      .then((r) => setDiff(r.diff || t('git.noDiff')))
      .catch(() => setDiff(t('git.diffFailed')));
  }, [open, selectedPath, t]);

  async function handleCommit(all: boolean) {
    if (!message.trim()) {
      setError(t('git.commitMessageRequired'));
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
      setError(e instanceof ApiClientError ? e.message : t('git.commitFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <aside className="flex w-96 shrink-0 flex-col bg-zinc-50 shadow-[-1px_0_0_rgba(0,0,0,0.06)] dark:bg-zinc-950 dark:shadow-[-1px_0_0_rgba(255,255,255,0.06)]">
      <div className="csm-border flex items-center justify-between border-b px-3 py-2">
        <div>
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t('git.title')}</h2>
          {status && (
            <p className="csm-muted text-xs">
              {status.branch} ·{' '}
              {status.clean
                ? t('git.clean')
                : t('git.changes', { count: status.files.length })}
            </p>
          )}
        </div>
        <button type="button" onClick={onClose} className="csm-muted text-xs hover:text-zinc-800 dark:hover:text-zinc-300">
          {t('nav.close')}
        </button>
      </div>

      <div className="csm-border flex border-b text-xs">
        <button
          type="button"
          onClick={() => setTab('changes')}
          className={`flex-1 py-2 ${tab === 'changes' ? 'text-emerald-600 dark:text-emerald-400' : 'csm-muted'}`}
        >
          {t('git.tabChanges')}
        </button>
        <button
          type="button"
          onClick={() => setTab('log')}
          className={`flex-1 py-2 ${tab === 'log' ? 'text-emerald-600 dark:text-emerald-400' : 'csm-muted'}`}
        >
          {t('git.tabLog')}
        </button>
        <button type="button" onClick={() => refresh()} className="csm-muted px-3 hover:text-zinc-800 dark:hover:text-zinc-300">
          {t('nav.refresh')}
        </button>
      </div>

      {error && (
        <p className="border-b border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </p>
      )}

      {tab === 'log' ? (
        <ul className="csm-divider flex-1 divide-y overflow-y-auto text-xs">
          {log.map((entry) => (
            <li key={entry.hash} className="px-3 py-2">
              <p className="csm-muted font-mono">{entry.hash.slice(0, 7)}</p>
              <p className="mt-1 text-zinc-800 dark:text-zinc-300">{entry.message}</p>
              <p className="csm-muted mt-0.5">
                {entry.author} · {entry.date}
              </p>
            </li>
          ))}
          {log.length === 0 && !loading && <li className="csm-muted p-4">{t('git.noLog')}</li>}
        </ul>
      ) : (
        <>
          <ul className="csm-divider max-h-40 divide-y overflow-y-auto text-sm">
            {status?.files.map((f) => (
              <li key={f.path}>
                <button
                  type="button"
                  onClick={() => setSelectedPath(f.path)}
                  className={`w-full px-3 py-2 text-left hover:bg-zinc-200 dark:hover:bg-zinc-900 ${
                    selectedPath === f.path ? 'bg-zinc-200 dark:bg-zinc-900' : ''
                  }`}
                >
                  <span className="text-xs text-amber-600 dark:text-amber-400/90">{f.status}</span>{' '}
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">{f.path}</span>
                </button>
              </li>
            ))}
            {status?.clean && (
              <li className="csm-muted px-3 py-4 text-center text-xs">{t('git.workspaceClean')}</li>
            )}
          </ul>
          <pre className="csm-border min-h-0 flex-1 overflow-auto border-t bg-zinc-100/80 p-3 font-mono text-xs text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400">
            {selectedPath ? diff || t('git.loadingDiff') : t('git.selectDiff')}
          </pre>
          <div className="csm-border shrink-0 border-t p-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('git.commitPlaceholder')}
              rows={2}
              className="csm-input w-full resize-none rounded-lg px-2 py-1.5 text-sm"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={loading || !selectedPath}
                onClick={() => handleCommit(false)}
                className="csm-btn flex-1 py-1.5 text-xs disabled:opacity-40"
              >
                {t('git.commitSelected')}
              </button>
              <button
                type="button"
                disabled={loading || status?.clean}
                onClick={() => handleCommit(true)}
                className="flex-1 rounded-lg bg-emerald-700 py-1.5 text-xs text-white hover:bg-emerald-600 disabled:opacity-40"
              >
                {t('git.commitAll')}
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
