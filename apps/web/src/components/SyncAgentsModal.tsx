import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ApiClientError,
  fetchPlatforms,
  postSyncPlatforms,
  type PublishBatchResult,
} from '../lib/api.js';
import { cn, ui } from '../lib/ui.js';
import type { PlatformDefinition, PlatformId } from '../types.js';

const PLATFORM_I18N: Record<PlatformId, string> = {
  cursor: 'platforms.cursor',
  agents: 'platforms.agents',
  opencode: 'platforms.opencode',
  claude: 'platforms.claude',
  codex: 'platforms.codex',
};

function formatResults(platforms: PublishBatchResult[]): string {
  return platforms
    .map((p) => {
      const head = `[${p.platformId}] created=${p.summary.created} repaired=${p.summary.repaired} skipped=${p.summary.skipped} conflicts=${p.summary.conflicts}`;
      const lines = p.items
        .filter((i) => i.action !== 'skipped')
        .map((i) => `  ${i.name}: ${i.action}${i.message ? ` — ${i.message}` : ''}`)
        .join('\n');
      return lines ? `${head}\n${lines}` : head;
    })
    .join('\n\n');
}

export function PublishPlatformsModal({
  open,
  onClose,
  onDone,
  skillIds,
}: {
  open: boolean;
  onClose: () => void;
  onDone?: () => void;
  /** When set, publish only these skills; otherwise all personal skills */
  skillIds?: string[];
}) {
  const { t } = useTranslation();
  const [platforms, setPlatforms] = useState<PlatformDefinition[]>([]);
  const [selected, setSelected] = useState<PlatformId[]>([]);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastDryRun, setLastDryRun] = useState<PublishBatchResult[] | null>(null);
  const [force, setForce] = useState(false);

  const targets = useMemo(
    () =>
      platforms.filter(
        (p) => p.enabled && p.role !== 'canonical' && p.syncMode === 'symlink',
      ),
    [platforms],
  );

  useEffect(() => {
    if (!open) return;
    setOutput('');
    setError(null);
    setLastDryRun(null);
    setForce(false);
    fetchPlatforms()
      .then(({ items }) => {
        setPlatforms(items);
        setSelected(
          items
            .filter((p) => p.enabled && p.role !== 'canonical' && p.syncMode === 'symlink')
            .map((p) => p.id),
        );
      })
      .catch(() => setPlatforms([]));
  }, [open]);

  if (!open) return null;

  const hasConflicts =
    lastDryRun?.some((p) => p.summary.conflicts > 0) ?? false;

  async function runPublish(dryRun: boolean) {
    if (selected.length === 0) {
      setError(t('publish.selectPlatform'));
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const body = {
        platformIds: selected,
        all: skillIds ? undefined : true,
        skillIds,
        dryRun,
        force: dryRun ? undefined : force,
      };
      const result = await postSyncPlatforms(body);
      const text = formatResults(result.platforms);
      setOutput(text);
      if (dryRun) {
        setLastDryRun(result.platforms);
        return;
      }
      const conflicts = result.platforms.reduce((n, p) => n + p.summary.conflicts, 0);
      if (conflicts > 0) {
        setError(t('publish.conflictsRemain', { count: conflicts }));
      } else {
        onDone?.();
      }
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : t('publish.failed'));
    } finally {
      setRunning(false);
    }
  }

  function togglePlatform(id: PlatformId) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={cn(ui.panel, 'flex max-h-[85vh] w-full max-w-2xl flex-col shadow-xl')}>
        <div className={cn(ui.border, 'flex items-center justify-between border-b px-4 py-3')}>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{t('publish.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className={cn(ui.muted, 'text-sm hover:text-zinc-800 dark:hover:text-zinc-300')}
          >
            {t('nav.close')}
          </button>
        </div>
        <p className={cn(ui.muted, 'px-4 py-2 text-xs')}>
          {skillIds?.length
            ? t('publish.hintSelected', { count: skillIds.length })
            : t('publish.hintAll')}
        </p>

        <div className="space-y-2 px-4 pb-2">
          {targets.map((platform) => (
            <label
              key={platform.id}
              className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200/80 px-3 py-2 dark:border-zinc-800/80"
            >
              <input
                type="checkbox"
                checked={selected.includes(platform.id)}
                onChange={() => togglePlatform(platform.id)}
                className="mt-0.5"
              />
              <span className="min-w-0">
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {t(PLATFORM_I18N[platform.id])}
                </span>
                <span className={cn(ui.muted, 'mt-0.5 block break-all font-mono text-[11px]')}>
                  {platform.globalRoot}
                </span>
              </span>
            </label>
          ))}
        </div>

        {hasConflicts && (
          <label className="mx-4 mb-2 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
            <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} />
            {t('publish.forceReplace')}
          </label>
        )}

        {error && <p className="px-4 text-sm text-red-500 dark:text-red-400">{error}</p>}
        <pre className="mx-4 mb-2 min-h-[100px] flex-1 overflow-auto rounded-lg bg-zinc-100 p-3 font-mono text-xs text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
          {running ? t('publish.running') : output || t('publish.noOutput')}
        </pre>
        <div className={cn(ui.border, 'flex justify-end gap-2 border-t px-4 py-3')}>
          <button
            type="button"
            onClick={onClose}
            className={cn(ui.muted, 'text-sm hover:text-zinc-800 dark:hover:text-zinc-200')}
          >
            {t('publish.cancel')}
          </button>
          <button
            type="button"
            disabled={running}
            onClick={() => void runPublish(true)}
            className={cn(ui.btn, 'disabled:opacity-50')}
          >
            {t('publish.preview')}
          </button>
          <button
            type="button"
            disabled={running}
            onClick={() => void runPublish(false)}
            className={cn(ui.btnPrimary, 'disabled:opacity-50')}
          >
            {running ? t('publish.running') : t('publish.start')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** @deprecated use PublishPlatformsModal */
export const SyncAgentsModal = PublishPlatformsModal;
