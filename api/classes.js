// /api/classes.js
import { requireSupabase, outerId } from './_supabase.js';

const FIELD_MAP = {
  'ID': 'class_id',
  'Class Name': 'class_name',
  'Type': 'type',
  'Max Participants': 'max_participants',
  'Location': 'location',
  'City': 'city',
  'Instructor': 'instructor',
  'Price': 'price',
  'Pricing Unit': 'pricing_unit',
  'Partner Organization': 'partner_organization',
  'Booking Method': 'booking_method',
  'Is Active': 'is_active',
  'Parking Instructions': 'parking_instructions',
  'Parking Map URL': 'parking_map_url',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    let query = supabase.from('classes').select('*');

    // Frontend passes Airtable filterByFormula syntax. The only form currently
    // used is RECORD_ID()='recXXX' (SatisfactionSurveyPage).
    const { filter } = req.query;
    if (filter) {
      const recordIdMatch = filter.match(/^RECORD_ID\(\)='([^']+)'$/);
      if (!recordIdMatch) {
        return res.status(400).json({ error: `Unsupported filter formula: ${filter}` });
      }
      query = query.eq('airtable_record_id', recordIdMatch[1]);
    }

    const { data, error } = await query;
    if (error) throw error;

    const records = (data || []).map((row) => {
      const fields = {};
      for (const [airtableKey, supaKey] of Object.entries(FIELD_MAP)) {
        fields[airtableKey] = row[supaKey];
      }
      return { id: outerId(row), fields };
    });

    res.json({ records });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
}
