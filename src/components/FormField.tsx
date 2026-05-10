import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Body } from './Typography';
import { useAppTheme } from './theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function FormField({ label, error, style, multiline, ...props }: Props) {
  const theme = useAppTheme();
  return (
    <View style={styles.wrap}>
      <Body muted>{label}</Body>
      <TextInput
        placeholderTextColor={theme.colors.muted}
        style={[
          styles.input,
          multiline && styles.multiline,
          { backgroundColor: theme.colors.input, borderColor: theme.colors.border, color: theme.colors.text, fontSize: 16 * theme.textScale, lineHeight: 22 * theme.textScale },
          style,
        ]}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
      />
      {!!error && <Body style={{ color: theme.colors.danger }}>{error}</Body>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    letterSpacing: 0,
  },
  multiline: { minHeight: 110 },
});
