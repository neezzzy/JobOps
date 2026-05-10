import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { FormField } from '@/src/components/FormField';
import { Screen } from '@/src/components/Screen';
import { Body, Heading, Title } from '@/src/components/Typography';
import { useAppTheme } from '@/src/components/theme';
import { createApplication, getApplication, listResumeVersions, updateApplication } from '@/src/db/database';
import { parseJobDescription } from '@/src/services/jobParser';
import { APPLICATION_STATUSES, type ApplicationInput, type ApplicationStatus, type JobApplication } from '@/src/types/application';
import type { ResumeVersion } from '@/src/types/resume';
import { todayIsoDate } from '@/src/utils/dates';

type Props = { id?: string };

export function ApplicationFormScreen({ id }: Props) {
  const theme = useAppTheme();
  const editing = id && id !== 'new';
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [form, setForm] = useState<ApplicationInput>({
    title: '',
    company: '',
    location: '',
    salary_min: null,
    salary_max: null,
    salary_text: '',
    posting_url: '',
    source_site: '',
    status: 'Saved',
    date_saved: todayIsoDate(),
    date_applied: '',
    resume_version_id: null,
    cover_letter_version: '',
    follow_up_date: '',
    notes: '',
    job_description: '',
    parsed_keywords: '',
  });

  const parsedKeywords = useMemo(() => {
    try {
      return form.parsed_keywords ? JSON.parse(form.parsed_keywords) as string[] : [];
    } catch {
      return [];
    }
  }, [form.parsed_keywords]);

  const load = useCallback(async () => {
    setResumes(await listResumeVersions());
    if (editing) {
      const existing = await getApplication(id);
      if (existing) setForm(toInput(existing));
    }
  }, [editing, id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  function setField<K extends keyof ApplicationInput>(key: K, value: ApplicationInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function runParser() {
    const parsed = parseJobDescription(form.job_description ?? '');
    setForm((current) => ({
      ...current,
      parsed_keywords: JSON.stringify(parsed.keywords),
      salary_text: current.salary_text || parsed.possibleSalaryText || '',
      location: current.location || parsed.workMode || '',
      notes: current.notes || parsed.topRequirements.join('\n'),
    }));
  }

  async function save() {
    if (!form.title.trim() || !form.company.trim()) {
      Alert.alert('Missing details', 'Job title and company are required.');
      return;
    }
    const clean = normalize(form);
    if (editing) {
      await updateApplication(id, clean);
      router.replace(`/application/${id}`);
    } else {
      const newId = await createApplication(clean);
      router.replace(`/application/${newId}`);
    }
  }

  return (
    <Screen>
      <Title>{editing ? 'Edit Application' : 'Add Application'}</Title>
      <Card>
        <FormField label="Job title" value={form.title} onChangeText={(value) => setField('title', value)} />
        <FormField label="Company" value={form.company} onChangeText={(value) => setField('company', value)} />
        <FormField label="Location" value={form.location ?? ''} onChangeText={(value) => setField('location', value)} />
        <FormField label="Salary range" value={form.salary_text ?? ''} onChangeText={(value) => setField('salary_text', value)} placeholder="$90k-$120k" />
        <FormField label="Job posting link" value={form.posting_url ?? ''} onChangeText={(value) => setField('posting_url', value)} autoCapitalize="none" />
        <FormField label="Source site" value={form.source_site ?? ''} onChangeText={(value) => setField('source_site', value)} />
      </Card>

      <Card>
        <Heading>Status</Heading>
        <View style={styles.wrap}>
          {APPLICATION_STATUSES.map((status) => (
            <Pressable key={status} onPress={() => setField('status', status)} style={[styles.choice, { borderColor: theme.colors.border, backgroundColor: form.status === status ? theme.colors.primary : theme.colors.surface }]}>
              <Body style={{ color: form.status === status ? theme.colors.primaryText : theme.colors.text }}>{status}</Body>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Heading>Dates and versions</Heading>
        <FormField label="Date saved (YYYY-MM-DD)" value={form.date_saved} onChangeText={(value) => setField('date_saved', value)} />
        <FormField label="Date applied (YYYY-MM-DD)" value={form.date_applied ?? ''} onChangeText={(value) => setField('date_applied', value)} />
        <FormField label="Follow-up date (YYYY-MM-DD)" value={form.follow_up_date ?? ''} onChangeText={(value) => setField('follow_up_date', value)} />
        <FormField label="Cover letter version" value={form.cover_letter_version ?? ''} onChangeText={(value) => setField('cover_letter_version', value)} />
        <Heading>Resume version</Heading>
        <View style={styles.wrap}>
          <Pressable onPress={() => setField('resume_version_id', null)} style={[styles.choice, { borderColor: theme.colors.border, backgroundColor: !form.resume_version_id ? theme.colors.primary : theme.colors.surface }]}>
            <Body style={{ color: !form.resume_version_id ? theme.colors.primaryText : theme.colors.text }}>None</Body>
          </Pressable>
          {resumes.map((resume) => (
            <Pressable key={resume.id} onPress={() => setField('resume_version_id', resume.id)} style={[styles.choice, { borderColor: theme.colors.border, backgroundColor: form.resume_version_id === resume.id ? theme.colors.primary : theme.colors.surface }]}>
              <Body style={{ color: form.resume_version_id === resume.id ? theme.colors.primaryText : theme.colors.text }}>{resume.name}</Body>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Heading>Job description</Heading>
        <FormField label="Pasted description" value={form.job_description ?? ''} onChangeText={(value) => setField('job_description', value)} multiline />
        <Button variant="secondary" onPress={runParser}>Find helpful details</Button>
        {parsedKeywords.length > 0 && <Body muted>{parsedKeywords.join(', ')}</Body>}
      </Card>

      <Card>
        <FormField label="Notes" value={form.notes ?? ''} onChangeText={(value) => setField('notes', value)} multiline />
      </Card>

      <Button onPress={() => void save()}>{editing ? 'Save changes' : 'Create application'}</Button>
    </Screen>
  );
}

function toInput(item: JobApplication): ApplicationInput {
  return {
    title: item.title,
    company: item.company,
    location: item.location ?? '',
    salary_min: item.salary_min ?? null,
    salary_max: item.salary_max ?? null,
    salary_text: item.salary_text ?? '',
    posting_url: item.posting_url ?? '',
    source_site: item.source_site ?? '',
    status: item.status as ApplicationStatus,
    date_saved: item.date_saved,
    date_applied: item.date_applied ?? '',
    resume_version_id: item.resume_version_id ?? null,
    cover_letter_version: item.cover_letter_version ?? '',
    follow_up_date: item.follow_up_date ?? '',
    notes: item.notes ?? '',
    job_description: item.job_description ?? '',
    parsed_keywords: item.parsed_keywords ?? '',
  };
}

function normalize(input: ApplicationInput): ApplicationInput {
  return {
    ...input,
    title: input.title.trim(),
    company: input.company.trim(),
    location: input.location?.trim() || null,
    salary_text: input.salary_text?.trim() || null,
    posting_url: input.posting_url?.trim() || null,
    source_site: input.source_site?.trim() || null,
    date_saved: input.date_saved || todayIsoDate(),
    date_applied: input.date_applied?.trim() || null,
    resume_version_id: input.resume_version_id || null,
    cover_letter_version: input.cover_letter_version?.trim() || null,
    follow_up_date: input.follow_up_date?.trim() || null,
    notes: input.notes?.trim() || null,
    job_description: input.job_description?.trim() || null,
    parsed_keywords: input.parsed_keywords || null,
  };
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
});
