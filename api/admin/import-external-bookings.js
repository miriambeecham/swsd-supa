// /api/admin/import-external-bookings.js
// Imports external (off-platform) registrations from a CSV-style payload.
import { requireSupabase, airtableIdToUuid, outerId } from '../_supabase.js';
import { requireAdminAuth } from '../_admin-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const { csvData } = req.body;
    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({ error: 'Invalid CSV data format' });
    }

    console.log(`[IMPORT] Processing ${csvData.length} rows`);

    const groups = new Map();
    for (const row of csvData) {
      const list = groups.get(row.bookingGroupId) || [];
      list.push(row);
      groups.set(row.bookingGroupId, list);
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;
    const todayDate = new Date().toISOString().split('T')[0];

    for (const [groupId, participants] of groups.entries()) {
      try {
        if (participants.length === 0) throw new Error('Booking group has no participants');

        const adult = participants.find(p => p.ageGroup === '16+' && p.email);
        if (!adult) throw new Error('Each booking group must have one adult (16+) with an email address');

        const classScheduleId = participants[0].classScheduleId;
        if (!classScheduleId) throw new Error('Missing classScheduleId');

        if (!participants.every(p => p.classScheduleId === classScheduleId)) {
          throw new Error('All participants in a booking group must have the same classScheduleId');
        }

        const scheduleUuid = /^rec/.test(classScheduleId)
          ? await airtableIdToUuid('class_schedules', classScheduleId)
          : classScheduleId;
        if (!scheduleUuid) throw new Error(`Class schedule ${classScheduleId} not found`);

        const { data: bookingRow, error: bErr } = await supabase
          .from('bookings')
          .insert({
            class_schedule_id: scheduleUuid,
            booking_date: todayDate,
            status: 'Confirmed',
            payment_status: 'Completed',
            payment_date: todayDate,
            contact_first_name: adult.firstName,
            contact_last_name: adult.lastName,
            contact_email: adult.email,
            contact_phone: adult.phone || '',
            number_of_participants: participants.length,
            total_amount: 0,
          })
          .select('id, airtable_record_id')
          .single();
        if (bErr) throw new Error(`Failed to create booking: ${bErr.message}`);

        const participantRows = participants.map((p, i) => ({
          booking_id: bookingRow.id,
          first_name: p.firstName,
          last_name: p.lastName,
          age_group: p.ageGroup,
          participant_number: i + 1,
        }));
        const { error: pErr } = await supabase.from('participants').insert(participantRows);
        if (pErr) throw new Error(`Failed to create participants: ${pErr.message}`);

        successCount++;
        results.push({
          bookingGroupId: groupId,
          success: true,
          bookingId: outerId(bookingRow),
          participantCount: participants.length,
          contactEmail: adult.email,
        });
      } catch (error) {
        errorCount++;
        console.error(`[IMPORT] Error processing booking group ${groupId}:`, error);
        results.push({ bookingGroupId: groupId, success: false, error: error.message });
      }
    }

    console.log(`[IMPORT] Complete. Success: ${successCount}, Errors: ${errorCount}`);
    return res.json({
      success: true,
      totalGroups: groups.size,
      successCount,
      errorCount,
      results,
    });
  } catch (error) {
    console.error('[IMPORT] Fatal error:', error);
    return res.status(500).json({ error: error.message });
  }
}
