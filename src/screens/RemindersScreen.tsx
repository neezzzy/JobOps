import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { FormField } from '@/src/components/FormField';
import { Screen } from '@/src/components/Screen';
import { Body, Heading, Title } from '@/src/components/Typography';
import { listReminders, setReminderCompleted, updateReminderDate } from '@/src/db/database';
import type { Reminder } from '@/src/types/application';
import { displayDate } from '@/src/utils/dates';

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
      {reminders.length === 0 ? <EmptyState text="No follow-up reminders." /> : reminders.map((reminder) => (
        <Card key={reminder.id}>
          <Heading>{reminder.title}</Heading>
          <Body muted>{reminder.job_title || 'Application'} • {displayDate(reminder.reminder_date)}</Body>
          <Body muted>{reminder.completed ? 'Completed' : 'Open'}</Body>
          <FormField label="Follow-up date (YYYY-MM-DD)" value={dates[reminder.id] ?? ''} onChangeText={(value) => setDates((current) => ({ ...current, [reminder.id]: value }))} />
          <View style={styles.actions}>
            <Button variant="secondary" onPress={() => void saveDate(reminder.id)}>Save date</Button>
            <Button onPress={() => void setReminderCompleted(reminder.id, !reminder.completed).then(load)}>
              {reminder.completed ? 'Reopen' : 'Complete'}
            </Button>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
});
