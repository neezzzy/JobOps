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
  'next.js',
  'vue',
  'angular',
  'swift',
  'kotlin',
  'java',
  'c#',
  'ruby',
  'terraform',
  'linux',
  'security',
  'etl',
  'snowflake',
  'looker',
  'hubspot',
  'notion',
  'linear',
];

export function parseJobDescription(text: string): ParsedJobData {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const originalLines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const lower = normalized.toLowerCase();
  const keywords = new Set<string>();
  const urlMatch = text.match(/https?:\/\/[^\s)]+/i);

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
    normalized.match(/\$?\d{2,3}(?:,\d{3})?\s?(?:k|K)?\s?[-–]\s?\$?\d{2,3}(?:,\d{3})?\s?(?:k|K)?(?:\s?(?:per year|annually|\/year|\/yr|\/hr|hourly))?/i) ??
    normalized.match(/\$\d{2,3}(?:,\d{3})?(?:\s?(?:per year|annually|\/year|\/yr|\/hr|hourly))?/i) ??
    normalized.match(/\b(?:salary|compensation|pay)\s*[:|-]\s*[^.]{4,80}/i);

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
    possibleSalaryText: salaryMatch?.[0]?.replace(/^(?:salary|compensation|pay)\s*[:|-]\s*/i, '').trim(),
    workMode,
    possibleLocation: findPossibleLocation(originalLines, workMode),
    possibleUrl: urlMatch?.[0],
    possibleSourceSite: findPossibleSourceSite(urlMatch?.[0], originalLines),
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
  const labeled = lines.find((line) => /^(?:job\s*)?(?:title|position|role)\s*[:|-]/i.test(line));
  if (labeled) return cleanValue(labeled.replace(/^(?:job\s*)?(?:title|position|role)\s*[:|-]\s*/i, ''));

  const headline = lines.find((line) =>
    line.length <= 80 &&
    /\b(?:engineer|developer|analyst|manager|designer|specialist|coordinator|director|lead|operator|operations|product)\b/i.test(line) &&
    !/salary|remote|hybrid|onsite|on-site|apply|about|posted|promoted/i.test(line)
  );
  return headline ? cleanValue(headline.replace(/\s+[-|]\s+.*$/, '')) : undefined;
}

function findPossibleCompany(lines: string[]) {
  const labeled = lines.find((line) => /^(?:company|organization|employer)\s*[:|-]/i.test(line));
  if (labeled) return cleanValue(labeled.replace(/^(?:company|organization|employer)\s*[:|-]\s*/i, ''));

  const aboutLine = lines.find((line) => /^about\s+/i.test(line) && line.length <= 80);
  if (aboutLine) return cleanValue(aboutLine.replace(/^about\s+/i, '').replace(/[:|-].*$/, ''));

  const atLine = lines.find((line) => /\bat\s+[A-Z][A-Za-z0-9 &.-]{2,}$/i.test(line) && line.length <= 80);
  if (atLine) return cleanValue(atLine.replace(/^.*\bat\s+/i, ''));

  const titleIndex = lines.findIndex((line) => findPossibleTitle([line]) === cleanValue(line.replace(/\s+[-|]\s+.*$/, '')));
  const nextLine = titleIndex >= 0 ? lines[titleIndex + 1] : undefined;
  if (nextLine && nextLine.length <= 80 && !/remote|hybrid|on-site|onsite|salary|compensation|apply|http|posted/i.test(nextLine)) {
    return cleanValue(nextLine);
  }
  return undefined;
}

function findPossibleLocation(lines: string[], workMode?: string) {
  const labeled = lines.find((line) => /^(?:location|job location|work location)\s*[:|-]/i.test(line));
  if (labeled) return cleanValue(labeled.replace(/^(?:location|job location|work location)\s*[:|-]\s*/i, ''));
  const locationLine = lines.find((line) =>
    line.length <= 90 &&
    /(?:remote|hybrid|on-site|onsite|[A-Z][a-z]+,\s*[A-Z]{2}|United States|Canada|Vancouver|Toronto|Seattle|New York|San Francisco)/.test(line) &&
    !/salary|compensation|apply|http/i.test(line)
  );
  if (locationLine && workMode && locationLine.toLowerCase() === workMode.toLowerCase()) return undefined;
  return locationLine ? cleanValue(locationLine) : undefined;
}

function findPossibleSourceSite(url?: string, lines: string[] = []) {
  if (url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return undefined;
    }
  }
  const source = lines.find((line) => /^(?:source|site|job board)\s*[:|-]/i.test(line));
  return source ? cleanValue(source.replace(/^(?:source|site|job board)\s*[:|-]\s*/i, '')) : undefined;
}

function cleanValue(value: string) {
  return value.replace(/\s+/g, ' ').replace(/^[•*-]\s*/, '').trim();
}
