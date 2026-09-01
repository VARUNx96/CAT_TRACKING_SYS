/**
 * Global Theme Manager for Caterpillar Smart Rental System
 * Persists theme in localStorage and synchronizes with DOM elements.
 */

export type Theme = 'dark' | 'light';

const THEME_KEY = 'cat_theme_mode';

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  // Default to dark mode for Caterpillar high-contrast sleek design
  return 'dark';
}

export function applyTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
  const root = document.documentElement;
  const body = document.body;

  if (theme === 'dark') {
    root.classList.add('dark-mode');
    body.classList.add('dark-mode');
  } else {
    root.classList.remove('dark-mode');
    body.classList.remove('dark-mode');
  }

  // Dispatch custom event for reactive subscribers
  window.dispatchEvent(new CustomEvent('cat-theme-changed', { detail: { theme } }));
}

export function toggleTheme(): Theme {
  const current = getInitialTheme();
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
