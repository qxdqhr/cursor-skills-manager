import type { SkillFrontmatter, ValidationError } from '../types.js';

type Props = {
  frontmatter: SkillFrontmatter;
  onChange: (next: SkillFrontmatter) => void;
  errors: ValidationError[];
  nameReadOnly?: boolean;
};

function fieldError(errors: ValidationError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message;
}

export function FrontmatterForm({ frontmatter, onChange, errors, nameReadOnly = true }: Props) {
  const pathsValue = Array.isArray(frontmatter.paths)
    ? frontmatter.paths.join(', ')
    : (frontmatter.paths ?? '');

  return (
    <div className="space-y-3 border-b border-zinc-800 p-4">
      <div>
        <label className="text-xs text-zinc-500">name</label>
        <input
          type="text"
          readOnly={nameReadOnly}
          value={frontmatter.name}
          onChange={(e) => onChange({ ...frontmatter, name: e.target.value })}
          className={`mt-1 w-full rounded-lg border px-3 py-2 font-mono text-sm ${
            nameReadOnly
              ? 'border-zinc-800 bg-zinc-900/50 text-zinc-500'
              : 'border-zinc-700 bg-zinc-900 text-zinc-100'
          }`}
        />
        {fieldError(errors, 'name') && (
          <p className="mt-1 text-xs text-red-400">{fieldError(errors, 'name')}</p>
        )}
      </div>
      <div>
        <label className="text-xs text-zinc-500">description</label>
        <textarea
          value={frontmatter.description}
          onChange={(e) => onChange({ ...frontmatter, description: e.target.value })}
          rows={3}
          className="mt-1 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        />
        {fieldError(errors, 'description') && (
          <p className="mt-1 text-xs text-red-400">{fieldError(errors, 'description')}</p>
        )}
      </div>
      <div>
        <label className="text-xs text-zinc-500">paths（可选，逗号分隔）</label>
        <input
          type="text"
          value={pathsValue}
          onChange={(e) => {
            const raw = e.target.value.trim();
            onChange({
              ...frontmatter,
              paths: raw ? raw.split(',').map((p) => p.trim()) : undefined,
            });
          }}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-400">
        <input
          type="checkbox"
          checked={Boolean(frontmatter['disable-model-invocation'])}
          onChange={(e) =>
            onChange({
              ...frontmatter,
              'disable-model-invocation': e.target.checked || undefined,
            })
          }
          className="rounded border-zinc-600"
        />
        disable-model-invocation
      </label>
    </div>
  );
}
