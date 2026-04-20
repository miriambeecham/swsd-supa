// /api/send-preclass-sms-reminders.js
// Cron: sends a final SMS reminder ~2 hours before class starts.
// Includes the address and a Google Maps link. TAs get a similar SMS.
import { requireSupabase, outerId } from './_supabase.js';
import { requireCronAuth } from './_cron-auth.js';
import { formatTimeForDisplay } from './_email.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function formatPhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return null;
}

export default async function handler(req, res) {
  if (!requireCronAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return res.json({ success: true, message: 'Twilio not configured', smsSent: 0, taSmsSent: 0 });
  }

  try {
    const twilio = await import('twilio');
    const twilioClient = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const now = Date.now();
    const twoHoursFromNow = new Date(now + 2 * 60 * 60 * 1000).toISOString();
    const twoHoursFifteenFromNow = new Date(now + 2.25 * 60 * 60 * 1000).toISOString();

    const { data: schedules, error: sErr } = await supabase
      .from('class_schedules')
      .select('id, airtable_record_id, start_time_new, classes(class_name, location)')
      .gte('start_time_new', twoHoursFromNow)
      .lte('start_time_new', twoHoursFifteenFromNow)
      .eq('is_cancelled', false);
    if (sErr) throw sErr;

    if (!schedules || schedules.length === 0) {
      return res.json({ success: true, message: 'No classes starting in 2 hours', classesFound: 0, smsSent: 0, taSmsSent: 0 });
    }

    const results = [];
    let totalSmsSent = 0;
    let totalSmsSkipped = 0;
    let totalTaSmsSent = 0;

    for (const schedule of schedules) {
      const className = schedule.classes?.class_name || 'class';
      const classLocation = schedule.classes?.location || 'the location';
      const mapsLink = classLocation !== 'the location'
        ? `https://maps.google.com/?q=${encodeURIComponent(classLocation)}`
        : '';
      const scheduleRouteId = outerId(schedule);
      const host = req.headers.host || 'www.streetwiseselfdefense.com';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const classPrepUrl = `${protocol}://${host}/class-prep/${scheduleRouteId}`;
      const displayStartTime = formatTimeForDisplay(schedule.start_time_new);

      // ── Students ────────────────────────────────────────────────────
      const { data: bookings, error: bErr } = await supabase
        .from('bookings')
        .select('id, contact_phone, contact_first_name, sms_consent_date, sms_opted_out_date, preclass_sms_id')
        .eq('class_schedule_id', schedule.id)
        .eq('status', 'Confirmed')
        .or('reschedule_status.is.null,reschedule_status.neq.Pending Reschedule');
      if (bErr) {
        console.error(`[PRECLASS-SMS] Fetch bookings failed:`, bErr);
        continue;
      }

      for (const booking of bookings || []) {
        try {
          if (!booking.contact_phone) { totalSmsSkipped++; continue; }
          if (!booking.sms_consent_date) { totalSmsSkipped++; continue; }
          if (booking.sms_opted_out_date) { totalSmsSkipped++; continue; }
          if (booking.preclass_sms_id) { totalSmsSkipped++; continue; }

          const formattedPhone = formatPhone(booking.contact_phone);
          if (!formattedPhone) { totalSmsSkipped++; continue; }

          const smsMessage = `🎉 Your Streetwise Self Defense class starts at ${displayStartTime}. The address is: ${classLocation}${mapsLink ? ` ${mapsLink}` : ''}

If you haven't signed your waiver yet, click here ${classPrepUrl}. Text or call (925) 532-9953 with any questions.

See you there!
~Jay`;

          const message = await twilioClient.messages.create({
            body: smsMessage, from: TWILIO_PHONE_NUMBER, to: formattedPhone,
          });

          await supabase.from('bookings').update({
            preclass_sms_id: message.sid,
            preclass_sms_status: 'Sent',
            preclass_sms_sent_at: new Date().toISOString(),
          }).eq('id', booking.id);

          totalSmsSent++;
          results.push({ scheduleId: schedule.id, bookingId: booking.id, phone: formattedPhone, recipientType: 'student', success: true });
          await sleep(1000);
        } catch (err) {
          console.error(`[PRECLASS-SMS] Failed for booking ${booking.id}:`, err);
          results.push({ scheduleId: schedule.id, bookingId: booking.id, recipientType: 'student', success: false, error: err.message });
        }
      }

      // ── Teaching assistants ────────────────────────────────────────
      const { data: assignments } = await supabase
        .from('teaching_assignments')
        .select('persons(id, name, phone)')
        .eq('class_schedule_id', schedule.id);

      for (const assignment of assignments || []) {
        const person = assignment.persons;
        if (!person?.phone) continue;
        const formattedPhone = formatPhone(person.phone);
        if (!formattedPhone) continue;

        const taFirstName = (person.name || 'Teaching Assistant').split(' ')[0];
        try {
          const taSmsMessage = `Hi ${taFirstName}! Class starts at ${displayStartTime}. Address: ${classLocation}${mapsLink ? ` ${mapsLink}` : ''}

Please arrive by now if you haven't already! Text me if you're running late.

~Jay`;
          const message = await twilioClient.messages.create({
            body: taSmsMessage, from: TWILIO_PHONE_NUMBER, to: formattedPhone,
          });
          totalTaSmsSent++;
          results.push({ scheduleId: schedule.id, personId: person.id, phone: formattedPhone, recipientType: 'TA', success: true, sid: message.sid });
          await sleep(1000);
        } catch (err) {
          console.error(`[PRECLASS-SMS] TA SMS failed for ${person.phone}:`, err);
          results.push({ scheduleId: schedule.id, personId: person.id, recipientType: 'TA', success: false, error: err.message });
        }
      }
    }

    return res.json({ success: true, message: 'Pre-class SMS reminders sent', classesFound: schedules.length, smsSent: totalSmsSent, taSmsSent: totalTaSmsSent, smsSkipped: totalSmsSkipped, results });
  } catch (error) {
    console.error('[PRECLASS-SMS] Fatal error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
