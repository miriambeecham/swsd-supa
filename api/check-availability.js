// /api/check-availability.js
import { requireSupabase } from './_supabase.js';

function isBookingTooLate(startDateTime) {
  if (!startDateTime) return false;
  try {
    const classDateTime = new Date(startDateTime);
    const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000);
    return classDateTime <= fourHoursFromNow;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const { classScheduleId, requestedSeats, requestedSpots } = req.body || {};
    const seats = Number(requestedSeats || requestedSpots);
    if (!classScheduleId || !seats) {
      return res.status(400).json({ error: 'Missing classScheduleId or requestedSeats' });
    }

    const isAirtableId = /^rec/.test(classScheduleId);
    const scheduleQuery = supabase
      .from('class_schedules')
      .select('id, available_spots, start_time_new');
    const { data: schedule, error: sErr } = await (isAirtableId
      ? scheduleQuery.eq('airtable_record_id', classScheduleId)
      : scheduleQuery.eq('id', classScheduleId)
    ).maybeSingle();
    if (sErr) throw sErr;
    if (!schedule) return res.status(404).json({ error: 'Class schedule not found' });

    if (isBookingTooLate(schedule.start_time_new)) {
      return res.status(409).json({
        ok: false,
        remaining: 0,
        message: 'Registration has closed for this class. Bookings must be made at least 4 hours in advance.',
      });
    }

    if (schedule.available_spots == null) {
      throw new Error('Available Spots (capacity) is not set on Class Schedule');
    }

    // Same accounting Airtable's "Booked Spots" rollup performed: sum of
    // participants across all non-cancelled bookings.
    const { data: activeBookings, error: bErr } = await supabase
      .from('bookings')
      .select('number_of_participants')
      .eq('class_schedule_id', schedule.id)
      .neq('status', 'Cancelled');
    if (bErr) throw bErr;
    const booked = (activeBookings || []).reduce((n, b) => n + (b.number_of_participants || 0), 0);
    const remaining = Math.max(0, schedule.available_spots - booked);

    if (remaining >= seats) {
      return res.json({ ok: true, remaining });
    }

    const message = remaining === 0 ? 'This class is full.' : `Only ${remaining} spot(s) left.`;
    return res.status(409).json({ ok: false, remaining, message });
  } catch (error) {
    console.error('[check-availability] error:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
