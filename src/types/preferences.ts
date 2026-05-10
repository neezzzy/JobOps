export type ThemeMode = 'system' | 'light' | 'dark';
export type TextSize = 'normal' | 'large' | 'extraLarge';

export type AppPreferences = {
  themeMode: ThemeMode;
  textSize: TextSize;
  highContrast: boolean;
};

export const defaultPreferences: AppPreferences = {
  themeMode: 'system',
  textSize: 'normal',
  highContrast: false,
};
