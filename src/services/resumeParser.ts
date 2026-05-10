export type ResumeAutofill = {
  name?: string;
  target_role?: string;
  notes?: string;
};

const ROLE_PATTERNS = [
  /\b(?:target|desired)\s+(?:role|position)\s*[:|-]\s*([^\n\r]+)/i,
  /\b(?:role|position)\s*[:|-]\s*([^\n\r]+)/i,
  /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3}\s+(?:Engineer|Developer|Manager|Analyst|Designer|Specialist|Coordinator|Director|Lead))\b/,
];

export function parseResumeText(text: string, fallbackName?: string): ResumeAutofill {
  const cleaned = cleanText(text);
  if (!cleaned) return inferFromFileName(fallbackName);

  const lines = cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const firstNameLikeLine = lines.find((line) => /^[A-Za-z][A-Za-z.'-]+(?:\s+[A-Za-z][A-Za-z.'-]+){1,3}$/.test(line) && line.length <= 64);
  const targetRole = findTargetRole(cleaned);
  const highlights = findHighlights(lines);

  return {
    name: firstNameLikeLine ?? formatFileName(fallbackName),
    target_role: targetRole ?? inferFromFileName(fallbackName).target_role,
    notes: highlights.length ? highlights.join('\n') : cleaned.slice(0, 600),
  };
}

export function inferFromFileName(fileName?: string): ResumeAutofill {
  const formatted = formatFileName(fileName);
  if (!formatted) return {};
  const targetRole = formatted.replace(/\b(?:resume|cv|curriculum vitae)\b/gi, '').replace(/\s+/g, ' ').trim();
  return {
    name: formatted,
    target_role: targetRole || undefined,
  };
}

export function cleanText(text: string) {
  return text
    .replace(/\u0000/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function findTargetRole(text: string) {
  for (const pattern of ROLE_PATTERNS) {
    const match = text.match(pattern)?.[1]?.trim();
    if (match) return match.replace(/[|•].*$/, '').trim();
  }
  return undefined;
}

function findHighlights(lines: string[]) {
  const picked = lines.filter((line) => /experience|managed|built|led|created|improved|skills|certification|education|project/i.test(line));
  return picked.slice(0, 8).map((line) => line.slice(0, 180));
}

function formatFileName(fileName?: string) {
  if (!fileName) return undefined;
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
