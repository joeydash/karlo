import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first, fallback to system preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme;
    }
    return 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme === 'dark' ? 'dark' : 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    const updateEffectiveTheme = () => {
      if (theme === 'system') {
        setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setEffectiveTheme(theme === 'dark' ? 'dark' : 'light');
      }
    };

    updateEffectiveTheme();
    
    // Listen for system theme changes
    mediaQuery.addListener(handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeListener(handleSystemThemeChange);
    };
  }, [theme]);

  useEffect(() => {
    // Apply theme class to document root
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    
    // Set theme-color meta tag for mobile browsers
    const themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (themeColorMeta) {
      themeColorMeta.content = effectiveTheme === 'dark' ? '#1e1b4b' : '#8b5cf6';
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = effectiveTheme === 'dark' ? '#1e1b4b' : '#8b5cf6';
      document.head.appendChild(meta);
    }
  }, [effectiveTheme]);

  const value = {
    theme,
    setTheme,
    effectiveTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};