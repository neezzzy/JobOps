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
  const [sourceFilter, setSourceFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'Remote' | 'Hybrid' | 'On-site' | 'has-follow-up' | 'missing-resume' | 'stale'>('all');
  const [sortMode, setSortMode] = useState<'newest' | 'follow-up' | 'updated' | 'company' | 'status'>('newest');

  const load = useCallback(async () => setApplications(await listApplications()), []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    const source = sourceFilter.toLowerCase().trim();
    const company = companyFilter.toLowerCase().trim();
    const rows = applications.filter((item) => {
      if (needle && ![item.title, item.company, item.location, item.source_site, item.work_mode].some((value) => value?.toLowerCase().includes(needle))) return false;
      if (source && !item.source_site?.toLowerCase().includes(source)) return false;
      if (company && !item.company.toLowerCase().includes(company)) return false;
      if (quickFilter === 'has-follow-up' && !(item.next_action_date ?? item.follow_up_date)) return false;
      if (quickFilter === 'missing-resume' && item.resume_version_id) return false;
      if (quickFilter === 'stale' && daysSince(item.updated_at) < 14) return false;
      if (['Remote', 'Hybrid', 'On-site'].includes(quickFilter) && item.work_mode !== quickFilter && item.location !== quickFilter) return false;
      return true;
    });
    return rows.sort((a, b) => {
      if (sortMode === 'follow-up') return (a.next_action_date ?? a.follow_up_date ?? '9999').localeCompare(b.next_action_date ?? b.follow_up_date ?? '9999');
      if (sortMode === 'updated') return b.updated_at.localeCompare(a.updated_at);
      if (sortMode === 'company') return a.company.localeCompare(b.company);
      if (sortMode === 'status') return APPLICATION_STATUSES.indexOf(a.status) - APPLICATION_STATUSES.indexOf(b.status);
      return b.date_saved.localeCompare(a.date_saved);
    });
  }, [applications, companyFilter, query, quickFilter, sortMode, sourceFilter]);

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
      <View style={styles.filterGrid}>
        <FormField label="Company" value={companyFilter} onChangeText={setCompanyFilter} />
        <FormField label="Source" value={sourceFilter} onChangeText={setSourceFilter} />
      </View>
      <Heading>Quick filters</Heading>
      <View style={styles.moves}>
        {(['all', 'Remote', 'Hybrid', 'On-site', 'has-follow-up', 'missing-resume', 'stale'] as const).map((filter) => (
          <Pressable key={filter} onPress={() => setQuickFilter(filter)} style={[styles.moveButton, { borderColor: theme.colors.border, backgroundColor: quickFilter === filter ? theme.colors.primary : theme.colors.surface }]}>
            <Body style={{ color: quickFilter === filter ? theme.colors.primaryText : theme.colors.text }}>{filterLabel(filter)}</Body>
          </Pressable>
        ))}
      </View>
      <Heading>Sort</Heading>
      <View style={styles.moves}>
        {(['newest', 'follow-up', 'updated', 'company', 'status'] as const).map((mode) => (
          <Pressable key={mode} onPress={() => setSortMode(mode)} style={[styles.moveButton, { borderColor: theme.colors.border, backgroundColor: sortMode === mode ? theme.colors.primary : theme.colors.surface }]}>
            <Body style={{ color: sortMode === mode ? theme.colors.primaryText : theme.colors.text }}>{sortLabel(mode)}</Body>
          </Pressable>
        ))}
      </View>

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
                        <Body muted>{item.work_mode ?? item.location ?? 'Location not set'} • next {displayDate(item.next_action_date ?? item.follow_up_date)}</Body>
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

function daysSince(value?: string | null) {
  if (!value) return 0;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

function filterLabel(value: string) {
  if (value === 'all') return 'All';
  if (value === 'has-follow-up') return 'Has next step';
  if (value === 'missing-resume') return 'Missing resume';
  if (value === 'stale') return 'Stale';
  return value;
}

function sortLabel(value: string) {
  if (value === 'newest') return 'Newest saved';
  if (value === 'follow-up') return 'Next action';
  if (value === 'updated') return 'Last updated';
  if (value === 'company') return 'Company';
  return 'Status';
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  group: { gap: 10 },
  cardHead: { flexDirection: 'row', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' },
  filterGrid: { gap: 10 },
  flex: { flex: 1, gap: 4 },
  moves: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moveButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
});
