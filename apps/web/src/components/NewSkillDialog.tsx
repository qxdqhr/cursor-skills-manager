import { useState, type FormEvent } from 'react';
import { ApiClientError, postSkill } from '../lib/api.js';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (skillId: string) => void;
};

export function NewSkillDialog({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [categoryPath, setCategoryPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const detail = await postSkill({
        name: name.trim(),
        categoryPath: categoryPath.trim() || undefined,
        template: 'blank',
      });
      onCreated(detail.skillId);
      setName('');
      setCategoryPath('');
      onClose();
    } catch (err) {
      const msg =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : '创建失败';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl"
      >
        <h2 className="text-lg font-medium text-zinc-100">新建 Skill</h2>
        <p className="mt-1 text-xs text-zinc-500">将在个人主库创建目录与 SKILL.md</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-zinc-500">name（目录名）</label>
            <input
              required
              pattern="[a-z0-9-]+"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-new-skill"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">categoryPath（可选）</label>
            <input
              value={categoryPath}
              onChange={(e) => setCategoryPath(e.target.value)}
              placeholder="experiments"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm"
            />
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {saving ? '创建中…' : '创建'}
          </button>
        </div>
      </form>
    </div>
  );
}
