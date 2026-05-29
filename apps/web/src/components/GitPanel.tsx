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
import { cn, ui } from '../lib/ui.js';

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

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="git-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(ui.panel, 'flex max-h-[85vh] w-full max-w-4xl flex-col shadow-xl')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn(ui.border, 'flex items-center justify-between border-b px-4 py-3')}>
          <div>
            <h2 id="git-modal-title" className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              {t('git.title')}
            </h2>
            {status && (
              <p className={cn(ui.muted, 'mt-0.5 text-xs')}>
                {status.branch} ·{' '}
                {status.clean
                  ? t('git.clean')
                  : t('git.changes', { count: status.files.length })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(ui.muted, 'text-sm hover:text-zinc-800 dark:hover:text-zinc-300')}
          >
            {t('nav.close')}
          </button>
        </div>

        <div className={cn(ui.border, 'flex border-b text-xs')}>
          <button
            type="button"
            onClick={() => setTab('changes')}
            className={`flex-1 py-2.5 ${tab === 'changes' ? 'text-emerald-600 dark:text-emerald-400' : ui.muted}`}
          >
            {t('git.tabChanges')}
          </button>
          <button
            type="button"
            onClick={() => setTab('log')}
            className={`flex-1 py-2.5 ${tab === 'log' ? 'text-emerald-600 dark:text-emerald-400' : ui.muted}`}
          >
            {t('git.tabLog')}
          </button>
          <button
            type="button"
            onClick={() => refresh()}
            className={cn(ui.muted, 'px-4 hover:text-zinc-800 dark:hover:text-zinc-300')}
          >
            {t('nav.refresh')}
          </button>
        </div>

        {error && (
          <p className="border-b border-red-300 bg-red-50 px-4 py-2 text-xs text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </p>
        )}

        {tab === 'log' ? (
          <ul className={cn(ui.divider, 'min-h-0 flex-1 divide-y overflow-y-auto text-xs')}>
            {log.map((entry) => (
              <li key={entry.hash} className="px-4 py-2.5">
                <p className={cn(ui.muted, 'font-mono')}>{entry.hash.slice(0, 7)}</p>
                <p className="mt-1 text-zinc-800 dark:text-zinc-300">{entry.message}</p>
                <p className={cn(ui.muted, 'mt-0.5')}>
                  {entry.author} · {entry.date}
                </p>
              </li>
            ))}
            {log.length === 0 && !loading && (
              <li className={cn(ui.muted, 'p-6 text-center')}>{t('git.noLog')}</li>
            )}
          </ul>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <ul className={cn(ui.divider, 'max-h-36 shrink-0 divide-y overflow-y-auto text-sm')}>
              {status?.files.map((f) => (
                <li key={f.path}>
                  <button
                    type="button"
                    onClick={() => setSelectedPath(f.path)}
                    className={cn(
                      'w-full px-4 py-2 text-left transition-colors hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80',
                      selectedPath === f.path && 'bg-zinc-200/90 dark:bg-zinc-800/90',
                    )}
                  >
                    <span className="text-xs text-amber-600 dark:text-amber-400/90">{f.status}</span>{' '}
                    <span className="font-mono text-zinc-700 dark:text-zinc-300">{f.path}</span>
                  </button>
                </li>
              ))}
              {status?.clean && (
                <li className={cn(ui.muted, 'px-4 py-6 text-center text-xs')}>{t('git.workspaceClean')}</li>
              )}
            </ul>
            <pre
              className={cn(
                ui.border,
                'min-h-[140px] flex-1 overflow-auto border-t bg-zinc-100/80 p-4 font-mono text-xs text-zinc-600 dark:bg-zinc-900/40 dark:text-zinc-400',
              )}
            >
              {selectedPath ? diff || t('git.loadingDiff') : t('git.selectDiff')}
            </pre>
            <div className={cn(ui.border, 'shrink-0 border-t p-4')}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('git.commitPlaceholder')}
                rows={2}
                className={cn(ui.input, 'w-full resize-none rounded-lg px-3 py-2 text-sm')}
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={loading || !selectedPath}
                  onClick={() => handleCommit(false)}
                  className={cn(ui.btn, 'flex-1 py-2 text-xs disabled:opacity-40')}
                >
                  {t('git.commitSelected')}
                </button>
                <button
                  type="button"
                  disabled={loading || status?.clean}
                  onClick={() => handleCommit(true)}
                  className={cn(ui.btnPrimary, 'flex-1 py-2 text-xs disabled:opacity-40')}
                >
                  {t('git.commitAll')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
