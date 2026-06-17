import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type PortalTheme = 'light' | 'dark';

type PortalThemeContextValue = {
  theme: PortalTheme;
  setTheme: (theme: PortalTheme) => void;
  toggleTheme: () => void;
};

export const PORTAL_THEME_STORAGE_KEY = 'wk-portal-theme';

const PortalThemeContext = createContext<PortalThemeContextValue | null>(null);

/** Set portal theme before navigating to a dashboard (e.g. on login). */
export function setPortalThemePreference(theme: PortalTheme) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PORTAL_THEME_STORAGE_KEY, theme);
  }
}

export function PortalThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<PortalTheme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(PORTAL_THEME_STORAGE_KEY);
    return stored === 'light' ? 'light' : 'dark';
  });

  const setTheme = (next: PortalTheme) => {
    setThemeState(next);
    localStorage.setItem(PORTAL_THEME_STORAGE_KEY, next);
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    localStorage.setItem(PORTAL_THEME_STORAGE_KEY, theme);
  }, [theme]);

  return (
    <PortalThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <div className={`portal-theme${theme === 'dark' ? ' dark' : ''}`}>{children}</div>
    </PortalThemeContext.Provider>
  );
}

export function usePortalTheme() {
  const ctx = useContext(PortalThemeContext);
  if (!ctx) {
    throw new Error('usePortalTheme must be used within PortalThemeProvider');
  }
  return ctx;
}
