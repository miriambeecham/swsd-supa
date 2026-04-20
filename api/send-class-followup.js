// /api/send-class-followup.js
// Cron job to send follow-up survey/review emails ~1 hour after class ends.
import { requireSupabase, outerId } from './_supabase.js';
import { requireCronAuth } from './_cron-auth.js';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  if (!requireCronAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const SITE_URL = process.env.SITE_URL || 'https://streetwiseselfdefense.com';
  const FROM_EMAIL = `"Jay Beecham - Streetwise Self Defense" <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ success: false, error: 'RESEND_API_KEY not configured' });
  }

  try {
    const now = Date.now();
    const fortyFiveAgo = new Date(now - 45 * 60 * 1000).toISOString();
    const seventyFiveAgo = new Date(now - 75 * 60 * 1000).toISOString();

    const { data: schedules, error: sErr } = await supabase
      .from('class_schedules')
      .select('id, airtable_record_id, date, end_time_new, classes(class_name)')
      .gte('end_time_new', seventyFiveAgo)
      .lte('end_time_new', fortyFiveAgo)
      .eq('is_cancelled', false);
    if (sErr) throw sErr;

    if (!schedules || schedules.length === 0) {
      return res.json({ success: true, message: 'No classes ended ~1 hour ago', classesFound: 0, emailsSent: 0 });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);

    const results = [];
    let totalEmailsSent = 0;

    for (const schedule of schedules) {
      const className = schedule.classes?.class_name || 'Self Defense Class';
      const scheduleRouteId = outerId(schedule);

      const { data: bookings, error: bErr } = await supabase
        .from('bookings')
        .select('id, contact_email, contact_first_name, email_unsubscribed, followup_email_id')
        .eq('class_schedule_id', schedule.id)
        .eq('status', 'Confirmed')
        .or('reschedule_status.is.null,reschedule_status.neq.Pending Reschedule');
      if (bErr) {
        console.error(`[FOLLOWUP-CRON] Fetch bookings failed for schedule ${schedule.id}:`, bErr);
        continue;
      }

      for (const booking of bookings || []) {
        try {
          if (!booking.contact_email) continue;
          if (booking.email_unsubscribed) continue;
          if (booking.followup_email_id) continue;

          const contactFirstName = booking.contact_first_name || 'Valued Student';
          const classDate = schedule.date
            ? new Date(schedule.date + 'T12:00:00').toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })
            : 'recently';
          const surveyLink = `${SITE_URL}/satisfaction-survey?classScheduleId=${scheduleRouteId}`;

          const emailHTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Thank You for Attending!</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f8f9fa">
<table role="presentation" style="width:100%;border-collapse:collapse"><tr><td align="center" style="padding:40px 20px">
<table role="presentation" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1)">
<tr><td style="background-color:#2C3E50;padding:30px;text-align:center;border-radius:8px 8px 0 0">
<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:600">Thank You, ${contactFirstName}!</h1></td></tr>
<tr><td style="padding:40px 30px">
<p style="margin:0 0 20px 0;color:#2C3E50;font-size:16px;line-height:1.6">Thank you for attending the <strong>Streetwise Self Defense & Personal Safety</strong> class on <strong>${classDate}</strong>!</p>
<p style="margin:0 0 20px 0;color:#2C3E50;font-size:16px;line-height:1.6">I hope you left with some practical skills, a little more confidence, and a better understanding of what you're capable of under pressure.</p>
<div style="background-color:#E0F7F5;border-left:4px solid:#20B2AA;padding:20px;margin:30px 0;border-radius:4px">
<h2 style="margin:0 0 15px 0;color:#2C3E50;font-size:18px;font-weight:600">📋 Quick Feedback Survey</h2>
<p style="margin:0 0 15px 0;color:#2C3E50;font-size:15px;line-height:1.6">Your feedback helps me improve the class and empowers others to find quality self-defense training. Would you take 2-3 minutes to share your experience?</p>
<table role="presentation" style="margin:20px 0"><tr><td align="center"><a href="${surveyLink}" style="display:inline-block;background-color:#20B2AA;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:6px;font-size:16px;font-weight:600;text-align:center">Take the 2-Minute Survey</a></td></tr></table>
<p style="margin:15px 0 0 0;color:#6C757D;font-size:13px;line-height:1.5">📝 Your class is already pre-selected for you!</p>
</div>
<h2 style="margin:30px 0 15px 0;color:#2C3E50;font-size:18px;font-weight:600">⭐ Share Your Experience Publicly</h2>
<p style="margin:0 0 15px 0;color:#2C3E50;font-size:15px;line-height:1.6">If you enjoyed the class and found it valuable, I'd greatly appreciate a quick review. These "Verified" Reviews (on Google or Yelp) accomplish several things:</p>
<ol style="margin:0 0 20px 0;padding-left:25px;color:#2C3E50;font-size:15px;line-height:1.8">
<li style="margin-bottom:10px"><strong>Help potential students commit to showing up.</strong> I believe there are benefits to having a male instructor, but it needs to be someone you are comfortable with, and that isn't always obvious from the class sign-up form. If you have had traumatic experiences in your past, it is even more difficult.</li>
<li style="margin-bottom:10px"><strong>Help others find this program.</strong> The more popular the class, the faster Streetwise will be known as the place to go for this kind of education.</li>
<li style="margin-bottom:10px"><strong>Support future classes in our community.</strong> Your positive reviews help ensure we can continue offering these empowering classes.</li></ol>
<div style="background-color:#F8F9FA;padding:20px;margin:25px 0;border-radius:6px;text-align:center">
<p style="margin:0 0 15px 0;color:#2C3E50;font-size:15px;font-weight:600">Leave a review on your preferred platform:</p>
<table role="presentation" style="margin:0 auto">
<tr><td style="padding:5px"><a href="https://bit.ly/Streetwise-Leave-Review-Google" style="display:inline-block;background-color:#2C3E50;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:15px;font-weight:600">Google Review</a></td></tr>
<tr><td style="padding:5px"><a href="https://bit.ly/Streetwise-Leave-Review-Yelp" style="display:inline-block;background-color:#2C3E50;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:15px;font-weight:600">Yelp Review</a></td></tr></table>
</div>
<p style="margin:30px 0 0 0;color:#2C3E50;font-size:15px;line-height:1.6">Whether or not you leave a positive review, or you are even comfortable leaving a review at all, I would like to thank you again for being part of the class and for supporting Streetwise Self Defense.</p>
<p style="margin:15px 0 0 0;color:#2C3E50;font-size:15px;line-height:1.6">I look forward to seeing you again in a future workshop!</p>
<p style="margin:25px 0 0 0;color:#2C3E50;font-size:15px;line-height:1.6">Warm regards,<br><strong>Jay Beecham</strong><br>Streetwise Self Defense<br>
<a href="tel:925-532-9953" style="color:#20B2AA;text-decoration:none">925-532-9953</a><br>
<a href="mailto:jay@streetwiseselfdefense.com" style="color:#20B2AA;text-decoration:none">jay@streetwiseselfdefense.com</a></p>
</td></tr>
<tr><td style="background-color:#f8f9fa;padding:20px 30px;border-radius:0 0 8px 8px;text-align:center">
<p style="margin:0;color:#6C757D;font-size:13px;line-height:1.5">Streetwise Self Defense<br>Empowering individuals through practical self-defense training</p>
<p style="margin-top:15px;font-size:12px;color:#9CA3AF"><a href="https://streetwiseselfdefense.com/api/unsubscribe?id=${booking.id}" style="color:#6B7280;text-decoration:underline">Unsubscribe from emails</a></p>
</td></tr></table></td></tr></table>
</body></html>`.trim();

          const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: booking.contact_email,
            cc: ['jay@streetwiseselfdefense.com'],
            subject: `Thank You for Attending ${className}!`,
            html: emailHTML,
            headers: {
              'List-Unsubscribe': `<https://streetwiseselfdefense.com/api/unsubscribe?id=${booking.id}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          });
          if (error) throw error;

          if (data?.id) {
            await supabase.from('bookings').update({
              followup_email_id: data.id,
              followup_email_status: 'Sent',
              followup_email_sent_at: new Date().toISOString(),
            }).eq('id', booking.id);
          }

          totalEmailsSent++;
          results.push({ scheduleId: schedule.id, bookingId: booking.id, email: booking.contact_email, success: true });
          await sleep(600);
        } catch (err) {
          console.error(`[FOLLOWUP-CRON] Failed for booking ${booking.id}:`, err);
          results.push({ scheduleId: schedule.id, bookingId: booking.id, success: false, error: err.message });
        }
      }
    }

    return res.json({ success: true, classesFound: schedules.length, emailsSent: totalEmailsSent, results });
  } catch (error) {
    console.error('[FOLLOWUP-CRON] Fatal error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
