import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Link, useFocusEffect, type Href } from 'expo-router';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { Screen } from '@/src/components/Screen';
import { Body, Heading, Title } from '@/src/components/Typography';
import { useAppTheme } from '@/src/components/theme';
import { APPLICATION_STATUSES, type JobApplication, type Reminder } from '@/src/types/application';
import { displayDate } from '@/src/utils/dates';
import { changeApplicationStatus, listApplications, listReminders, setReminderCompleted } from '@/src/db/database';
import { buildRecommendations, type Recommendation } from '@/src/services/recommendations';
import { buildInsights, statusBreakdown, type InsightRow } from '@/src/services/insights';

export function DashboardScreen() {
  const theme = useAppTheme();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [reminders, setReminders] = useState<(Reminder & { company?: string; job_title?: string })[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [insights, setInsights] = useState<InsightRow[]>([]);

  const load = useCallback(async () => {
    const nextApplications = await listApplications();
    const allReminders = await listReminders(true);
    const nextReminders = allReminders.filter((item) => !item.completed);
    setApplications(nextApplications);
    setReminders(nextReminders.slice(0, 5));
    setRecommendations(buildRecommendations(nextApplications, nextReminders));
    setInsights(buildInsights(nextApplications, allReminders));
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

      <Heading>Today</Heading>
      {recommendations.length === 0 ? (
        <EmptyState text="Nothing urgent today. Add a job or review the board when you are ready." />
      ) : recommendations.map((item) => (
        <Card key={item.id} style={[styles.recommendation, { borderLeftColor: priorityColor(item.priority, theme.colors.danger, theme.colors.warning, theme.colors.primary) }]}>
          <Link href={item.href as Href} asChild>
            <Pressable>
              <Body>{item.title}</Body>
              <Body muted>{item.detail}</Body>
            </Pressable>
          </Link>
          <View style={styles.actions}>
            <Link href={item.href as Href} asChild>
              <Button variant="secondary">Open</Button>
            </Link>
          </View>
        </Card>
      ))}

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

      <Heading>Upcoming follow-ups</Heading>
      {reminders.length === 0 ? <EmptyState text="No open follow-ups." /> : reminders.map((reminder) => (
        <Card key={reminder.id}>
          <Link href={reminder.application_id ? `/application/${reminder.application_id}` : '/reminders'} asChild>
            <Pressable>
              <Body>{reminder.title}</Body>
              <Body muted>{displayDate(reminder.reminder_date)}</Body>
            </Pressable>
          </Link>
          <View style={styles.actions}>
            <Button variant="secondary" onPress={() => void setReminderCompleted(reminder.id, true).then(load)}>Complete</Button>
            <Link href={reminder.application_id ? `/application/${reminder.application_id}/edit` : '/reminders'} asChild>
              <Button variant="secondary">Set date</Button>
            </Link>
          </View>
        </Card>
      ))}

      <Heading>Recently added</Heading>
      {applications.slice(0, 5).length === 0 ? <EmptyState text="No jobs yet. Add an application to start tracking." /> : applications.slice(0, 5).map((item) => (
        <Link key={item.id} href={`/application/${item.id}`} asChild>
          <Pressable>
            <Card>
              <Body>{item.title}</Body>
              <Body muted>{item.company} • {item.status}</Body>
              <View style={styles.actions}>
                {item.status === 'Saved' && <Button variant="secondary" onPress={() => void changeApplicationStatus(item.id, 'Applied').then(load)}>Applied</Button>}
                <Link href={`/application/${item.id}`} asChild><Button variant="secondary">Open</Button></Link>
              </View>
            </Card>
          </Pressable>
        </Link>
      ))}

      <Heading>Insights</Heading>
      <View style={styles.grid}>
        {insights.slice(0, 6).map((item) => (
          <Card key={item.label} style={styles.insight}>
            <Body muted>{item.label}</Body>
            <Heading>{item.value}</Heading>
            {!!item.detail && <Body muted>{item.detail}</Body>}
          </Card>
        ))}
      </View>
      <Heading>Status mix</Heading>
      {statusBreakdown(applications).map((item) => (
        <View key={item.status} style={styles.breakdown}>
          <Body>{item.status}</Body>
          <Body muted>{item.count}</Body>
        </View>
      ))}
    </Screen>
  );
}

function priorityColor(priority: Recommendation['priority'], high: string, medium: string, low: string) {
  return priority === 'high' ? high : priority === 'medium' ? medium : low;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  summaryCard: { minHeight: 110, justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statusCard: { flexGrow: 1, flexBasis: 112, maxWidth: 220 },
  recommendation: { borderLeftWidth: 4 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  insight: { flexGrow: 1, flexBasis: 140 },
  breakdown: { flexDirection: 'row', justifyContent: 'space-between' },
});
