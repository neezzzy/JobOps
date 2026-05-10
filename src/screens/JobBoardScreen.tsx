import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Link, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { FormField } from '@/src/components/FormField';
import { Screen } from '@/src/components/Screen';
import { StatusBadge } from '@/src/components/StatusBadge';
import { Body, Heading, Title } from '@/src/components/Typography';
import { useAppTheme } from '@/src/components/theme';
import { changeApplicationStatus, listApplications } from '@/src/db/database';
import { APPLICATION_STATUSES, type ApplicationStatus, type JobApplication } from '@/src/types/application';
import { displayDate } from '@/src/utils/dates';

export function JobBoardScreen() {
  const theme = useAppTheme();
  const { status } = useLocalSearchParams<{ status?: ApplicationStatus }>();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => setApplications(await listApplications()), []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    if (!needle) return applications;
    return applications.filter((item) => [item.title, item.company, item.location, item.source_site].some((value) => value?.toLowerCase().includes(needle)));
  }, [applications, query]);

  async function move(id: string, status: ApplicationStatus) {
    await changeApplicationStatus(id, status);
    await load();
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Job Board</Title>
        <Link href="/application/new" asChild><Button>New</Button></Link>
      </View>
      <FormField label="Search" value={query} onChangeText={setQuery} placeholder="Title, company, location, source" />

      {APPLICATION_STATUSES.filter((item) => !status || item === status).map((statusName) => {
        const rows = filtered.filter((item) => item.status === statusName);
        return (
          <View key={statusName} style={styles.group}>
            <Heading>{statusName} ({rows.length})</Heading>
            {status && (
              <Link href="/jobs" asChild>
                <Button variant="secondary">Show all statuses</Button>
              </Link>
            )}
            {rows.length === 0 ? <EmptyState text={`No ${statusName.toLowerCase()} applications.`} /> : rows.map((item) => (
              <Card key={item.id}>
                <Link href={`/application/${item.id}`} asChild>
                  <Pressable>
                    <View style={styles.cardHead}>
                      <View style={styles.flex}>
                        <Body>{item.title}</Body>
                        <Body muted>{item.company} • saved {displayDate(item.date_saved)}</Body>
                      </View>
                      <StatusBadge status={item.status} />
                    </View>
                  </Pressable>
                </Link>
                <View style={styles.moves}>
                  {APPLICATION_STATUSES.filter((next) => next !== item.status).map((next) => (
                    <Pressable key={next} onPress={() => void move(item.id, next)} style={[styles.moveButton, { borderColor: theme.colors.border }]}>
                      <Body muted>{next}</Body>
                    </Pressable>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  group: { gap: 10 },
  cardHead: { flexDirection: 'row', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' },
  flex: { flex: 1, gap: 4 },
  moves: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moveButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
});
