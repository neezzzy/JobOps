import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { Screen } from '@/src/components/Screen';
import { Body, Heading, Title } from '@/src/components/Typography';
import { APPLICATION_STATUSES, type JobApplication, type Reminder } from '@/src/types/application';
import { displayDate } from '@/src/utils/dates';
import { listApplications, listReminders } from '@/src/db/database';

export function DashboardScreen() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [reminders, setReminders] = useState<(Reminder & { company?: string; job_title?: string })[]>([]);

  const load = useCallback(async () => {
    setApplications(await listApplications());
    setReminders((await listReminders(false)).slice(0, 5));
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Title>JobOps</Title>
          <Body muted>Application operations tracker</Body>
        </View>
        <Link href="/application/new" asChild>
          <Button>New job</Button>
        </Link>
      </View>

      <Card>
        <Body muted>Total applications</Body>
        <Title>{applications.length}</Title>
      </Card>

      <View style={styles.grid}>
        {APPLICATION_STATUSES.map((status) => (
          <Card key={status} style={styles.statusCard}>
            <Body muted>{status}</Body>
            <Heading>{applications.filter((item) => item.status === status).length}</Heading>
          </Card>
        ))}
      </View>

      <Heading>Upcoming follow-ups</Heading>
      {reminders.length === 0 ? <EmptyState text="No open follow-ups." /> : reminders.map((reminder) => (
        <Card key={reminder.id}>
          <Body>{reminder.title}</Body>
          <Body muted>{displayDate(reminder.reminder_date)}</Body>
        </Card>
      ))}

      <Heading>Recently added</Heading>
      {applications.slice(0, 5).length === 0 ? <EmptyState text="No jobs yet. Add an application to start tracking." /> : applications.slice(0, 5).map((item) => (
        <Link key={item.id} href={`/application/${item.id}`} asChild>
          <Pressable>
            <Card>
              <Body>{item.title}</Body>
              <Body muted>{item.company} • {item.status}</Body>
            </Card>
          </Pressable>
        </Link>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusCard: { width: '31%', minWidth: 96 },
});
