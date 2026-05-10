import { createContext, createElement, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { getAppPreferences, setAppPreference } from '@/src/db/database';
import { defaultPreferences, type AppPreferences } from '@/src/types/preferences';

type AppThemeContext = {
  preferences: AppPreferences;
  updatePreference: <Key extends keyof AppPreferences>(key: Key, value: AppPreferences[Key]) => Promise<void>;
  theme: ReturnType<typeof createTheme>;
};

const Context = createContext<AppThemeContext>({
  preferences: defaultPreferences,
  updatePreference: async () => undefined,
  theme: createTheme(false, defaultPreferences),
});

export type AppTheme = ReturnType<typeof createTheme>;

export function AppThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const [preferences, setPreferences] = useState(defaultPreferences);

  useEffect(() => {
    let mounted = true;
    void getAppPreferences().then((saved) => {
      if (mounted) setPreferences(saved);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const dark = preferences.themeMode === 'dark' || (preferences.themeMode === 'system' && scheme === 'dark');
  const theme = useMemo(() => createTheme(dark, preferences), [dark, preferences]);

  async function updatePreference<Key extends keyof AppPreferences>(key: Key, value: AppPreferences[Key]) {
    setPreferences((current) => ({ ...current, [key]: value }));
    await setAppPreference(key, value);
  }

  const value = useMemo(() => ({ preferences, updatePreference, theme }), [preferences, theme]);
  return createElement(Context.Provider, { value }, children);
}

export function useAppTheme() {
  return useContext(Context).theme;
}

export function useAppPreferences() {
  const { preferences, updatePreference } = useContext(Context);
  return { preferences, updatePreference };
}

function createTheme(dark: boolean, preferences: AppPreferences) {
  const highContrast = preferences.highContrast;
  const textScale = preferences.textSize === 'extraLarge' ? 1.22 : preferences.textSize === 'large' ? 1.12 : 1;
  return {
    dark,
    textScale,
    colors: {
      background: dark ? (highContrast ? '#000000' : '#101214') : (highContrast ? '#ffffff' : '#f7f8fa'),
      surface: dark ? (highContrast ? '#080808' : '#181b1f') : '#ffffff',
      border: dark ? (highContrast ? '#f4f7fb' : '#2a3036') : (highContrast ? '#17202a' : '#d9dee5'),
      text: dark ? '#f4f7fb' : '#17202a',
      muted: dark ? (highContrast ? '#d7dee8' : '#a6b0bd') : (highContrast ? '#25313f' : '#5c6876'),
      primary: dark ? (highContrast ? '#b9d2ff' : '#8fb7ff') : (highContrast ? '#003ba8' : '#2458d3'),
      primaryText: dark ? '#08111f' : '#ffffff',
      danger: dark ? '#ff9c9c' : '#b42318',
      success: dark ? '#9dddb4' : '#087443',
      warning: dark ? '#ffd78a' : '#8a5a00',
      input: dark ? (highContrast ? '#000000' : '#121519') : '#ffffff',
    },
    spacing: {
      xs: 6,
      sm: 10,
      md: 16,
      lg: 22,
    },
  };
}
