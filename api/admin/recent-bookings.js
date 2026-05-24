// /api/admin/recent-bookings.js
// Returns bookings sorted by booking_date desc, joined to class & schedule
// info, for the AdminRecentBookingsPage.
import { requireSupabase, outerId } from '../_supabase.js';
import { requireAdminAuth } from '../_admin-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 1000);

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        airtable_record_id,
        booking_id,
        booking_date,
        status,
        payment_status,
        contact_first_name,
        contact_last_name,
        contact_email,
        number_of_participants,
        total_amount,
        class_schedules (
          id,
          airtable_record_id,
          date,
          start_time_new,
          start_time,
          is_cancelled,
          classes ( class_id, class_name, type, city )
        )
      `)
      .order('booking_date', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;

    const bookings = (data || []).map((row) => {
      const sched = row.class_schedules || {};
      const cls = sched.classes || {};
      return {
        id: outerId(row),
        bookingId: row.booking_id,
        bookingDate: row.booking_date,
        status: row.status,
        paymentStatus: row.payment_status,
        contactName: [row.contact_first_name, row.contact_last_name].filter(Boolean).join(' ').trim(),
        contactEmail: row.contact_email,
        numberOfParticipants: row.number_of_participants || 0,
        totalAmount: row.total_amount != null ? Number(row.total_amount) : null,
        classScheduleId: sched.airtable_record_id || sched.id || null,
        className: cls.class_name || '',
        classCode: cls.class_id || '',
        classType: cls.type || '',
        city: cls.city || '',
        classDate: sched.date || '',
        classStartTime: sched.start_time_new || sched.start_time || '',
        scheduleCancelled: !!sched.is_cancelled,
      };
    });

    return res.status(200).json({ bookings, count: bookings.length });
  } catch (err) {
    console.error('recent-bookings error:', err);
    return res.status(500).json({ error: 'Failed to fetch recent bookings' });
  }
}
