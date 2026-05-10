import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useAppTheme } from './theme';

type Props = PropsWithChildren<Omit<PressableProps, 'style'> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'quiet';
  style?: StyleProp<ViewStyle>;
}>;

export function Button({ children, variant = 'primary', style, disabled, ...props }: Props) {
  const theme = useAppTheme();
  const background =
    variant === 'primary' ? theme.colors.primary :
    variant === 'danger' ? theme.colors.danger :
    variant === 'quiet' ? 'transparent' :
    theme.colors.surface;
  const color = variant === 'primary' ? theme.colors.primaryText : variant === 'danger' ? '#ffffff' : theme.colors.text;

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, borderColor: theme.colors.border, opacity: disabled ? 0.45 : pressed ? 0.7 : 1 },
        variant === 'quiet' && styles.quiet,
        style,
      ]}
      {...props}>
      <Text style={[styles.text, { color }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quiet: { borderWidth: 0, paddingHorizontal: 6 },
  text: { fontSize: 16, fontWeight: '700', letterSpacing: 0 },
});
