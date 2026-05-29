import { useTranslation } from 'react-i18next';
import { cn, ui } from '../lib/ui.js';
import type { SkillSummary } from '../types.js';

function formatTime(ms: number, locale: string): string {
  return new Date(ms).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SkillList({
  items,
  loading,
  selectedId,
  onSelect,
  locale,
}: {
  items: SkillSummary[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (skill: SkillSummary) => void;
  locale: string;
}) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className={cn(ui.muted, 'flex flex-1 items-center justify-center p-8')}>{t('skills.loading')}</div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn(ui.muted, 'flex flex-1 flex-col items-center justify-center gap-2 p-8')}>
        <p>{t('skills.empty')}</p>
        <p className="text-xs">{t('skills.emptyHint')}</p>
      </div>
    );
  }

  return (
    <ul className={cn(ui.divider, 'divide-y overflow-y-auto')}>
      {items.map((skill) => (
        <li key={skill.skillId}>
          <button
            type="button"
            onClick={() => onSelect(skill)}
            className={`w-full px-4 py-3 text-left transition-colors active:scale-[0.995] ${
              selectedId === skill.skillId
                ? 'bg-emerald-100 dark:bg-emerald-950/50'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-900/80'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{skill.name}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-xs ${
                  skill.source === 'personal'
                    ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'bg-blue-200 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300'
                }`}
              >
                {skill.source === 'personal' ? t('skills.personal') : t('skills.project')}
              </span>
              {skill.readOnly && (
                <span className="rounded bg-amber-200 px-1.5 py-0.5 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                  {t('skills.readOnly')}
                </span>
              )}
              {!skill.validation.ok && (
                <span className="rounded bg-red-200 px-1.5 py-0.5 text-xs text-red-900 dark:bg-red-900/40 dark:text-red-200">
                  {t('skills.validationFailed')}
                </span>
              )}
              {skill.hasScripts && (
                <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {t('skills.scripts')}
                </span>
              )}
              {skill.git?.dirty && (
                <span className="rounded bg-violet-200 px-1.5 py-0.5 text-xs text-violet-900 dark:bg-violet-900/40 dark:text-violet-200">
                  {t('skills.uncommitted')}
                </span>
              )}
              {skill.agentsLink && !skill.agentsLink.ok && (
                <span className="rounded bg-orange-200 px-1.5 py-0.5 text-xs text-orange-900 dark:bg-orange-900/40 dark:text-orange-200">
                  {t('skills.agentsUnlinked')}
                </span>
              )}
            </div>
            <p className={cn(ui.muted, 'mt-1 line-clamp-2 text-sm')}>{skill.description}</p>
            <p className={cn(ui.muted, 'mt-1 font-mono text-xs')}>
              {skill.relativePath || skill.name}
              {skill.categoryPath ? ` · ${skill.categoryPath}` : ''}
              {' · '}
              {formatTime(skill.mtimeMs, locale)}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
