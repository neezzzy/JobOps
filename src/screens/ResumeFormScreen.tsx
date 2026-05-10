import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { FormField } from '@/src/components/FormField';
import { Screen } from '@/src/components/Screen';
import { Title } from '@/src/components/Typography';
import { createResumeVersion, getResumeVersion, updateResumeVersion } from '@/src/db/database';
import type { ResumeVersionInput } from '@/src/types/resume';

export function ResumeFormScreen({ id }: { id?: string }) {
  const editing = id && id !== 'new';
  const [form, setForm] = useState<ResumeVersionInput>({ name: '', target_role: '', notes: '' });

  const load = useCallback(async () => {
    if (!editing) return;
    const resume = await getResumeVersion(id);
    if (resume) setForm({ name: resume.name, target_role: resume.target_role ?? '', notes: resume.notes ?? '' });
  }, [editing, id]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function save() {
    if (!form.name.trim()) {
      Alert.alert('Missing name', 'Resume version name is required.');
      return;
    }
    const input = {
      name: form.name.trim(),
      target_role: form.target_role?.trim() || null,
      notes: form.notes?.trim() || null,
    };
    if (editing) {
      await updateResumeVersion(id, input);
    } else {
      await createResumeVersion(input);
    }
    router.replace('/resumes');
  }

  return (
    <Screen>
      <Title>{editing ? 'Edit Resume' : 'Add Resume'}</Title>
      <Card>
        <FormField label="Version name" value={form.name} onChangeText={(value) => setForm((current) => ({ ...current, name: value }))} />
        <FormField label="Target role type" value={form.target_role ?? ''} onChangeText={(value) => setForm((current) => ({ ...current, target_role: value }))} />
        <FormField label="Notes or file path" value={form.notes ?? ''} onChangeText={(value) => setForm((current) => ({ ...current, notes: value }))} multiline />
      </Card>
      <Button onPress={() => void save()}>{editing ? 'Save changes' : 'Create resume version'}</Button>
    </Screen>
  );
}
