// /api/admin/class-roster.js
import { requireSupabase, outerId } from '../_supabase.js';
import { requireAdminAuth } from '../_admin-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const { classScheduleId } = req.query;
    if (!classScheduleId) {
      return res.status(400).json({ error: 'classScheduleId is required' });
    }

    const isAirtableId = /^rec/.test(classScheduleId);
    const scheduleQuery = supabase
      .from('class_schedules')
      .select('*, classes(class_name, location)');
    const scheduleResult = await (isAirtableId
      ? scheduleQuery.eq('airtable_record_id', classScheduleId)
      : scheduleQuery.eq('id', classScheduleId)
    ).maybeSingle();
    if (scheduleResult.error) throw scheduleResult.error;
    if (!scheduleResult.data) return res.status(404).json({ error: 'Class schedule not found' });
    const schedule = scheduleResult.data;

    // Roster bookings: Confirmed and not Pending Reschedule.
    // .neq() alone excludes NULL values, so combine with .or() to match "not 'Pending Reschedule'
    // OR null". Use the column-filter grouping syntax that postgREST accepts.
    const { data: bookings, error: bErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('class_schedule_id', schedule.id)
      .eq('status', 'Confirmed')
      .or('reschedule_status.is.null,reschedule_status.neq.Pending Reschedule');
    if (bErr) throw bErr;

    const bookingUuids = (bookings || []).map(b => b.id);
    let participants = [];
    if (bookingUuids.length > 0) {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .in('booking_id', bookingUuids);
      if (error) throw error;
      participants = data || [];
    }
    const bookingById = new Map((bookings || []).map(b => [b.id, b]));

    const roster = participants.map((p) => {
      const booking = bookingById.get(p.booking_id);
      const isPrimaryContact =
        p.first_name === booking?.contact_first_name &&
        p.last_name === booking?.contact_last_name;
      return {
        id: outerId(p),
        firstName: p.first_name,
        lastName: p.last_name,
        ageGroup: p.age_group,
        attendance: p.attendance || 'Not Recorded',
        contactEmail: booking?.contact_email,
        contactPhone: booking?.contact_phone,
        smsOptedOutDate: booking?.sms_opted_out_date,
        smsConsentDate: booking?.sms_consent_date,
        bookingId: booking ? outerId(booking) : null,
        bookingNumber: booking?.booking_id,
        isPrimaryContact,
        bookingDate: booking?.booking_date,
        confirmationEmailStatus: booking?.confirmation_email_status,
        confirmationEmailSentAt: booking?.confirmation_email_sent_at,
        confirmationEmailDeliveredAt: booking?.confirmation_email_delivered_at,
        confirmationEmailClickedAt: booking?.confirmation_email_clicked_at,
        reminderEmailStatus: booking?.reminder_email_status,
        reminderEmailSentAt: booking?.reminder_email_sent_at,
        reminderEmailDeliveredAt: booking?.reminder_email_delivered_at,
        reminderEmailClickedAt: booking?.reminder_email_clicked_at,
        followupEmailStatus: booking?.followup_email_status,
        followupEmailSentAt: booking?.followup_email_sent_at,
        followupEmailClickedAt: booking?.followup_email_clicked_at,
        reminderSmsStatus: booking?.reminder_sms_status,
        reminderSmsSentAt: booking?.reminder_sms_sent_at,
        reminderSmsDeliveredAt: booking?.reminder_sms_delivered_at,
        preclassSmsStatus: booking?.preclass_sms_status,
        preclassSmsSentAt: booking?.preclass_sms_sent_at,
        preclassSmsDeliveredAt: booking?.preclass_sms_delivered_at,
      };
    });

    // Propagate SMS opt-out to every participant sharing the opted-out phone number.
    const optedOutPhones = new Set();
    for (const p of roster) {
      if (p.smsOptedOutDate && p.contactPhone) optedOutPhones.add(p.contactPhone);
    }
    for (const p of roster) {
      if (p.contactPhone && optedOutPhones.has(p.contactPhone) && !p.smsOptedOutDate) {
        p.smsOptedOutDate = 'opted-out';
      }
    }

    roster.sort((a, b) => {
      if (a.bookingId !== b.bookingId) {
        return (a.bookingNumber || 0) - (b.bookingNumber || 0);
      }
      if (a.isPrimaryContact && !b.isPrimaryContact) return -1;
      if (!a.isPrimaryContact && b.isPrimaryContact) return 1;
      const lastCmp = (a.lastName || '').localeCompare(b.lastName || '');
      if (lastCmp !== 0) return lastCmp;
      return (a.firstName || '').localeCompare(b.firstName || '');
    });

    const { data: surveys, error: sErr } = await supabase
      .from('satisfaction_surveys')
      .select('*')
      .eq('class_schedule_id', schedule.id);
    if (sErr) throw sErr;

    const surveyResponses = (surveys || []).map(s => ({
      id: outerId(s),
      submissionDate: s.submission_date || s.created_at,
      firstName: s.first_name,
      lastName: s.last_name,
      email: s.email,
      phone: s.phone,
      overallExperience: s.q1_overall_experience,
      confidenceLevel: s.q2_confidence_level,
      mostValuable: s.q3_most_valuable_part,
      areasForImprovement: s.q4_areas_for_improvement,
      wouldRecommend: s.q5_would_recommend,
      optInCommunication: s.q6_opt_in_future_communication,
      willingToShare: s.q7_willing_to_share_experience,
      writtenTestimonial: s.q7_written_testimonial,
      reviewPlatformClicked: s.q7_review_platform_clicked,
      preferredContactMethod: s.preferred_contact_method,
    }));

    // Matches the computed "Booked Spots" used by /api/schedules: sum of
    // participants across all Confirmed bookings (regardless of reschedule status).
    const { data: allConfirmed, error: bcErr } = await supabase
      .from('bookings')
      .select('number_of_participants')
      .eq('class_schedule_id', schedule.id)
      .eq('status', 'Confirmed');
    if (bcErr) throw bcErr;
    const bookedSpots = (allConfirmed || []).reduce((n, b) => n + (b.number_of_participants || 0), 0);

    res.status(200).json({
      classInfo: {
        id: classScheduleId,
        className: schedule.classes?.class_name || 'Unknown Class',
        date: schedule.date,
        startTime: schedule.start_time_new || schedule.start_time,
        endTime: schedule.end_time_new || schedule.end_time,
        location: schedule.classes?.location || null,
        availableSpots: schedule.available_spots,
        bookedSpots,
      },
      roster,
      surveyResponses,
      totalParticipants: roster.length,
    });
  } catch (error) {
    console.error('Class roster error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
