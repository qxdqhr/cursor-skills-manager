import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiClientError, postSkill } from '../lib/api.js';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (skillId: string) => void;
};

export function NewSkillDialog({ open, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [categoryPath, setCategoryPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const detail = await postSkill({
        name: name.trim(),
        categoryPath: categoryPath.trim() || undefined,
        template: 'blank',
      });
      onCreated(detail.skillId);
      setName('');
      setCategoryPath('');
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : t('newSkill.createFailed');
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form onSubmit={handleSubmit} className="csm-panel w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{t('newSkill.title')}</h2>
        <p className="csm-muted mt-1 text-xs">{t('newSkill.hint')}</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="csm-muted text-xs">{t('newSkill.name')}</label>
            <input
              required
              pattern="[a-z0-9-]+"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-new-skill"
              className="csm-input mt-1 w-full rounded-lg px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="csm-muted text-xs">{t('newSkill.category')}</label>
            <input
              value={categoryPath}
              onChange={(e) => setCategoryPath(e.target.value)}
              placeholder="experiments"
              className="csm-input mt-1 w-full rounded-lg px-3 py-2 font-mono text-sm"
            />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-500 dark:text-red-400">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="csm-muted text-sm hover:text-zinc-800 dark:hover:text-zinc-200">
            {t('newSkill.cancel')}
          </button>
          <button type="submit" disabled={saving || !name.trim()} className="csm-btn-primary disabled:opacity-50">
            {saving ? t('newSkill.creating') : t('newSkill.create')}
          </button>
        </div>
      </form>
    </div>
  );
}
