import { StyleSheet, Text, View } from 'react-native';
import type { ApplicationStatus } from '@/src/types/application';

const COLORS: Record<ApplicationStatus, { bg: string; fg: string }> = {
  Saved: { bg: '#e8edf7', fg: '#25406d' },
  Applied: { bg: '#e7f0ff', fg: '#174ea6' },
  Interview: { bg: '#fff2cc', fg: '#7a5200' },
  Rejected: { bg: '#fde8e8', fg: '#9b1c1c' },
  Offer: { bg: '#def7ec', fg: '#046c4e' },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const colors = COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.fg }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  text: { fontSize: 13, fontWeight: '700', letterSpacing: 0 },
});
