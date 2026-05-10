import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { StatusBadge } from '@/src/components/StatusBadge';
import { Body, Heading, Title } from '@/src/components/Typography';
import { useAppTheme } from '@/src/components/theme';
import { APPLICATION_STATUSES, type ApplicationStatus, type JobApplication, type StatusHistory } from '@/src/types/application';
import type { ResumeVersion } from '@/src/types/resume';
import { changeApplicationStatus, deleteApplication, getApplication, getResumeVersion, listStatusHistory } from '@/src/db/database';
import { displayDate } from '@/src/utils/dates';

export function ApplicationDetailScreen({ id }: { id: string }) {
  const theme = useAppTheme();
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [resume, setResume] = useState<ResumeVersion | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);

  const load = useCallback(async () => {
    const app = await getApplication(id);
    setApplication(app ?? null);
    setHistory(await listStatusHistory(id));
    setResume(app?.resume_version_id ? await getResumeVersion(app.resume_version_id) : null);
  }, [id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const keywords = useMemo(() => {
    try {
      return application?.parsed_keywords ? JSON.parse(application.parsed_keywords) as string[] : [];
    } catch {
      return [];
    }
  }, [application?.parsed_keywords]);

  async function move(status: ApplicationStatus) {
    await changeApplicationStatus(id, status);
    await load();
  }

  function confirmDelete() {
    Alert.alert('Delete application', 'This removes the application, reminders, and status history from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void remove() },
    ]);
  }

  async function remove() {
    await deleteApplication(id);
    router.replace('/jobs');
  }

  if (!application) {
    return (
      <Screen>
        <Title>Application not found</Title>
        <Button onPress={() => router.replace('/jobs')}>Back to board</Button>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Title>{application.title}</Title>
          <Body muted>{application.company}</Body>
        </View>
        <StatusBadge status={application.status} />
      </View>

      <View style={styles.actions}>
        <Link href={`/application/${id}/edit`} asChild><Button>Edit</Button></Link>
        <Button variant="danger" onPress={confirmDelete}>Delete</Button>
      </View>

      <Card>
        <Heading>Change status</Heading>
        <View style={styles.wrap}>
          {APPLICATION_STATUSES.map((status) => (
            <Pressable key={status} onPress={() => void move(status)} style={[styles.choice, { borderColor: theme.colors.border, backgroundColor: application.status === status ? theme.colors.primary : theme.colors.surface }]}>
              <Body style={{ color: application.status === status ? theme.colors.primaryText : theme.colors.text }}>{status}</Body>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Heading>Details</Heading>
        <Detail label="Location" value={application.location} />
        <Detail label="Salary" value={application.salary_text} />
        <Detail label="Posting URL" value={application.posting_url} />
        <Detail label="Source" value={application.source_site} />
        <Detail label="Date saved" value={displayDate(application.date_saved)} />
        <Detail label="Date applied" value={displayDate(application.date_applied)} />
        <Detail label="Resume version" value={resume?.name} />
        <Detail label="Cover letter" value={application.cover_letter_version} />
      </Card>

      <Card>
        <Heading>Follow-up</Heading>
        <Body>{displayDate(application.follow_up_date)}</Body>
      </Card>

      <Card>
        <Heading>Parsed keywords</Heading>
        <Body muted>{keywords.length ? keywords.join(', ') : 'No keywords extracted yet.'}</Body>
      </Card>

      <Card>
        <Heading>Notes</Heading>
        <Body muted>{application.notes || 'No notes.'}</Body>
      </Card>

      <Card>
        <Heading>Status history</Heading>
        {history.length === 0 ? <Body muted>No status changes yet.</Body> : history.map((item) => (
          <Body key={item.id} muted>{item.old_status || 'Created'} → {item.new_status} on {displayDate(item.changed_at)}</Body>
        ))}
      </Card>

      {!!application.job_description && (
        <Card>
          <Heading>Job description</Heading>
          <Body muted>{application.job_description}</Body>
        </Card>
      )}
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <View>
      <Body muted>{label}</Body>
      <Body>{value || 'Not set'}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' },
  flex: { flex: 1, gap: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
});
