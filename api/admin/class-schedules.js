// /api/admin/class-schedules.js
import { requireSupabase, outerId } from '../_supabase.js';
import { requireAdminAuth } from '../_admin-auth.js';

function isRegistrationOpen(row) {
  const now = new Date();
  if (row.registration_opens) {
    const regOpens = new Date(row.registration_opens);
    if (regOpens > now) return false;
  }
  if (row.start_time_new) {
    const classDateTime = new Date(row.start_time_new);
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    return classDateTime > fourHoursFromNow;
  }
  if (!row.date) return false;
  const classDate = new Date(row.date);
  classDate.setHours(23, 59, 59, 999);
  const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  return classDate > fourHoursFromNow;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const [schedulesResult, bookingsResult] = await Promise.all([
      supabase
        .from('class_schedules')
        .select('*, classes(class_id, class_name, type, booking_method, city)'),
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

    const enrichedSchedules = (schedulesResult.data || []).map((row) => {
      const bookedSpots = bookedByScheduleUuid.get(row.id) || 0;
      const availableSpots = row.available_spots || 0;
      const remainingSpots = Math.max(0, availableSpots - bookedSpots);

      let startTime = '';
      if (row.start_time_new) {
        startTime = new Date(row.start_time_new).toLocaleTimeString('en-US', {
          hour: 'numeric', minute: '2-digit', hour12: true,
        });
      }

      return {
        id: outerId(row),
        date: row.date || '',
        startTime,
        startTimeNew: row.start_time_new,
        classId: row.classes?.class_id || '',
        className: row.classes?.class_name || '',
        type: row.classes?.type || '',
        bookingMethod: row.classes?.booking_method || '',
        city: row.classes?.city || '',
        availableSpots,
        bookedSpots,
        remainingSpots,
        registrationOpens: row.registration_opens || null,
        isCancelled: row.is_cancelled || false,
        isRegistrationOpen: isRegistrationOpen(row),
      };
    });

    res.json({ schedules: enrichedSchedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
}
