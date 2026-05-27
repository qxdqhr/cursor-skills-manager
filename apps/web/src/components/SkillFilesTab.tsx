import { useEffect, useState } from 'react';
import { fetchSkillFiles } from '../lib/api.js';
import type { SkillFileEntry } from '../types.js';

export function SkillFilesTab({ skillId }: { skillId: string }) {
  const [files, setFiles] = useState<SkillFileEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchSkillFiles(skillId)
      .then((r) => setFiles(r.files))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, [skillId]);

  if (loading) {
    return <p className="p-4 text-sm text-zinc-500">加载文件列表…</p>;
  }

  if (files.length === 0) {
    return <p className="p-4 text-sm text-zinc-600">无附属文件（仅 SKILL.md）</p>;
  }

  return (
    <ul className="divide-y divide-zinc-800 overflow-auto p-2 text-sm">
      {files.map((f) => (
        <li key={f.relativePath} className="flex items-center justify-between px-3 py-2">
          <span className="font-mono text-zinc-300">{f.relativePath}</span>
          <span className="text-xs text-zinc-600">
            {f.type === 'directory' ? '目录' : f.size != null ? `${f.size} B` : '文件'}
          </span>
        </li>
      ))}
    </ul>
  );
}
