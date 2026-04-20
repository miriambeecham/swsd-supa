// /api/schedules.js
import { requireSupabase, outerId } from './_supabase.js';

const FIELD_MAP = {
  'Date': 'date',
  'Start Time': 'start_time',
  'End Time': 'end_time',
  'Start Time New': 'start_time_new',
  'End Time New': 'end_time_new',
  'Booking URL': 'booking_url',
  'Registration Opens': 'registration_opens',
  'Is Cancelled': 'is_cancelled',
  'Special Notes': 'special_notes',
  'Available Spots': 'available_spots',
  'Waiver URL': 'waiver_url',
  'Pricing Unit': 'pricing_unit',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    let query = supabase
      .from('class_schedules')
      .select('*, classes(airtable_record_id)');

    // Translate the Airtable filter formulas the frontend actually uses into
    // Supabase predicates. Unknown formulas return 400 so the caller can add
    // an explicit pattern here rather than silently over-fetching.
    const { filter } = req.query;
    if (filter) {
      const recordId = filter.match(/^RECORD_ID\(\)='([^']+)'$/);
      // SatisfactionSurveyPage — date range, not cancelled
      const dateRange = filter.match(
        /^AND\(IS_AFTER\(\{Date\}, '([^']+)'\), NOT\(IS_AFTER\(\{Date\}, '([^']+)'\)\), NOT\(\{Is Cancelled\}\)\)$/,
      );

      if (recordId) {
        query = query.eq('airtable_record_id', recordId[1]);
      } else if (dateRange) {
        // IS_AFTER({Date}, X) → date > X;  NOT(IS_AFTER({Date}, Y)) → date <= Y
        query = query
          .gt('date', dateRange[1])
          .lte('date', dateRange[2])
          .eq('is_cancelled', false);
      } else {
        return res.status(400).json({ error: `Unsupported filter formula: ${filter}` });
      }
    }

    const [schedulesResult, bookingsResult] = await Promise.all([
      query,
      // Airtable "Booked Spots" = rollup(SUM(Number of Participants)) where Status='Confirmed'
      supabase
        .from('bookings')
        .select('class_schedule_id, number_of_participants')
        .eq('status', 'Confirmed'),
    ]);
    if (schedulesResult.error) throw schedulesResult.error;
    if (bookingsResult.error) throw bookingsResult.error;

    const bookedByScheduleUuid = new Map();
    for (const b of bookingsResult.data || []) {
      if (!b.class_schedule_id) continue;
      bookedByScheduleUuid.set(
        b.class_schedule_id,
        (bookedByScheduleUuid.get(b.class_schedule_id) || 0) + (b.number_of_participants || 0),
      );
    }

    const records = (schedulesResult.data || []).map((row) => {
      const fields = {};
      for (const [airtableKey, supaKey] of Object.entries(FIELD_MAP)) {
        fields[airtableKey] = row[supaKey];
      }
      // Class: array of Airtable-style linked-record IDs (Airtable recXXX when
      // available, Supabase UUID otherwise for newly-created classes).
      const classRef = outerId(row.classes);
      fields['Class'] = classRef ? [classRef] : [];
      // Booked Spots (rollup) + Remaining Spots (formula) — computed, not stored
      const bookedSpots = bookedByScheduleUuid.get(row.id) || 0;
      fields['Booked Spots'] = bookedSpots;
      const avail = row.available_spots;
      fields['Remaining Spots'] = Number.isFinite(avail) ? Math.max(0, avail - bookedSpots) : null;
      return { id: outerId(row), fields };
    });

    res.json({ records });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
}
