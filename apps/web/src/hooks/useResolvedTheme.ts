import { useEffect, useState } from 'react';
import { useAppPreferences } from '../context/AppPreferences.js';
import { resolveTheme } from '../lib/theme.js';

export function useResolvedTheme(): 'light' | 'dark' {
  const { theme } = useAppPreferences();
  const [resolved, setResolved] = useState(() => resolveTheme(theme));

  useEffect(() => {
    setResolved(resolveTheme(theme));
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setResolved(resolveTheme('system'));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  return resolved;
}
