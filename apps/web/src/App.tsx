import { useEffect, useState } from 'react';
import { SkillsPage } from './pages/SkillsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { fetchHealth } from './lib/api.js';
import { getStoredToken } from './lib/token.js';

type View = 'skills' | 'settings';

export default function App() {
  const [view, setView] = useState<View>('skills');
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));
  }, []);

  if (apiOk === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-center">
        <div>
          <p className="text-red-400">无法连接 API（:3847）</p>
          <p className="mt-2 text-sm text-zinc-500">请先运行 pnpm dev:api</p>
        </div>
      </div>
    );
  }

  if (apiOk === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-500">
        连接 API…
      </div>
    );
  }

  if (!getStoredToken() && view === 'skills') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 p-6">
        <p className="text-zinc-300">首次使用请配置 API Token</p>
        <button
          type="button"
          onClick={() => setView('settings')}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm text-white hover:bg-emerald-600"
        >
          打开设置
        </button>
      </div>
    );
  }

  if (view === 'settings') {
    return <SettingsPage onBack={() => setView('skills')} />;
  }

  return <SkillsPage onOpenSettings={() => setView('settings')} />;
}
