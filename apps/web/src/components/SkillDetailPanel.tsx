import type { SkillSummary } from '../types.js';

export function SkillDetailPanel({
  skill,
  onEdit,
}: {
  skill: SkillSummary | null;
  onEdit?: (skillId: string) => void;
}) {
  if (!skill) {
    return (
      <div className="flex h-full items-center justify-center border-l border-zinc-800 p-6 text-sm text-zinc-600">
        选择一项 skill 查看详情
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-l border-zinc-800 p-4">
      <h2 className="text-lg font-medium text-zinc-100">{skill.name}</h2>
      <p className="mt-1 font-mono text-xs text-zinc-500">{skill.skillId}</p>
      {skill.readOnly && (
        <p className="mt-3 rounded-lg border border-amber-900/50 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
          项目 skill 为只读，不可在此保存。可复制到主库（M4 向导）。
        </p>
      )}
      {!skill.readOnly && skill.source === 'personal' && onEdit && (
        <button
          type="button"
          onClick={() => onEdit(skill.skillId)}
          className="mt-4 w-full rounded-lg bg-emerald-800/80 py-2 text-sm text-white hover:bg-emerald-700"
        >
          打开编辑器
        </button>
      )}
      <dl className="mt-4 space-y-2 text-sm">
        <Row label="描述" value={skill.description} />
        <Row label="路径" value={skill.skillMdPath} mono />
        <Row label="分类" value={skill.categoryPath || '（根）'} />
      </dl>
      {!skill.validation.ok && (
        <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 p-3">
          <p className="text-xs font-medium text-red-300">校验问题</p>
          <ul className="mt-2 list-inside list-disc text-xs text-red-200/90">
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
      <dt className="text-zinc-500">{label}</dt>
      <dd className={`mt-0.5 ${mono ? 'break-all font-mono text-xs text-zinc-400' : 'text-zinc-300'}`}>
        {value}
      </dd>
    </div>
  );
}
