import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SkillsPage } from './pages/SkillsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { SkillEditorPage } from './pages/SkillEditorPage.js';
import { fetchHealth } from './lib/api.js';
import { getStoredToken } from './lib/token.js';

type View = 'skills' | 'settings';

export default function App() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('skills');
  const [editSkillId, setEditSkillId] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));
  }, []);

  if (apiOk === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 text-center dark:bg-zinc-950">
        <div>
          <p className="text-red-500 dark:text-red-400">{t('api.unreachable')}</p>
          <p className="csm-muted mt-2 text-sm">{t('api.startHint')}</p>
        </div>
      </div>
    );
  }

  if (apiOk === null) {
    return (
      <div className="csm-muted flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        {t('api.connecting')}
      </div>
    );
  }

  if (!getStoredToken() && view === 'skills') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-6 dark:bg-zinc-950">
        <p className="text-zinc-700 dark:text-zinc-300">{t('settings.firstUseToken')}</p>
        <button type="button" onClick={() => setView('settings')} className="csm-btn-primary">
          {t('settings.openSettings')}
        </button>
      </div>
    );
  }

  if (view === 'settings') {
    return <SettingsPage onBack={() => setView('skills')} />;
  }

  if (editSkillId) {
    return (
      <SkillEditorPage
        skillId={editSkillId}
        onBack={() => setEditSkillId(null)}
        onSaved={() => undefined}
        onDeleted={() => setEditSkillId(null)}
      />
    );
  }

  return (
    <SkillsPage
      onOpenSettings={() => setView('settings')}
      onEditSkill={(id) => setEditSkillId(id)}
    />
  );
}
