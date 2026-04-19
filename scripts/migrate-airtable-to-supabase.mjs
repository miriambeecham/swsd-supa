#!/usr/bin/env node
// scripts/migrate-airtable-to-supabase.mjs
//
// One-time data migration: Airtable production → Supabase staging.
//
// Idempotent: every row upserts on `airtable_record_id` (unique column on every
// Supabase table), so re-running the script will update existing rows rather
// than duplicate them.
//
// Airtable autonumber values (Booking ID, Participant ID, etc.) are preserved
// explicitly. At the end, the script prints SQL to advance each identity
// sequence past the highest migrated value — run that in Supabase SQL editor
// once after the first successful migration.
//
// Required environment variables:
//   AIRTABLE_API_KEY       — Airtable personal access token
//   AIRTABLE_BASE_ID       — Production base ID
//   SUPABASE_URL           — Staging project URL
//   SUPABASE_SERVICE_KEY   — Staging project service-role key
//
// Usage:
//   node scripts/migrate-airtable-to-supabase.mjs
//   node scripts/migrate-airtable-to-supabase.mjs --tables=classes,bookings
//   node scripts/migrate-airtable-to-supabase.mjs --dry-run
//
// Prerequisite: `npm install @supabase/supabase-js` (not yet in package.json)

import https from 'https';
import { createClient } from '@supabase/supabase-js';

// =============================================================================
// Config
// =============================================================================
const AIRTABLE_API_KEY     = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID     = process.env.AIRTABLE_BASE_ID;
const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY_TABLES = (args.find(a => a.startsWith('--tables=')) || '')
  .split('=')[1]?.split(',').map(s => s.trim()).filter(Boolean) || null;

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Migrate Airtable production → Supabase staging.

Usage:
  node scripts/migrate-airtable-to-supabase.mjs [options]

Options:
  --tables=<csv>   Only migrate the listed Supabase table names
                   (e.g. --tables=classes,bookings,participants)
  --dry-run        Fetch from Airtable but do not write to Supabase
  -h, --help       Show this help
`);
  process.exit(0);
}

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ AIRTABLE_API_KEY and AIRTABLE_BASE_ID are required');
  process.exit(1);
}
if (!DRY_RUN && (!SUPABASE_URL || !SUPABASE_SERVICE_KEY)) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY are required (omit with --dry-run)');
  process.exit(1);
}

const supabase = DRY_RUN
  ? null
  : createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

// =============================================================================
// Airtable fetch (paginated, rate-limited)
// =============================================================================
function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 500)}`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchAllRecords(tableName) {
  const headers = { Authorization: `Bearer ${AIRTABLE_API_KEY}` };
  const all = [];
  let offset = null;
  let page = 0;
  do {
    const qs = new URLSearchParams({ pageSize: '100' });
    if (offset) qs.set('offset', offset);
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}?${qs}`;
    const res = await httpsGet(url, headers);
    all.push(...(res.records || []));
    offset = res.offset;
    page++;
    if (offset && page % 5 === 0) {
      console.log(`     … ${all.length} rows fetched so far`);
    }
    if (offset) await new Promise(r => setTimeout(r, 220)); // Airtable: 5 req/s per base
  } while (offset);
  return all;
}

// =============================================================================
// Supabase upsert + ID map
// =============================================================================
async function upsertRows(supabaseTable, rows) {
  if (DRY_RUN) {
    return { count: rows.length, errors: [] };
  }
  const errors = [];
  let count = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { data, error } = await supabase
      .from(supabaseTable)
      .upsert(chunk, { onConflict: 'airtable_record_id' })
      .select('id');
    if (error) {
      errors.push({ offset: i, message: error.message, details: error.details });
      console.error(`     ❌ rows ${i}..${i + chunk.length - 1}: ${error.message}`);
      if (error.details) console.error(`        ${error.details}`);
    } else {
      count += data.length;
    }
  }
  return { count, errors };
}

async function buildIdMap(supabaseTable) {
  if (DRY_RUN) return new Map();
  const map = new Map();
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(supabaseTable)
      .select('id, airtable_record_id')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Failed to build id map for ${supabaseTable}: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data) {
      if (row.airtable_record_id) map.set(row.airtable_record_id, row.id);
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return map;
}

// =============================================================================
// Transform helpers
// =============================================================================
const firstLink = (val, map) => {
  if (!val || !Array.isArray(val) || val.length === 0) return null;
  const airtableId = val[0];
  return map ? (map.get(airtableId) || null) : airtableId;
};

const str  = (v) => (v === undefined || v === null || v === '') ? null : String(v);
const num  = (v) => (v === undefined || v === null || v === '') ? null : Number(v);
const bool = (v) => v === true;
const ts   = (v) => v ? new Date(v).toISOString() : null;
const dateOnly = (v) => {
  if (!v) return null;
  return typeof v === 'string' && v.length >= 10 ? v.slice(0, 10) : null;
};
const arr = (v) => Array.isArray(v) ? v : (v ? [v] : null);

// Coerce Airtable enum values to NULL if they're outside the schema CHECK
// allowlist. Logs once per (table, column, value) combo so we can see what's
// getting dropped without flooding output.
const droppedEnumValues = new Set();
const enumOrNull = (v, allowed, label) => {
  if (v === undefined || v === null || v === '') return null;
  const s = String(v);
  if (allowed.includes(s)) return s;
  const key = `${label}:${s}`;
  if (!droppedEnumValues.has(key)) {
    droppedEnumValues.add(key);
    console.warn(`      ⚠️  dropping out-of-enum value ${label}="${s}" (allowed: ${allowed.join(', ')})`);
  }
  return null;
};

// =============================================================================
// Per-table transforms
// =============================================================================
function transformClass(rec) {
  const f = rec.fields;
  return {
    airtable_record_id: rec.id,
    class_id: str(f['ID']),
    class_name: str(f['Class Name']) || 'Untitled',
    description: str(f['Description']),
    type: str(f['Type']),
    age_range: str(f['Age Range']),
    duration: num(f['Duration']),
    max_participants: num(f['Max Participants']),
    location: str(f['Location']),
    instructor: str(f['Instructor']),
    price: num(f['Price']),
    booking_method: str(f['Booking Method']),
    registration_instructions: str(f['Registration Instructions']),
    is_active: bool(f['Is Active']),
    partner_organization: str(f['Partner Organization']),
    city: str(f['City']),
    parking_instructions: str(f['Parking Instructions']),
    parking_map_url: str(f['Parking Map URL']),
    pricing_unit: str(f['Pricing Unit']),
    created_at: ts(rec.createdTime),
  };
}

function transformClassSchedule(rec, maps) {
  const f = rec.fields;
  return {
    airtable_record_id: rec.id,
    schedule_id: num(f['Id']),  // Airtable autonumber, preserved
    class_id: firstLink(f['Class'], maps.classes),
    date: dateOnly(f['Date']),
    start_time: str(f['Start Time']),
    end_time: str(f['End Time']),
    start_time_new: ts(f['Start Time New']),
    end_time_new: ts(f['End Time New']),
    is_cancelled: bool(f['Is Cancelled']),
    special_notes: str(f['Special Notes']),
    description: str(f['Description']),
    booking_url: str(f['Booking URL']),
    pricing_unit: str(f['Pricing Unit']),
    registration_opens: ts(f['Registration Opens']),
    available_spots: num(f['Available Spots']),
    waiver_url: str(f['Waiver URL']),
    synced_to_zoho: bool(f['Synced to Zoho']),
    created_at: ts(rec.createdTime),
  };
}

function transformBooking(rec, maps) {
  const f = rec.fields;
  return {
    airtable_record_id: rec.id,
    booking_id: num(f['Booking ID']),
    class_schedule_id: firstLink(f['Class Schedule'], maps.class_schedules),
    booking_date: ts(f['Booking Date']),
    status: str(f['Status']),
    contact_first_name: str(f['Contact First Name']),
    contact_last_name: str(f['Contact Last Name']),
    contact_email: str(f['Contact Email']),
    contact_phone: str(f['Contact Phone']),
    contact_is_participant: bool(f['Contact Is Participant']),
    number_of_participants: num(f['Number of Participants']),
    total_amount: num(f['Total Amount']),
    stripe_payment_intent_id: str(f['Stripe Payment Intent ID']),
    stripe_checkout_session_id: str(f['Stripe Checkout Session ID']),
    payment_status: str(f['Payment Status']),
    payment_date: ts(f['Payment Date']),
    payment_notes: str(f['Payment Notes']),
    age_validation_status: str(f['Age Validation Status']),
    validation_notes: str(f['Validation Notes']),
    refund_status: str(f['Refund Status']),
    refund_amount: num(f['Refund Amount']),
    refund_date: ts(f['Refund Date']),
    refund_reason: str(f['Refund Reason']),
    refund_notes: str(f['Refund Notes']),
    participants_json: str(f['Participants JSON']),
    hold_expires_at: ts(f['Hold Expires At']),
    zoho_synced: bool(f['Zoho Synced']),

    confirmation_email_id: str(f['Confirmation Email ID']),
    confirmation_email_status: str(f['Confirmation Email Status']),
    confirmation_email_sent_at: ts(f['Confirmation Email Sent At']),
    confirmation_email_delivered_at: ts(f['Confirmation Email Delivered At']),
    confirmation_email_clicked_at: ts(f['Confirmation Email Clicked At']),

    reminder_email_id: str(f['Reminder Email ID']),
    reminder_email_status: str(f['Reminder Email Status']),
    reminder_email_sent_at: ts(f['Reminder Email Sent At']),
    reminder_email_delivered_at: ts(f['Reminder Email Delivered At']),
    reminder_email_clicked_at: ts(f['Reminder Email Clicked At']),

    followup_email_id: str(f['Followup Email ID']),
    followup_email_status: str(f['Followup Email Status']),
    followup_email_sent_at: ts(f['Followup Email Sent At']),
    followup_email_delivered_at: ts(f['Followup Email Delivered At']),
    followup_email_clicked_at: ts(f['Followup Email Clicked At']),

    email_unsubscribed: bool(f['Email Unsubscribed']),
    email_unsubscribed_at: ts(f['Email Unsubscribed At']),

    reminder_sms_id: str(f['Reminder SMS ID']),
    reminder_sms_status: str(f['Reminder SMS Status']),
    reminder_sms_sent_at: ts(f['Reminder SMS Sent At']),
    reminder_sms_delivered_at: ts(f['Reminder SMS Delivered At']),

    preclass_sms_id: str(f['Preclass SMS ID']),
    preclass_sms_status: str(f['Preclass SMS Status']),
    preclass_sms_sent_at: ts(f['Preclass SMS Sent At']),
    preclass_sms_delivered_at: ts(f['Preclass SMS Delivered At']),

    sms_unsubscribed: bool(f['SMS Unsubscribed']),
    sms_unsubscribed_at: ts(f['SMS Unsubscribed At']),
    sms_consent_date: ts(f['SMS Consent Date']),
    sms_opted_out_date: ts(f['SMS Opted Out Date']),

    original_participant_count: num(f['Original Participant Count']),
    offshoot_booking_ids: str(f['Offshoot Booking IDs']),
    original_booking_id: str(f['Original Booking ID']),
    reschedule_status: str(f['Reschedule Status']),
    reschedule_notes: str(f['Reschedule Notes']),
    created_at: ts(rec.createdTime),
  };
}

function transformParticipant(rec, maps) {
  const f = rec.fields;
  return {
    airtable_record_id: rec.id,
    participant_id: num(f['Participant ID']),
    booking_id: firstLink(f['Booking'], maps.bookings),
    first_name: str(f['First Name']) || '',
    last_name: str(f['Last Name']) || '',
    age_group: enumOrNull(f['Age Group'], ['Under 12', '12-15', '16+'], 'participants.age_group'),
    participant_number: num(f['Participant Number']),
    special_needs: str(f['Special Needs']),
    guardian_name: str(f['Guardian Name']),
    dietary_requirements: str(f['Dietary Requirements']),
    contact_email: str(f['Contact Email']),
    emergency_contact_number: str(f['Emergency Contact Number']),
    attendance: str(f['Attendance']) || 'Not Recorded',
    teaching_assistants: str(f['Teaching Assistants']),

    confirmation_email_id: str(f['Confirmation Email ID']),
    confirmation_email_status: str(f['Confirmation Email Status']),
    confirmation_email_sent_at: ts(f['Confirmation Email Sent At']),
    confirmation_email_delivered_at: ts(f['Confirmation Email Delivered At']),
    confirmation_email_opened_at: ts(f['Confirmation Email Opened At']),

    reminder_email_id: str(f['Reminder Email ID']),
    reminder_email_status: str(f['Reminder Email Status']),
    reminder_email_sent_at: ts(f['Reminder Email Sent At']),
    reminder_email_delivered_at: ts(f['Reminder Email Delivered At']),
    reminder_email_opened_at: ts(f['Reminder Email Opened At']),

    created_at: ts(rec.createdTime),
  };
}

function transformPerson(rec, maps) {
  const f = rec.fields;
  return {
    airtable_record_id: rec.id,
    name: str(f['Name']) || 'Unknown',
    email: str(f['Email']),
    phone: str(f['Phone']),
    roles: arr(f['Roles']),
    status: str(f['Status']) || 'Active',
    notes: str(f['Notes']),
    emergency_contact_name: str(f['Emergency Contact Name']),
    emergency_contact_relationship: str(f['Emergency Contact Relationship']),
    emergency_contact_phone: str(f['Emergency Contact Phone']),
    emergency_contact_email: str(f['Emergency Contact Email']),
    source_participant_id: firstLink(f['Source Participant'], maps.participants),
    created_at: ts(rec.createdTime),
  };
}

function transformTeachingAssignment(rec, maps) {
  const f = rec.fields;
  return {
    airtable_record_id: rec.id,
    assignment_id: num(f['Assignment ID']),
    person_id: firstLink(f['Person'], maps.persons),
    class_schedule_id: firstLink(f['Class Schedule'], maps.class_schedules),
    assignment_notes: str(f['Assignment Notes']),
    created_at: ts(rec.createdTime),
  };
}

function transformTestimonial(rec) {
  const f = rec.fields;
  return {
    airtable_record_id: rec.id,
    testimonial_id: str(f['ID']),
    name: str(f['Name']),
    content: str(f['Content']) || '',
    rating: f['Rating'] !== undefined && f['Rating'] !== null ? String(f['Rating']) : null,
    class_type: str(f['Class Type']),
    platform: str(f['Platform']),
    review_date: dateOnly(f['Review Date']),
    profile_picture: f['Profile Picture'] || null,
    platform_screenshot: f['Platform Screenshot'] || null,
    original_review_url: str(f['Original Review URL']),
    profile_image_url: str(f['Profile Image URL']),
    is_featured: bool(f['Is Featured']),
    is_published: bool(f['Is Published']),
    status: str(f['Status']) || 'Active',
    internal_notes: str(f['Internal Notes']),
    homepage_position: str(f['Homepage position']),
    created_at: ts(rec.createdTime),
  };
}

function transformSurvey(rec, maps) {
  const f = rec.fields;
  return {
    airtable_record_id: rec.id,
    survey_id: num(f['Survey ID']),
    submission_date: ts(f['Submission Date']) || ts(rec.createdTime),
    class_schedule_id: firstLink(f['Class Schedule'], maps.class_schedules),
    first_name: str(f['First Name']),
    last_name: str(f['Last Name']),
    email: str(f['Email']),
    phone: str(f['Phone']),
    q1_overall_experience: str(f['Q1: Overall Experience']),
    q2_confidence_level: str(f['Q2: Confidence Level']),
    q3_most_valuable_part: str(f['Q3: Most Valuable Part']),
    q4_areas_for_improvement: str(f['Q4: Areas for Improvement']),
    q5_would_recommend: str(f['Q5: Would Recommend']),
    q6_opt_in_future_communication: str(f['Q6: Opt-in to Future Communication']),
    q7_willing_to_share_experience: str(f['Q7: Willing to Share Experience']),
    q7_written_testimonial: str(f['Q7: Written Testimonial']),
    q7_review_platform_clicked: str(f['Q7: Review Platform Clicked']),
    preferred_contact_method: arr(f['Preferred Contact Method']),
    ip_address: str(f['IP Address']),
    user_agent: str(f['User Agent']),
    created_at: ts(rec.createdTime),
  };
}

function transformFormSubmission(rec) {
  const f = rec.fields;
  return {
    airtable_record_id: rec.id,
    submission_id: num(f['ID']),
    first_name: str(f['First Name']),
    last_name: str(f['Last Name']),
    email: str(f['Email']),
    phone: str(f['Phone']),
    form_type: str(f['Form Type']),
    submitted_date: ts(f['Submitted Date']),
    status: str(f['Status']) || 'New',
    newsletter_signup: bool(f['Newsletter Signup']),
    notes: str(f['Notes']),
    follow_up_date: dateOnly(f['Follow-up Date']),
    web_lead_message: str(f['Web Lead Message']),
    city: str(f['City']),
    state: str(f['State']),
    organization: str(f['Organization']),
    title: str(f['Title']),
    created_at: ts(rec.createdTime),
  };
}

function transformCategory(rec) {
  const f = rec.fields;
  return {
    airtable_record_id: rec.id,
    category_name: str(f['Category Name']) || 'Untitled',
    display_order: num(f['Display Order']),
    is_active: bool(f['Is Active']),
    description: str(f['Description']),
    faq_copy: str(f['FAQ copy']),
    whattoexpect_content_cwc_15plus_copy: str(f['WhatToExpect Content CWC 15+ copy']),
    created_at: ts(rec.createdTime),
  };
}

function transformFaq(rec, maps) {
  const f = rec.fields;
  return {
    airtable_record_id: rec.id,
    faq_id: num(f['ID']),
    question: str(f['Question']) || '',
    answer: str(f['Answer']) || '',
    category_id: firstLink(f['Category'], maps.categories),
    question_order: num(f['Question Order']),
    is_published: bool(f['Is Published']),
    categories_copy: str(f['Categories copy']),
    created_at: ts(rec.createdTime),
  };
}

function transformWaiver(rec) {
  const f = rec.fields;
  // Airtable "User (collaborator)" returns {id, email, name} — preserve name (fall back to email)
  const assigneeRaw = f['Assignee'];
  const assignee = assigneeRaw && typeof assigneeRaw === 'object'
    ? (assigneeRaw.name || assigneeRaw.email || null)
    : str(assigneeRaw);

  return {
    airtable_record_id: rec.id,
    name: str(f['Name']) || 'Unknown',
    notes: str(f['Notes']),
    assignee,
    status: str(f['Status']),
    attachments: f['Attachments'] || null,
    attachment_summary: str(f['Attachment Summary']),
    document_id: str(f['Document ID']),
    first_name: str(f['First Name']),
    last_name: str(f['Last Name']),
    email: str(f['Email']),
    document_name: str(f['Document Name']),
    phone: str(f['Phone']),
    date_of_birth: dateOnly(f['Date of Birth']),
    street_address: str(f['Street Address']),
    city: str(f['City']),
    state: str(f['State']),
    zip_code: str(f['Zip Code']),
    completed_date: ts(f['Completed Date']),
    waiver_url: str(f['Waiver URL']),
    guardian_send_email: bool(f['Guardian Send Email']),
    guardian_send_sms: bool(f['Guardian Send SMS']),
    is_adult: bool(f['Is Adult']),
    course_location: str(f['Course Location']),
    emergency_contact_name: str(f['Emergency Contact Name']),
    emergency_contact_phone: str(f['Emergency Contact Phone']),
    referral_source: str(f['Referral Source']),
    created_at: ts(rec.createdTime),
  };
}

// =============================================================================
// Migration plan (dependency-ordered)
// =============================================================================
const MIGRATIONS = [
  // No FK dependencies
  { airtable: 'Classes',              supabase: 'classes',              transform: transformClass,              idColumn: null },
  { airtable: 'Testimonials',         supabase: 'testimonials',         transform: transformTestimonial,        idColumn: null },
  { airtable: 'Categories',           supabase: 'categories',           transform: transformCategory,           idColumn: null },
  { airtable: 'Form Submissions',     supabase: 'form_submissions',     transform: transformFormSubmission,     idColumn: 'submission_id' },
  { airtable: 'Waiver Holding Table', supabase: 'waiver_holding_table', transform: transformWaiver,             idColumn: null },

  // One-level dependencies
  { airtable: 'Class Schedules',      supabase: 'class_schedules',      transform: transformClassSchedule,      idColumn: 'schedule_id',     needs: ['classes'] },
  { airtable: 'FAQ',                  supabase: 'faq',                  transform: transformFaq,                idColumn: 'faq_id',          needs: ['categories'] },

  // Multi-level dependencies
  { airtable: 'Bookings',             supabase: 'bookings',             transform: transformBooking,            idColumn: 'booking_id',      needs: ['class_schedules'] },
  { airtable: 'Participants',         supabase: 'participants',         transform: transformParticipant,        idColumn: 'participant_id',  needs: ['bookings'] },
  { airtable: 'Persons',              supabase: 'persons',              transform: transformPerson,             idColumn: null,              needs: ['participants'] },
  { airtable: 'Teaching Assignments', supabase: 'teaching_assignments', transform: transformTeachingAssignment, idColumn: 'assignment_id',   needs: ['persons', 'class_schedules'] },
  { airtable: 'Satisfaction Surveys', supabase: 'satisfaction_surveys', transform: transformSurvey,             idColumn: 'survey_id',       needs: ['class_schedules'] },
];

// =============================================================================
// Main
// =============================================================================
async function main() {
  console.log(`🚀 Airtable → Supabase migration`);
  console.log(`   Airtable base: ${AIRTABLE_BASE_ID}`);
  console.log(`   Supabase:      ${DRY_RUN ? '(dry run — no writes)' : SUPABASE_URL}`);
  console.log(`   Tables:        ${ONLY_TABLES ? ONLY_TABLES.join(', ') : 'all 12'}`);

  const summary = [];
  const idMaps = {};

  for (const mig of MIGRATIONS) {
    if (ONLY_TABLES && !ONLY_TABLES.includes(mig.supabase)) continue;
    console.log(`\n📦 ${mig.airtable}  →  ${mig.supabase}`);

    // Load dependency maps if not yet built
    for (const dep of mig.needs || []) {
      if (!idMaps[dep]) {
        console.log(`   🔑 Building id map for ${dep}`);
        idMaps[dep] = await buildIdMap(dep);
        console.log(`      ${idMaps[dep].size} entries`);
      }
    }

    // Fetch from Airtable
    console.log(`   📥 Fetching from Airtable`);
    let records;
    try {
      records = await fetchAllRecords(mig.airtable);
      console.log(`      ${records.length} records fetched`);
    } catch (err) {
      console.error(`   ❌ Fetch failed: ${err.message}`);
      summary.push({ table: mig.supabase, fetched: 0, upserted: 0, transformErrors: 0, chunkErrors: 1, err: err.message });
      continue;
    }

    // Transform
    const rows = [];
    const transformErrors = [];
    for (const rec of records) {
      try {
        rows.push(mig.transform(rec, idMaps));
      } catch (err) {
        transformErrors.push({ recordId: rec.id, message: err.message });
        console.error(`      ⚠️  transform error on ${rec.id}: ${err.message}`);
      }
    }

    // Upsert
    console.log(`   📤 Upserting ${rows.length} rows${DRY_RUN ? ' (dry run)' : ''}`);
    const { count, errors } = await upsertRows(mig.supabase, rows);
    const status = errors.length === 0 && transformErrors.length === 0 ? '✅' : '⚠️ ';
    console.log(`      ${status} ${count} upserted, ${transformErrors.length} transform errors, ${errors.length} chunk errors`);

    // Refresh id map for this table (downstream tables need it)
    if (!DRY_RUN) {
      idMaps[mig.supabase] = await buildIdMap(mig.supabase);
    }

    summary.push({
      table: mig.supabase,
      fetched: records.length,
      upserted: count,
      transformErrors: transformErrors.length,
      chunkErrors: errors.length,
    });
  }

  // Summary table
  console.log(`\n\n${'='.repeat(70)}\nMIGRATION SUMMARY\n${'='.repeat(70)}`);
  console.log(`${'table'.padEnd(28)} ${'fetched'.padStart(8)} ${'upserted'.padStart(9)} ${'errors'.padStart(7)}`);
  console.log('-'.repeat(70));
  for (const s of summary) {
    const total = s.fetched;
    const ok = s.upserted;
    const err = s.transformErrors + s.chunkErrors;
    const icon = err === 0 && ok === total ? '✅' : '⚠️ ';
    console.log(`${icon} ${s.table.padEnd(26)} ${String(total).padStart(8)} ${String(ok).padStart(9)} ${String(err).padStart(7)}`);
  }
  console.log('='.repeat(70));

  // Sequence-reset SQL
  const needsReset = MIGRATIONS
    .filter(m => m.idColumn && (!ONLY_TABLES || ONLY_TABLES.includes(m.supabase)))
    .filter(m => summary.some(s => s.table === m.supabase && s.upserted > 0));

  if (needsReset.length > 0) {
    console.log(`\n📝 Run this SQL in the Supabase SQL editor after a successful migration`);
    console.log(`   to advance each identity sequence past the migrated max value:\n`);
    for (const m of needsReset) {
      console.log(`select setval(`);
      console.log(`  pg_get_serial_sequence('${m.supabase}', '${m.idColumn}'),`);
      console.log(`  coalesce((select max(${m.idColumn}) from ${m.supabase}), 0) + 1,`);
      console.log(`  false`);
      console.log(`);`);
    }
    console.log('');
  }

  const totalErrors = summary.reduce((a, s) => a + s.transformErrors + s.chunkErrors, 0);
  if (totalErrors > 0) {
    console.log(`\n⚠️  Completed with ${totalErrors} errors — inspect logs above.`);
    process.exit(1);
  }
  console.log(`\n✨ Migration completed successfully.`);
}

main().catch((err) => {
  console.error('\n❌ Fatal:', err);
  process.exit(1);
});
