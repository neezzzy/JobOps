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
        <Body muted>No accounts, backend, analytics, tracking, scraping, or external AI APIs are used.</Body>
      </Card>

      <Card>
        <Heading>Export</Heading>
        <Button onPress={() => void exportData()}>Export all data as JSON</Button>
        {!!exportJson && <FormField label="Backup JSON" value={exportJson} onChangeText={setExportJson} multiline />}
      </Card>

      <Card>
        <Heading>Import</Heading>
        <FormField label="Paste backup JSON" value={importJson} onChangeText={setImportJson} multiline />
        <Button variant="secondary" disabled={!importJson.trim()} onPress={confirmImport}>Import JSON backup</Button>
      </Card>

      <Card>
        <Heading>Local data</Heading>
        <Button variant="secondary" onPress={confirmSeed}>Seed demo data</Button>
        <Button variant="danger" onPress={confirmClear}>Clear all data</Button>
      </Card>

      <Card>
        <Heading>App version</Heading>
        <Body muted>{Constants.expoConfig?.version ?? '1.0.0'}</Body>
      </Card>
    </Screen>
  );
}
