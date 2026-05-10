import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { DateField } from '@/src/components/DateField';
import { EmptyState } from '@/src/components/EmptyState';
import { Screen } from '@/src/components/Screen';
import { Body, Heading, Title } from '@/src/components/Typography';
import { listReminders, setReminderCompleted, updateReminderDate } from '@/src/db/database';
import type { Reminder } from '@/src/types/application';
import { addDaysIsoDate, displayDate, todayIsoDate } from '@/src/utils/dates';

type ReminderRow = Reminder & { company?: string; job_title?: string };

export function RemindersScreen() {
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [dates, setDates] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    const rows = await listReminders(true);
    setReminders(rows);
    setDates(Object.fromEntries(rows.map((row) => [row.id, row.reminder_date])));
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function saveDate(id: string) {
    const date = dates[id]?.trim();
    if (!date) {
      Alert.alert('Missing date', 'Enter a follow-up date as YYYY-MM-DD.');
      return;
    }
    await updateReminderDate(id, date);
    await load();
  }

  return (
    <Screen>
      <Title>Reminders</Title>
      {reminders.length === 0 ? <EmptyState text="No follow-up reminders." /> : grouped(reminders).map((section) => (
        <View key={section.title} style={styles.section}>
          <Heading>{section.title}</Heading>
          {section.rows.length === 0 ? <EmptyState text={`No ${section.title.toLowerCase()} reminders.`} /> : section.rows.map((reminder) => (
        <Card key={reminder.id}>
          <Heading>{reminder.title}</Heading>
          <Body muted>{reminder.job_title || 'Application'} • {displayDate(reminder.reminder_date)}</Body>
          <Body muted>{reminder.completed ? 'Completed' : 'Open'}</Body>
          <DateField label="Follow-up date" value={dates[reminder.id] ?? ''} onChangeText={(value) => setDates((current) => ({ ...current, [reminder.id]: value }))} />
          <View style={styles.actions}>
            <Button variant="secondary" onPress={() => void saveDate(reminder.id)}>Save date</Button>
            <Button variant="secondary" onPress={() => void snooze(reminder.id, 1)}>Tomorrow</Button>
            <Button variant="secondary" onPress={() => void snooze(reminder.id, 3)}>3 days</Button>
            <Button variant="secondary" onPress={() => void snooze(reminder.id, 7)}>1 week</Button>
            <Button onPress={() => void setReminderCompleted(reminder.id, !reminder.completed).then(load)}>
              {reminder.completed ? 'Reopen' : 'Complete'}
            </Button>
          </View>
        </Card>
          ))}
        </View>
      ))}
    </Screen>
  );

  async function snooze(id: string, days: number) {
    await updateReminderDate(id, addDaysIsoDate(days));
    await load();
  }
}

function grouped(reminders: ReminderRow[]) {
  const today = todayIsoDate();
  return [
    { title: 'Overdue', rows: reminders.filter((item) => !item.completed && item.reminder_date < today) },
    { title: 'Today', rows: reminders.filter((item) => !item.completed && item.reminder_date === today) },
    { title: 'Upcoming', rows: reminders.filter((item) => !item.completed && item.reminder_date > today) },
    { title: 'Completed', rows: reminders.filter((item) => item.completed) },
  ];
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  section: { gap: 10 },
});
