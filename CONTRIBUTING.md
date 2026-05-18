# Contributing

Thanks for your interest in JobOps.

This is a portfolio project, so contributions should stay focused on the current scope: local-first job-search tracking, resume version tracking, follow-up workflows, backup import/export, and privacy-aware design.

## Local Setup

Use Node.js 20.19.4 or newer.

```bash
npm install
npm run typecheck
npm test
```

## Guidelines

- Keep changes small and focused.
- Do not add backend services, cloud sync, analytics, scraping, authentication, paid APIs, or external AI services.
- Update tests when changing parsing, persistence, backup, recommendation, or screen behavior.
- Keep README and portfolio copy aligned with features that exist in the code.

## Pull Requests

Before opening a pull request, run:

```bash
npm run typecheck
npm test
```
