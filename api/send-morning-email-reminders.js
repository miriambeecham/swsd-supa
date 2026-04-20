// /api/send-morning-email-reminders.js
// Cron: 9 AM Pacific — comprehensive email reminder for tomorrow's classes.
// Same target as send-class-reminders but a slightly different template + an
// additional skip when the confirmation email bounced.
import { requireSupabase, outerId } from './_supabase.js';
import { requireCronAuth } from './_cron-auth.js';
import { formatTimeForDisplay, formatDateForDisplay } from './_email.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  if (!requireCronAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = `"Streetwise Self Defense" <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ success: false, error: 'RESEND_API_KEY not configured' });
  }

  try {
    const nowPacific = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
    const todayPacific = new Date(nowPacific);
    const tomorrowPacific = new Date(todayPacific);
    tomorrowPacific.setDate(tomorrowPacific.getDate() + 1);
    const tomorrowDateStr = tomorrowPacific.toISOString().split('T')[0];

    const { data: schedules, error: sErr } = await supabase
      .from('class_schedules')
      .select('id, airtable_record_id, date, start_time_new, end_time_new, classes(class_name, location)')
      .eq('date', tomorrowDateStr)
      .eq('is_cancelled', false);
    if (sErr) throw sErr;

    if (!schedules || schedules.length === 0) {
      return res.json({ success: true, message: 'No classes scheduled for tomorrow', classesFound: 0, emailsSent: 0, taEmailsSent: 0 });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);
    const results = [];
    let totalEmailsSent = 0;
    let totalTaEmailsSent = 0;

    for (const schedule of schedules) {
      const className = schedule.classes?.class_name || 'Self Defense Class';
      const classLocation = schedule.classes?.location || 'Location TBD';
      const displayStartTime = formatTimeForDisplay(schedule.start_time_new);
      const displayEndTime = formatTimeForDisplay(schedule.end_time_new);
      const formattedDate = formatDateForDisplay(schedule.date);
      const scheduleRouteId = outerId(schedule);
      const classPrepUrl = `https://streetwiseselfdefense.com/class-prep/${scheduleRouteId}`;

      const { data: bookings, error: bErr } = await supabase
        .from('bookings')
        .select('id, contact_email, contact_first_name, number_of_participants, reminder_email_id, email_unsubscribed, confirmation_email_status')
        .eq('class_schedule_id', schedule.id)
        .eq('status', 'Confirmed')
        .or('reschedule_status.is.null,reschedule_status.neq.Pending Reschedule');
      if (bErr) {
        console.error(`[MORNING-EMAIL] Fetch bookings failed:`, bErr);
      } else {
        const bookingIds = bookings.map(b => b.id);
        const { data: parts } = bookingIds.length
          ? await supabase.from('participants').select('booking_id, first_name, last_name').in('booking_id', bookingIds)
          : { data: [] };
        const partsByBooking = new Map();
        for (const p of parts || []) {
          const list = partsByBooking.get(p.booking_id) || [];
          list.push(p);
          partsByBooking.set(p.booking_id, list);
        }

        for (const booking of bookings || []) {
          try {
            if (!booking.contact_email) continue;
            if (booking.reminder_email_id) continue;
            if (booking.confirmation_email_status === 'Bounced') continue;
            if (booking.email_unsubscribed) continue;

            const contactFirstName = booking.contact_first_name || 'Valued Customer';
            const bookingParticipants = partsByBooking.get(booking.id) || [];
            const participantCount = booking.number_of_participants || bookingParticipants.length || 1;
            const allParticipantNames = bookingParticipants.length > 0
              ? bookingParticipants.map(p => `${p.first_name} ${p.last_name}`).join(', ')
              : contactFirstName;

            const emailHTML = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://www.streetwiseselfdefense.com/swsd-logo-official.png" alt="Streetwise Self Defense" style="max-width: 300px;">
  </div>
  <h1 style="color: #2C3E50; text-align: center; font-size: 32px; margin-bottom: 10px;">Your Class is Tomorrow!</h1>
  <p style="font-size: 16px; line-height: 1.6;">Hi ${contactFirstName},</p>
  <p style="font-size: 16px; line-height: 1.6;">This is a friendly reminder that your self-defense class is happening <strong>tomorrow</strong>! We're excited to work with ${participantCount > 1 ? 'your group' : 'you'}.</p>
  <div style="background: #F0F4F8; border: 2px solid #2C3E50; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <h2 style="color: #2C3E50; margin-top: 0; margin-bottom: 20px; font-size: 24px;">Your Class Details</h2>
    <table style="width: 100%; font-size: 16px;" cellpadding="8" cellspacing="0">
      <tr><td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; font-weight: bold; color: #2C3E50; width: 35%;">Class:</td><td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; color: #1E293B;">${className}</td></tr>
      <tr><td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; font-weight: bold; color: #2C3E50;">Date:</td><td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; color: #1E293B;">${formattedDate}</td></tr>
      <tr><td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; font-weight: bold; color: #2C3E50;">Time:</td><td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; color: #1E293B;">${displayStartTime} - ${displayEndTime}</td></tr>
      <tr><td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; font-weight: bold; color: #2C3E50;">Location:</td><td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; color: #1E293B;">${classLocation}</td></tr>
      <tr><td style="padding: 12px 8px; font-weight: bold; color: #2C3E50;">Registered:</td><td style="padding: 12px 8px; color: #1E293B;">${allParticipantNames}</td></tr>
    </table>
  </div>
  <div style="background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <h2 style="color: #92400E; margin-top: 0; font-size: 22px;">📋 Class Prep & Waiver</h2>
    <p style="font-size: 15px; color: #78350F; line-height: 1.7;">Please visit your class prep page for everything you need to know:</p>
    <ul style="font-size: 14px; color: #78350F; margin: 15px 0; line-height: 1.8;">
      <li>Complete your liability waiver ${participantCount > 1 ? '- <strong>if you booked for multiple people, forward this email to everyone!</strong>' : ''}</li>
      <li>Get detailed directions & parking info</li>
      <li>See what to bring (and what NOT to bring)</li>
      <li>Review recommended attire</li>
      <li>Learn about the photography policy</li>
      <li>Access map links (Google & Apple Maps)</li>
    </ul>
    <p style="text-align: center; margin: 25px 0;"><a href="${classPrepUrl}" style="background: #20B2AA; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">View Class Prep & Complete Waiver</a></p>
    <p style="font-size: 14px; color: #6B7280; margin-top: 20px;"><strong>Important Waiver Instructions:</strong></p>
    <ul style="font-size: 14px; color: #6B7280; margin: 10px 0; line-height: 1.8;">
      <li><strong>Adults (18+):</strong> Select "Myself"</li>
      <li><strong>Teens (15-17):</strong> Select "Minors Only" (parent/guardian must sign)</li>
      <li><strong>Teens with parent:</strong> Select "Parent/Guardian & Minor"</li>
    </ul>
    <p style="font-size: 13px; color: #6B7280; font-style: italic; margin-top: 15px;">Pro tip: On mobile, scroll down for the "Continue" button!</p>
  </div>
  <div style="background: #F8F9FA; border: 1px solid #D1D5DB; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <h2 style="color: #2C3E50; margin-top: 0; font-size: 22px;">Quick Favor</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #374151;">I've had some deliverability issues with these emails landing in spam. If you could briefly reply confirming you received this and plan to attend, it would help me out tremendously!</p>
    <p style="font-size: 14px; color: #6B7280; font-style: italic; margin-top: 12px;">You can also respond to the text message reminder I may send.</p>
  </div>
  <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-left: 4px solid #20B2AA; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <p style="font-size: 16px; line-height: 1.7; font-style: italic; color: #374151; margin: 0;">Bring any male-focused frustration you might have... take it out on me, with no judgment! First one to knock me down gets bragging rights! 😄</p>
  </div>
  <div style="background: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
    <p style="font-size: 16px; margin-bottom: 15px; color: #374151;">If you have any last-minute questions, feel free to call or text:</p>
    <p style="font-size: 22px; font-weight: bold; color: #2C3E50; margin: 15px 0;"><a href="tel:+19255329953" style="color: #20B2AA; text-decoration: none;">(925) 532-9953</a></p>
    <p style="margin-top: 20px; font-size: 16px; color: #374151;">I'm looking forward to working with you!</p>
    <p style="font-weight: bold; margin-top: 15px; font-size: 18px; color: #2C3E50;">See you tomorrow!</p>
  </div>
  <div style="background: #F8F9FA; border: 1px solid #D1D5DB; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
    <p style="font-weight: bold; font-size: 16px; color: #2C3E50; margin-bottom: 8px;">Warm regards,</p>
    <p style="font-size: 18px; margin: 8px 0; color: #2C3E50;">Jay Beecham</p>
    <p style="color: #6B7280; font-size: 15px; margin: 8px 0;">Streetwise Self Defense</p>
    <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 12px;">
      Empowering women and vulnerable populations through practical self-defense training<br>
      Walnut Creek, CA | (925) 532-9953
    </p>
    <p style="margin-top: 20px; font-size: 12px; color: #9CA3AF;"><a href="https://streetwiseselfdefense.com/api/unsubscribe?id=${booking.id}" style="color: #6B7280; text-decoration: underline;">Unsubscribe from reminder emails</a></p>
  </div>
</body>
</html>`;

            const { data, error } = await resend.emails.send({
              from: FROM_EMAIL,
              to: booking.contact_email,
              cc: 'reminders@streetwiseselfdefense.com',
              subject: `Tomorrow: Your ${className} Class`,
              html: emailHTML,
              headers: {
                'List-Unsubscribe': `<https://streetwiseselfdefense.com/api/unsubscribe?id=${booking.id}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            });
            if (error) throw error;

            if (data?.id) {
              await supabase.from('bookings').update({
                reminder_email_id: data.id,
                reminder_email_status: 'Sent',
                reminder_email_sent_at: new Date().toISOString(),
              }).eq('id', booking.id);
            }
            totalEmailsSent++;
            results.push({ scheduleId: schedule.id, bookingId: booking.id, email: booking.contact_email, recipientType: 'student', success: true });
            await sleep(600);
          } catch (err) {
            console.error(`[MORNING-EMAIL] Failed for booking ${booking.id}:`, err);
            results.push({ scheduleId: schedule.id, bookingId: booking.id, recipientType: 'student', success: false, error: err.message });
          }
        }
      }

      // ── Teaching assistants ────────────────────────────────────────
      const { data: assignments } = await supabase
        .from('teaching_assignments')
        .select('persons(id, name, email)')
        .eq('class_schedule_id', schedule.id);

      for (const assignment of assignments || []) {
        const person = assignment.persons;
        if (!person?.email) continue;
        const taFirstName = (person.name || 'Teaching Assistant').split(' ')[0];

        try {
          const taEmailHTML = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://www.streetwiseselfdefense.com/swsd-logo-official.png" alt="Streetwise Self Defense" style="max-width: 300px;">
  </div>
  <h1 style="color: #553c9a; text-align: center; font-size: 32px; margin-bottom: 10px;">You're Helping Teach Tomorrow!</h1>
  <p style="font-size: 16px; line-height: 1.6;">Hi ${taFirstName},</p>
  <p style="font-size: 16px; line-height: 1.6;">This is a friendly reminder that you're scheduled to help teach a class tomorrow. Thank you so much for volunteering your time!</p>
  <div style="background: #F5F3FF; border: 2px solid #553c9a; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <h2 style="color: #553c9a; margin-top: 0; margin-bottom: 20px; font-size: 24px;">Class Details</h2>
    <table style="width: 100%; font-size: 16px;" cellpadding="8" cellspacing="0">
      <tr><td style="padding: 12px 8px; border-bottom: 1px solid #DDD6FE; font-weight: bold; color: #553c9a; width: 35%;">Class:</td><td style="padding: 12px 8px; border-bottom: 1px solid #DDD6FE; color: #1E293B;">${className}</td></tr>
      <tr><td style="padding: 12px 8px; border-bottom: 1px solid #DDD6FE; font-weight: bold; color: #553c9a;">Date:</td><td style="padding: 12px 8px; border-bottom: 1px solid #DDD6FE; color: #1E293B;">${formattedDate}</td></tr>
      <tr><td style="padding: 12px 8px; border-bottom: 1px solid #DDD6FE; font-weight: bold; color: #553c9a;">Time:</td><td style="padding: 12px 8px; border-bottom: 1px solid #DDD6FE; color: #1E293B;">${displayStartTime} - ${displayEndTime}</td></tr>
      <tr><td style="padding: 12px 8px; font-weight: bold; color: #553c9a;">Location:</td><td style="padding: 12px 8px; color: #1E293B;">${classLocation}</td></tr>
    </table>
  </div>
  <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 30px 0;">
    <p style="font-size: 15px; line-height: 1.6; color: #92400E; margin: 0;"><strong>⏰ Please arrive 15-20 minutes early</strong> to help with setup and greet students as they arrive.</p>
  </div>
  <div style="background: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
    <p style="font-size: 16px; margin-bottom: 15px; color: #374151;">If something comes up and you can't make it, please let me know ASAP:</p>
    <p style="font-size: 22px; font-weight: bold; color: #553c9a; margin: 15px 0;"><a href="tel:+19255329953" style="color: #553c9a; text-decoration: none;">(925) 532-9953</a></p>
  </div>
  <div style="background: #F8F9FA; border: 1px solid #D1D5DB; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
    <p style="font-weight: bold; font-size: 16px; color: #2C3E50; margin-bottom: 8px;">Thank you!</p>
    <p style="font-size: 18px; margin: 8px 0; color: #2C3E50;">Jay Beecham</p>
    <p style="color: #6B7280; font-size: 15px; margin: 8px 0;">Streetwise Self Defense</p>
  </div>
</body>
</html>`;

          const { error: taErr } = await resend.emails.send({
            from: FROM_EMAIL,
            to: person.email,
            reply_to: 'jay@streetwiseselfdefense.com',
            subject: `Tomorrow: You're Helping Teach ${className}!`,
            html: taEmailHTML,
          });
          if (taErr) throw taErr;

          totalTaEmailsSent++;
          results.push({ scheduleId: schedule.id, personId: person.id, email: person.email, recipientType: 'TA', success: true });
          await sleep(600);
        } catch (err) {
          console.error(`[MORNING-EMAIL] TA email failed for ${person.email}:`, err);
          results.push({ scheduleId: schedule.id, personId: person.id, email: person.email, recipientType: 'TA', success: false, error: err.message });
        }
      }
    }

    return res.json({ success: true, message: '9 AM email reminders sent', classesFound: schedules.length, emailsSent: totalEmailsSent, taEmailsSent: totalTaEmailsSent, results });
  } catch (error) {
    console.error('[MORNING-EMAIL] Fatal error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
