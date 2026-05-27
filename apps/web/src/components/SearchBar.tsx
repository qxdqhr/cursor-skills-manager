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
  return (
    <div className="flex flex-1 flex-wrap items-center gap-2">
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="搜索 name / description / 正文…"
        className="min-w-[200px] flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
      />
      <select
        value={source}
        onChange={(e) => onSourceChange(e.target.value as SourceFilter)}
        className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
        aria-label="来源筛选"
      >
        <option value="all">全部来源</option>
        <option value="personal">个人主库</option>
        <option value="project">项目只读</option>
      </select>
      <label className="flex items-center gap-1.5 text-sm text-zinc-400">
        <input
          type="checkbox"
          checked={gitDirtyOnly}
          onChange={(e) => onGitDirtyOnlyChange(e.target.checked)}
          className="rounded border-zinc-600"
        />
        仅未提交
      </label>
    </div>
  );
}
