import { useEffect } from 'react';

import useSettings from './useSettings';

const useThemeEffect = () => {
  const { settings } = useSettings();

  useEffect(() => {
    if (settings?.theme) {
      document.documentElement.dataset.theme = settings.theme;
    }
  }, [settings?.theme]);

  return null;
};

export default useThemeEffect;
