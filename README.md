# JobOps

JobOps is a local-first Expo app for tracking job applications, resume versions, follow-ups, notes, and job posting details. It keeps job search work organized on the device without accounts, cloud sync, analytics, or external AI services.

## Setup

```bash
npm install
npm run web
```

Useful commands:

```bash
npm run android
npm run ios
npm run typecheck
npm test
```

## Features

- Clickable dashboard with application totals, status counts, follow-ups, recent jobs, and practical recommendations.
- Job board grouped by status with search and quick status changes.
- Create, edit, delete, and review applications with saved status history.
- Resume versions with TXT/PDF document attachment through the device file manager.
- TXT resume uploads can fill basic resume fields from the file content; PDF uploads save file details for reference.
- Follow-up reminders with date editing and completion.
- Local job description helper for role highlights, salary text, work mode, and requirements.
- Plain-language backup export/import from Settings.
- Optional demo data for trying the app quickly.
- Light and dark mode through the device color scheme.

## Project Structure

- `app/`: Expo Router routes and tab navigation.
- `src/screens/`: Screen-level UI.
- `src/components/`: Shared UI components and theme.
- `src/db/`: SQLite schema, migrations, and database access.
- `src/services/`: Import/export, parsing, recommendations, seed data, and document helpers.
- `src/types/`: Shared TypeScript types.
- `src/utils/`: Small reusable utilities.

## Data and Privacy

JobOps stores structured data locally in `jobops.db` through `expo-sqlite`. Resume document references are stored as local file metadata. The app does not use accounts, authentication, tracking, scraping, cloud sync, paid APIs, external AI APIs, or a backend.

Backups are exported and imported from Settings using a plain backup file format. The app keeps the format compatible internally while avoiding technical wording in the user interface.

## Testing

Run the full local check before shipping changes:

```bash
npm run typecheck
npm test
```

Tests cover parsing helpers, recommendations, backup validation, utility behavior, and key screen rendering.
