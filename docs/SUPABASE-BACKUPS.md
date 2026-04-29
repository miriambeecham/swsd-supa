# Supabase Backup System

Automated database backups and keep-alive for the production and staging Supabase projects.

## Overview

Four GitHub Actions workflows handle the database lifecycle:

| Workflow | File | Schedule | Purpose |
|---|---|---|---|
| Keep-alive | `supabase-keepalive.yml` | Mon & Thu at 12:00 UTC | Pings prod + staging via REST so free-tier projects don't auto-pause |
| Daily prod backup | `supabase-backup.yml` | Daily at 11:00 UTC (3 AM Pacific) | Data-only dump of production |
| Weekly full prod backup | `supabase-backup-full.yml` | Sundays at 11:00 UTC | Schema + data dump of production (safety net for migration drift) |
| Staging backup on schema change | `supabase-backup-staging.yml` | On push to `staging` touching `supabase/migrations/**` | Schema dump of staging |

All workflows also accept `workflow_dispatch` for manual runs from the Actions tab.

## Where backups live

All backup files commit to a dedicated **orphan branch `backups`** (no shared history with `main`). Inspecting:

```bash
git fetch origin backups
git checkout backups
ls backups/supabase/
```

Layout on the `backups` branch:

```
backups/supabase/
├── swsd-YYYY-MM-DD.sql              # daily prod (data only)
├── full/swsd-full-YYYY-MM-DD.sql    # weekly prod (schema + data)
└── staging/swsd-staging-YYYY-MM-DD.sql  # staging (schema only, on migration change)
```

Why an orphan branch:

1. Keeps `main`'s git log free of daily `chore: automated backup` commits.
2. Cloning `main` doesn't pull down years of backup history.
3. Sidesteps the Repository Ruleset on `main` ("PRs required") — the workflow bot can't be added to that ruleset's bypass list, so writing to an unprotected branch is the only path.

## Required secrets

Six repository secrets (Settings → Secrets and variables → Actions):

| Secret | Where to find it | Used by |
|---|---|---|
| `SUPABASE_URL_PROD` | Supabase Dashboard → Project Settings → API → Project URL | keep-alive |
| `SUPABASE_URL_STAGING` | Same, for staging project | keep-alive |
| `SUPABASE_SERVICE_KEY_PROD` | Project Settings → API → `service_role` key | keep-alive |
| `SUPABASE_SERVICE_KEY_STAGING` | Same, for staging project | keep-alive |
| `SUPABASE_DB_URL_PROD` | Project Settings → Database → Connection string → **Session pooler** tab | all dump workflows |
| `SUPABASE_DB_URL_STAGING` | Same, for staging project | staging backup |

⚠️ **Use the Session pooler connection string for `SUPABASE_DB_URL_*`, not the direct connection.** The direct connection (`db.<projectref>.supabase.co`) resolves to IPv6 only on the free plan, and GitHub Actions runners can't reach IPv6. Symptom: `pg_dump: error: ... Network is unreachable`. The Session pooler URL looks like `postgres://postgres.<projectref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres` — note the `pooler.supabase.com` host. Don't use the Transaction pooler (port 6543); `pg_dump` needs session-level features that don't work through transaction pooling.

## Why the keep-alive matters

Supabase pauses free-tier projects after 7 days without API activity. The keep-alive workflow runs every Monday and Thursday at noon UTC, hitting both projects with a no-op `select=id&limit=1` REST call against the `classes` table. The 3-4 day cadence keeps us under the 7-day limit even if one run fails.

If we ever upgrade to a paid plan, the keep-alive workflow can be deleted.

## Gotchas (read before touching workflows)

### `supabase db dump` defaults to schema-only

Without `--data-only`, you get just the schema. To produce a true schema+data dump, run two passes and concatenate (this is what `supabase-backup-full.yml` does):

```bash
supabase db dump --db-url "$URL" --file schema.sql
supabase db dump --db-url "$URL" --data-only --file data.sql
cat schema.sql data.sql > full.sql
```

### IPv6 connectivity

Use the Session pooler connection string (see Required secrets above).

### Workflow needs `contents: write`

GitHub's default `GITHUB_TOKEN` is read-only. All three backup workflows have `permissions: contents: write` at the top level. The keep-alive workflow doesn't — it doesn't push.

### Branch protection on `main`

`main` has a Rulesets-based "PRs required" rule. Workflows must commit to the `backups` orphan branch, not `main`. If you see `Repository rule violations found for refs/heads/main` in a workflow log, the checkout step is missing `ref: backups`.

## Restore procedure

| Scenario | Path | Time |
|---|---|---|
| Free-tier paused | Click "Restore" in Supabase Dashboard | Minutes |
| Project deleted by mistake | New project → run `supabase/migrations/*.sql` → load latest daily backup | ~30 min |
| Region outage | Wait, or spin up new project in different region | Hours |
| Supabase shutters | New Postgres anywhere (Neon, RDS, fly.io) → load latest **weekly full** backup | A few hours |

The schema is portable — only the `pgcrypto` extension and `gen_random_uuid()`, no Supabase-specific functions, no `auth.users` references. RLS is enabled but no policies, so it's effectively a no-op during restore.

### From the weekly full dump (preferred — self-contained)

```bash
git fetch origin backups
git show origin/backups:backups/supabase/full/swsd-full-YYYY-MM-DD.sql > restore.sql
psql "$NEW_DB_URL" < restore.sql
```

### From the daily data-only dump

You also need the schema first:

```bash
psql "$NEW_DB_URL" < supabase/migrations/0001_initial_schema.sql
git show origin/backups:backups/supabase/swsd-YYYY-MM-DD.sql | psql "$NEW_DB_URL"
```

## Storage growth

Current sizes: ~280 KB per weekly full, ~240 KB per daily, ~38 KB per staging schema dump. Roughly 90 MB/year added to the `backups` branch — well under GitHub's recommended 1 GB ceiling. No pruning needed for years.

If a single dump ever crosses 5 MB, add a retention step (`find -mtime +90 -delete`) before the commit step.

## Security notes

- Service role keys and DB URLs are stored as GitHub secrets (encrypted at rest, never logged).
- Backup files contain customer PII (names, emails, phone numbers from `bookings`, `persons`, `participants`). Repo must stay private.
- The orphan `backups` branch is subject to the same repo access control as the rest.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Network is unreachable` on the dump step | IPv6-only direct connection | Switch secret to the Session pooler URL |
| `Permission ... denied to github-actions[bot]` | Missing `contents: write` permission | Add `permissions: contents: write` block to the workflow |
| `Repository rule violations found for refs/heads/main` | Workflow pushing to main | Check that the checkout step uses `ref: backups` |
| Backup file unexpectedly ~38 KB | Schema-only dump where data was expected | Use the two-pass + concat trick (only needed for the weekly full) |
| Daily backup file missing INSERTs | Same as above | This is the daily, expected to be data-only — the format is multi-row `INSERT INTO ... VALUES (...), (...)` rather than `COPY` |

## Last updated

2026-04-29 — initial setup. Workflows in `.github/workflows/supabase-*.yml`.
