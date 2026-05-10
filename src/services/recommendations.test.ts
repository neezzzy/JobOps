import type { JobApplication, Reminder } from '@/src/types/application';
import { buildRecommendations } from './recommendations';

const baseApplication: JobApplication = {
  id: 'app_1',
  title: 'Analyst',
  company: 'Acme',
  status: 'Saved',
  date_saved: '2026-04-01',
  created_at: '2026-04-01T00:00:00.000Z',
  updated_at: '2026-04-01T00:00:00.000Z',
};

const baseReminder: Reminder = {
  id: 'rem_1',
  application_id: 'app_1',
  reminder_date: '2026-04-20',
  title: 'Follow up',
  completed: 0,
  created_at: '2026-04-01T00:00:00.000Z',
  updated_at: '2026-04-01T00:00:00.000Z',
};

describe('recommendations', () => {
  it('recommends overdue follow-ups and missing next steps', () => {
    const items = buildRecommendations([baseApplication], [baseReminder], new Date('2026-05-01T00:00:00.000Z'));

    expect(items.map((item) => item.id)).toContain('overdue-follow-ups');
    expect(items.map((item) => item.id)).toContain('saved-without-follow-up');
  });

  it('returns no items when everything is current', () => {
    const items = buildRecommendations([
      { ...baseApplication, status: 'Rejected', follow_up_date: null, updated_at: '2026-05-01T00:00:00.000Z' },
    ], [], new Date('2026-05-01T00:00:00.000Z'));

    expect(items).toEqual([]);
  });
});
