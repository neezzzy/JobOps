import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useAppTheme } from './theme';

export function Title({ children, style, ...props }: PropsWithChildren<TextProps>) {
  const theme = useAppTheme();
  return <Text style={[styles.title, { color: theme.colors.text, fontSize: 30 * theme.textScale, lineHeight: 36 * theme.textScale }, style]} {...props}>{children}</Text>;
}

export function Heading({ children, style, ...props }: PropsWithChildren<TextProps>) {
  const theme = useAppTheme();
  return <Text style={[styles.heading, { color: theme.colors.text, fontSize: 20 * theme.textScale, lineHeight: 26 * theme.textScale }, style]} {...props}>{children}</Text>;
}

export function Body({ children, style, muted, ...props }: PropsWithChildren<TextProps & { muted?: boolean }>) {
  const theme = useAppTheme();
  return <Text style={[styles.body, { color: muted ? theme.colors.muted : theme.colors.text, fontSize: 16 * theme.textScale, lineHeight: 22 * theme.textScale }, style]} {...props}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: { fontWeight: '700', letterSpacing: 0 },
  heading: { fontWeight: '700', letterSpacing: 0 },
  body: { letterSpacing: 0 },
});
