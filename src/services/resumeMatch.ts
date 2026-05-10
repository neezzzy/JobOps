import type { JobApplication } from '@/src/types/application';
import type { ResumeVersion } from '@/src/types/resume';

export type ResumeMatch = {
  resume: ResumeVersion | null;
  matched: string[];
  missing: string[];
  score: number;
};

export type ResumeUsage = {
  resume: ResumeVersion;
  applications: number;
  interviews: number;
  offers: number;
  lastUsed?: string | null;
};

export function parseKeywords(value?: string | null) {
  try {
    const parsed = value ? JSON.parse(value) as unknown : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function rankResumesForApplication(application: JobApplication, resumes: ResumeVersion[]): ResumeMatch[] {
  const jobKeywords = parseKeywords(application.parsed_keywords);
  return resumes
    .map((resume) => buildMatch(application, resume, jobKeywords))
    .sort((a, b) => b.score - a.score || (a.resume?.name ?? '').localeCompare(b.resume?.name ?? ''));
}

export function buildMatch(application: JobApplication, resume: ResumeVersion | null, keywords = parseKeywords(application.parsed_keywords)): ResumeMatch {
  const resumeText = `${resume?.name ?? ''} ${resume?.target_role ?? ''} ${resume?.notes ?? ''}`.toLowerCase();
  const matched = keywords.filter((keyword) => resumeText.includes(keyword.toLowerCase()));
  return {
    resume,
    matched,
    missing: keywords.filter((keyword) => !matched.includes(keyword)).slice(0, 8),
    score: keywords.length ? matched.length / keywords.length : 0,
  };
}

export function buildResumeUsage(resumes: ResumeVersion[], applications: JobApplication[]): ResumeUsage[] {
  return resumes.map((resume) => {
    const linked = applications.filter((item) => item.resume_version_id === resume.id);
    return {
      resume,
      applications: linked.length,
      interviews: linked.filter((item) => ['Interview', 'Offer'].includes(item.status)).length,
      offers: linked.filter((item) => item.status === 'Offer').length,
      lastUsed: linked.map((item) => item.updated_at).sort().at(-1) ?? null,
    };
  });
}
