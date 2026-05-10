import { View, StyleSheet } from 'react-native';
import { Button } from './Button';
import { addDaysIsoDate, todayIsoDate } from '@/src/utils/dates';

type Props = {
  onPick: (date: string) => void;
};

export function DatePresets({ onPick }: Props) {
  return (
    <View style={styles.row}>
      <Button variant="secondary" onPress={() => onPick(todayIsoDate())}>Today</Button>
      <Button variant="secondary" onPress={() => onPick(addDaysIsoDate(1))}>Tomorrow</Button>
      <Button variant="secondary" onPress={() => onPick(addDaysIsoDate(3))}>3 days</Button>
      <Button variant="secondary" onPress={() => onPick(addDaysIsoDate(7))}>1 week</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
