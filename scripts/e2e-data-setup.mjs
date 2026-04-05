#!/usr/bin/env node
// scripts/e2e-data-setup.mjs
// Pre-test data setup and cleanup for Playwright E2E tests.
//
// Order of operations:
//   1. Cleanup old test data (bookings + schedules older than 7 days)
//   2. Ensure future-dated class sessions exist for all 3 booking types
//
// Environment variables required:
//   STAGING_AIRTABLE_API_KEY
//   STAGING_AIRTABLE_BASE_ID
//
// Outputs (written to e2e-test-data.json for tests to consume):
//   { adult: { scheduleId, classSchedule }, motherDaughter: {...}, communityMD: {...} }

import { writeFileSync } from 'fs';

const API_KEY = process.env.STAGING_AIRTABLE_API_KEY;
const BASE_ID = process.env.STAGING_AIRTABLE_BASE_ID;

if (!API_KEY || !BASE_ID) {
  console.error('Missing STAGING_AIRTABLE_API_KEY or STAGING_AIRTABLE_BASE_ID');
  process.exit(1);
}

const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

// Known class record IDs in staging (active, bookable via SWSD website)
const CLASS_IDS = {
  adult: 'recM3vKQwRXZtGLaa',           // Adult&Teen - Not Sponsored
  motherDaughter: 'rec3mPusVO6enAAGw',    // Mothers&Daughters - New
  communityMD: 'recci6R7bbj0ubPhk',       // Mothers&Daughters - Girl Scouts Community
};

const TEST_EMAIL = 'info@streetwiseselfdefense.com';
const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

// ─── Airtable helpers ───────────────────────────────────────────────

async function airtableFetch(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}/${endpoint}`, { headers: HEADERS, ...options });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${res.status}: ${body}`);
  }
  return res.json();
}

async function airtableList(table, filterFormula) {
  const encoded = encodeURIComponent(filterFormula);
  const url = `${encodeURIComponent(table)}?filterByFormula=${encoded}`;
  const data = await airtableFetch(url);
  return data.records || [];
}

async function airtableDeleteBatch(table, ids) {
  // Airtable delete supports max 10 records per request
  let deleted = 0;
  for (let i = 0; i < ids.length; i += 10) {
    const batch = ids.slice(i, i + 10);
    const params = batch.map(id => `records[]=${id}`).join('&');
    await fetch(`${BASE_URL}/${encodeURIComponent(table)}?${params}`, {
      method: 'DELETE',
      headers: HEADERS,
    });
    deleted += batch.length;
  }
  return deleted;
}

async function airtableUpdate(table, id, fields) {
  const data = await airtableFetch(`${encodeURIComponent(table)}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  });
  return data;
}

async function airtableCreate(table, fields) {
  const data = await airtableFetch(encodeURIComponent(table), {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
  return data;
}

// ─── Step 1: Cleanup old test data ──────────────────────────────────

async function cleanupOldTestData() {
  console.log('\n=== STEP 1: Cleanup old test data ===\n');

  // 1a. Delete old test bookings (email = test email AND older than 7 days)
  const oldBookings = await airtableList(
    'Bookings',
    `AND({Contact Email}='${TEST_EMAIL}', IS_BEFORE({Created time}, '${SEVEN_DAYS_AGO}'))`
  );

  if (oldBookings.length > 0) {
    // First delete associated participants
    for (const booking of oldBookings) {
      const participantIds = booking.fields.Participants || [];
      if (participantIds.length > 0) {
        const deleted = await airtableDeleteBatch('Participants', participantIds);
        console.log(`  Deleted ${deleted} participants for booking ${booking.id}`);
      }
    }

    const bookingIds = oldBookings.map(r => r.id);
    const deleted = await airtableDeleteBatch('Bookings', bookingIds);
    console.log(`  Cleaned up ${deleted} old test bookings`);
  } else {
    console.log('  No old test bookings to clean up');
  }

  // 1b. Delete old auto-created test class schedules (older than 7 days)
  // These have Special Notes containing "E2E_TEST_SCHEDULE"
  const oldSchedules = await airtableList(
    'Class Schedules',
    `AND(FIND('E2E_TEST_SCHEDULE', {Special Notes}), IS_BEFORE({Created time}, '${SEVEN_DAYS_AGO}'))`
  );

  if (oldSchedules.length > 0) {
    const scheduleIds = oldSchedules.map(r => r.id);
    const deleted = await airtableDeleteBatch('Class Schedules', scheduleIds);
    console.log(`  Cleaned up ${deleted} old test class schedules`);
  } else {
    console.log('  No old test class schedules to clean up');
  }
}

// ─── Step 2: Ensure future class sessions exist ─────────────────────

async function ensureTestSchedules() {
  console.log('\n=== STEP 2: Ensure future class sessions exist ===\n');

  const now = new Date();
  const testDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days from now
  const dateStr = testDate.toISOString().split('T')[0]; // YYYY-MM-DD

  // Start time = test date at 10am Pacific (17:00 UTC)
  const startTime = `${dateStr}T17:00:00.000Z`;
  // End time = test date at 1pm Pacific (20:00 UTC)
  const endTime = `${dateStr}T20:00:00.000Z`;

  // Fetch class details for metadata needed by tests
  const classDetails = {};
  for (const [type, classId] of Object.entries(CLASS_IDS)) {
    const classRecord = await airtableFetch(`${encodeURIComponent('Classes')}/${classId}`);
    classDetails[type] = classRecord.fields;
  }

  const results = {};

  for (const [type, classId] of Object.entries(CLASS_IDS)) {
    // Check for existing future non-cancelled schedule for this class
    const existing = await airtableList(
      'Class Schedules',
      `AND({Class}='${classId}', IS_AFTER({Date}, '${now.toISOString().split('T')[0]}'), NOT({Is Cancelled}))`
    );

    let scheduleId, scheduleDate, scheduleStart, scheduleEnd;

    if (existing.length > 0) {
      const schedule = existing[0];
      const spots = schedule.fields['Available Spots'] || 0;
      const booked = schedule.fields['Booked Spots'] || 0;
      console.log(`  ${type}: Found existing future schedule ${schedule.id} (date: ${schedule.fields.Date}, spots: ${spots}, booked: ${booked})`);

      // Reset Available Spots to ensure there's room for test bookings
      if (spots - booked < 5) {
        await airtableUpdate('Class Schedules', schedule.id, { 'Available Spots': booked + 20 });
        console.log(`  ${type}: Reset Available Spots to ${booked + 20} (was ${spots})`);
      }

      scheduleId = schedule.id;
      scheduleDate = schedule.fields.Date;
      scheduleStart = schedule.fields['Start Time New'];
      scheduleEnd = schedule.fields['End Time New'];
    } else {
      console.log(`  ${type}: No future schedule found — creating one for ${dateStr}`);
      const created = await airtableCreate('Class Schedules', {
        Class: [classId],
        Date: dateStr,
        'Start Time New': startTime,
        'End Time New': endTime,
        'Available Spots': 20,
        'Special Notes': 'E2E_TEST_SCHEDULE — auto-created for Playwright tests',
      });
      console.log(`  ${type}: Created schedule ${created.id}`);
      scheduleId = created.id;
      scheduleDate = dateStr;
      scheduleStart = startTime;
      scheduleEnd = endTime;
    }

    const cls = classDetails[type];
    results[type] = {
      scheduleId,
      classSchedule: {
        id: scheduleId,
        class_name: cls['Class Name'] || '',
        type: cls['Type']?.toLowerCase() || '',
        date: scheduleDate,
        start_time: scheduleStart,
        end_time: scheduleEnd,
        price: cls['Price'] || 1,
        location: cls['Location'] || '',
      },
    };
  }

  return results;
}

// ─── Main ───────────────────────────────────────────────────────────

async function main() {
  console.log('E2E Test Data Setup');
  console.log(`Base: ${BASE_ID}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  // Safety check: refuse to run against production base
  const PRODUCTION_BASE_ID = 'appZoy2JCOlXfwSVx';
  if (BASE_ID === PRODUCTION_BASE_ID) {
    console.error('\nABORTED: Refusing to run against production Airtable base!');
    process.exit(1);
  }

  await cleanupOldTestData();
  const results = await ensureTestSchedules();

  // Write results for tests to consume
  writeFileSync('e2e-test-data.json', JSON.stringify(results, null, 2));
  console.log(`\nWrote e2e-test-data.json: ${JSON.stringify(results)}`);
  console.log('\nData setup complete.\n');
}

main().catch(err => {
  console.error('Data setup failed:', err);
  process.exit(1);
});
