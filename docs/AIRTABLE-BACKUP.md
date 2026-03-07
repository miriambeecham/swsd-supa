# Airtable Backup System

Automated daily backups of the production Airtable database to GitHub.

## Overview

This system creates **daily backups** and **monthly archives** of your entire Airtable production database:

- **Daily Backups**: Kept for 60 days, then auto-deleted
- **Monthly Backups**: Kept forever (created on 1st of each month)
- **Runs**: Every day at 2 AM Pacific Time
- **Storage**: `/backups/production/` directory in this repository

## Backup Structure

```
/backups/
  /production/
    /daily/
      backup-2025-01-15_02-00-00.json
      backup-2025-01-14_02-00-00.json
      ...
    /monthly/
      backup-2025-01-01_02-00-00.json
      backup-2024-12-01_02-00-00.json
      ...
```

## What Gets Backed Up

Each backup includes:
- ✅ All table data (records with all fields)
- ✅ Schema information (table names, field types)
- ✅ Metadata (timestamp, record counts)
- ❌ Attachments/files (not included to keep size manageable)
- ❌ Automations, interfaces, views (not available via API)

## Setup Instructions

### 1. Add GitHub Secret

The backup script needs your Airtable API key:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `AIRTABLE_API_KEY`
5. Value: Your Airtable Personal Access Token (same one you use for the app)
6. Click **Add secret**

### 2. Verify Configuration

The backup is configured for:
- **Base ID**: `appZoy2JCOlXfwSVx` (production)
- **Schedule**: 2 AM Pacific (10 AM UTC)
- **Retention**: 60 days for daily, forever for monthly

If you need to change these, edit:
- Base ID: `.github/workflows/airtable-backup.yml` (line 25)
- Schedule: `.github/workflows/airtable-backup.yml` (line 10)
- Retention: `scripts/backup-airtable.js` (line 117)

### 3. Test the Backup

**Option A: Wait for it to run** (tomorrow at 2 AM Pacific)

**Option B: Trigger manually:**
1. Go to **Actions** tab in GitHub
2. Click **Airtable Daily Backup** workflow
3. Click **Run workflow** → **Run workflow**
4. Wait ~30 seconds
5. Check the `/backups/production/daily/` directory for the new file

## How It Works

### GitHub Actions Workflow
Every day at 2 AM Pacific:
1. Checks out the repository
2. Runs the backup script
3. Commits the new backup file to `/backups/production/`
4. Pushes the changes to GitHub
5. Auto-cleans up backups older than 60 days (daily only)

### Backup Script
The `scripts/backup-airtable.js` script:
1. Fetches all tables from your Airtable base
2. Downloads all records from each table (handles pagination)
3. Saves everything as JSON with timestamp
4. Places in `/daily` or `/monthly` folder (based on date)
5. Cleans up old daily backups (keeps last 60 days)

## Using the Backups

### Viewing a Backup
Backups are JSON files. To view:
```bash
# Pretty-print a backup file
cat backups/production/daily/backup-2025-01-15_02-00-00.json | jq '.'

# See just the metadata
cat backups/production/daily/backup-2025-01-15_02-00-00.json | jq '.metadata'

# Count records in a specific table
cat backups/production/daily/backup-2025-01-15_02-00-00.json | jq '.tables["Class Registrations"].recordCount'
```

### Restoring Data
Since you have Airtable snapshots for full restoration, use these backups for:

1. **Reference**: "What was the value on January 15?"
2. **Audit trail**: "Did this record exist?"
3. **Data recovery**: "I need to restore just this one table"
4. **Compliance**: "Prove we had this data on this date"

For partial restoration, you would:
1. Open the backup JSON file
2. Find the records you need
3. Use Airtable's CSV Import or API to restore specific records

## Monitoring

### Check if Backups Are Working
1. Go to **Actions** tab in GitHub
2. Look for green checkmarks ✅ on "Airtable Daily Backup" runs
3. Check `/backups/production/daily/` for recent files

### Email Notifications
By default, GitHub will email you if a workflow fails. To adjust:
1. Go to your GitHub settings → Notifications
2. Configure "Actions" notifications

### What to Do If a Backup Fails
1. Go to **Actions** tab
2. Click on the failed workflow run
3. Read the error logs
4. Common issues:
   - **API key expired**: Update the `AIRTABLE_API_KEY` secret
   - **Rate limit**: Airtable may throttle; will retry next day
   - **Network issue**: Usually resolves itself; manual retry if urgent

## Storage Considerations

### Estimated Sizes
Based on typical class registration business:
- Daily backup: ~2-10 MB per file
- 60 daily backups: ~120-600 MB total
- Monthly backups: ~2-10 MB per file (12-24 files per year)
- **Total after 2 years**: ~400-800 MB

GitHub free tier allows 1 GB per repository, so you're well within limits.

### If Storage Becomes an Issue
You can adjust retention in `scripts/backup-airtable.js`:
```javascript
// Change line 117 from:
const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);
// To keep only 30 days:
const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
```

## Security Notes

- ✅ API key stored as GitHub secret (encrypted)
- ✅ Backups are in your private repository
- ✅ No sensitive data exposed in logs
- ⚠️ Backups contain customer PII - keep repo private
- ⚠️ Limit who has access to this repository

## Troubleshooting

### "No backups are being created"
- Check Actions tab for failed runs
- Verify `AIRTABLE_API_KEY` secret is set correctly
- Ensure API token has `data.records:read` and `schema.bases:read` scopes

### "Backup file is empty or missing tables"
- Check if table names changed in Airtable
- Verify API token has access to the production base
- Look at the workflow logs for specific error messages

### "Old backups aren't being deleted"
- Cleanup only runs for daily backups, not monthly
- Requires backups to be >60 days old
- Check that the script has write permissions (it should)

## Manual Backup

To run a backup manually from your local machine:

```bash
# Set environment variable
export AIRTABLE_API_KEY="your-api-key-here"

# Run backup script
node scripts/backup-airtable.js
```

The backup will be saved to `/backups/production/daily/` or `/monthly/` depending on the date.

## Disaster Recovery Plan

In case of catastrophic data loss:

1. **Use Airtable Snapshots first** (fastest full restoration)
   - Go to base → History → Snapshots
   - Restore from the most recent snapshot

2. **Use GitHub backups for reference**
   - Find the backup closest to the desired date
   - Extract specific data that wasn't in the snapshot
   - Use Airtable CSV Import or API to restore specific records

3. **Combine both methods**
   - Restore base from snapshot
   - Use GitHub backup to verify data integrity
   - Fill in any gaps manually

## Questions?

Contact the developer who set this up or refer to:
- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Last Updated**: January 2025  
**Backup System Version**: 1.0  
**Production Base**: appZoy2JCOlXfwSVx
