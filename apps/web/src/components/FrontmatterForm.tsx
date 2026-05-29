import type { SkillFrontmatter, ValidationError } from '../types.js';
import { cn, ui } from '../lib/ui.js';

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

  const fieldClass = cn(ui.input, 'mt-1 w-full rounded-lg px-3 py-2 text-sm');

  return (
    <div className={cn('space-y-3 border-b p-4', ui.border)}>
      <div>
        <label className={cn('text-xs', ui.muted)}>name</label>
        <input
          type="text"
          readOnly={nameReadOnly}
          value={frontmatter.name}
          onChange={(e) => onChange({ ...frontmatter, name: e.target.value })}
          className={cn(fieldClass, 'font-mono', nameReadOnly && 'cursor-not-allowed opacity-60')}
        />
        {fieldError(errors, 'name') && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldError(errors, 'name')}</p>
        )}
      </div>
      <div>
        <label className={cn('text-xs', ui.muted)}>description</label>
        <textarea
          value={frontmatter.description}
          onChange={(e) => onChange({ ...frontmatter, description: e.target.value })}
          rows={3}
          className={cn(fieldClass, 'resize-y')}
        />
        {fieldError(errors, 'description') && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldError(errors, 'description')}</p>
        )}
      </div>
      <div>
        <label className={cn('text-xs', ui.muted)}>paths（可选，逗号分隔）</label>
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
          className={fieldClass}
        />
      </div>
      <label className={cn('flex items-center gap-2 text-sm', ui.muted)}>
        <input
          type="checkbox"
          checked={Boolean(frontmatter['disable-model-invocation'])}
          onChange={(e) =>
            onChange({
              ...frontmatter,
              'disable-model-invocation': e.target.checked || undefined,
            })
          }
          className={cn('rounded', ui.input)}
        />
        disable-model-invocation
      </label>
    </div>
  );
}
