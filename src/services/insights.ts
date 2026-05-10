import { APPLICATION_STATUSES, type JobApplication, type Reminder } from '@/src/types/application';
import { daysBetweenIso, todayIsoDate } from '@/src/utils/dates';

export type InsightRow = {
  label: string;
  value: string;
  detail?: string;
};

type ReminderRow = Reminder & { company?: string; job_title?: string };

export function buildInsights(applications: JobApplication[], reminders: ReminderRow[], today = todayIsoDate()): InsightRow[] {
  const active = applications.filter((item) => !['Rejected', 'Offer'].includes(item.status));
  const completedFollowUps = reminders.filter((item) => item.completed).length;
  const followUpRate = reminders.length ? Math.round((completedFollowUps / reminders.length) * 100) : 0;
  const interviews = applications.filter((item) => ['Interview', 'Offer'].includes(item.status)).length;
  const offers = applications.filter((item) => item.status === 'Offer').length;
  const lastAppliedDays = Math.min(...applications.filter((item) => item.date_applied).map((item) => daysBetweenIso(item.date_applied, today)));
  const weekCount = applications.filter((item) => daysBetweenIso(item.date_saved, today) <= 7).length;

  const rows: InsightRow[] = [
    { label: 'This week', value: String(weekCount), detail: 'Jobs saved in the last 7 days' },
    { label: 'Active search', value: String(active.length), detail: 'Saved, applied, or interviewing' },
    { label: 'Follow-up rate', value: `${followUpRate}%`, detail: `${completedFollowUps} of ${reminders.length} follow-ups complete` },
    { label: 'Interview rate', value: percent(interviews, applications.length), detail: `${interviews} of ${applications.length} reached interview or better` },
    { label: 'Offer rate', value: percent(offers, applications.length), detail: `${offers} offers from tracked applications` },
  ];

  const sourcePrompt = weakestSourcePrompt(applications);
  if (sourcePrompt) rows.push(sourcePrompt);
  if (Number.isFinite(lastAppliedDays) && lastAppliedDays >= 6) {
    rows.push({ label: 'Momentum', value: `${lastAppliedDays} days`, detail: 'No application has been marked applied recently' });
  }

  return rows;
}

export function statusBreakdown(applications: JobApplication[]) {
  return APPLICATION_STATUSES.map((status) => ({
    status,
    count: applications.filter((item) => item.status === status).length,
  }));
}

function percent(part: number, total: number) {
  return total ? `${Math.round((part / total) * 100)}%` : '0%';
}

function weakestSourcePrompt(applications: JobApplication[]): InsightRow | null {
  const bySource = new Map<string, JobApplication[]>();
  applications.forEach((item) => {
    const source = item.source_site?.trim();
    if (!source) return;
    bySource.set(source, [...(bySource.get(source) ?? []), item]);
  });
  const weak = Array.from(bySource.entries()).find(([, rows]) => rows.length >= 3 && rows.every((row) => !['Interview', 'Offer'].includes(row.status)));
  if (!weak) return null;
  return { label: weak[0], value: '0 interviews', detail: `${weak[1].length} applications from this source` };
}
