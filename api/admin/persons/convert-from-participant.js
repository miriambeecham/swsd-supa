// /api/admin/persons/convert-from-participant.js
// Convert a participant to a Person with Teaching Assistant role.
// (Original endpoint did not require admin auth; preserved for parity.)
import { requireSupabase, outerId } from '../../_supabase.js';

const formatPerson = (p) => ({
  id: outerId(p),
  name: p.name || '',
  email: p.email || '',
  phone: p.phone || '',
  roles: p.roles || ['Teaching Assistant'],
  status: p.status || 'Active',
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const { participantId, classScheduleId } = req.body;
    if (!participantId) return res.status(400).json({ error: 'Participant ID is required' });

    const isAirtableId = /^rec/.test(participantId);
    const partQ = supabase
      .from('participants')
      .select('id, airtable_record_id, first_name, last_name, booking_id, bookings(contact_first_name, contact_last_name, contact_email, contact_phone)');
    const { data: participant, error: partErr } = await (isAirtableId
      ? partQ.eq('airtable_record_id', participantId)
      : partQ.eq('id', participantId)
    ).maybeSingle();
    if (partErr) throw partErr;
    if (!participant) return res.status(404).json({ error: 'Participant not found' });

    const fullName = `${participant.first_name || ''} ${participant.last_name || ''}`.trim();
    if (!fullName) return res.status(400).json({ error: 'Participant has no name' });

    // If the participant is also the booker, copy their contact info
    let bookerEmail = null;
    let bookerPhone = null;
    const booking = participant.bookings;
    if (booking) {
      const isBooker =
        (participant.first_name || '').toLowerCase() === (booking.contact_first_name || '').toLowerCase() &&
        (participant.last_name || '').toLowerCase() === (booking.contact_last_name || '').toLowerCase();
      if (isBooker) {
        bookerEmail = booking.contact_email || null;
        bookerPhone = booking.contact_phone || null;
      }
    }

    // Look for an existing person by email, then by name
    let existing = null;
    if (bookerEmail) {
      const { data } = await supabase
        .from('persons')
        .select('*')
        .ilike('email', bookerEmail)
        .maybeSingle();
      existing = data;
    }
    if (!existing) {
      const { data } = await supabase
        .from('persons')
        .select('*')
        .ilike('name', fullName)
        .maybeSingle();
      existing = data;
    }

    let personRecord;
    let wasExisting = false;

    if (existing) {
      wasExisting = true;
      const currentRoles = existing.roles || [];
      if (!currentRoles.includes('Teaching Assistant')) {
        const { data: updated, error: updErr } = await supabase
          .from('persons')
          .update({ roles: [...currentRoles, 'Teaching Assistant'] })
          .eq('id', existing.id)
          .select('*')
          .single();
        if (updErr) throw updErr;
        personRecord = updated;
      } else {
        personRecord = existing;
      }
    } else {
      const insertRow = {
        name: fullName,
        roles: ['Teaching Assistant'],
        status: 'Active',
        source_participant_id: participant.id,
      };
      if (bookerEmail) insertRow.email = bookerEmail;
      if (bookerPhone) insertRow.phone = bookerPhone;
      const { data: created, error: insErr } = await supabase
        .from('persons')
        .insert(insertRow)
        .select('*')
        .single();
      if (insErr) throw insErr;
      personRecord = created;
    }

    // Optional: create the teaching assignment for this class schedule
    let assignmentCreated = false;
    let assignmentRecord = null;
    if (classScheduleId) {
      let scheduleUuid = classScheduleId;
      if (/^rec/.test(classScheduleId)) {
        const { data: sched } = await supabase
          .from('class_schedules')
          .select('id')
          .eq('airtable_record_id', classScheduleId)
          .maybeSingle();
        scheduleUuid = sched?.id || null;
      }

      if (scheduleUuid) {
        const { data: existingAssignment } = await supabase
          .from('teaching_assignments')
          .select('id')
          .eq('person_id', personRecord.id)
          .eq('class_schedule_id', scheduleUuid)
          .maybeSingle();

        if (!existingAssignment) {
          const { data: created, error: aErr } = await supabase
            .from('teaching_assignments')
            .insert({ person_id: personRecord.id, class_schedule_id: scheduleUuid })
            .select('id, assignment_id, airtable_record_id')
            .single();
          if (!aErr) {
            assignmentCreated = true;
            assignmentRecord = created;
          }
        }
      }
    }

    return res.status(201).json({
      success: true,
      wasExisting,
      person: formatPerson(personRecord),
      assignmentCreated,
      assignment: assignmentRecord ? {
        id: outerId(assignmentRecord),
        assignmentId: assignmentRecord.assignment_id,
      } : null,
      contactInfoCopied: !!(bookerEmail || bookerPhone),
    });
  } catch (error) {
    console.error('[CONVERT-PERSON] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
