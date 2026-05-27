import type { SkillSummary } from '../types.js';

function formatTime(ms: number): string {
  return new Date(ms).toLocaleString('zh-CN', {
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
}: {
  items: SkillSummary[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (skill: SkillSummary) => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-zinc-500">加载中…</div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-zinc-500">
        <p>没有匹配的 skill</p>
        <p className="text-xs">尝试调整搜索或筛选条件</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-800/80 overflow-y-auto">
      {items.map((skill) => (
        <li key={skill.skillId}>
          <button
            type="button"
            onClick={() => onSelect(skill)}
            className={`w-full px-4 py-3 text-left transition-colors ${
              selectedId === skill.skillId
                ? 'bg-emerald-950/50'
                : 'hover:bg-zinc-900/80'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-zinc-100">{skill.name}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-xs ${
                  skill.source === 'personal'
                    ? 'bg-emerald-900/50 text-emerald-300'
                    : 'bg-blue-900/40 text-blue-300'
                }`}
              >
                {skill.source === 'personal' ? '主库' : '项目'}
              </span>
              {skill.readOnly && (
                <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-xs text-amber-200">
                  只读
                </span>
              )}
              {!skill.validation.ok && (
                <span className="rounded bg-red-900/40 px-1.5 py-0.5 text-xs text-red-200">
                  校验失败
                </span>
              )}
              {skill.hasScripts && (
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                  scripts
                </span>
              )}
              {skill.agentsLink && !skill.agentsLink.ok && (
                <span className="rounded bg-orange-900/40 px-1.5 py-0.5 text-xs text-orange-200">
                  agents 未链接
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{skill.description}</p>
            <p className="mt-1 font-mono text-xs text-zinc-600">
              {skill.relativePath || skill.name}
              {skill.categoryPath ? ` · ${skill.categoryPath}` : ''}
              {' · '}
              {formatTime(skill.mtimeMs)}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
