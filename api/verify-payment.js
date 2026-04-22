// /api/verify-payment.js
import { requireSupabase } from './_supabase.js';

// Look up a booking by either UUID (new) or Airtable record ID (legacy).
async function findBooking(supabase, bookingId) {
  const isAirtableId = /^rec/.test(bookingId);
  const cols =
    'id, airtable_record_id, contact_first_name, contact_email, email_unsubscribed, ' +
    'number_of_participants, total_amount, class_schedule_id, ' +
    'class_schedules(id, airtable_record_id, date, start_time_new, end_time_new, classes(class_name, location))';
  const q = supabase.from('bookings').select(cols);
  const { data, error } = await (isAirtableId
    ? q.eq('airtable_record_id', bookingId)
    : q.eq('id', bookingId)
  ).maybeSingle();
  if (error) throw error;
  return data;
}

const convertToISO = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return new Date().toISOString();
  if (timeStr.includes('T')) return new Date(timeStr).toISOString();
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return new Date(dateStr + 'T12:00:00').toISOString();
  let hours = parseInt(match[1]);
  const mins = parseInt(match[2]);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00-08:00`).toISOString();
};

const formatTimeForDisplay = (timeStr) => {
  if (!timeStr) return 'TBD';
  if (timeStr.includes('T')) {
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles',
    });
  }
  return timeStr;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Server configuration missing' });
  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const { session_id, booking_id } = req.body;
    if (!session_id || !booking_id) {
      return res.status(400).json({ error: 'Missing session_id or booking_id' });
    }

    const stripe = (await import('stripe')).default(STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Resolve the booking (allow either UUID or recXXX)
    let booking = await findBooking(supabase, booking_id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (session.payment_status !== 'paid') {
      // Payment failed/pending — cancel the booking to release seats
      const { error: cancelErr } = await supabase
        .from('bookings')
        .update({ status: 'Cancelled', payment_status: 'Failed' })
        .eq('id', booking.id);
      if (cancelErr) console.error('Failed to cancel booking:', cancelErr);
      return res.status(400).json({
        success: false,
        error: 'Payment was not completed. Your seats have been released.',
      });
    }

    // Confirm + record payment
    const { error: confirmErr } = await supabase
      .from('bookings')
      .update({
        status: 'Confirmed',
        payment_status: 'Completed',
        stripe_payment_intent_id: session.id,
        payment_date: new Date().toISOString(),
      })
      .eq('id', booking.id);
    if (confirmErr) {
      console.error('Booking update failed:', confirmErr);
      return res.status(500).json({ error: 'Failed to confirm booking', details: confirmErr.message });
    }

    // Re-read to pick up any concurrent changes (e.g., webhook updates)
    booking = await findBooking(supabase, booking.id);
    const schedule = booking.class_schedules;
    const klass = schedule?.classes;

    // Class prep URL — prefer airtable_record_id for legacy frontend routes
    const host = req.headers.host || 'www.streetwiseselfdefense.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const scheduleRouteId = schedule?.airtable_record_id || schedule?.id || null;
    const classPrepUrl = scheduleRouteId ? `${protocol}://${host}/class-prep/${scheduleRouteId}` : null;

    // Send confirmation email (best-effort; never block the success response)
    if (!booking.email_unsubscribed && booking.contact_email && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const { default: ical } = await import('ical-generator');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const FROM_EMAIL = `"Streetwise Self Defense" <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;

        const startISO = convertToISO(schedule?.date, schedule?.start_time_new);
        const endISO = convertToISO(schedule?.date, schedule?.end_time_new);
        const displayStartTime = formatTimeForDisplay(schedule?.start_time_new);
        const displayEndTime = formatTimeForDisplay(schedule?.end_time_new);

        const className = klass?.class_name || 'Self Defense Class';
        const location = klass?.location || 'Walnut Creek, CA';

        const stripStripeFmt = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const gcalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(className)}&dates=${stripStripeFmt(startISO)}/${stripStripeFmt(endISO)}&details=${encodeURIComponent('Self defense class registration confirmed')}&location=${encodeURIComponent(location)}&ctz=America/Los_Angeles`;

        const cal = ical({ name: 'Self Defense Class', timezone: 'America/Los_Angeles' });
        cal.createEvent({
          start: new Date(startISO),
          end: new Date(endISO),
          summary: className,
          location,
          description: 'Self defense class confirmed',
        });

        const formattedDate = schedule?.date
          ? new Date(schedule.date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })
          : 'TBD';

        const emailHTML = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://www.streetwiseselfdefense.com/swsd-logo-official.png" alt="Streetwise Self Defense" style="max-width: 300px;">
  </div>
  <h1 style="color: #1E293B; text-align: center;">Registration Confirmed!</h1>
  <p>Dear ${booking.contact_first_name || 'Valued Customer'},</p>
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
  <p>See you in class!</p>
  <p><strong>The Streetwise Self Defense Team</strong></p>
  <hr style="border: 1px solid #E5E7EB; margin: 30px 0;">
  <p style="text-align: center; font-size: 14px; color: #6B7280;">
    Empowering women and vulnerable populations through practical self defense training.<br>
    Streetwise Self Defense | Walnut Creek, CA<br>
    © 2025 Streetwise Self Defense. All rights reserved.
  </p>
  <p style="text-align: center; margin-top: 15px; font-size: 12px; color: #9CA3AF;">
    <a href="${protocol}://${host}/api/unsubscribe?id=${booking.id}" style="color: #6B7280; text-decoration: underline;">Unsubscribe from emails</a>
  </p>
</body>
</html>
`;

        const { data: emailData, error: emailErr } = await resend.emails.send({
          from: FROM_EMAIL,
          to: booking.contact_email,
          subject: 'Your Self Defense Class Registration is Confirmed!',
          html: emailHTML,
          attachments: [{ filename: 'class-event.ics', content: cal.toString() }],
          headers: {
            'List-Unsubscribe': `<${protocol}://${host}/api/unsubscribe?id=${booking.id}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });
        if (emailErr) {
          console.error('[EMAIL] Resend error:', emailErr);
        } else if (emailData?.id) {
          const { error: trackErr } = await supabase
            .from('bookings')
            .update({
              confirmation_email_id: emailData.id,
              confirmation_email_status: 'Sent',
              confirmation_email_sent_at: new Date().toISOString(),
            })
            .eq('id', booking.id);
          if (trackErr) console.error('[EMAIL-TRACKING] update failed:', trackErr.message);
        }
      } catch (emailErr) {
        console.error('[EMAIL] Failed:', emailErr);
      }
    }

    return res.json({
      success: true,
      booking: {
        className: klass?.class_name || 'Self Defense Class',
        classDate: schedule?.date || null,
        startTime: schedule?.start_time_new || null,
        endTime: schedule?.end_time_new || null,
        location: klass?.location || null,
        participantCount: booking.number_of_participants || 1,
        totalAmount: booking.total_amount || 0,
        classPrepUrl,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
}
