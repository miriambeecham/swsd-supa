// Shared Supabase client for /api routes.
//
// All serverless functions in /api use the service-role key, which bypasses
// RLS. RLS is enabled on every table with no policies, so the anon key has
// no access — preventing the frontend from hitting Supabase directly.
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

export const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
  : null;

export function requireSupabase(res) {
  if (!supabase) {
    res.status(500).json({ error: 'Supabase not configured' });
    return null;
  }
  return supabase;
}

// Translate an Airtable record ID (recXXX) to the Supabase UUID for that row.
// Returns null if no matching row is found (or the input is falsy).
export async function airtableIdToUuid(table, airtableRecordId) {
  if (!airtableRecordId) return null;
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('airtable_record_id', airtableRecordId)
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

// Outer "id" for API responses: prefer the original Airtable record ID when a
// row was migrated from Airtable, fall back to the Supabase UUID for rows
// created post-migration. Frontend treats IDs opaquely either way.
export const outerId = (row) => row?.airtable_record_id || row?.id || null;

// Booking columns that record which reminder/followup messages went out. The
// send-* crons skip a booking once its *_id is set, so clearing these lets a
// rescheduled booking get a fresh reminder sequence for its new class.
export const RESET_CLASS_MESSAGING = {
  reminder_email_id: null,
  reminder_email_status: null,
  reminder_email_sent_at: null,
  reminder_email_delivered_at: null,
  reminder_email_clicked_at: null,
  followup_email_id: null,
  followup_email_status: null,
  followup_email_sent_at: null,
  followup_email_delivered_at: null,
  followup_email_clicked_at: null,
  reminder_sms_id: null,
  reminder_sms_status: null,
  reminder_sms_sent_at: null,
  reminder_sms_delivered_at: null,
  preclass_sms_id: null,
  preclass_sms_status: null,
  preclass_sms_sent_at: null,
  preclass_sms_delivered_at: null,
};

// Attendance for participants moved into a class: a class that has already
// ended means they attended it (moves into past classes are record-keeping);
// otherwise attendance starts fresh.
export async function attendanceForMove(client, scheduleUuid) {
  if (!scheduleUuid) return 'Not Recorded';
  const { data } = await client
    .from('class_schedules')
    .select('date, end_time_new')
    .eq('id', scheduleUuid)
    .maybeSingle();
  if (!data) return 'Not Recorded';
  if (data.end_time_new) {
    return new Date(data.end_time_new) < new Date() ? 'Present' : 'Not Recorded';
  }
  const todayPacific = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  return data.date && data.date < todayPacific ? 'Present' : 'Not Recorded';
}
