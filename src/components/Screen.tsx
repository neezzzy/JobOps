import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from './theme';

type Props = PropsWithChildren<{
  scroll?: boolean;
}>;

export function Screen({ children, scroll = true }: Props) {
  const theme = useAppTheme();
  const content = <View style={[styles.content, { backgroundColor: theme.colors.background }]}>{children}</View>;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['left', 'right']}>
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: { flex: 1, width: '100%', maxWidth: 960, alignSelf: 'center', padding: 16, gap: 14 },
});
