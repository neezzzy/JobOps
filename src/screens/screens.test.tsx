import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DashboardScreen } from './DashboardScreen';
import { JobBoardScreen } from './JobBoardScreen';
import { RemindersScreen } from './RemindersScreen';
import { ResumeFormScreen } from './ResumeFormScreen';
import { SettingsScreen } from './SettingsScreen';

const mockApplications = [{
  id: 'app_1',
  title: 'Product Analyst',
  company: 'Acme',
  status: 'Saved',
  date_saved: '2026-05-01',
  follow_up_date: null,
  created_at: '2026-05-01T00:00:00.000Z',
  updated_at: '2026-05-01T00:00:00.000Z',
}];

const mockReminders = [{
  id: 'rem_1',
  application_id: 'app_1',
  reminder_date: '2026-05-05',
  title: 'Follow up: Product Analyst at Acme',
  completed: 0,
  created_at: '2026-05-01T00:00:00.000Z',
  updated_at: '2026-05-01T00:00:00.000Z',
  company: 'Acme',
  job_title: 'Product Analyst',
}];

jest.mock('@/src/db/database', () => ({
  listApplications: jest.fn(async () => mockApplications),
  listReminders: jest.fn(async () => mockReminders),
  listResumeVersions: jest.fn(async () => []),
  getResumeVersion: jest.fn(async () => null),
  clearAllData: jest.fn(async () => undefined),
  exportAllData: jest.fn(),
  importAllData: jest.fn(),
}));

jest.mock('@/src/services/exportImport', () => ({
  clearAllData: jest.fn(async () => undefined),
  exportAllData: jest.fn(async () => JSON.stringify({
    applications: [{}],
    resume_versions: [{}, {}],
    reminders: [{}, {}, {}],
  })),
  importAllData: jest.fn(async () => undefined),
}));

jest.mock('@/src/services/seed', () => ({
  seedDemoData: jest.fn(async () => undefined),
}));

jest.mock('@/src/services/documentPicker', () => ({
  pickResumeDocument: jest.fn(async () => null),
}));

describe('screens', () => {
  it('renders dashboard recommendations and linked sections', async () => {
    render(<DashboardScreen />);

    expect(await screen.findByText('Recommendations')).toBeTruthy();
    expect(await screen.findByText('1 saved job needs a next step')).toBeTruthy();
    expect(screen.getByText('Total applications')).toBeTruthy();
  });

  it('renders settings with plain backup language', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('Backups')).toBeTruthy();
    expect(screen.getByText('Create backup')).toBeTruthy();
    expect(screen.getByText('Appearance')).toBeTruthy();
    expect(screen.getByText('System')).toBeTruthy();
    expect(screen.getByText('Light')).toBeTruthy();
    expect(screen.getByText('Dark')).toBeTruthy();
    expect(screen.getByText('Text size')).toBeTruthy();
    expect(screen.getByText('High contrast')).toBeTruthy();
    expect(screen.queryByText(/JSON/)).toBeNull();
  });

  it('creates backups without showing raw backup data', async () => {
    render(<SettingsScreen />);

    fireEvent.press(screen.getByText('Create backup'));

    expect(await screen.findByText(/Backup created/)).toBeTruthy();
    expect(screen.getByText(/Includes 1 jobs, 2 resumes, and 3 reminders/)).toBeTruthy();
    expect(screen.queryByText(/applications/)).toBeNull();
    expect(screen.queryByText('Saved backup')).toBeNull();
  });

  it('renders the resume form upload entry point', () => {
    render(<ResumeFormScreen />);

    expect(screen.getByText('Upload resume')).toBeTruthy();
    expect(screen.getByText('Resume details')).toBeTruthy();
  });

  it('renders the job board with existing jobs', async () => {
    render(<JobBoardScreen />);

    await waitFor(() => expect(screen.getByText('Product Analyst')).toBeTruthy());
    expect(screen.getByText('Saved (1)')).toBeTruthy();
  });

  it('renders reminders with follow-up actions', async () => {
    render(<RemindersScreen />);

    expect(await screen.findByText('Follow up: Product Analyst at Acme')).toBeTruthy();
    expect(screen.getByText('Complete')).toBeTruthy();
  });
});
