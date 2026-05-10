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

  it('extracts useful details from a LinkedIn-style pasted post', () => {
    const result = parseJobDescription(`Senior Frontend Engineer
Acme Labs
Vancouver, BC · Hybrid
https://www.linkedin.com/jobs/view/123
Compensation: $150,000 - $180,000 per year
Required experience with React, TypeScript, GraphQL, and CI/CD.`);

    expect(result.possibleTitle).toBe('Senior Frontend Engineer');
    expect(result.possibleCompany).toBe('Acme Labs');
    expect(result.possibleLocation).toBe('Vancouver, BC · Hybrid');
    expect(result.possibleSourceSite).toBe('linkedin.com');
    expect(result.possibleUrl).toBe('https://www.linkedin.com/jobs/view/123');
    expect(result.keywords).toEqual(expect.arrayContaining(['React', 'Typescript', 'Graphql', 'Ci/cd']));
  });

  it('extracts location and source from labeled plain text', () => {
    const result = parseJobDescription(`Role: Data Analyst
Employer: Northstar
Location: Remote - Canada
Source: Indeed
Pay: $45/hr
Must be proficient in SQL and Tableau.`);

    expect(result.possibleTitle).toBe('Data Analyst');
    expect(result.possibleCompany).toBe('Northstar');
    expect(result.possibleLocation).toBe('Remote - Canada');
    expect(result.possibleSourceSite).toBe('Indeed');
    expect(result.possibleSalaryText).toBe('$45/hr');
  });
});
