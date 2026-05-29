import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiClientError, postSkillsAdd } from '../lib/api.js';
import { cn, ui } from '../lib/ui.js';

export function SkillsAddModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  const { t } = useTranslation();
  const [argsText, setArgsText] = useState('vercel-labs/agent-skills --skill frontend-design -y');
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
    const args = argsText.trim().split(/\s+/).filter(Boolean);
    try {
      const result = await postSkillsAdd(args);
      setStdout(result.stdout);
      setStderr(result.stderr);
      if (result.exitCode !== 0) {
        setError(t('skillsAdd.exitCode', { code: result.exitCode }));
      } else {
        onDone?.();
      }
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : t('skillsAdd.failed'));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={cn(ui.panel, 'flex max-h-[80vh] w-full max-w-2xl flex-col shadow-xl')}>
        <div className={cn(ui.border, 'border-b px-4 py-3')}>
          <h2 className="text-lg font-medium">{t('skillsAdd.title')}</h2>
          <p className={cn(ui.muted, 'text-xs')}>{t('skillsAdd.hint')}</p>
        </div>
        <div className="p-4">
          <input
            className={cn(ui.input, 'w-full rounded-lg px-3 py-2 font-mono text-sm')}
            value={argsText}
            onChange={(e) => setArgsText(e.target.value)}
          />
        </div>
        {error && <p className="px-4 text-sm text-red-500">{error}</p>}
        <pre className="mx-4 mb-2 min-h-[100px] flex-1 overflow-auto rounded-lg bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-950">
          {running ? t('skillsAdd.running') : stdout || stderr || t('skillsAdd.noOutput')}
        </pre>
        <div className={cn(ui.border, 'flex justify-end gap-2 border-t px-4 py-3')}>
          <button type="button" onClick={onClose} className={ui.btn}>
            {t('skillsAdd.cancel')}
          </button>
          <button type="button" disabled={running} onClick={() => void handleRun()} className={ui.btnPrimary}>
            {running ? t('skillsAdd.running') : t('skillsAdd.start')}
          </button>
        </div>
      </div>
    </div>
  );
}
