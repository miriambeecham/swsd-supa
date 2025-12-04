// /scripts/backup-airtable.js
// Backs up Airtable production database to GitHub
// Runs daily at 2 AM Pacific via GitHub Actions

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appZoy2JCOlXfwSVx';
const API_KEY = process.env.AIRTABLE_API_KEY;
const BACKUP_DIR = path.join(__dirname, '..', 'backups', 'production');

// Validate environment
if (!API_KEY) {
  console.error('❌ AIRTABLE_API_KEY environment variable is required');
  process.exit(1);
}

// Helper: Make HTTPS request
function httpsRequest(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

// Fetch all records from a table (handles pagination)
async function fetchTableRecords(tableName) {
  console.log(`  📥 Fetching ${tableName}...`);
  const headers = { 'Authorization': `Bearer ${API_KEY}` };
  let allRecords = [];
  let offset = null;

  do {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(tableName)}${offset ? `?offset=${offset}` : ''}`;
    const response = await httpsRequest(url, headers);
    allRecords = allRecords.concat(response.records || []);
    offset = response.offset;
    
    if (offset) {
      console.log(`    ... fetched ${allRecords.length} records so far...`);
    }
  } while (offset);

  console.log(`  ✅ Fetched ${allRecords.length} records from ${tableName}`);
  return allRecords;
}

// Get base schema (tables and their fields)
async function getBaseSchema() {
  console.log('📋 Fetching base schema...');
  const headers = { 'Authorization': `Bearer ${API_KEY}` };
  const url = `https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`;
  
  try {
    const response = await httpsRequest(url, headers);
    return response.tables || [];
  } catch (error) {
    console.error('⚠️  Could not fetch schema via API, will use manual table list');
    // Fallback: Known tables from your schema
    return [
      { id: 'tblClasses', name: 'Classes' },
      { id: 'tblSchedules', name: 'Class Schedules' },
      { id: 'tblRegistrations', name: 'Class Registrations' },
      { id: 'tblTestimonials', name: 'Testimonials' },
      { id: 'tblInstructors', name: 'Instructors' }
    ];
  }
}

// Ensure backup directories exist
function ensureBackupDirs() {
  const dailyDir = path.join(BACKUP_DIR, 'daily');
  const monthlyDir = path.join(BACKUP_DIR, 'monthly');
  
  [BACKUP_DIR, dailyDir, monthlyDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
  
  return { dailyDir, monthlyDir };
}

// Clean up old daily backups (keep only last 60 days)
function cleanupOldBackups(dailyDir) {
  console.log('\n🧹 Cleaning up old backups...');
  const files = fs.readdirSync(dailyDir);
  const now = Date.now();
  const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);
  
  let deletedCount = 0;
  files.forEach(file => {
    if (!file.endsWith('.json')) return;
    
    const filePath = path.join(dailyDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.mtimeMs < sixtyDaysAgo) {
      fs.unlinkSync(filePath);
      deletedCount++;
      console.log(`  🗑️  Deleted old backup: ${file}`);
    }
  });
  
  if (deletedCount === 0) {
    console.log('  ✅ No old backups to clean up');
  } else {
    console.log(`  ✅ Deleted ${deletedCount} old backup(s)`);
  }
}

// Main backup function
async function runBackup() {
  console.log('🚀 Starting Airtable backup...\n');
  console.log(`📍 Base ID: ${BASE_ID}`);
  console.log(`📅 Timestamp: ${new Date().toISOString()}\n`);

  try {
    // Ensure directories exist
    const { dailyDir, monthlyDir } = ensureBackupDirs();

    // Get schema
    const tables = await getBaseSchema();
    console.log(`✅ Found ${tables.length} tables\n`);

    // Fetch data from all tables
    const backup = {
      metadata: {
        timestamp: new Date().toISOString(),
        baseId: BASE_ID,
        tablesCount: tables.length
      },
      schema: tables.map(t => ({
        id: t.id,
        name: t.name,
        fields: t.fields || []
      })),
      tables: {}
    };

    for (const table of tables) {
      try {
        const records = await fetchTableRecords(table.name);
        backup.tables[table.name] = {
          tableId: table.id,
          recordCount: records.length,
          records: records
        };
      } catch (error) {
        console.error(`  ❌ Failed to fetch ${table.name}:`, error.message);
        backup.tables[table.name] = {
          tableId: table.id,
          error: error.message,
          records: []
        };
      }
    }

    // Generate filename with timestamp
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                     now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `backup-${timestamp}.json`;

    // Determine if this is a monthly backup (1st of month)
    const isMonthly = now.getDate() === 1;
    const targetDir = isMonthly ? monthlyDir : dailyDir;
    const filePath = path.join(targetDir, filename);

    // Write backup file
    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));
    console.log(`\n✅ Backup saved to: ${path.relative(process.cwd(), filePath)}`);
    console.log(`📊 Total records backed up: ${Object.values(backup.tables).reduce((sum, t) => sum + (t.recordCount || 0), 0)}`);
    console.log(`📦 File size: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB`);
    
    if (isMonthly) {
      console.log(`📌 This is a MONTHLY backup (saved to monthly folder)`);
    }

    // Cleanup old daily backups (but not monthly)
    if (!isMonthly) {
      cleanupOldBackups(dailyDir);
    }

    console.log('\n✨ Backup completed successfully!');
    return true;

  } catch (error) {
    console.error('\n❌ Backup failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBackup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runBackup };
