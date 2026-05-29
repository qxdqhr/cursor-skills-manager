import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiClientError, patchSkillMeta } from '../lib/api.js';
import { cn, ui } from '../lib/ui.js';
import { PRESET_TAGS, type SkillSummary } from '../types.js';

export function SkillMetaEditor({
  skill,
  onUpdated,
}: {
  skill: SkillSummary;
  onUpdated?: () => void;
}) {
  const { t } = useTranslation();
  const [tags, setTags] = useState<string[]>(skill.meta?.tags ?? []);
  const [favorite, setFavorite] = useState(skill.meta?.favorite ?? false);
  const [note, setNote] = useState(skill.meta?.note ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTags(skill.meta?.tags ?? []);
    setFavorite(skill.meta?.favorite ?? false);
    setNote(skill.meta?.note ?? '');
  }, [skill.skillId, skill.meta]);

  async function save(patch: { tags?: string[]; favorite?: boolean; note?: string }) {
    setSaving(true);
    setError(null);
    try {
      await patchSkillMeta(skill.skillId, patch);
      onUpdated?.();
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : t('meta.saveFailed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-zinc-200/80 p-3 dark:border-zinc-800/80">
      <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">{t('meta.title')}</h3>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={favorite}
          disabled={saving}
          onChange={(e) => {
            setFavorite(e.target.checked);
            void save({ favorite: e.target.checked, tags, note });
          }}
        />
        {t('meta.favorite')}
      </label>
      <div className="mt-3">
        <p className={cn(ui.muted, 'text-xs')}>{t('meta.tags')}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {PRESET_TAGS.map((tag) => {
            const active = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                disabled={saving}
                onClick={() => {
                  const next = active ? tags.filter((x) => x !== tag) : [...tags, tag];
                  setTags(next);
                  void save({ tags: next, favorite, note });
                }}
                className={`rounded-md px-2 py-1 text-xs ${
                  active
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
                    : 'bg-zinc-200/70 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
      <label className="mt-3 block text-sm">
        <span className={cn(ui.muted, 'text-xs')}>{t('meta.note')}</span>
        <textarea
          className={cn(ui.input, 'mt-1 w-full rounded-lg px-3 py-2 text-sm')}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => void save({ tags, favorite, note })}
        />
      </label>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
