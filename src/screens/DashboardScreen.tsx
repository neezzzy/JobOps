import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Link, useFocusEffect, type Href } from 'expo-router';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { Screen } from '@/src/components/Screen';
import { Body, Heading, Title } from '@/src/components/Typography';
import { APPLICATION_STATUSES, type JobApplication, type Reminder } from '@/src/types/application';
import { displayDate } from '@/src/utils/dates';
import { listApplications, listReminders } from '@/src/db/database';
import { buildRecommendations, type Recommendation } from '@/src/services/recommendations';

export function DashboardScreen() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [reminders, setReminders] = useState<(Reminder & { company?: string; job_title?: string })[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const load = useCallback(async () => {
    const nextApplications = await listApplications();
    const nextReminders = await listReminders(false);
    setApplications(nextApplications);
    setReminders(nextReminders.slice(0, 5));
    setRecommendations(buildRecommendations(nextApplications, nextReminders));
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

      <Link href="/jobs" asChild>
        <Pressable>
          <Card style={styles.summaryCard}>
            <Body muted>Total applications</Body>
            <Title>{applications.length}</Title>
            <Body muted>Open job board</Body>
          </Card>
        </Pressable>
      </Link>

      <View style={styles.grid}>
        {APPLICATION_STATUSES.map((status) => {
          const count = applications.filter((item) => item.status === status).length;
          return (
            <Link key={status} href={`/jobs?status=${encodeURIComponent(status)}`} asChild>
              <Pressable style={styles.statusCard}>
                <Card>
                  <Body muted>{status}</Body>
                  <Heading>{count}</Heading>
                </Card>
              </Pressable>
            </Link>
          );
        })}
      </View>

      <Heading>Recommendations</Heading>
      {recommendations.length === 0 ? <EmptyState text="No recommendations right now." /> : recommendations.map((item) => (
        <Link key={item.id} href={item.href as Href} asChild>
          <Pressable>
            <Card style={styles.recommendation}>
              <Body>{item.title}</Body>
              <Body muted>{item.detail}</Body>
            </Card>
          </Pressable>
        </Link>
      ))}

      <Heading>Upcoming follow-ups</Heading>
      {reminders.length === 0 ? <EmptyState text="No open follow-ups." /> : reminders.map((reminder) => (
        <Link key={reminder.id} href={reminder.application_id ? `/application/${reminder.application_id}` : '/reminders'} asChild>
          <Pressable>
            <Card>
              <Body>{reminder.title}</Body>
              <Body muted>{displayDate(reminder.reminder_date)}</Body>
            </Card>
          </Pressable>
        </Link>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  summaryCard: { minHeight: 110, justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusCard: { flexGrow: 1, flexBasis: 112, maxWidth: 220 },
  recommendation: { borderLeftWidth: 4 },
});
