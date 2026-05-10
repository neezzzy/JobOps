import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { inferFromFileName, parseResumeText, type ResumeAutofill } from './resumeParser';

export type PickedResumeDocument = {
  uri: string;
  name: string;
  type: 'pdf' | 'txt';
  mimeType?: string;
  size?: number;
  autofill: ResumeAutofill;
};

const RESUME_TYPES = ['application/pdf', 'text/plain'];

export async function pickResumeDocument(): Promise<PickedResumeDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: RESUME_TYPES,
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;
  return normalizeResumeDocument(result.assets[0]);
}

export async function normalizeResumeDocument(asset: DocumentPicker.DocumentPickerAsset): Promise<PickedResumeDocument> {
  const type = getDocumentKind(asset.name, asset.mimeType);
  const autofill = type === 'txt'
    ? parseResumeText(await readTextAsset(asset), asset.name)
    : inferFromFileName(asset.name);

  return {
    uri: asset.uri,
    name: asset.name,
    type,
    mimeType: asset.mimeType,
    size: asset.size,
    autofill,
  };
}

export function getDocumentKind(name: string, mimeType?: string): 'pdf' | 'txt' {
  const lowerName = name.toLowerCase();
  const lowerMime = mimeType?.toLowerCase();
  if (lowerMime === 'application/pdf' || lowerName.endsWith('.pdf')) return 'pdf';
  return 'txt';
}

async function readTextAsset(asset: DocumentPicker.DocumentPickerAsset) {
  if (asset.base64 && asset.uri.startsWith('data:')) {
    return decodeBase64(asset.base64);
  }
  return FileSystem.readAsStringAsync(asset.uri);
}

function decodeBase64(value: string) {
  if (typeof atob === 'function') return atob(value);
  return value;
}
