import { useTranslation } from 'react-i18next';
import type { PlatformBindingStatus, PlatformId } from '../types.js';

const PLATFORM_I18N: Record<PlatformId, string> = {
  cursor: 'platforms.cursor',
  agents: 'platforms.agents',
  opencode: 'platforms.opencode',
  claude: 'platforms.claude',
  codex: 'platforms.codex',
};

export function PlatformBindingBadges({
  bindings,
  issuesOnly = true,
}: {
  bindings?: PlatformBindingStatus[];
  issuesOnly?: boolean;
}) {
  const { t } = useTranslation();
  if (!bindings?.length) return null;

  const items = issuesOnly
    ? bindings.filter((b) => !b.ok && b.issue)
    : bindings.filter((b) => b.mode !== 'none');

  if (items.length === 0) return null;

  return (
    <>
      {items.map((binding) => (
        <span
          key={binding.platformId}
          title={
            binding.issue
              ? t(`binding.issue.${binding.issue}`)
              : t('binding.ok', { platform: t(PLATFORM_I18N[binding.platformId]) })
          }
          className={`rounded px-1.5 py-0.5 text-xs ${
            binding.ok
              ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200'
              : 'bg-orange-200 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200'
          }`}
        >
          {binding.ok
            ? t(PLATFORM_I18N[binding.platformId])
            : t('skills.bindingIssue', { platform: t(PLATFORM_I18N[binding.platformId]) })}
        </span>
      ))}
    </>
  );
}
