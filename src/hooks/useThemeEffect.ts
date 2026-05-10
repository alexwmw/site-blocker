import { useLayoutEffect } from 'react';

import useSettings from './useSettings';

const useThemeEffect = () => {
  const { settings, updateSettings } = useSettings();
  const theme = settings?.theme;

  useLayoutEffect(() => {
    if (theme === 'focus') {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      updateSettings({ theme: isDarkMode ? 'focus-dark' : 'focus-light' }).catch(console.error);
    }
  }, [theme, updateSettings]);

  useLayoutEffect(() => {
    if (theme) {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  return theme;
};

export default useThemeEffect;
