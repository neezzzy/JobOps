export const APPLICATION_STATUSES = ['Saved', 'Applied', 'Interview', 'Rejected', 'Offer'] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export type ParsedJobData = {
  keywords: string[];
  possibleSalaryText?: string;
  workMode?: 'Remote' | 'Hybrid' | 'On-site';
  topRequirements: string[];
};

export type JobApplication = {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_text?: string | null;
  posting_url?: string | null;
  source_site?: string | null;
  status: ApplicationStatus;
  date_saved: string;
  date_applied?: string | null;
  resume_version_id?: string | null;
  cover_letter_version?: string | null;
  follow_up_date?: string | null;
  notes?: string | null;
  job_description?: string | null;
  parsed_keywords?: string | null;
  created_at: string;
  updated_at: string;
};

export type StatusHistory = {
  id: string;
  application_id: string;
  old_status?: string | null;
  new_status: ApplicationStatus;
  changed_at: string;
};

export type Reminder = {
  id: string;
  application_id: string;
  reminder_date: string;
  title: string;
  completed: number;
  created_at: string;
  updated_at: string;
};

export type ApplicationInput = Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>;
