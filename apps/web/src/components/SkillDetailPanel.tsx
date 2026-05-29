import { useTranslation } from 'react-i18next';
import { ApiClientError, postOpenTarget } from '../lib/api.js';
import { cn, ui } from '../lib/ui.js';
import type { PlatformBindingStatus, SkillSummary } from '../types.js';
import { PlatformBindingBadges } from './PlatformBindingBadges.js';

export function SkillDetailPanel({
  skill,
  onEdit,
}: {
  skill: SkillSummary | null;
  onEdit?: (skillId: string) => void;
}) {
  const { t } = useTranslation();

  if (!skill) {
    return (
      <div className={cn(ui.muted, 'flex h-full items-center justify-center p-6 text-sm text-wrap-pretty')}>
        {t('skills.selectHint')}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{skill.name}</h2>
      <p className={cn(ui.muted, 'mt-1 font-mono text-xs')}>{skill.skillId}</p>
      {skill.readOnly && (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {t('skills.projectReadOnlyHint')}
        </p>
      )}
      <div className="mt-4 flex flex-col gap-2">
        {!skill.readOnly && skill.source === 'personal' && onEdit && (
          <button
            type="button"
            onClick={() => onEdit(skill.skillId)}
            className={cn(ui.btnPrimary, 'w-full transition-transform active:scale-[0.96]')}
          >
            {t('skills.openEditor')}
          </button>
        )}
        {skill.source === 'personal' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                postOpenTarget({ skillId: skill.skillId, target: 'folder' }).catch((e) =>
                  alert(e instanceof ApiClientError ? e.message : t('common.loadFailed')),
                )
              }
              className={cn(ui.btn, 'flex-1 text-xs')}
            >
              {t('skills.openFolder')}
            </button>
            <button
              type="button"
              onClick={() =>
                postOpenTarget({ skillId: skill.skillId, target: 'editor' }).catch((e) =>
                  alert(e instanceof ApiClientError ? e.message : t('common.loadFailed')),
                )
              }
              className={cn(ui.btn, 'flex-1 text-xs')}
            >
              {t('skills.openInEditor')}
            </button>
          </div>
        )}
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <Row label={t('skills.description')} value={skill.description} />
        <Row label={t('skills.path')} value={skill.skillMdPath} mono />
        <Row label={t('skills.category')} value={skill.categoryPath || '—'} />
      </dl>
      {skill.bindings && skill.bindings.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {t('skills.bindingsTitle')}
          </h3>
          <ul className="mt-2 space-y-2">
            {skill.bindings.map((binding) => (
              <BindingRow key={binding.platformId} binding={binding} />
            ))}
          </ul>
        </div>
      )}
      {!skill.validation.ok && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-950/20">
          <p className="text-xs font-medium text-red-700 dark:text-red-300">{t('skills.validationFailed')}</p>
          <ul className="mt-2 list-inside list-disc text-xs text-red-800/90 dark:text-red-200/90">
            {skill.validation.errors.map((e) => (
              <li key={`${e.code}-${e.field}`}>{e.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className={ui.muted}>{label}</dt>
      <dd className={`mt-0.5 ${mono ? 'break-all font-mono text-xs text-zinc-600 dark:text-zinc-400' : 'text-zinc-800 dark:text-zinc-300'}`}>
        {value}
      </dd>
    </div>
  );
}

const PLATFORM_I18N: Record<PlatformBindingStatus['platformId'], string> = {
  cursor: 'platforms.cursor',
  agents: 'platforms.agents',
  opencode: 'platforms.opencode',
  claude: 'platforms.claude',
  codex: 'platforms.codex',
};

function BindingRow({ binding }: { binding: PlatformBindingStatus }) {
  const { t } = useTranslation();
  const label = t(PLATFORM_I18N[binding.platformId]);
  const status = binding.ok
    ? t('binding.ok', { platform: label })
    : binding.issue
      ? t(`binding.issue.${binding.issue}`)
      : t('binding.unknown');

  return (
    <li className="rounded-lg border border-zinc-200/80 px-3 py-2 dark:border-zinc-800/80">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
        <PlatformBindingBadges bindings={[binding]} issuesOnly={false} />
      </div>
      <p className={cn(ui.muted, 'mt-1 text-xs')}>{status}</p>
      <p className={cn(ui.muted, 'mt-1 break-all font-mono text-[11px]')}>{binding.expectedPath}</p>
      {binding.target && binding.target !== binding.expectedPath && (
        <p className={cn(ui.muted, 'mt-1 break-all font-mono text-[11px]')}>
          → {binding.target}
        </p>
      )}
    </li>
  );
}
