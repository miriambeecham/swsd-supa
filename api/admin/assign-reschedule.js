// /api/admin/assign-reschedule.js
// Assigns a class schedule to a pending reschedule booking and sends
// a fresh confirmation email to the contact.
import jwt from 'jsonwebtoken';

function verifyAuth(req) {
  const JWT_SECRET = process.env.JWT_SECRET;
  const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});

  const token = cookies?.auth_token;
  if (!token) return false;

  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const JWT_SECRET = process.env.JWT_SECRET;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!JWT_SECRET || !AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!verifyAuth(req)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;
  const atHeaders = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };

  const { bookingId, newClassScheduleId } = req.body || {};

  if (!bookingId || !newClassScheduleId) {
    return res.status(400).json({ error: 'bookingId and newClassScheduleId are required' });
  }

  try {
    // ── Step 1: Fetch and verify the booking ──
    const bookingRes = await fetch(`${BASE_URL}/Bookings/${bookingId}`, { headers: atHeaders });
    if (!bookingRes.ok) {
      return res.status(400).json({ error: 'Booking not found' });
    }

    const booking = await bookingRes.json();
    const bf = booking.fields;

    if (bf['Reschedule Status'] !== 'Pending Reschedule') {
      return res.status(400).json({ error: 'Booking is not in Pending Reschedule status' });
    }

    // ── Step 2: Assign the class and clear reschedule status ──
    const patchRes = await fetch(`${BASE_URL}/Bookings/${bookingId}`, {
      method: 'PATCH',
      headers: atHeaders,
      body: JSON.stringify({
        fields: {
          'Class Schedule': [newClassScheduleId],
          'Reschedule Status': null,
        },
      }),
    });

    if (!patchRes.ok) {
      const err = await patchRes.text();
      return res.status(500).json({ error: `Failed to update booking: ${err}` });
    }

    // ── Step 3: Send confirmation email ──
    // Follow the same pattern as send-external-confirmation-emails.js
    if (RESEND_API_KEY && bf['Contact Email']) {
      try {
        // Fetch schedule and class data for the email
        const scheduleRes = await fetch(`${BASE_URL}/Class%20Schedules/${newClassScheduleId}`, { headers: atHeaders });
        let scheduleData = null;
        let classData = null;

        if (scheduleRes.ok) {
          scheduleData = await scheduleRes.json();
          const classId = (scheduleData.fields['Class'] || [])[0];
          if (classId) {
            const classRes = await fetch(`${BASE_URL}/Classes/${classId}`, { headers: atHeaders });
            if (classRes.ok) {
              classData = await classRes.json();
            }
          }
        }

        // Build class prep URL
        const host = req.headers.host || 'www.streetwiseselfdefense.com';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const classPrepUrl = `${protocol}://${host}/class-prep/${newClassScheduleId}`;

        // Time formatting helpers (same as send-external-confirmation-emails.js)
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
              hour: 'numeric', minute: '2-digit', hour12: true,
              timeZone: 'America/Los_Angeles',
            });
          }
          return timeStr;
        };

        const startISO = convertToISO(scheduleData?.fields?.Date, scheduleData?.fields?.['Start Time New']);
        const endISO = convertToISO(scheduleData?.fields?.Date, scheduleData?.fields?.['End Time New']);
        const displayStartTime = formatTimeForDisplay(scheduleData?.fields?.['Start Time New']);
        const displayEndTime = formatTimeForDisplay(scheduleData?.fields?.['End Time New']);

        const formattedDate = scheduleData?.fields?.Date
          ? new Date(scheduleData.fields.Date + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
            })
          : 'TBD';

        const className = classData?.fields?.['Class Name'] || 'Self Defense Class';
        const location = scheduleData?.fields?.Location || classData?.fields?.Location || 'Walnut Creek, CA';

        const gcalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(className)}&dates=${new Date(startISO).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${new Date(endISO).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=${encodeURIComponent('Self defense class registration confirmed')}&location=${encodeURIComponent(location)}&ctz=America/Los_Angeles`;

        // Create iCal attachment
        const { default: ical } = await import('ical-generator');
        const cal = ical({ name: 'Self Defense Class', timezone: 'America/Los_Angeles' });
        cal.createEvent({
          start: new Date(startISO),
          end: new Date(endISO),
          summary: className,
          location,
          description: 'Self defense class confirmed',
        });

        const emailHTML = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://www.streetwiseselfdefense.com/swsd-logo-official.png" alt="Streetwise Self Defense" style="max-width: 300px;">
  </div>

  <h1 style="color: #1E293B; text-align: center;">You've Been Rescheduled!</h1>

  <p>Dear ${bf['Contact First Name'] || 'Valued Participant'},</p>

  <p>Great news! Your self defense class has been rescheduled. Here are your updated class details:</p>

  <div style="background: #F0FDFC; border: 1px solid #14b8a6; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #1E293B; margin-top: 0;">Your New Class Details</h2>
    <p><strong>Class:</strong> ${className}</p>
    <p><strong>Date:</strong> ${formattedDate}</p>
    <p><strong>Time:</strong> ${displayStartTime} - ${displayEndTime}</p>
    <p><strong>Location:</strong> ${location}</p>
    <p><strong>Participants:</strong> ${bf['Number of Participants'] || 1}</p>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${gcalURL}" style="display: inline-block; background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Add to Google Calendar</a>
  </div>

  <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="color: #92400E; margin-top: 0;">📋 Important: Complete Your Waiver</h3>
    <p style="color: #78350F;">Before class, please complete your liability waiver and provide emergency contact information:</p>
    <div style="text-align: center; margin-top: 15px;">
      <a href="${classPrepUrl}" style="display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Complete Waiver & Class Prep</a>
    </div>
  </div>

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
    <a href="https://streetwiseselfdefense.com/api/unsubscribe?id=${bookingId}" style="color: #6B7280; text-decoration: underline;">Unsubscribe from emails</a>
  </p>
</body>
</html>
`;

        const { Resend } = await import('resend');
        const resend = new Resend(RESEND_API_KEY);
        const FROM_EMAIL = `"Streetwise Self Defense" <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;

        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: bf['Contact Email'],
          subject: 'Your Self Defense Class Has Been Rescheduled!',
          html: emailHTML,
          attachments: [{ filename: 'class-event.ics', content: cal.toString() }],
          headers: {
            'List-Unsubscribe': `<https://streetwiseselfdefense.com/api/unsubscribe?id=${bookingId}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });

        if (error) {
          console.error(`[RESCHEDULE-EMAIL] Resend error for ${bookingId}:`, error);
        } else {
          console.log(`[RESCHEDULE-EMAIL] Sent to ${bf['Contact Email']}, Resend ID: ${data.id}`);

          // Update booking with email tracking
          await fetch(`${BASE_URL}/Bookings/${bookingId}`, {
            method: 'PATCH',
            headers: atHeaders,
            body: JSON.stringify({
              fields: {
                'Confirmation Email ID': data.id,
                'Confirmation Email Status': 'Sent',
                'Confirmation Email Sent At': new Date().toISOString(),
              },
            }),
          });
        }
      } catch (emailError) {
        // Email failure is non-fatal — the reschedule assignment still succeeded
        console.error(`[RESCHEDULE-EMAIL] Failed to send email for ${bookingId}:`, emailError);
      }
    }

    // ── Step 4: Return success ──
    return res.json({
      success: true,
      bookingId,
      newClassScheduleId,
    });

  } catch (error) {
    console.error('Assign reschedule error:', error);
    return res.status(500).json({ error: `Failed to assign reschedule: ${error.message}` });
  }
}
