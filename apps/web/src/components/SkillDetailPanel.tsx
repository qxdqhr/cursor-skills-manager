import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ApiClientError,
  fetchPlatforms,
  postPlatformPublish,
  postPlatformRepair,
  postOpenTarget,
  postSkillMove,
  postSkillRename,
} from '../lib/api.js';
import { cn, ui } from '../lib/ui.js';
import type {
  PlatformBindingStatus,
  PlatformDefinition,
  PlatformId,
  SkillSummary,
} from '../types.js';
import { PlatformBindingBadges } from './PlatformBindingBadges.js';
import { PublishPlatformsModal } from './SyncAgentsModal.js';
import { SkillMetaEditor } from './SkillMetaEditor.js';

const PLATFORM_I18N: Record<PlatformId, string> = {
  cursor: 'platforms.cursor',
  agents: 'platforms.agents',
  opencode: 'platforms.opencode',
  claude: 'platforms.claude',
  codex: 'platforms.codex',
};

export function SkillDetailPanel({
  skill,
  onEdit,
  onBindingsChanged,
  onMetaUpdated,
  onCopyToPersonal,
  onRenamed,
}: {
  skill: SkillSummary | null;
  onEdit?: (skillId: string) => void;
  onBindingsChanged?: () => void;
  onMetaUpdated?: () => void;
  onCopyToPersonal?: () => void;
  onRenamed?: (skillId: string) => void;
}) {
  const { t } = useTranslation();
  const [platforms, setPlatforms] = useState<PlatformDefinition[]>([]);
  const [publishOpen, setPublishOpen] = useState(false);
  const [busyPlatform, setBusyPlatform] = useState<PlatformId | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!skill || skill.source !== 'personal') {
      setPlatforms([]);
      return;
    }
    fetchPlatforms()
      .then(({ items }) => setPlatforms(items))
      .catch(() => setPlatforms([]));
  }, [skill?.skillId, skill?.source]);

  const targetPlatforms = useMemo(
    () =>
      platforms.filter(
        (p) => p.enabled && p.role !== 'canonical' && p.syncMode === 'symlink',
      ),
    [platforms],
  );

  if (!skill) {
    return (
      <div className={cn(ui.muted, 'flex h-full items-center justify-center p-6 text-sm text-wrap-pretty')}>
        {t('skills.selectHint')}
      </div>
    );
  }

  const skillId = skill.skillId;

  async function runPlatformAction(
    platformId: PlatformId,
    mode: 'publish' | 'repair',
    opts?: { force?: boolean },
  ) {
    setBusyPlatform(platformId);
    setActionError(null);
    try {
      const body = { skillIds: [skillId], force: opts?.force };
      const result =
        mode === 'publish'
          ? await postPlatformPublish(platformId, body)
          : await postPlatformRepair(platformId, body);
      if (result.summary.conflicts > 0) {
        const conflict = result.items.find((i) => i.action === 'conflict');
        const msg = conflict?.message ?? t('publish.conflictGeneric');
        if (!opts?.force && window.confirm(`${msg}\n\n${t('publish.forceConfirm')}`)) {
          await runPlatformAction(platformId, mode, { force: true });
          return;
        }
        setActionError(msg);
      } else {
        onBindingsChanged?.();
      }
    } catch (e) {
      setActionError(e instanceof ApiClientError ? e.message : t('publish.failed'));
    } finally {
      setBusyPlatform(null);
    }
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-y-auto p-4">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{skill.name}</h2>
        <p className={cn(ui.muted, 'mt-1 font-mono text-xs')}>{skill.skillId}</p>
      {skill.readOnly && (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          {t('skills.projectReadOnlyHint')}
        </p>
      )}
      {skill.source === 'project' && (
        <button
          type="button"
          onClick={onCopyToPersonal}
          className={cn(ui.btnPrimary, 'mt-3 w-full text-sm')}
        >
          {t('copy.title')}
        </button>
      )}
      {skill.source === 'personal' && !skill.readOnly && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className={cn(ui.btn, 'flex-1 text-xs')}
            onClick={() => {
              const newName = window.prompt(t('rename.prompt'), skill.name);
              if (!newName || newName === skill.name) return;
              void postSkillRename(skill.skillId, newName)
                .then((d) => onRenamed?.(d.skillId))
                .catch((e) =>
                  alert(e instanceof ApiClientError ? e.message : t('rename.failed')),
                );
            }}
          >
            {t('rename.action')}
          </button>
          <button
            type="button"
            className={cn(ui.btn, 'flex-1 text-xs')}
            onClick={() => {
              const categoryPath = window.prompt(t('move.prompt'), skill.categoryPath);
              if (categoryPath === null) return;
              void postSkillMove(skill.skillId, categoryPath)
                .then((d) => onRenamed?.(d.skillId))
                .catch((e) =>
                  alert(e instanceof ApiClientError ? e.message : t('move.failed')),
                );
            }}
          >
            {t('move.action')}
          </button>
        </div>
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
        {skill.source === 'personal' && (
          <SkillMetaEditor skill={skill} onUpdated={onMetaUpdated} />
        )}
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
        {skill.source === 'personal' && targetPlatforms.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                {t('skills.publishTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setPublishOpen(true)}
                className="text-xs text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
              >
                {t('skills.publishMulti')}
              </button>
            </div>
            {actionError && (
              <p className="mb-2 text-xs text-red-500 dark:text-red-400">{actionError}</p>
            )}
            <ul className="space-y-2">
              {targetPlatforms.map((platform) => {
                const binding = skill.bindings?.find((b) => b.platformId === platform.id);
                const hasIssue = binding && !binding.ok && binding.issue;
                return (
                  <li
                    key={platform.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200/80 px-3 py-2 dark:border-zinc-800/80"
                  >
                    <span className="text-sm text-zinc-800 dark:text-zinc-200">
                      {t(PLATFORM_I18N[platform.id])}
                    </span>
                    <div className="flex gap-2">
                      {hasIssue && (
                        <button
                          type="button"
                          disabled={busyPlatform === platform.id}
                          onClick={() => void runPlatformAction(platform.id, 'repair')}
                          className={cn(ui.btn, 'text-xs disabled:opacity-50')}
                        >
                          {t('skills.repairBinding')}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busyPlatform === platform.id}
                        onClick={() => void runPlatformAction(platform.id, 'publish')}
                        className={cn(ui.btnPrimary, 'text-xs disabled:opacity-50')}
                      >
                        {t('skills.publishOne')}
                      </button>
                    </div>
                  </li>
                );
              })}
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
      <PublishPlatformsModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        skillIds={[skill.skillId]}
        onDone={() => {
          setPublishOpen(false);
          onBindingsChanged?.();
        }}
      />
    </>
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
        <p className={cn(ui.muted, 'mt-1 break-all font-mono text-[11px]')}>→ {binding.target}</p>
      )}
    </li>
  );
}
