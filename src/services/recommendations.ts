import type { JobApplication, Reminder } from '@/src/types/application';

export type Recommendation = {
  id: string;
  title: string;
  detail: string;
  href: string;
  priority: 'high' | 'medium' | 'low';
};

type ReminderRow = Reminder & { company?: string; job_title?: string };

export function buildRecommendations(applications: JobApplication[], reminders: ReminderRow[], today = new Date()): Recommendation[] {
  const todayKey = today.toISOString().slice(0, 10);
  const recommendations: Recommendation[] = [];

  const overdue = reminders.filter((reminder) => !reminder.completed && reminder.reminder_date < todayKey);
  if (overdue.length > 0) {
    recommendations.push({
      id: 'overdue-follow-ups',
      title: `${overdue.length} overdue follow-up${overdue.length === 1 ? '' : 's'}`,
      detail: 'Send a short check-in or mark them complete.',
      href: '/reminders',
      priority: 'high',
    });
  }

  const savedWithoutFollowUp = applications.filter((item) => item.status === 'Saved' && !item.follow_up_date);
  if (savedWithoutFollowUp.length > 0) {
    recommendations.push({
      id: 'saved-without-follow-up',
      title: `${savedWithoutFollowUp.length} saved job${savedWithoutFollowUp.length === 1 ? '' : 's'} need a next step`,
      detail: 'Add a follow-up date so nothing sits forgotten.',
      href: '/jobs?status=Saved',
      priority: 'medium',
    });
  }

  const appliedWithoutFollowUp = applications.filter((item) => item.status === 'Applied' && !item.follow_up_date);
  if (appliedWithoutFollowUp.length > 0) {
    recommendations.push({
      id: 'applied-without-follow-up',
      title: `${appliedWithoutFollowUp.length} application${appliedWithoutFollowUp.length === 1 ? '' : 's'} need follow-up dates`,
      detail: 'Pick a date to check back with the company.',
      href: '/jobs?status=Applied',
      priority: 'medium',
    });
  }

  const stale = applications.filter((item) => daysBetween(item.updated_at, todayKey) >= 14 && !['Rejected', 'Offer'].includes(item.status));
  if (stale.length > 0) {
    recommendations.push({
      id: 'stale-applications',
      title: `${stale.length} active item${stale.length === 1 ? '' : 's'} may be stale`,
      detail: 'Review the status or archive the dead ends.',
      href: '/jobs',
      priority: 'low',
    });
  }

  return recommendations.slice(0, 4);
}

function daysBetween(value: string, todayKey: string) {
  const start = new Date(value);
  const end = new Date(todayKey);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000);
}
