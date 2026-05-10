import { useState, type ReactNode } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { FormField } from '@/src/components/FormField';
import { Screen } from '@/src/components/Screen';
import { useAppPreferences, useAppTheme } from '@/src/components/theme';
import { Body, Heading, Title } from '@/src/components/Typography';
import { clearAllData, exportAllData, importAllData } from '@/src/services/exportImport';
import { seedDemoData } from '@/src/services/seed';
import type { TextSize, ThemeMode } from '@/src/types/preferences';

export function SettingsScreen() {
  const theme = useAppTheme();
  const { preferences, updatePreference } = useAppPreferences();
  const [importJson, setImportJson] = useState('');
  const [lastBackup, setLastBackup] = useState('');
  const [backupSummary, setBackupSummary] = useState('');

  async function exportData() {
    const json = await exportAllData();
    const createdAt = new Date().toLocaleString();
    const counts = countBackupItems(json);
    setLastBackup(createdAt);
    setBackupSummary(counts
      ? `Backup created ${createdAt}. Includes ${counts.applications} jobs, ${counts.resumeVersions} resumes, and ${counts.reminders} reminders.`
      : `Backup created ${createdAt}.`);
  }

  function confirmImport() {
    Alert.alert('Import backup', 'This replaces local JobOps data with the pasted backup.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Import', style: 'destructive', onPress: () => void doImport() },
    ]);
  }

  async function doImport() {
    try {
      await importAllData(importJson);
      Alert.alert('Import complete', 'Backup data is now stored locally.');
      setImportJson('');
    } catch (error) {
      Alert.alert('Import failed', error instanceof Error ? error.message : 'The backup could not be imported.');
    }
  }

  function confirmClear() {
    Alert.alert('Clear all data', 'This deletes all local applications, resume versions, reminders, and status history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => void clearAllData().then(() => Alert.alert('Data cleared')) },
    ]);
  }

  function confirmSeed() {
    Alert.alert('Seed demo data', 'Adds sample applications, resume versions, and reminders to the local database.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Seed', onPress: () => void seedDemoData().then(() => Alert.alert('Demo data added')) },
    ]);
  }

  return (
    <Screen>
      <Title>Settings</Title>
      <Card>
        <Heading>Privacy</Heading>
        <Body>Your job search data is stored locally on this device.</Body>
        <Body muted>No accounts, tracking, cloud sync, or outside services are used.</Body>
      </Card>

      <Card>
        <Heading>Appearance</Heading>
        <Body muted>Choose how JobOps looks and reads on this device.</Body>
        <PreferenceGroup label="Theme">
          {themeOptions.map((option) => (
            <PreferenceChoice
              key={option.value}
              label={option.label}
              selected={preferences.themeMode === option.value}
              onPress={() => void updatePreference('themeMode', option.value)}
            />
          ))}
        </PreferenceGroup>
        <PreferenceGroup label="Text size">
          {textSizeOptions.map((option) => (
            <PreferenceChoice
              key={option.value}
              label={option.label}
              selected={preferences.textSize === option.value}
              onPress={() => void updatePreference('textSize', option.value)}
            />
          ))}
        </PreferenceGroup>
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="High contrast"
          accessibilityState={{ checked: preferences.highContrast }}
          onPress={() => void updatePreference('highContrast', !preferences.highContrast)}
          style={({ pressed }) => [
            styles.switchRow,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, opacity: pressed ? 0.7 : 1 },
          ]}>
          <View>
            <Body>High contrast</Body>
            <Body muted>Use stronger borders and text contrast.</Body>
          </View>
          <View style={[
            styles.switchTrack,
            { backgroundColor: preferences.highContrast ? theme.colors.primary : theme.colors.border },
          ]}>
            <View style={[styles.switchThumb, { alignSelf: preferences.highContrast ? 'flex-end' : 'flex-start', backgroundColor: preferences.highContrast ? theme.colors.primaryText : theme.colors.surface }]} />
          </View>
        </Pressable>
      </Card>

      <Card>
        <Heading>Backups</Heading>
        <Body muted>Create a saved backup or restore from one you already have.</Body>
        <Button onPress={() => void exportData()}>Create backup</Button>
        {!!lastBackup && <Body muted>Last backup created {lastBackup}</Body>}
        {!!backupSummary && <Body>{backupSummary}</Body>}
        <FormField label="Restore from backup" value={importJson} onChangeText={setImportJson} multiline />
        <Button variant="secondary" disabled={!importJson.trim()} onPress={confirmImport}>Restore backup</Button>
      </Card>

      <Card>
        <Heading>Demo data</Heading>
        <Body muted>Add sample jobs, resumes, and reminders to explore the app.</Body>
        <Button variant="secondary" onPress={confirmSeed}>Add demo data</Button>
      </Card>

      <Card>
        <Heading>Data reset</Heading>
        <Body muted>Remove local jobs, resumes, follow-ups, and history from this device.</Body>
        <Button variant="danger" onPress={confirmClear}>Clear all data</Button>
      </Card>

      <Card>
        <Heading>App version</Heading>
        <Body muted>{Constants.expoConfig?.version ?? '1.0.0'}</Body>
      </Card>
    </Screen>
  );
}

const themeOptions: { label: string; value: ThemeMode }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const textSizeOptions: { label: string; value: TextSize }[] = [
  { label: 'Normal', value: 'normal' },
  { label: 'Large', value: 'large' },
  { label: 'Extra large', value: 'extraLarge' },
];

function PreferenceGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.preferenceGroup}>
      <Body muted>{label}</Body>
      <View style={styles.choiceRow}>{children}</View>
    </View>
  );
}

function PreferenceChoice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Body style={{ color: selected ? theme.colors.primaryText : theme.colors.text }}>{label}</Body>
    </Pressable>
  );
}

function countBackupItems(json: string) {
  try {
    const parsed = JSON.parse(json) as { applications?: unknown[]; resume_versions?: unknown[]; reminders?: unknown[] };
    return {
      applications: parsed.applications?.length ?? 0,
      resumeVersions: parsed.resume_versions?.length ?? 0,
      reminders: parsed.reminders?.length ?? 0,
    };
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  preferenceGroup: { gap: 8 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    justifyContent: 'center',
  },
  switchRow: {
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchTrack: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});
