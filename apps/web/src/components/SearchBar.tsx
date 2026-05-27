import { useTranslation } from 'react-i18next';

export type SourceFilter = 'all' | 'personal' | 'project';

export function SearchBar({
  query,
  onQueryChange,
  source,
  onSourceChange,
  gitDirtyOnly,
  onGitDirtyOnlyChange,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  source: SourceFilter;
  onSourceChange: (s: SourceFilter) => void;
  gitDirtyOnly: boolean;
  onGitDirtyOnlyChange: (v: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-wrap items-center gap-2">
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={t('search.placeholder')}
        className="csm-input min-w-[200px] flex-1 rounded-lg px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
      />
      <select
        value={source}
        onChange={(e) => onSourceChange(e.target.value as SourceFilter)}
        className="csm-input rounded-lg px-3 py-2 text-sm"
        aria-label={t('search.sourceAll')}
      >
        <option value="all">{t('search.sourceAll')}</option>
        <option value="personal">{t('search.sourcePersonal')}</option>
        <option value="project">{t('search.sourceProject')}</option>
      </select>
      <label className="csm-muted flex items-center gap-1.5 text-sm">
        <input
          type="checkbox"
          checked={gitDirtyOnly}
          onChange={(e) => onGitDirtyOnlyChange(e.target.checked)}
          className="rounded border-zinc-400 dark:border-zinc-600"
        />
        {t('search.gitDirtyOnly')}
      </label>
    </div>
  );
}
