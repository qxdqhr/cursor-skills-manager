import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FrontmatterForm } from '../components/FrontmatterForm.js';
import { MarkdownEditor } from '../components/MarkdownEditor.js';
import { MarkdownPreview } from '../components/MarkdownPreview.js';
import { SkillFilesTab } from '../components/SkillFilesTab.js';
import { Toast } from '../components/Toast.js';
import {
  ApiClientError,
  deleteSkill,
  fetchSkillDetail,
  putSkill,
  validateSkillDraft,
} from '../lib/api.js';
import type { SkillDetail, SkillFrontmatter, ValidationError } from '../types.js';

type Tab = 'edit' | 'files';

type Props = {
  skillId: string;
  onBack: () => void;
  onSaved?: () => void;
  onDeleted?: () => void;
};

export function SkillEditorPage({ skillId, onBack, onSaved, onDeleted }: Props) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<SkillDetail | null>(null);
  const [frontmatter, setFrontmatter] = useState<SkillFrontmatter | null>(null);
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('edit');
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchSkillDetail(skillId);
      setDetail(d);
      setFrontmatter({ ...d.frontmatter });
      setBodyMarkdown(d.bodyMarkdown);
      setErrors(d.validation.errors);
      setDirty(false);
    } catch (e) {
      const msg = e instanceof ApiClientError ? e.message : t('common.loadFailed');
      setToast(msg);
    } finally {
      setLoading(false);
    }
  }, [skillId]);

  useEffect(() => {
    load();
  }, [load]);

  async function runValidate(fm: SkillFrontmatter, body: string) {
    const result = await validateSkillDraft({
      skillId,
      frontmatter: fm,
      bodyMarkdown: body,
    });
    setErrors(result.errors);
    return result.ok;
  }

  async function handleSave() {
    if (!frontmatter || !detail || detail.readOnly) return;
    setSaving(true);
    try {
      const ok = await runValidate(frontmatter, bodyMarkdown);
      if (!ok) {
        setToast(t('editor.fixValidation'));
        return;
      }
      const updated = await putSkill(skillId, {
        frontmatter,
        bodyMarkdown,
      });
      setDetail(updated);
      setFrontmatter({ ...updated.frontmatter });
      setBodyMarkdown(updated.bodyMarkdown);
      setDirty(false);
      setToast(t('editor.saved'));
      onSaved?.();
    } catch (e) {
      if (e instanceof ApiClientError && e.code === 'VALIDATION_ERROR') {
        setToast(e.message);
        await runValidate(frontmatter, bodyMarkdown);
      } else {
        setToast(e instanceof ApiClientError ? e.message : t('editor.saveFailed'));
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!detail || detail.readOnly) return;
    if (!confirm(t('editor.deleteConfirm', { name: detail.name }))) return;
    try {
      await deleteSkill(skillId, 'hard');
      onDeleted?.();
      onBack();
    } catch (e) {
      setToast(e instanceof ApiClientError ? e.message : t('editor.deleteFailed'));
    }
  }

  if (loading || !detail || !frontmatter) {
    return (
      <div className="csm-muted flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        {loading ? t('editor.loading') : t('editor.loadFailed')}
      </div>
    );
  }

  const readOnly = detail.readOnly || detail.source !== 'personal';

  return (
    <div className="csm-shell">
      <header className="csm-header gap-3">
        <button type="button" onClick={onBack} className="csm-muted text-sm hover:text-zinc-800 dark:hover:text-zinc-200">
          {t('nav.backList')}
        </button>
        <h1 className="font-mono text-sm text-zinc-900 dark:text-zinc-200">{detail.name}</h1>
        {readOnly && (
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
            {t('editor.readOnly')}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={`rounded px-2 py-1 text-xs ${tab === 'edit' ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100' : 'csm-muted'}`}
          >
            {t('editor.tabEdit')}
          </button>
          <button
            type="button"
            onClick={() => setTab('files')}
            className={`rounded px-2 py-1 text-xs ${tab === 'files' ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100' : 'csm-muted'}`}
          >
            {t('editor.tabFiles')}
          </button>
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/30"
              >
                {t('editor.delete')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !dirty}
                className="csm-btn-primary py-1.5 disabled:opacity-40"
              >
                {saving ? t('editor.saving') : t('editor.save')}
              </button>
            </>
          )}
        </div>
      </header>

      {tab === 'files' ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <SkillFilesTab skillId={skillId} />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
          <div className="csm-border flex min-h-0 flex-col border-r">
            <FrontmatterForm
              frontmatter={frontmatter}
              onChange={(fm) => {
                setFrontmatter(fm);
                setDirty(true);
              }}
              errors={errors}
              nameReadOnly
            />
            <div className="min-h-0 flex-1 overflow-hidden">
              <MarkdownEditor
                value={bodyMarkdown}
                onChange={(v) => {
                  setBodyMarkdown(v);
                  setDirty(true);
                }}
                readOnly={readOnly}
              />
            </div>
          </div>
          <div className="csm-border min-h-0 overflow-auto border-l bg-zinc-100/50 dark:bg-zinc-900/30">
            <p className="csm-border csm-muted border-b px-4 py-2 text-xs">{t('editor.preview')}</p>
            <MarkdownPreview markdown={bodyMarkdown} />
          </div>
        </div>
      )}

      {dirty && !readOnly && (
        <p className="shrink-0 border-t border-amber-300 px-4 py-1 text-xs text-amber-700 dark:border-zinc-800 dark:text-amber-400/90">
          {t('editor.unsaved')}
        </p>
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
