import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useAppTheme } from './theme';

export function Title({ children, style, ...props }: PropsWithChildren<TextProps>) {
  const theme = useAppTheme();
  return <Text style={[styles.title, { color: theme.colors.text }, style]} {...props}>{children}</Text>;
}

export function Heading({ children, style, ...props }: PropsWithChildren<TextProps>) {
  const theme = useAppTheme();
  return <Text style={[styles.heading, { color: theme.colors.text }, style]} {...props}>{children}</Text>;
}

export function Body({ children, style, muted, ...props }: PropsWithChildren<TextProps & { muted?: boolean }>) {
  const theme = useAppTheme();
  return <Text style={[styles.body, { color: muted ? theme.colors.muted : theme.colors.text }, style]} {...props}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '700', letterSpacing: 0 },
  heading: { fontSize: 20, fontWeight: '700', letterSpacing: 0 },
  body: { fontSize: 16, lineHeight: 22, letterSpacing: 0 },
});
