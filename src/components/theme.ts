import { useColorScheme } from 'react-native';

export type AppTheme = ReturnType<typeof useAppTheme>;

export function useAppTheme() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  return {
    dark,
    colors: {
      background: dark ? '#101214' : '#f7f8fa',
      surface: dark ? '#181b1f' : '#ffffff',
      border: dark ? '#2a3036' : '#d9dee5',
      text: dark ? '#f4f7fb' : '#17202a',
      muted: dark ? '#a6b0bd' : '#5c6876',
      primary: dark ? '#8fb7ff' : '#2458d3',
      primaryText: dark ? '#08111f' : '#ffffff',
      danger: dark ? '#ff9c9c' : '#b42318',
      success: dark ? '#9dddb4' : '#087443',
      warning: dark ? '#ffd78a' : '#8a5a00',
      input: dark ? '#121519' : '#ffffff',
    },
    spacing: {
      xs: 6,
      sm: 10,
      md: 16,
      lg: 22,
    },
  };
}
