import { getDocumentKind, normalizeResumeDocument } from './documentPicker';

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(async () => 'Alex Rivera\nRole: Mobile Engineer\nExperience shipping React Native apps.'),
}));

describe('documentPicker', () => {
  it('detects PDF and TXT documents', () => {
    expect(getDocumentKind('resume.pdf')).toBe('pdf');
    expect(getDocumentKind('resume.txt')).toBe('txt');
    expect(getDocumentKind('resume', 'application/pdf')).toBe('pdf');
  });

  it('normalizes TXT documents with autofill details', async () => {
    const result = await normalizeResumeDocument({
      uri: 'file:///resume.txt',
      name: 'resume.txt',
      mimeType: 'text/plain',
      size: 200,
      lastModified: 0,
    });

    expect(result.type).toBe('txt');
    expect(result.autofill.name).toBe('Alex Rivera');
    expect(result.autofill.target_role).toBe('Mobile Engineer');
  });

  it('normalizes PDFs without text extraction', async () => {
    const result = await normalizeResumeDocument({
      uri: 'file:///product-ops-resume.pdf',
      name: 'product-ops-resume.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      lastModified: 0,
    });

    expect(result.type).toBe('pdf');
    expect(result.autofill.name).toBe('Product Ops Resume');
  });
});
