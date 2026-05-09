// Pure helpers shared by the inline pre-paint script (in index.html)
// and the React-side theme provider. Keep both in sync.

export const STORAGE_KEY = 'dayflow.theme';
export const THEMES = ['light', 'system', 'dark'];

export function readStoredTheme() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

export function writeStoredTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* localStorage disabled; theme will reset on reload */
  }
}

export function resolveTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', resolveTheme(theme));
}
