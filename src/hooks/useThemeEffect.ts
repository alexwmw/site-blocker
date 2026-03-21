import { useLayoutEffect } from 'react';

import useSettings from './useSettings';

const useThemeEffect = () => {
  const { settings } = useSettings();
  const theme = settings?.theme;

  useLayoutEffect(() => {
    if (theme) {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  return theme;
};

export default useThemeEffect;
