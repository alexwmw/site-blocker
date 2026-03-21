import { useLayoutEffect } from 'react';

import useSettings from './useSettings';

import { defaultSettings } from '@/services/defaultSettings';

const THEME_STORAGE_KEY = 'site-blocker.theme';

const THEME_BACKGROUND_COLORS: Record<string, string> = {
  'intention-light': '#f5f2ee',
  'intention-dark': '#13171a',
  'mindful-light': '#edf7f1',
  'mindful-dark': '#111613',
  'focus-light': '#f4f7ff',
  'focus-dark': '#10142b',
};

const applyTheme = (theme: string) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.backgroundColor = THEME_BACKGROUND_COLORS[theme] ?? THEME_BACKGROUND_COLORS[defaultSettings.theme];
  document.documentElement.style.colorScheme = theme.endsWith('-dark') ? 'dark' : 'light';

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Failed to cache theme preference locally.', error);
  }
};

const useThemeEffect = () => {
  const { settings } = useSettings();

  useLayoutEffect(() => {
    applyTheme(settings?.theme ?? defaultSettings.theme);
  }, [settings?.theme]);

  return null;
};

export default useThemeEffect;
