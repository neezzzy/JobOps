import { parseJobDescription } from './jobParser';

describe('jobParser', () => {
  it('finds local highlights from a job description', () => {
    const result = parseJobDescription('Remote React Native role requiring 3+ years of experience. Salary $110k-$135k. Must know TypeScript and REST APIs.');

    expect(result.workMode).toBe('Remote');
    expect(result.possibleSalaryText).toBe('$110k-$135k');
    expect(result.keywords).toEqual(expect.arrayContaining(['React', 'React Native', 'Typescript', 'Rest', '3+ years of experience']));
    expect(result.topRequirements.length).toBeGreaterThan(0);
  });

  it('extracts likely title and company from a pasted post', () => {
    const result = parseJobDescription(`Title: Staff Product Engineer
Company: Northstar Apps
Hybrid role requiring TypeScript and SQL.
Salary $140,000 - $165,000`);

    expect(result.possibleTitle).toBe('Staff Product Engineer');
    expect(result.possibleCompany).toBe('Northstar Apps');
    expect(result.workMode).toBe('Hybrid');
    expect(result.possibleSalaryText).toBe('$140,000 - $165,000');
  });
});
