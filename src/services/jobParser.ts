import type { ParsedJobData } from '@/src/types/application';

const SKILLS = [
  'javascript',
  'typescript',
  'react',
  'react native',
  'node',
  'python',
  'sql',
  'postgres',
  'sqlite',
  'aws',
  'azure',
  'gcp',
  'docker',
  'kubernetes',
  'graphql',
  'rest',
  'figma',
  'jira',
  'salesforce',
  'excel',
  'tableau',
  'power bi',
  'machine learning',
  'data analysis',
  'agile',
  'ci/cd',
];

export function parseJobDescription(text: string): ParsedJobData {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const originalLines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const lower = normalized.toLowerCase();
  const keywords = new Set<string>();

  SKILLS.forEach((skill) => {
    if (lower.includes(skill)) {
      keywords.add(titleCase(skill));
    }
  });

  const capitalizedTerms = normalized.match(/\b[A-Z][A-Za-z0-9+#]*(?:\s+[A-Z][A-Za-z0-9+#]*){0,2}\b/g) ?? [];
  const counts = capitalizedTerms.reduce<Record<string, number>>((acc, term) => {
    const cleaned = term.trim();
    if (cleaned.length > 2 && !['The', 'And', 'You', 'We', 'Our'].includes(cleaned)) {
      acc[cleaned] = (acc[cleaned] ?? 0) + 1;
    }
    return acc;
  }, {});

  Object.entries(counts)
    .filter(([, count]) => count > 1)
    .slice(0, 8)
    .forEach(([term]) => keywords.add(term));

  const experienceMatches = normalized.match(/\b\d+\+?\s*(?:years|yrs)\b(?:\s+of\s+experience)?/gi) ?? [];
  experienceMatches.slice(0, 3).forEach((match) => keywords.add(match));

  const salaryMatch =
    normalized.match(/\$?\d{2,3}(?:,\d{3})?\s?(?:k|K)?\s?[-–]\s?\$?\d{2,3}(?:,\d{3})?\s?(?:k|K)?/i) ??
    normalized.match(/\$\d{2,3}(?:,\d{3})?(?:\s?(?:per year|annually|\/year|\/yr))?/i);

  const workMode = lower.includes('remote')
    ? 'Remote'
    : lower.includes('hybrid')
      ? 'Hybrid'
      : lower.includes('on-site') || lower.includes('onsite') || lower.includes('in office')
        ? 'On-site'
        : undefined;

  if (workMode) keywords.add(workMode);

  const topRequirements = normalized
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => /required|experience|must|proficient|responsible|qualification|ability/i.test(sentence))
    .slice(0, 5)
    .map((sentence) => sentence.trim());

  return {
    keywords: Array.from(keywords).slice(0, 24),
    possibleSalaryText: salaryMatch?.[0],
    workMode,
    possibleTitle: findPossibleTitle(originalLines),
    possibleCompany: findPossibleCompany(originalLines),
    topRequirements,
  };
}

function titleCase(value: string) {
  return value
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function findPossibleTitle(lines: string[]) {
  const labeled = lines.find((line) => /^(?:job\s*)?title\s*[:|-]/i.test(line));
  if (labeled) return labeled.replace(/^(?:job\s*)?title\s*[:|-]\s*/i, '').trim();

  return lines.find((line) =>
    line.length <= 80 &&
    /\b(?:engineer|developer|analyst|manager|designer|specialist|coordinator|director|lead|operator|operations|product)\b/i.test(line) &&
    !/salary|remote|hybrid|onsite|apply|about/i.test(line)
  );
}

function findPossibleCompany(lines: string[]) {
  const labeled = lines.find((line) => /^(?:company|organization|employer)\s*[:|-]/i.test(line));
  if (labeled) return labeled.replace(/^(?:company|organization|employer)\s*[:|-]\s*/i, '').trim();

  const aboutLine = lines.find((line) => /^about\s+/i.test(line) && line.length <= 80);
  if (aboutLine) return aboutLine.replace(/^about\s+/i, '').replace(/[:|-].*$/, '').trim();

  const atLine = lines.find((line) => /\bat\s+[A-Z][A-Za-z0-9 &.-]{2,}$/i.test(line) && line.length <= 80);
  return atLine?.replace(/^.*\bat\s+/i, '').trim();
}
