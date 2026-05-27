import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        setError(t('sync.exitCode', { code: result.exitCode }));
      } else {
        onDone?.();
      }
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : t('sync.failed'));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="csm-panel flex max-h-[80vh] w-full max-w-2xl flex-col shadow-xl">
        <div className="csm-border flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{t('sync.title')}</h2>
          <button type="button" onClick={onClose} className="csm-muted text-sm hover:text-zinc-800 dark:hover:text-zinc-300">
            {t('nav.close')}
          </button>
        </div>
        <p className="csm-muted px-4 py-2 text-xs">{t('sync.scriptHint')}</p>
        {error && <p className="px-4 text-sm text-red-500 dark:text-red-400">{error}</p>}
        <pre className="mx-4 mb-2 min-h-[120px] flex-1 overflow-auto rounded-lg bg-zinc-100 p-3 font-mono text-xs text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
          {running ? t('sync.running') : stdout || stderr || t('sync.noOutput')}
          {stderr && stdout ? `\n--- stderr ---\n${stderr}` : ''}
        </pre>
        <div className="csm-border flex justify-end gap-2 border-t px-4 py-3">
          <button type="button" onClick={onClose} className="csm-muted text-sm hover:text-zinc-800 dark:hover:text-zinc-200">
            {t('sync.cancel')}
          </button>
          <button type="button" disabled={running} onClick={handleRun} className="csm-btn-primary disabled:opacity-50">
            {running ? t('sync.running') : t('sync.start')}
          </button>
        </div>
      </div>
    </div>
  );
}
