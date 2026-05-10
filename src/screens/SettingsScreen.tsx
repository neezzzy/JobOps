import { useState } from 'react';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { FormField } from '@/src/components/FormField';
import { Screen } from '@/src/components/Screen';
import { Body, Heading, Title } from '@/src/components/Typography';
import { clearAllData, exportAllData, importAllData } from '@/src/services/exportImport';
import { seedDemoData } from '@/src/services/seed';

export function SettingsScreen() {
  const [exportJson, setExportJson] = useState('');
  const [importJson, setImportJson] = useState('');

  async function exportData() {
    setExportJson(await exportAllData());
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
        <Heading>Backups</Heading>
        <Body muted>Create a saved backup or restore from one you already have.</Body>
        <Button onPress={() => void exportData()}>Create backup</Button>
        {!!exportJson && <FormField label="Saved backup" value={exportJson} onChangeText={setExportJson} multiline />}
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
