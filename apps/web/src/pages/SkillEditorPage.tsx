import { useCallback, useEffect, useState } from 'react';
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
      const msg = e instanceof ApiClientError ? e.message : '加载失败';
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
        setToast('请先修复校验错误');
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
      setToast('已保存');
      onSaved?.();
    } catch (e) {
      if (e instanceof ApiClientError && e.code === 'VALIDATION_ERROR') {
        setToast(e.message);
        await runValidate(frontmatter, bodyMarkdown);
      } else {
        setToast(e instanceof ApiClientError ? e.message : '保存失败');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!detail || detail.readOnly) return;
    if (!confirm(`确定删除 skill「${detail.name}」？此操作不可恢复（硬删除）。`)) return;
    try {
      await deleteSkill(skillId, 'hard');
      onDeleted?.();
      onBack();
    } catch (e) {
      setToast(e instanceof ApiClientError ? e.message : '删除失败');
    }
  }

  if (loading || !detail || !frontmatter) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-500">
        {loading ? '加载编辑器…' : '无法加载 skill'}
      </div>
    );
  }

  const readOnly = detail.readOnly || detail.source !== 'personal';

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <header className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← 返回列表
        </button>
        <h1 className="font-mono text-sm text-zinc-200">{detail.name}</h1>
        {readOnly && (
          <span className="rounded bg-amber-950/50 px-2 py-0.5 text-xs text-amber-200">
            只读
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab('edit')}
            className={`rounded px-2 py-1 text-xs ${tab === 'edit' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'}`}
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => setTab('files')}
            className={`rounded px-2 py-1 text-xs ${tab === 'files' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500'}`}
          >
            文件
          </button>
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/30"
              >
                删除
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !dirty}
                className="rounded-lg bg-emerald-700 px-4 py-1.5 text-sm text-white hover:bg-emerald-600 disabled:opacity-40"
              >
                {saving ? '保存中…' : '保存'}
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
          <div className="flex min-h-0 flex-col border-r border-zinc-800">
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
          <div className="min-h-0 overflow-auto border-l border-zinc-800 bg-zinc-900/30">
            <p className="border-b border-zinc-800 px-4 py-2 text-xs text-zinc-500">预览</p>
            <MarkdownPreview markdown={bodyMarkdown} />
          </div>
        </div>
      )}

      {dirty && !readOnly && (
        <p className="shrink-0 border-t border-zinc-800 px-4 py-1 text-xs text-amber-400/90">
          有未保存的更改
        </p>
      )}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
