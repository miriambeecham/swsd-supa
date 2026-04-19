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
