import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { Screen } from '@/src/components/Screen';
import { Body, Heading, Title } from '@/src/components/Typography';
import { deleteResumeVersion, listResumeVersions } from '@/src/db/database';
import type { ResumeVersion } from '@/src/types/resume';
import { displayDate } from '@/src/utils/dates';

export function ResumeVersionsScreen() {
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const load = useCallback(async () => setResumes(await listResumeVersions()), []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  function confirmDelete(id: string) {
    Alert.alert('Delete resume version', 'Applications using this version will keep the application but lose the resume link.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void remove(id) },
    ]);
  }

  async function remove(id: string) {
    await deleteResumeVersion(id);
    await load();
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Resume Versions</Title>
        <Link href="/resume/new" asChild><Button>New</Button></Link>
      </View>
      {resumes.length === 0 ? <EmptyState text="No resume versions yet." /> : resumes.map((resume) => (
        <Card key={resume.id}>
          <Heading>{resume.name}</Heading>
          <Body muted>{resume.target_role || 'No target role'} • {displayDate(resume.created_at)}</Body>
          {!!resume.file_name && <Body>{resume.file_name}</Body>}
          {!!resume.notes && <Body muted>{resume.notes}</Body>}
          <View style={styles.actions}>
            <Link href={`/resume/${resume.id}`} asChild><Button variant="secondary">Edit</Button></Link>
            <Button variant="danger" onPress={() => confirmDelete(resume.id)}>Delete</Button>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 10 },
});
