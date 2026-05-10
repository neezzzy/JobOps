import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { FormField } from '@/src/components/FormField';
import { Screen } from '@/src/components/Screen';
import { Body, Heading, Title } from '@/src/components/Typography';
import { createResumeVersion, getResumeVersion, updateResumeVersion } from '@/src/db/database';
import { pickResumeDocument } from '@/src/services/documentPicker';
import type { ResumeVersionInput } from '@/src/types/resume';

export function ResumeFormScreen({ id }: { id?: string }) {
  const editing = id && id !== 'new';
  const [form, setForm] = useState<ResumeVersionInput>({
    name: '',
    target_role: '',
    notes: '',
    file_uri: null,
    file_name: null,
    file_type: null,
    file_size: null,
  });

  const load = useCallback(async () => {
    if (!editing) return;
    const resume = await getResumeVersion(id);
    if (resume) {
      setForm({
        name: resume.name,
        target_role: resume.target_role ?? '',
        notes: resume.notes ?? '',
        file_uri: resume.file_uri ?? null,
        file_name: resume.file_name ?? null,
        file_type: resume.file_type ?? null,
        file_size: resume.file_size ?? null,
      });
    }
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
      file_uri: form.file_uri ?? null,
      file_name: form.file_name ?? null,
      file_type: form.file_type ?? null,
      file_size: form.file_size ?? null,
    };
    if (editing) {
      await updateResumeVersion(id, input);
    } else {
      await createResumeVersion(input);
    }
    router.replace('/resumes');
  }

  async function chooseDocument() {
    try {
      const document = await pickResumeDocument();
      if (!document) return;
      setForm((current) => ({
        ...current,
        name: current.name || document.autofill.name || document.name,
        target_role: current.target_role || document.autofill.target_role || '',
        notes: current.notes || document.autofill.notes || '',
        file_uri: document.uri,
        file_name: document.name,
        file_type: document.type,
        file_size: document.size ?? null,
      }));
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'The resume document could not be opened.');
    }
  }

  function clearDocument() {
    setForm((current) => ({
      ...current,
      file_uri: null,
      file_name: null,
      file_type: null,
      file_size: null,
    }));
  }

  return (
    <Screen>
      <Title>{editing ? 'Edit Resume' : 'Add Resume'}</Title>
      <Card>
        <Heading>Document</Heading>
        <Body muted>Choose a TXT or PDF resume from your files. TXT files can fill in basic details.</Body>
        {form.file_name ? (
          <>
            <Body>{form.file_name}</Body>
            <Body muted>{formatFileDetails(form.file_type, form.file_size)}</Body>
            <Button variant="secondary" onPress={clearDocument}>Remove document</Button>
          </>
        ) : (
          <Button variant="secondary" onPress={() => void chooseDocument()}>Upload resume</Button>
        )}
      </Card>

      <Card>
        <Heading>Resume details</Heading>
        <FormField label="Version name" value={form.name} onChangeText={(value) => setForm((current) => ({ ...current, name: value }))} />
        <FormField label="Target role type" value={form.target_role ?? ''} onChangeText={(value) => setForm((current) => ({ ...current, target_role: value }))} />
        <FormField label="Notes" value={form.notes ?? ''} onChangeText={(value) => setForm((current) => ({ ...current, notes: value }))} multiline />
      </Card>
      <Button onPress={() => void save()}>{editing ? 'Save changes' : 'Create resume version'}</Button>
    </Screen>
  );
}

function formatFileDetails(type?: string | null, size?: number | null) {
  const fileType = type?.toUpperCase() || 'Document';
  if (!size) return fileType;
  return `${fileType} - ${Math.round(size / 1024)} KB`;
}
