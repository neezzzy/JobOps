export const schemaSql = `
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_text TEXT,
  posting_url TEXT,
  source_site TEXT,
  status TEXT NOT NULL,
  date_saved TEXT NOT NULL,
  date_applied TEXT,
  resume_version_id TEXT,
  cover_letter_version TEXT,
  follow_up_date TEXT,
  notes TEXT,
  job_description TEXT,
  parsed_keywords TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resume_versions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  target_role TEXT,
  notes TEXT,
  file_uri TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS status_history (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  reminder_date TEXT NOT NULL,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_reminders_application ON reminders(application_id);
CREATE INDEX IF NOT EXISTS idx_status_history_application ON status_history(application_id);
`;
