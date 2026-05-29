import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchSkillFiles } from '../lib/api.js';
import { cn, ui } from '../lib/ui.js';
import type { SkillFileEntry } from '../types.js';

export function SkillFilesTab({ skillId }: { skillId: string }) {
  const { t } = useTranslation();
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
    return <p className={cn('p-4 text-sm', ui.muted)}>{t('editor.filesLoading')}</p>;
  }

  if (files.length === 0) {
    return <p className={cn('p-4 text-sm', ui.muted)}>{t('editor.filesEmpty')}</p>;
  }

  return (
    <ul className={cn('divide-y overflow-auto p-2 text-sm', ui.divider)}>
      {files.map((f) => (
        <li key={f.relativePath} className="flex items-center justify-between px-3 py-2">
          <span className="font-mono text-zinc-800 dark:text-zinc-300">{f.relativePath}</span>
          <span className={cn('text-xs', ui.muted)}>
            {f.type === 'directory' ? t('editor.fileTypeDir') : f.size != null ? `${f.size} B` : t('editor.fileTypeFile')}
          </span>
        </li>
      ))}
    </ul>
  );
}
