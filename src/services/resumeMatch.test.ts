import type { JobApplication } from '@/src/types/application';
import type { ResumeVersion } from '@/src/types/resume';
import { buildMatch, rankResumesForApplication } from './resumeMatch';

const application: JobApplication = {
  id: 'app_1',
  title: 'React Native Engineer',
  company: 'Acme',
  status: 'Saved',
  date_saved: '2026-05-01',
  parsed_keywords: JSON.stringify(['React Native', 'TypeScript', 'SQL']),
  created_at: '2026-05-01T00:00:00.000Z',
  updated_at: '2026-05-01T00:00:00.000Z',
};

const resumes: ResumeVersion[] = [
  {
    id: 'res_1',
    name: 'Product Ops',
    target_role: 'Operations',
    notes: 'SQL dashboards',
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
  },
  {
    id: 'res_2',
    name: 'Mobile',
    target_role: 'React Native Engineer',
    notes: 'React Native and TypeScript apps',
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
  },
];

describe('resumeMatch', () => {
  it('ranks resumes by local keyword fit', () => {
    const matches = rankResumesForApplication(application, resumes);

    expect(matches[0].resume?.id).toBe('res_2');
    expect(matches[0].matched).toEqual(expect.arrayContaining(['React Native', 'TypeScript']));
    expect(matches[0].missing).toContain('SQL');
  });

  it('handles applications without parsed keywords', () => {
    const match = buildMatch({ ...application, parsed_keywords: '' }, resumes[0]);

    expect(match.score).toBe(0);
    expect(match.matched).toEqual([]);
    expect(match.missing).toEqual([]);
  });

  it('sorts tied resume scores by name', () => {
    const tied = rankResumesForApplication(application, [
      { ...resumes[0], id: 'res_b', name: 'Zulu', notes: '' },
      { ...resumes[0], id: 'res_a', name: 'Alpha', notes: '' },
    ]);

    expect(tied.map((item) => item.resume?.name)).toEqual(['Alpha', 'Zulu']);
  });
});
