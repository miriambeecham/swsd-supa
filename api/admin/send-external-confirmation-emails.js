// /api/admin/send-external-confirmation-emails.js
// Sends a Registration Confirmed email (no payment block) for the listed
// bookings — typically those imported via CSV.
import { requireSupabase } from '../_supabase.js';
import { requireAdminAuth } from '../_admin-auth.js';
import {
  convertToISO, formatTimeForDisplay, formatDateForDisplay,
  buildGcalURL, buildClassIcal, sendBookingEmailAndTrack,
} from '../_email.js';

async function findBookingForEmail(supabase, bookingId) {
  const isAirtableId = /^rec/.test(bookingId);
  const cols =
    'id, airtable_record_id, contact_first_name, contact_email, email_unsubscribed, ' +
    'number_of_participants, confirmation_email_status, ' +
    'class_schedules(id, airtable_record_id, date, start_time_new, end_time_new, classes(class_name, location))';
  const q = supabase.from('bookings').select(cols);
  const { data, error } = await (isAirtableId
    ? q.eq('airtable_record_id', bookingId)
    : q.eq('id', bookingId)
  ).maybeSingle();
  if (error) throw error;
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
  }

  try {
    const { bookingIds } = req.body;
    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({ error: 'Invalid bookingIds' });
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const bookingId of bookingIds) {
      try {
        const booking = await findBookingForEmail(supabase, bookingId);
        if (!booking) throw new Error('Booking not found');
        const contactEmail = booking.contact_email;

        if (booking.email_unsubscribed) {
          results.push({ bookingId, success: true, skipped: true, reason: 'Customer unsubscribed' });
          continue;
        }
        if (!contactEmail) throw new Error('No contact email found');
        if (booking.confirmation_email_status === 'Sent' || booking.confirmation_email_status === 'Delivered') {
          results.push({ bookingId, success: true, skipped: true, reason: 'Already sent' });
          successCount++;
          continue;
        }

        const schedule = booking.class_schedules;
        const klass = schedule?.classes;
        const className = klass?.class_name || 'Self Defense Class';
        const location = klass?.location || 'Walnut Creek, CA';
        const startISO = convertToISO(schedule?.date, schedule?.start_time_new);
        const endISO = convertToISO(schedule?.date, schedule?.end_time_new);
        const displayStartTime = formatTimeForDisplay(schedule?.start_time_new);
        const displayEndTime = formatTimeForDisplay(schedule?.end_time_new);
        const formattedDate = formatDateForDisplay(schedule?.date);

        const host = req.headers.host || 'www.streetwiseselfdefense.com';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const scheduleRouteId = schedule?.airtable_record_id || schedule?.id;
        const classPrepUrl = scheduleRouteId ? `${protocol}://${host}/class-prep/${scheduleRouteId}` : null;

        const gcalURL = buildGcalURL({
          className, startISO, endISO, location,
          details: 'Self defense class registration confirmed',
        });
        const icalString = await buildClassIcal({
          className, startISO, endISO, location, description: 'Self defense class confirmed',
        });

        const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://www.streetwiseselfdefense.com/swsd-logo-official.png" alt="Streetwise Self Defense" style="max-width: 300px;">
  </div>
  <h1 style="color: #1E293B; text-align: center;">Registration Confirmed!</h1>
  <p>Dear ${booking.contact_first_name || 'Valued Participant'},</p>
  <p>Congratulations on taking this empowering step! Your registration for our self defense class has been confirmed.</p>
  <p>You're not just learning techniques – you're building strength, awareness, and the confidence that comes with knowing you can protect yourself.</p>
  <div style="background: #F0FDFC; border: 1px solid #14b8a6; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #1E293B; margin-top: 0;">Your Class Details</h2>
    <p><strong>Class:</strong> ${className}</p>
    <p><strong>Date:</strong> ${formattedDate}</p>
    <p><strong>Time:</strong> ${displayStartTime} - ${displayEndTime}</p>
    <p><strong>Location:</strong> ${location}</p>
    <p><strong>Participants:</strong> ${booking.number_of_participants || 1}</p>
  </div>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${gcalURL}" style="display: inline-block; background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Add to Google Calendar</a>
  </div>
  ${classPrepUrl ? `
  <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="color: #92400E; margin-top: 0;">📋 Important: Complete Your Waiver</h3>
    <p style="color: #78350F;">Before class, please complete your liability waiver and provide emergency contact information:</p>
    <div style="text-align: center; margin-top: 15px;">
      <a href="${classPrepUrl}" style="display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Complete Waiver & Class Prep</a>
    </div>
  </div>
  ` : ''}
  <h3 style="color: #1E293B;">What to Bring:</h3>
  <ul style="color: #4B5563; line-height: 1.8;">
    <li>Comfortable clothing you can move freely in</li>
    <li>Water bottle to stay hydrated</li>
    <li>Positive attitude and willingness to learn</li>
  </ul>
  <p style="color: #4B5563;">We're thrilled to have you join us. This class will equip you with practical skills and the mindset to handle challenging situations with confidence.</p>
  <p style="color: #4B5563;">If you have any questions before class, don't hesitate to reach out!</p>
  <p>See you in class!</p>
  <p><strong>The Streetwise Self Defense Team</strong></p>
  <hr style="border: 1px solid #E5E7EB; margin: 30px 0;">
  <p style="text-align: center; font-size: 14px; color: #6B7280;">
    Empowering women and vulnerable populations through practical self defense training.<br>
    Streetwise Self Defense | Walnut Creek, CA<br>
    © ${new Date().getFullYear()} Streetwise Self Defense. All rights reserved.
  </p>
  <p style="text-align: center; margin-top: 15px; font-size: 12px; color: #9CA3AF;">
    <a href="${protocol}://${host}/api/unsubscribe?id=${booking.id}" style="color: #6B7280; text-decoration: underline;">Unsubscribe from emails</a>
  </p>
</body>
</html>
`;

        const sendResult = await sendBookingEmailAndTrack({
          supabase, bookingUuid: booking.id, to: contactEmail,
          subject: 'Your Self Defense Class Registration is Confirmed!',
          html, icalString,
          unsubscribeUrl: `${protocol}://${host}/api/unsubscribe?id=${booking.id}`,
        });
        if (!sendResult.ok) throw new Error(`Resend error: ${sendResult.error?.message || 'unknown'}`);

        successCount++;
        results.push({ bookingId, success: true, email: contactEmail, resendId: sendResult.resendId });
      } catch (error) {
        errorCount++;
        console.error(`[EXTERNAL-EMAIL] Error processing booking ${bookingId}:`, error);
        results.push({ bookingId, success: false, error: error.message });
      }
    }

    return res.json({
      success: true,
      totalBookings: bookingIds.length,
      successCount,
      errorCount,
      results,
    });
  } catch (error) {
    console.error('[EXTERNAL-EMAIL] Fatal error:', error);
    return res.status(500).json({ error: error.message });
  }
}
