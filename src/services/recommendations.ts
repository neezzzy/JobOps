import type { JobApplication, Reminder } from '@/src/types/application';
import { todayIsoDate } from '@/src/utils/dates';

export type Recommendation = {
  id: string;
  title: string;
  detail: string;
  href: string;
  priority: 'high' | 'medium' | 'low';
};

type ReminderRow = Reminder & { company?: string; job_title?: string };

export function buildRecommendations(applications: JobApplication[], reminders: ReminderRow[], today = new Date()): Recommendation[] {
  const todayKey = Number.isNaN(today.getTime()) ? todayIsoDate() : today.toISOString().slice(0, 10);
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

  const dueToday = reminders.filter((reminder) => !reminder.completed && reminder.reminder_date === todayKey);
  if (dueToday.length > 0) {
    recommendations.push({
      id: 'today-follow-ups',
      title: `${dueToday.length} follow-up${dueToday.length === 1 ? '' : 's'} due today`,
      detail: 'Clear these while the context is fresh.',
      href: '/reminders',
      priority: 'high',
    });
  }

  const savedWithoutFollowUp = applications.filter((item) => item.status === 'Saved' && !item.follow_up_date);
  if (savedWithoutFollowUp.length > 0) {
    recommendations.push({
      id: 'saved-without-follow-up',
      title: savedWithoutFollowUp.length === 1 ? '1 saved job needs a next step' : `${savedWithoutFollowUp.length} saved jobs need a next step`,
      detail: 'Add a follow-up date so nothing sits forgotten.',
      href: '/jobs?status=Saved',
      priority: 'medium',
    });
  }

  const appliedWithoutFollowUp = applications.filter((item) => item.status === 'Applied' && !item.follow_up_date);
  if (appliedWithoutFollowUp.length > 0) {
    recommendations.push({
      id: 'applied-without-follow-up',
      title: appliedWithoutFollowUp.length === 1 ? '1 application needs a follow-up date' : `${appliedWithoutFollowUp.length} applications need follow-up dates`,
      detail: 'Pick a date to check back with the company.',
      href: '/jobs?status=Applied',
      priority: 'medium',
    });
  }

  const stale = applications.filter((item) => daysBetween(item.updated_at, todayKey) >= 14 && !['Rejected', 'Offer'].includes(item.status));
  if (stale.length > 0) {
    recommendations.push({
      id: 'stale-applications',
      title: stale.length === 1 ? '1 active item may be stale' : `${stale.length} active items may be stale`,
      detail: 'Review the status or archive the dead ends.',
      href: '/jobs',
      priority: 'low',
    });
  }

  const interviewsWithoutPrep = applications.filter((item) => item.status === 'Interview' && !(item.next_action_date ?? item.follow_up_date));
  if (interviewsWithoutPrep.length > 0) {
    recommendations.push({
      id: 'interviews-need-prep',
      title: interviewsWithoutPrep.length === 1 ? '1 interview needs prep time' : `${interviewsWithoutPrep.length} interviews need prep time`,
      detail: 'Add a prep reminder before the conversation.',
      href: '/jobs?status=Interview',
      priority: 'high',
    });
  }

  return recommendations.sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority)).slice(0, 5);
}

function daysBetween(value: string, todayKey: string) {
  const start = new Date(value);
  const end = new Date(todayKey);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000);
}

function priorityWeight(priority: Recommendation['priority']) {
  return priority === 'high' ? 0 : priority === 'medium' ? 1 : 2;
}
