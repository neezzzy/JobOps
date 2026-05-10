import { parseJobDescription } from './jobParser';

describe('jobParser', () => {
  it('finds local highlights from a job description', () => {
    const result = parseJobDescription('Remote React Native role requiring 3+ years of experience. Salary $110k-$135k. Must know TypeScript and REST APIs.');

    expect(result.workMode).toBe('Remote');
    expect(result.possibleSalaryText).toBe('$110k-$135k');
    expect(result.keywords).toEqual(expect.arrayContaining(['React', 'React Native', 'Typescript', 'Rest', '3+ years of experience']));
    expect(result.topRequirements.length).toBeGreaterThan(0);
  });
});
