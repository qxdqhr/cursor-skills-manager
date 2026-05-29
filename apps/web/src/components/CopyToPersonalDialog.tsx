import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiClientError, postCopyToPersonal } from '../lib/api.js';
import { cn, ui } from '../lib/ui.js';
import type { SkillSummary } from '../types.js';

export function CopyToPersonalDialog({
  open,
  skill,
  onClose,
  onCopied,
}: {
  open: boolean;
  skill: SkillSummary | null;
  onClose: () => void;
  onCopied: (skillId: string) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [categoryPath, setCategoryPath] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !skill) return null;

  const sourceSkillId = skill.skillId;
  const defaultName = skill.name;

  async function handleCopy() {
    setBusy(true);
    setError(null);
    try {
      const created = await postCopyToPersonal({
        sourceSkillId,
        name: name.trim() || undefined,
        categoryPath: categoryPath.trim() || undefined,
      });
      onCopied(created.skillId);
      onClose();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : t('copy.failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={cn(ui.panel, 'w-full max-w-md p-5 shadow-xl')}>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{t('copy.title')}</h2>
        <p className={cn(ui.muted, 'mt-1 text-sm')}>{t('copy.hint', { name: defaultName })}</p>
        <label className="mt-4 block text-sm">
          <span className={ui.muted}>{t('copy.name')}</span>
          <input
            className={cn(ui.input, 'mt-1 w-full rounded-lg px-3 py-2 text-sm')}
            placeholder={defaultName}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="mt-3 block text-sm">
          <span className={ui.muted}>{t('copy.category')}</span>
          <input
            className={cn(ui.input, 'mt-1 w-full rounded-lg px-3 py-2 text-sm')}
            placeholder="rn/android"
            value={categoryPath}
            onChange={(e) => setCategoryPath(e.target.value)}
          />
        </label>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ui.btn}>
            {t('copy.cancel')}
          </button>
          <button type="button" disabled={busy} onClick={() => void handleCopy()} className={ui.btnPrimary}>
            {busy ? t('copy.running') : t('copy.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
