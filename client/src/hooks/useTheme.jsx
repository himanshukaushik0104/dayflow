import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  STORAGE_KEY,
  readStoredTheme,
  writeStoredTheme,
  resolveTheme,
  applyTheme,
} from '../lib/theme.js';
import { apiGet, apiPut } from '../lib/api.js';
import { useAuth } from './useAuth.jsx';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { session } = useAuth();
  const [theme, setThemeState] = useState(() => readStoredTheme());
  const [resolved, setResolved] = useState(() => resolveTheme(readStoredTheme()));

  // Apply on every theme change. The pre-paint script in index.html
  // already set the initial value, so this is a no-op on first render
  // unless localStorage was empty.
  useEffect(() => {
    applyTheme(theme);
    setResolved(resolveTheme(theme));
  }, [theme]);

  // 'system' mode: react to OS-level theme changes live.
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      applyTheme('system');
      setResolved(resolveTheme('system'));
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  // Cross-tab sync: another tab changes the toggle → we follow.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) setThemeState(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // After login, reconcile localStorage with the server-side preference.
  // localStorage wins on first paint (so login screens are styled fast),
  // but the profile is the cross-device source of truth.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    apiGet('/api/profile')
      .then((profile) => {
        if (cancelled || !profile?.theme) return;
        if (profile.theme !== readStoredTheme()) {
          writeStoredTheme(profile.theme);
          setThemeState(profile.theme);
        }
      })
      .catch(() => {
        /* offline or backend down — keep local preference */
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Optimistic: apply + persist locally instantly, save to API in
  // the background. Failures are non-fatal — local state still wins.
  const setTheme = useCallback(
    (next) => {
      setThemeState(next);
      writeStoredTheme(next);
      if (session) {
        apiPut('/api/profile', { theme: next }).catch(() => {});
      }
    },
    [session],
  );

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
