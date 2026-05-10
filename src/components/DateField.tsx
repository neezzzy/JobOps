import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { isIsoDate, todayIsoDate } from '@/src/utils/dates';
import { Body, Heading } from './Typography';
import { useAppTheme } from './theme';

type Props = {
  label: string;
  value?: string | null;
  error?: string;
  onChangeText: (value: string) => void;
  style?: StyleProp<ViewStyle>;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DateField({ label, value, error, style, onChangeText }: Props) {
  const theme = useAppTheme();
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(value || todayIsoDate()));
  const dates = useMemo(() => buildCalendarDates(visibleMonth), [visibleMonth]);

  function chooseDate(date: Date) {
    onChangeText(toIsoDate(date));
    setVisibleMonth(monthStart(date));
    setOpen(false);
  }

  function openPicker() {
    setVisibleMonth(monthStart(value || todayIsoDate()));
    setOpen(true);
  }

  return (
    <View style={styles.wrap}>
      <Body muted>{label}</Body>
      <Pressable
        accessibilityLabel={`Pick ${label}`}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.pickerField,
          { backgroundColor: theme.colors.input, borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
          style,
        ]}>
        <Body style={{ color: value ? theme.colors.text : theme.colors.muted }}>
          {value || 'Select date'}
        </Body>
        <View style={styles.iconButton}>
          <Ionicons name="calendar-outline" size={21} color={theme.colors.text} />
        </View>
      </Pressable>
      {!!error && <Body style={{ color: theme.colors.danger }}>{error}</Body>}

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.scrim} onPress={() => setOpen(false)}>
          <Pressable style={[styles.modal, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.header}>
              <Pressable
                accessibilityLabel="Previous month"
                onPress={() => setVisibleMonth(addMonths(visibleMonth, -1))}
                style={({ pressed }) => [styles.navButton, { opacity: pressed ? 0.7 : 1 }]}>
                <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
              </Pressable>
              <Heading>{monthLabel(visibleMonth)}</Heading>
              <Pressable
                accessibilityLabel="Next month"
                onPress={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                style={({ pressed }) => [styles.navButton, { opacity: pressed ? 0.7 : 1 }]}>
                <Ionicons name="chevron-forward" size={22} color={theme.colors.text} />
              </Pressable>
            </View>
            <View style={styles.grid}>
              {WEEKDAYS.map((day) => (
                <Body key={day} muted style={styles.weekday}>{day}</Body>
              ))}
              {dates.map((date) => {
                const iso = toIsoDate(date);
                const selected = value === iso;
                const inMonth = date.getMonth() === visibleMonth.getMonth();
                return (
                  <Pressable
                    key={iso}
                    accessibilityLabel={`Select ${iso}`}
                    onPress={() => chooseDate(date)}
                    style={({ pressed }) => [
                      styles.day,
                      {
                        backgroundColor: selected ? theme.colors.primary : 'transparent',
                        opacity: pressed ? 0.7 : inMonth ? 1 : 0.35,
                      },
                    ]}>
                    <Body style={[styles.dayText, { color: selected ? theme.colors.primaryText : theme.colors.text }]}>
                      {date.getDate()}
                    </Body>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.footer}>
              <Pressable
                onPress={() => chooseDate(new Date())}
                style={({ pressed }) => [styles.footerButton, { borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 }]}>
                <Body>Today</Body>
              </Pressable>
              {!!value && (
                <Pressable
                  onPress={() => {
                    onChangeText('');
                    setOpen(false);
                  }}
                  style={({ pressed }) => [styles.footerButton, { borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 }]}>
                  <Body>Clear</Body>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function monthStart(value: string | Date) {
  const date = value instanceof Date ? value : isIsoDate(value) ? fromIsoDate(value) : new Date();
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function buildCalendarDates(month: Date) {
  const first = monthStart(month);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function fromIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  pickerField: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  iconButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  navButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', paddingVertical: 6 },
  day: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayText: { textAlign: 'center' },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  footerButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
});
