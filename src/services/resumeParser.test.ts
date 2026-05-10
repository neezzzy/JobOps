import { inferFromFileName, parseResumeText } from './resumeParser';

describe('resumeParser', () => {
  it('fills resume details from plain text', () => {
    const result = parseResumeText(`Jane Candidate
Target role: Product Operations Analyst
Experience building dashboards and improving weekly reporting.
Skills: SQL, Tableau, Excel`, 'jane_resume.txt');

    expect(result.name).toBe('Jane Candidate');
    expect(result.target_role).toBe('Product Operations Analyst');
    expect(result.notes).toContain('Experience building dashboards');
  });

  it('uses the file name when content is unavailable', () => {
    expect(inferFromFileName('frontend-engineer-resume.pdf')).toEqual({
      name: 'Frontend Engineer Resume',
      target_role: 'Frontend Engineer',
    });
  });
});
