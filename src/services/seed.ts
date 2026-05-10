import { createApplication, createResumeVersion } from '@/src/db/database';
import { parseJobDescription } from '@/src/services/jobParser';
import { addDaysIsoDate, nowIso, todayIsoDate } from '@/src/utils/dates';

export async function seedDemoData() {
  const frontendResumeId = await createResumeVersion({
    name: 'Frontend RN v1',
    target_role: 'React Native Engineer',
    notes: 'Mobile-focused version with TypeScript and offline-first projects.',
  });
  const opsResumeId = await createResumeVersion({
    name: 'Product Ops v2',
    target_role: 'Product Operations',
    notes: 'Emphasizes systems, dashboards, SQL, and stakeholder communication.',
  });

  const samples = [
    {
      title: 'React Native Developer',
      company: 'Northstar Apps',
      status: 'Saved' as const,
      resume_version_id: frontendResumeId,
      follow_up_date: addDaysIsoDate(3),
      source_site: 'Company site',
      location: 'Remote',
      description: 'We need a React Native developer with 3+ years of experience, TypeScript, REST APIs, and mobile delivery. Salary $110k-$135k. Remote role.',
    },
    {
      title: 'Product Operations Analyst',
      company: 'Clearpath Health',
      status: 'Applied' as const,
      resume_version_id: opsResumeId,
      follow_up_date: addDaysIsoDate(5),
      source_site: 'LinkedIn',
      location: 'Vancouver, BC',
      description: 'Must have SQL, Tableau, stakeholder reporting, and 2+ years of experience. Hybrid team.',
    },
    {
      title: 'Mobile Engineer',
      company: 'Harbor Tools',
      status: 'Interview' as const,
      resume_version_id: frontendResumeId,
      follow_up_date: null,
      source_site: 'Indeed',
      location: 'Hybrid',
      description: 'React, TypeScript, GraphQL, CI/CD, and app store release experience required.',
    },
    {
      title: 'Data Operations Specialist',
      company: 'Ledgerline',
      status: 'Rejected' as const,
      resume_version_id: opsResumeId,
      follow_up_date: null,
      source_site: 'Referral',
      location: 'On-site',
      description: 'Excel, SQL, Power BI, process improvement, and cross-functional support.',
    },
    {
      title: 'Frontend Platform Engineer',
      company: 'SignalWorks',
      status: 'Offer' as const,
      resume_version_id: frontendResumeId,
      follow_up_date: null,
      source_site: 'Wellfound',
      location: 'Remote',
      description: 'React, TypeScript, Node, Docker, and design system experience. Salary $130,000 - $155,000.',
    },
  ];

  for (const sample of samples) {
    const parsed = parseJobDescription(sample.description);
    await createApplication({
      title: sample.title,
      company: sample.company,
      location: sample.location,
      salary_min: null,
      salary_max: null,
      salary_text: parsed.possibleSalaryText ?? null,
      posting_url: null,
      source_site: sample.source_site,
      status: sample.status,
      date_saved: todayIsoDate(),
      date_applied: sample.status === 'Applied' ? todayIsoDate() : null,
      resume_version_id: sample.resume_version_id,
      cover_letter_version: null,
      follow_up_date: sample.follow_up_date,
      notes: `Seeded demo record created ${nowIso().slice(0, 10)}.`,
      job_description: sample.description,
      parsed_keywords: JSON.stringify(parsed.keywords),
    });
  }
}
