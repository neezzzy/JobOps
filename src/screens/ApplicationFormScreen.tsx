import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { DateField } from '@/src/components/DateField';
import { DatePresets } from '@/src/components/DatePresets';
import { FormField } from '@/src/components/FormField';
import { Screen } from '@/src/components/Screen';
import { Body, Heading, Title } from '@/src/components/Typography';
import { useAppTheme } from '@/src/components/theme';
import { createApplication, findDuplicateApplication, getApplication, listResumeVersions, updateApplication } from '@/src/db/database';
import { parseJobDescription } from '@/src/services/jobParser';
import { rankResumesForApplication } from '@/src/services/resumeMatch';
import { APPLICATION_STATUSES, NEXT_ACTION_TYPES, PRIORITIES, type ApplicationInput, type ApplicationStatus, type JobApplication, type NextActionType } from '@/src/types/application';
import type { ResumeVersion } from '@/src/types/resume';
import { isIsoDate, todayIsoDate } from '@/src/utils/dates';

type Props = { id?: string };

export function ApplicationFormScreen({ id }: Props) {
  const theme = useAppTheme();
  const editing = id && id !== 'new';
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<ApplicationInput>({
    title: '',
    company: '',
    location: '',
    salary_min: null,
    salary_max: null,
    salary_text: '',
    work_mode: null,
    posting_url: '',
    source_site: '',
    status: 'Saved',
    priority: 'Normal',
    archived_at: null,
    next_action_type: 'Apply by',
    next_action_date: '',
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

  function chooseStatus(status: ApplicationStatus) {
    setForm((current) => ({
      ...current,
      status,
      next_action_type: defaultAction(status),
    }));
  }

  function runParser() {
    const parsed = parseJobDescription(form.job_description ?? '');
    setForm((current) => ({
      ...current,
      parsed_keywords: JSON.stringify(parsed.keywords),
      salary_text: current.salary_text || parsed.possibleSalaryText || '',
      location: current.location || parsed.possibleLocation || parsed.workMode || '',
      work_mode: current.work_mode || parsed.workMode || null,
      notes: current.notes || parsed.topRequirements.join('\n'),
    }));
  }

  function applyPastedPost() {
    const parsed = parseJobDescription(pasteText);
    setForm((current) => ({
      ...current,
      title: current.title || parsed.possibleTitle || '',
      company: current.company || parsed.possibleCompany || '',
      salary_text: current.salary_text || parsed.possibleSalaryText || '',
      location: current.location || parsed.possibleLocation || parsed.workMode || '',
      work_mode: current.work_mode || parsed.workMode || null,
      posting_url: current.posting_url || parsed.possibleUrl || '',
      source_site: current.source_site || parsed.possibleSourceSite || '',
      job_description: current.job_description || pasteText,
      parsed_keywords: JSON.stringify(parsed.keywords),
      notes: current.notes || parsed.topRequirements.join('\n'),
    }));
  }

  const recommendedResumes = useMemo(() => {
    if (!form.parsed_keywords || resumes.length === 0) return [];
    return rankResumesForApplication({ ...form, id: 'draft', created_at: '', updated_at: '' } as JobApplication, resumes).slice(0, 2);
  }, [form, resumes]);

  async function save() {
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    const clean = normalize(form);
    if (editing) {
      await updateApplication(id, clean);
      router.replace(`/application/${id}`);
    } else {
      const duplicate = await findDuplicateApplication(clean);
      if (duplicate) {
        Alert.alert('Possible duplicate', `${duplicate.title} at ${duplicate.company} is already tracked.`, [
          { text: 'Create anyway', onPress: () => void createNew(clean) },
          { text: 'Open existing', onPress: () => router.replace(`/application/${duplicate.id}`) },
          { text: 'Cancel', style: 'cancel' },
        ]);
        return;
      }
      await createNew(clean);
    }
  }

  async function createNew(clean: ApplicationInput) {
      const newId = await createApplication(clean);
      router.replace(`/application/${newId}`);
  }

  return (
    <Screen>
      <Title>{editing ? 'Edit Application' : 'Add Application'}</Title>
      <Card>
        <Heading>Paste job post</Heading>
        <FormField label="Full posting" value={pasteText} onChangeText={setPasteText} multiline placeholder="Paste a job post to fill useful fields locally." />
        <Button variant="secondary" disabled={!pasteText.trim()} onPress={applyPastedPost}>Review extracted details</Button>
      </Card>
      <Card>
        <FormField label="Job title" value={form.title} error={errors.title} onChangeText={(value) => setField('title', value)} />
        <FormField label="Company" value={form.company} error={errors.company} onChangeText={(value) => setField('company', value)} />
        <FormField label="Location" value={form.location ?? ''} onChangeText={(value) => setField('location', value)} />
        <Heading>Work mode</Heading>
        <View style={styles.wrap}>
          {(['Remote', 'Hybrid', 'On-site'] as const).map((mode) => (
            <Pressable key={mode} onPress={() => setField('work_mode', form.work_mode === mode ? null : mode)} style={[styles.choice, { borderColor: theme.colors.border, backgroundColor: form.work_mode === mode ? theme.colors.primary : theme.colors.surface }]}>
              <Body style={{ color: form.work_mode === mode ? theme.colors.primaryText : theme.colors.text }}>{mode}</Body>
            </Pressable>
          ))}
        </View>
        <FormField label="Salary range" value={form.salary_text ?? ''} onChangeText={(value) => setField('salary_text', value)} placeholder="$90k-$120k" />
        <FormField label="Job posting link" value={form.posting_url ?? ''} error={errors.posting_url} onChangeText={(value) => setField('posting_url', value)} autoCapitalize="none" />
        <FormField label="Source site" value={form.source_site ?? ''} onChangeText={(value) => setField('source_site', value)} />
      </Card>

      <Card>
        <Heading>Status</Heading>
        <View style={styles.wrap}>
          {APPLICATION_STATUSES.map((status) => (
            <Pressable key={status} onPress={() => chooseStatus(status)} style={[styles.choice, { borderColor: theme.colors.border, backgroundColor: form.status === status ? theme.colors.primary : theme.colors.surface }]}>
              <Body style={{ color: form.status === status ? theme.colors.primaryText : theme.colors.text }}>{status}</Body>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Heading>Priority</Heading>
        <View style={styles.wrap}>
          {PRIORITIES.map((priority) => (
            <Pressable key={priority} onPress={() => setField('priority', priority)} style={[styles.choice, { borderColor: theme.colors.border, backgroundColor: form.priority === priority ? theme.colors.primary : theme.colors.surface }]}>
              <Body style={{ color: form.priority === priority ? theme.colors.primaryText : theme.colors.text }}>{priority}</Body>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Heading>Next action</Heading>
        <View style={styles.wrap}>
          {NEXT_ACTION_TYPES.map((type) => (
            <Pressable key={type} onPress={() => setField('next_action_type', type)} style={[styles.choice, { borderColor: theme.colors.border, backgroundColor: form.next_action_type === type ? theme.colors.primary : theme.colors.surface }]}>
              <Body style={{ color: form.next_action_type === type ? theme.colors.primaryText : theme.colors.text }}>{type}</Body>
            </Pressable>
          ))}
        </View>
        <DatePresets onPick={(value) => {
          setField('next_action_date', value);
          setField('follow_up_date', value);
        }} />
        <DateField label="Custom date" value={form.next_action_date ?? ''} error={errors.next_action_date} onChangeText={(value) => {
          setField('next_action_date', value);
          setField('follow_up_date', value);
        }} />
      </Card>

      <Card>
        <Heading>Dates and versions</Heading>
        <DatePresets onPick={(value) => setField('date_saved', value)} />
        <DateField label="Date saved" value={form.date_saved} error={errors.date_saved} onChangeText={(value) => setField('date_saved', value)} />
        <DatePresets onPick={(value) => setField('date_applied', value)} />
        <DateField label="Date applied" value={form.date_applied ?? ''} error={errors.date_applied} onChangeText={(value) => setField('date_applied', value)} />
        <FormField label="Cover letter version" value={form.cover_letter_version ?? ''} onChangeText={(value) => setField('cover_letter_version', value)} />
        <Heading>Resume version</Heading>
        {recommendedResumes.length > 0 && (
          <Body muted>Recommended: {recommendedResumes.map((item) => item.resume?.name).filter(Boolean).join(', ')}</Body>
        )}
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
    work_mode: item.work_mode ?? null,
    posting_url: item.posting_url ?? '',
    source_site: item.source_site ?? '',
    status: item.status as ApplicationStatus,
    priority: item.priority ?? 'Normal',
    archived_at: item.archived_at ?? null,
    next_action_type: item.next_action_type ?? defaultAction(item.status as ApplicationStatus),
    next_action_date: item.next_action_date ?? item.follow_up_date ?? '',
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
    work_mode: input.work_mode ?? null,
    posting_url: input.posting_url?.trim() || null,
    source_site: input.source_site?.trim() || null,
    priority: input.priority ?? 'Normal',
    archived_at: input.archived_at ?? null,
    next_action_type: input.next_action_type || null,
    next_action_date: input.next_action_date?.trim() || null,
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

function validate(input: ApplicationInput) {
  const errors: Record<string, string> = {};
  if (!input.title.trim()) errors.title = 'Job title is required.';
  if (!input.company.trim()) errors.company = 'Company is required.';
  if (!isIsoDate(input.date_saved)) errors.date_saved = 'Use YYYY-MM-DD.';
  if (!isIsoDate(input.date_applied)) errors.date_applied = 'Use YYYY-MM-DD.';
  if (!isIsoDate(input.next_action_date)) errors.next_action_date = 'Use YYYY-MM-DD.';
  if (input.posting_url?.trim() && !/^https?:\/\/\S+\.\S+/.test(input.posting_url.trim())) errors.posting_url = 'Use a full http or https link.';
  return errors;
}

function defaultAction(status: ApplicationStatus): NextActionType | null {
  if (status === 'Saved') return 'Apply by';
  if (status === 'Applied') return 'Follow up';
  if (status === 'Interview') return 'Prepare';
  if (status === 'Offer') return 'Decision deadline';
  return null;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9 },
});
