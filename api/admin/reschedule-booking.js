// /api/admin/reschedule-booking.js
// Whole-group and split-move reschedules.
import { requireSupabase, outerId } from '../_supabase.js';
import { requireAdminAuth } from '../_admin-auth.js';
import {
  convertToISO, formatTimeForDisplay, formatDateForDisplay,
  buildGcalURL, buildClassIcal, sendBookingEmailAndTrack,
} from '../_email.js';

const BOOKING_COLS =
  'id, airtable_record_id, contact_first_name, contact_last_name, contact_email, ' +
  'contact_phone, number_of_participants, class_schedule_id, offshoot_booking_ids';

async function findBooking(supabase, bookingId) {
  const isAirtableId = /^rec/.test(bookingId);
  const q = supabase.from('bookings').select(BOOKING_COLS);
  const { data, error } = await (isAirtableId
    ? q.eq('airtable_record_id', bookingId)
    : q.eq('id', bookingId)
  ).maybeSingle();
  if (error) throw error;
  return data;
}

async function resolveScheduleUuid(supabase, scheduleId) {
  if (!scheduleId) return null;
  if (!/^rec/.test(scheduleId)) return scheduleId;
  const { data, error } = await supabase
    .from('class_schedules')
    .select('id')
    .eq('airtable_record_id', scheduleId)
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

// Resolve participant identifiers (mix of recXXX and UUID) to UUIDs.
async function resolveParticipantUuids(supabase, ids) {
  if (!ids || ids.length === 0) return [];
  const airtableIds = ids.filter(id => /^rec/.test(id));
  const uuids = ids.filter(id => !/^rec/.test(id));
  if (airtableIds.length === 0) return uuids;
  const { data, error } = await supabase
    .from('participants')
    .select('id, airtable_record_id')
    .in('airtable_record_id', airtableIds);
  if (error) throw error;
  const map = new Map((data || []).map(p => [p.airtable_record_id, p.id]));
  return [...uuids, ...airtableIds.map(id => map.get(id)).filter(Boolean)];
}

async function sendRescheduleEmail({ supabase, bookingUuid, contactFirstName, contactEmail, participantCount, scheduleUuid, req }) {
  if (!process.env.RESEND_API_KEY || !contactEmail || !scheduleUuid) return;
  try {
    const { data: schedule } = await supabase
      .from('class_schedules')
      .select('id, airtable_record_id, date, start_time_new, end_time_new, classes(class_name, location)')
      .eq('id', scheduleUuid)
      .maybeSingle();
    if (!schedule) return;

    const klass = schedule.classes;
    const className = klass?.class_name || 'Self Defense Class';
    const location = klass?.location || 'Walnut Creek, CA';
    const startISO = convertToISO(schedule.date, schedule.start_time_new);
    const endISO = convertToISO(schedule.date, schedule.end_time_new);
    const displayStartTime = formatTimeForDisplay(schedule.start_time_new);
    const displayEndTime = formatTimeForDisplay(schedule.end_time_new);
    const formattedDate = formatDateForDisplay(schedule.date);

    const host = req.headers.host || 'www.streetwiseselfdefense.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const scheduleRouteId = schedule.airtable_record_id || schedule.id;
    const classPrepUrl = `${protocol}://${host}/class-prep/${scheduleRouteId}`;

    const gcalURL = buildGcalURL({
      className, startISO, endISO, location, details: 'Self defense class rescheduled',
    });
    const icalString = await buildClassIcal({
      className, startISO, endISO, location, description: 'Self defense class rescheduled',
    });

    const html = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<div style="text-align: center; margin-bottom: 30px;"><img src="https://www.streetwiseselfdefense.com/swsd-logo-official.png" alt="Streetwise Self Defense" style="max-width: 300px;"></div>
<h1 style="color: #1E293B; text-align: center;">You've Been Rescheduled!</h1>
<p>Dear ${contactFirstName || 'Valued Participant'},</p>
<p>Great news! Your self defense class has been rescheduled. Here are your updated class details:</p>
<div style="background: #F0FDFC; border: 1px solid #14b8a6; border-radius: 8px; padding: 20px; margin: 20px 0;">
<h2 style="color: #1E293B; margin-top: 0;">Your New Class Details</h2>
<p><strong>Class:</strong> ${className}</p>
<p><strong>Date:</strong> ${formattedDate}</p>
<p><strong>Time:</strong> ${displayStartTime} - ${displayEndTime}</p>
<p><strong>Location:</strong> ${location}</p>
<p><strong>Participants:</strong> ${participantCount || 1}</p></div>
<div style="text-align: center; margin: 30px 0;"><a href="${gcalURL}" style="display: inline-block; background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Add to Google Calendar</a></div>
<div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0;">
<h3 style="color: #92400E; margin-top: 0;">📋 Important: Complete Your Waiver</h3>
<p style="color: #78350F;">Before class, please complete your liability waiver and provide emergency contact information:</p>
<div style="text-align: center; margin-top: 15px;"><a href="${classPrepUrl}" style="display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Complete Waiver & Class Prep</a></div></div>
<h3 style="color: #1E293B;">What to Bring:</h3>
<ul style="color: #4B5563; line-height: 1.8;"><li>Comfortable clothing you can move freely in</li><li>Water bottle to stay hydrated</li><li>Positive attitude and willingness to learn</li></ul>
<p style="color: #4B5563;">If you have any questions before class, don't hesitate to reach out!</p>
<p>See you in class!</p><p><strong>The Streetwise Self Defense Team</strong></p>
<hr style="border: 1px solid #E5E7EB; margin: 30px 0;">
<p style="text-align: center; font-size: 14px; color: #6B7280;">Streetwise Self Defense | Walnut Creek, CA<br>© ${new Date().getFullYear()} Streetwise Self Defense. All rights reserved.</p>
<p style="text-align: center; margin-top: 15px; font-size: 12px; color: #9CA3AF;"><a href="${protocol}://${host}/api/unsubscribe?id=${bookingUuid}" style="color: #6B7280; text-decoration: underline;">Unsubscribe from emails</a></p>
</body></html>`;

    await sendBookingEmailAndTrack({
      supabase, bookingUuid, to: contactEmail,
      subject: 'Your Self Defense Class Has Been Rescheduled!',
      html, icalString,
      unsubscribeUrl: `${protocol}://${host}/api/unsubscribe?id=${bookingUuid}`,
    });
  } catch (err) {
    console.error('[RESCHEDULE-EMAIL] Failed:', err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  const {
    originalBookingId,
    movingParticipantIds,
    primaryContactEmail,
    primaryContactFirstName,
    primaryContactLastName,
    primaryContactPhone,
    smsConsent,
    stayerContactFirstName,
    stayerContactLastName,
    stayerContactEmail,
    stayerContactPhone,
    newClassScheduleId,
    rescheduleNotes,
  } = req.body || {};

  if (!originalBookingId) {
    return res.status(400).json({ error: 'originalBookingId is required' });
  }
  if (!Array.isArray(movingParticipantIds) || movingParticipantIds.length === 0) {
    return res.status(400).json({ error: 'movingParticipantIds must be a non-empty array' });
  }
  if (!primaryContactEmail || !primaryContactFirstName || !primaryContactLastName) {
    return res.status(400).json({ error: 'primaryContactEmail, primaryContactFirstName, and primaryContactLastName are required' });
  }

  try {
    const original = await findBooking(supabase, originalBookingId);
    if (!original) return res.status(404).json({ error: 'Original booking not found' });

    const newScheduleUuid = await resolveScheduleUuid(supabase, newClassScheduleId);

    // Look up all participants currently linked to the original booking
    const { data: originalParticipants, error: pErr } = await supabase
      .from('participants')
      .select('id, airtable_record_id')
      .eq('booking_id', original.id);
    if (pErr) throw pErr;
    const allParticipantUuids = (originalParticipants || []).map(p => p.id);
    const movingParticipantUuids = await resolveParticipantUuids(supabase, movingParticipantIds);
    const isWholeGroup = movingParticipantUuids.length === allParticipantUuids.length;

    if (isWholeGroup) {
      const updates = {
        contact_first_name: primaryContactFirstName,
        contact_last_name: primaryContactLastName,
        contact_email: primaryContactEmail,
      };
      if (primaryContactPhone) updates.contact_phone = primaryContactPhone;
      if (smsConsent) updates.sms_consent_date = new Date().toISOString();

      if (newScheduleUuid) {
        updates.class_schedule_id = newScheduleUuid;
        if (rescheduleNotes) updates.reschedule_notes = rescheduleNotes;
      } else {
        // Pending: clear schedule, mark Pending Reschedule, prepend original schedule ID to notes
        const origScheduleRef = original.class_schedule_id;
        let prefix = '';
        if (origScheduleRef) {
          const { data: origSched } = await supabase
            .from('class_schedules')
            .select('airtable_record_id')
            .eq('id', origScheduleRef)
            .maybeSingle();
          const ref = origSched?.airtable_record_id || origScheduleRef;
          prefix = `[Original Schedule: ${ref}] `;
        }
        updates.reschedule_status = 'Pending Reschedule';
        updates.reschedule_notes = prefix + (rescheduleNotes || '');
        updates.class_schedule_id = null;
      }

      const { error: updErr } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', original.id);
      if (updErr) throw updErr;

      if (newScheduleUuid) {
        await sendRescheduleEmail({
          supabase,
          bookingUuid: original.id,
          contactFirstName: primaryContactFirstName,
          contactEmail: primaryContactEmail,
          participantCount: allParticipantUuids.length,
          scheduleUuid: newScheduleUuid,
          req,
        });
      }

      return res.json({ type: 'whole-group', updatedBookingId: outerId(original) });
    }

    // ── Split move ──
    const stayingUuids = allParticipantUuids.filter(id => !movingParticipantUuids.includes(id));

    // Update original booking's participant count + record original count
    const { error: origErr } = await supabase
      .from('bookings')
      .update({
        original_participant_count: allParticipantUuids.length,
        number_of_participants: stayingUuids.length,
      })
      .eq('id', original.id);
    if (origErr) throw origErr;

    // Create child booking
    const childRow = {
      booking_date: new Date().toISOString(),
      status: 'Confirmed',
      payment_status: 'Prepaid',
      contact_first_name: primaryContactFirstName,
      contact_last_name: primaryContactLastName,
      contact_email: primaryContactEmail,
      contact_phone: primaryContactPhone || '',
      number_of_participants: movingParticipantUuids.length,
      original_booking_id: original.id,
      total_amount: 0,
    };
    if (smsConsent) childRow.sms_consent_date = new Date().toISOString();
    if (newScheduleUuid) {
      childRow.class_schedule_id = newScheduleUuid;
    } else {
      childRow.reschedule_status = 'Pending Reschedule';
    }
    if (rescheduleNotes) childRow.reschedule_notes = rescheduleNotes;

    const { data: child, error: childErr } = await supabase
      .from('bookings')
      .insert(childRow)
      .select('id')
      .single();
    if (childErr) throw childErr;
    const childUuid = child.id;

    // Move participants to the child booking
    const { error: pUpdErr } = await supabase
      .from('participants')
      .update({ booking_id: childUuid })
      .in('id', movingParticipantUuids);
    if (pUpdErr) console.error('Warning: failed to move participants:', pUpdErr.message);

    // Update original booking's offshoot list + optional stayer contact override
    const existingOffshoots = original.offshoot_booking_ids || '';
    const updatedOffshoots = existingOffshoots ? `${existingOffshoots},${childUuid}` : childUuid;
    const offshootUpdates = { offshoot_booking_ids: updatedOffshoots };
    if (stayerContactEmail) {
      offshootUpdates.contact_first_name = stayerContactFirstName || '';
      offshootUpdates.contact_last_name = stayerContactLastName || '';
      offshootUpdates.contact_email = stayerContactEmail;
      if (stayerContactPhone) offshootUpdates.contact_phone = stayerContactPhone;
    }
    const { error: offErr } = await supabase
      .from('bookings')
      .update(offshootUpdates)
      .eq('id', original.id);
    if (offErr) console.error('Warning: failed to update original offshoots:', offErr.message);

    if (newScheduleUuid) {
      await sendRescheduleEmail({
        supabase,
        bookingUuid: childUuid,
        contactFirstName: primaryContactFirstName,
        contactEmail: primaryContactEmail,
        participantCount: movingParticipantUuids.length,
        scheduleUuid: newScheduleUuid,
        req,
      });
    }

    return res.json({
      type: 'split',
      originalBookingId: outerId(original),
      childBookingId: childUuid,
      movedParticipantCount: movingParticipantUuids.length,
      remainingParticipantCount: stayingUuids.length,
    });
  } catch (error) {
    console.error('Reschedule error:', error);
    return res.status(500).json({ error: `Reschedule failed: ${error.message}` });
  }
}
