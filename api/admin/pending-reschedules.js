// /api/admin/pending-reschedules.js
// Returns bookings with Reschedule Status = "Pending Reschedule", enriched with
// participants and original/assigned class info.
import { requireSupabase, outerId } from '../_supabase.js';
import { requireAdminAuth } from '../_admin-auth.js';

const SCHEDULE_NESTED =
  'airtable_record_id, id, date, start_time_new, classes(airtable_record_id, class_name)';

const shapeOriginalFromSchedule = (s, extras = {}) => ({
  bookingId: extras.bookingId ?? null,
  bookingNumber: extras.bookingNumber ?? null,
  scheduleId: outerId(s),
  classId: s?.classes?.airtable_record_id || s?.classes?.id || null,
  className: s?.classes?.class_name || '',
  classDate: s?.date || '',
  classStartTime: s?.start_time_new || '',
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const { data: pending, error: bErr } = await supabase
      .from('bookings')
      .select(`*, class_schedules(${SCHEDULE_NESTED})`)
      .eq('reschedule_status', 'Pending Reschedule');
    if (bErr) throw bErr;
    if (!pending || pending.length === 0) return res.json([]);

    // Gather referenced "original" IDs — may be recXXX (legacy) or UUID (new).
    const originalBookingRefs = new Set();
    const originalScheduleRefs = new Set();
    for (const b of pending) {
      if (b.original_booking_id) {
        originalBookingRefs.add(b.original_booking_id);
      } else if (b.reschedule_notes) {
        const m = b.reschedule_notes.match(/\[Original Schedule: (rec[^\]]+)\]/);
        if (m) originalScheduleRefs.add(m[1]);
      }
    }

    // Look up original bookings by either airtable_record_id or id.
    const originalBookingsByRef = new Map();
    if (originalBookingRefs.size > 0) {
      const refs = [...originalBookingRefs];
      const airtableRefs = refs.filter(r => /^rec/.test(r));
      const uuidRefs = refs.filter(r => !/^rec/.test(r));
      const select = `id, airtable_record_id, booking_id, class_schedule_id, class_schedules(${SCHEDULE_NESTED})`;

      const queries = [];
      if (airtableRefs.length) {
        queries.push(supabase.from('bookings').select(select).in('airtable_record_id', airtableRefs));
      }
      if (uuidRefs.length) {
        queries.push(supabase.from('bookings').select(select).in('id', uuidRefs));
      }
      const results = await Promise.all(queries);
      for (const r of results) {
        if (r.error) throw r.error;
        for (const row of r.data || []) {
          if (row.airtable_record_id) originalBookingsByRef.set(row.airtable_record_id, row);
          originalBookingsByRef.set(row.id, row);
        }
      }
    }

    // Look up schedules referenced in reschedule notes.
    const originalSchedulesByAirtableId = new Map();
    if (originalScheduleRefs.size > 0) {
      const { data: schedules, error: sErr } = await supabase
        .from('class_schedules')
        .select(SCHEDULE_NESTED)
        .in('airtable_record_id', [...originalScheduleRefs]);
      if (sErr) throw sErr;
      for (const s of schedules || []) {
        if (s.airtable_record_id) originalSchedulesByAirtableId.set(s.airtable_record_id, s);
      }
    }

    // Participants for the pending bookings.
    const bookingUuids = pending.map(b => b.id);
    const { data: participants, error: pErr } = await supabase
      .from('participants')
      .select('*')
      .in('booking_id', bookingUuids);
    if (pErr) throw pErr;

    const participantsByBooking = new Map();
    for (const p of participants || []) {
      const list = participantsByBooking.get(p.booking_id) || [];
      list.push(p);
      participantsByBooking.set(p.booking_id, list);
    }

    const enriched = pending.map((b) => {
      let originalBooking = null;

      if (b.original_booking_id) {
        const ob = originalBookingsByRef.get(b.original_booking_id);
        if (ob?.class_schedules) {
          originalBooking = shapeOriginalFromSchedule(ob.class_schedules, {
            bookingId: outerId(ob),
            bookingNumber: ob.booking_id || null,
          });
        }
      } else if (b.reschedule_notes) {
        const m = b.reschedule_notes.match(/\[Original Schedule: (rec[^\]]+)\]/);
        if (m) {
          const s = originalSchedulesByAirtableId.get(m[1]);
          if (s) originalBooking = shapeOriginalFromSchedule(s);
        }
      }

      const assignedClass = b.class_schedules
        ? {
            scheduleId: outerId(b.class_schedules),
            className: b.class_schedules.classes?.class_name || '',
            classDate: b.class_schedules.date || '',
            classStartTime: b.class_schedules.start_time_new || '',
          }
        : null;

      const participantList = (participantsByBooking.get(b.id) || []).map(p => ({
        id: outerId(p),
        firstName: p.first_name || '',
        lastName: p.last_name || '',
        ageGroup: p.age_group || '',
      }));

      return {
        bookingId: outerId(b),
        bookingNumber: b.booking_id || null,
        contactFirstName: b.contact_first_name || '',
        contactLastName: b.contact_last_name || '',
        contactEmail: b.contact_email || '',
        rescheduleNotes: b.reschedule_notes || '',
        createdAt: b.created_at || '',
        participants: participantList,
        originalBooking,
        assignedClass,
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error('Pending reschedules error:', error);
    res.status(500).json({ error: `Failed to fetch pending reschedules: ${error.message}` });
  }
}
