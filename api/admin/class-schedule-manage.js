// /api/admin/class-schedule-manage.js
// CRUD operations for Class Schedules (single read, create, update).
import { requireSupabase, airtableIdToUuid, outerId } from '../_supabase.js';
import { requireAdminAuth } from '../_admin-auth.js';

// Airtable field name → Supabase column. Linked-record fields (`Class`) are
// translated separately because the value is an array of recXXX/UUIDs.
const FIELD_TO_COLUMN = {
  'Date': 'date',
  'Start Time': 'start_time',
  'End Time': 'end_time',
  'Start Time New': 'start_time_new',
  'End Time New': 'end_time_new',
  'Booking URL': 'booking_url',
  'Registration Opens': 'registration_opens',
  'Is Cancelled': 'is_cancelled',
  'Special Notes': 'special_notes',
  'Description': 'description',
  'Available Spots': 'available_spots',
  'Waiver URL': 'waiver_url',
  'Pricing Unit': 'pricing_unit',
};

const COLUMN_TO_FIELD = Object.fromEntries(
  Object.entries(FIELD_TO_COLUMN).map(([k, v]) => [v, k]),
);

async function fieldsToColumns(supabase, fields) {
  const row = {};
  for (const [k, v] of Object.entries(fields || {})) {
    if (k === 'Class') {
      const arr = Array.isArray(v) ? v : (v ? [v] : []);
      const ref = arr[0];
      if (!ref) {
        row.class_id = null;
      } else if (/^rec/.test(ref)) {
        row.class_id = await airtableIdToUuid('classes', ref);
      } else {
        row.class_id = ref;
      }
      continue;
    }
    const col = FIELD_TO_COLUMN[k];
    if (col) row[col] = v;
  }
  return row;
}

// Build the legacy Airtable-shaped record the frontend expects in the response.
async function rowToAirtableRecord(supabase, row) {
  const fields = {};
  for (const [col, key] of Object.entries(COLUMN_TO_FIELD)) {
    fields[key] = row[col];
  }
  if (row.class_id) {
    const { data } = await supabase
      .from('classes')
      .select('airtable_record_id')
      .eq('id', row.class_id)
      .maybeSingle();
    fields['Class'] = data?.airtable_record_id ? [data.airtable_record_id] : [row.class_id];
  } else {
    fields['Class'] = [];
  }
  return { id: outerId(row), fields };
}

export default async function handler(req, res) {
  if (!requireAdminAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    if (req.method === 'GET') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Record ID is required' });

      const isAirtableId = /^rec/.test(id);
      const q = supabase.from('class_schedules').select('*');
      const { data, error } = await (isAirtableId
        ? q.eq('airtable_record_id', id)
        : q.eq('id', id)
      ).maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Schedule not found' });

      return res.json({ record: await rowToAirtableRecord(supabase, data) });
    }

    if (req.method === 'POST') {
      const { fields } = req.body || {};
      if (!fields) return res.status(400).json({ error: 'Fields are required' });
      const row = await fieldsToColumns(supabase, fields);
      const { data, error } = await supabase
        .from('class_schedules')
        .insert(row)
        .select('*')
        .single();
      if (error) throw error;
      return res.json({ record: await rowToAirtableRecord(supabase, data) });
    }

    if (req.method === 'PATCH') {
      const { id, fields } = req.body || {};
      if (!id || !fields) return res.status(400).json({ error: 'Record ID and fields are required' });
      const updates = await fieldsToColumns(supabase, fields);

      const isAirtableId = /^rec/.test(id);
      let q = supabase.from('class_schedules').update(updates);
      q = isAirtableId ? q.eq('airtable_record_id', id) : q.eq('id', id);
      const { data, error } = await q.select('*').maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Schedule not found' });
      return res.json({ record: await rowToAirtableRecord(supabase, data) });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('class-schedule-manage error:', error);
    return res.status(500).json({ error: error.message || 'Failed' });
  }
}
