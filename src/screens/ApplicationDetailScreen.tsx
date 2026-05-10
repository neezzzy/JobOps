import { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { StatusBadge } from '@/src/components/StatusBadge';
import { Body, Heading, Title } from '@/src/components/Typography';
import { useAppTheme } from '@/src/components/theme';
import { APPLICATION_STATUSES, type ApplicationStatus, type JobApplication, type StatusHistory } from '@/src/types/application';
import type { ResumeVersion } from '@/src/types/resume';
import { changeApplicationStatus, deleteApplication, getApplication, getResumeVersion, listResumeVersions, listStatusHistory } from '@/src/db/database';
import { buildMatch, rankResumesForApplication, type ResumeMatch } from '@/src/services/resumeMatch';
import { displayDate } from '@/src/utils/dates';

export function ApplicationDetailScreen({ id }: { id: string }) {
  const theme = useAppTheme();
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [resume, setResume] = useState<ResumeVersion | null>(null);
  const [resumeMatches, setResumeMatches] = useState<ResumeMatch[]>([]);
  const [history, setHistory] = useState<StatusHistory[]>([]);

  const load = useCallback(async () => {
    const app = await getApplication(id);
    const allResumes = await listResumeVersions();
    setApplication(app ?? null);
    setHistory(await listStatusHistory(id));
    setResume(app?.resume_version_id ? await getResumeVersion(app.resume_version_id) : null);
    setResumeMatches(app ? rankResumesForApplication(app, allResumes) : []);
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

  async function openPosting() {
    if (!application?.posting_url) {
      Alert.alert('No posting link', 'Add the original job posting link first.');
      return;
    }
    if (!/^https?:\/\/\S+\.\S+/.test(application.posting_url)) {
      Alert.alert('Invalid link', 'The posting link needs to start with http or https.');
      return;
    }
    await Linking.openURL(application.posting_url);
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
        <Button variant="secondary" onPress={() => void openPosting()}>Open posting</Button>
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
        <Detail label="Work mode" value={application.work_mode} />
        <Detail label="Job posting link" value={application.posting_url} />
        <Detail label="Source" value={application.source_site} />
        <Detail label="Priority" value={application.priority} />
        <Detail label="Date saved" value={displayDate(application.date_saved)} />
        <Detail label="Date applied" value={displayDate(application.date_applied)} />
        <Detail label="Resume version" value={resume?.name} />
        <Detail label="Cover letter" value={application.cover_letter_version} />
      </Card>

      <Card>
        <Heading>Next action</Heading>
        <Body>{application.next_action_type || 'Follow up'}</Body>
        <Body muted>{displayDate(application.next_action_date ?? application.follow_up_date)}</Body>
      </Card>

      <Card>
        <Heading>Job highlights</Heading>
        <Body muted>{keywords.length ? keywords.join(', ') : 'No highlights found yet.'}</Body>
      </Card>

      <Card>
        <Heading>Resume fit</Heading>
        <ResumeFit current={resume ? buildMatch(application, resume, keywords) : null} best={resumeMatches[0]} />
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

function ResumeFit({ current, best }: { current: ResumeMatch | null; best?: ResumeMatch }) {
  const match = current ?? best;
  if (!match?.resume) return <Body muted>Add a resume version to see local keyword fit.</Body>;
  return (
    <View style={styles.fit}>
      <Body>{current ? `Current: ${match.resume.name}` : `Suggested: ${match.resume.name}`}</Body>
      <Body muted>{Math.round(match.score * 100)}% keyword fit</Body>
      <Body muted>Matched: {match.matched.length ? match.matched.join(', ') : 'None yet'}</Body>
      <Body muted>Missing: {match.missing.length ? match.missing.join(', ') : 'No obvious gaps'}</Body>
    </View>
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
  actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
  fit: { gap: 6 },
});
