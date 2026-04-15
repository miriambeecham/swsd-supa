// /api/admin/reschedule-booking.js
// Handles whole-group moves and split moves for rescheduling participants.
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

async function sendRescheduleEmail({ bookingId, contactFirstName, contactEmail, participantCount, classScheduleId, baseUrl, atHeaders, req }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY || !contactEmail || !classScheduleId) return;

  try {
    const schedRes = await fetch(`${baseUrl}/Class%20Schedules/${classScheduleId}`, { headers: atHeaders });
    if (!schedRes.ok) return;
    const scheduleData = await schedRes.json();

    let classData = null;
    const classId = (scheduleData.fields.Class || [])[0];
    if (classId) {
      const classRes = await fetch(`${baseUrl}/Classes/${classId}`, { headers: atHeaders });
      if (classRes.ok) classData = await classRes.json();
    }

    const host = req.headers.host || 'www.streetwiseselfdefense.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const classPrepUrl = `${protocol}://${host}/class-prep/${classScheduleId}`;

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
      return new Date(`${dateStr}T${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:00-08:00`).toISOString();
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

    const startISO = convertToISO(scheduleData.fields?.Date, scheduleData.fields?.['Start Time New']);
    const endISO = convertToISO(scheduleData.fields?.Date, scheduleData.fields?.['End Time New']);
    const displayStartTime = formatTimeForDisplay(scheduleData.fields?.['Start Time New']);
    const displayEndTime = formatTimeForDisplay(scheduleData.fields?.['End Time New']);
    const className = classData?.fields?.['Class Name'] || 'Self Defense Class';
    const location = scheduleData.fields?.Location || classData?.fields?.Location || 'Walnut Creek, CA';

    const formattedDate = scheduleData.fields?.Date
      ? new Date(scheduleData.fields.Date + 'T12:00:00').toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        })
      : 'TBD';

    const gcalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(className)}&dates=${new Date(startISO).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}/${new Date(endISO).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}&details=${encodeURIComponent('Self defense class rescheduled')}&location=${encodeURIComponent(location)}&ctz=America/Los_Angeles`;

    const { default: ical } = await import('ical-generator');
    const cal = ical({ name: 'Self Defense Class', timezone: 'America/Los_Angeles' });
    cal.createEvent({ start: new Date(startISO), end: new Date(endISO), summary: className, location, description: 'Self defense class rescheduled' });

    const emailHTML = `<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
<p style="text-align: center; margin-top: 15px; font-size: 12px; color: #9CA3AF;"><a href="https://streetwiseselfdefense.com/api/unsubscribe?id=${bookingId}" style="color: #6B7280; text-decoration: underline;">Unsubscribe from emails</a></p>
</body></html>`;

    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);
    const FROM_EMAIL = `"Streetwise Self Defense" <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL, to: contactEmail,
      subject: 'Your Self Defense Class Has Been Rescheduled!',
      html: emailHTML,
      attachments: [{ filename: 'class-event.ics', content: cal.toString() }],
      headers: { 'List-Unsubscribe': `<https://streetwiseselfdefense.com/api/unsubscribe?id=${bookingId}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    });

    if (error) {
      console.error(`[RESCHEDULE-EMAIL] Error for ${bookingId}:`, error);
    } else {
      console.log(`[RESCHEDULE-EMAIL] Sent to ${contactEmail}, Resend ID: ${data.id}`);
      await fetch(`${baseUrl}/Bookings/${bookingId}`, {
        method: 'PATCH', headers: { ...atHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { 'Confirmation Email ID': data.id, 'Confirmation Email Status': 'Sent', 'Confirmation Email Sent At': new Date().toISOString() } }),
      });
    }
  } catch (emailError) {
    console.error(`[RESCHEDULE-EMAIL] Failed for ${bookingId}:`, emailError);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET || !AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!verifyAuth(req)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;
  const headers = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };

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

  // Validate required fields
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
    // ── Step 1: Fetch the original booking ──
    const bookingRes = await fetch(`${BASE_URL}/Bookings/${originalBookingId}`, { headers });
    if (!bookingRes.ok) {
      const err = await bookingRes.text();
      return res.status(500).json({ error: `Failed to fetch original booking: ${err}` });
    }
    const originalBooking = await bookingRes.json();
    const ob = originalBooking.fields;

    const currentClassSchedule = ob['Class Schedule'] || [];
    const currentParticipantCount = ob['Number of Participants'] || 0;
    const allParticipantIds = ob['Participants'] || [];

    // ── Step 2: Determine whole-group vs split ──
    const isWholeGroup = movingParticipantIds.length === allParticipantIds.length;

    if (isWholeGroup) {
      // ── Step 3A: Whole-group move ──
      const patchFields = {};

      if (newClassScheduleId) {
        patchFields['Class Schedule'] = [newClassScheduleId];
      } else {
        patchFields['Reschedule Status'] = 'Pending Reschedule';
        // Clear Class Schedule so the booking is no longer counted in the old class's rollup.
        // Prepend the original schedule ID to notes so the pending page can show it.
        const origScheduleId = currentClassSchedule[0] || '';
        const notePrefix = origScheduleId ? `[Original Schedule: ${origScheduleId}] ` : '';
        patchFields['Reschedule Notes'] = notePrefix + (rescheduleNotes || '');
        patchFields['Class Schedule'] = [];
      }

      if (rescheduleNotes && !patchFields['Reschedule Notes']) {
        patchFields['Reschedule Notes'] = rescheduleNotes;
      }

      // Update contact info to the provided primary contact
      patchFields['Contact First Name'] = primaryContactFirstName;
      patchFields['Contact Last Name'] = primaryContactLastName;
      patchFields['Contact Email'] = primaryContactEmail;
      if (primaryContactPhone) patchFields['Contact Phone'] = primaryContactPhone;
      if (smsConsent) patchFields['SMS Consent Date'] = new Date().toISOString();

      const patchRes = await fetch(`${BASE_URL}/Bookings/${originalBookingId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ fields: patchFields }),
      });

      if (!patchRes.ok) {
        const err = await patchRes.text();
        return res.status(500).json({ error: `Failed to update original booking: ${err}` });
      }

      // Send reschedule confirmation email if moving to a specific class
      if (newClassScheduleId) {
        await sendRescheduleEmail({
          bookingId: originalBookingId,
          contactFirstName: primaryContactFirstName,
          contactEmail: primaryContactEmail,
          participantCount: allParticipantIds.length,
          classScheduleId: newClassScheduleId,
          baseUrl: BASE_URL,
          atHeaders: headers,
          req,
        });
      }

      return res.json({
        type: 'whole-group',
        updatedBookingId: originalBookingId,
      });
    }

    // ── Step 3B: Split move ──

    // Determine which participants stay on the original booking
    const stayingParticipantIds = allParticipantIds.filter(
      (id) => !movingParticipantIds.includes(id)
    );

    // Patch the original booking: preserve count, update participants
    const originalPatchFields = {
      'Original Participant Count': allParticipantIds.length,
      'Participants': stayingParticipantIds,
      'Number of Participants': stayingParticipantIds.length,
    };

    const originalPatchRes = await fetch(`${BASE_URL}/Bookings/${originalBookingId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields: originalPatchFields }),
    });

    if (!originalPatchRes.ok) {
      const err = await originalPatchRes.text();
      return res.status(500).json({ error: `Failed to update original booking for split: ${err}` });
    }

    // Create the child booking
    const childFields = {
      'Booking Date': new Date().toISOString().split('T')[0],
      'Status': 'Confirmed',
      'Payment Status': 'Prepaid',
      'Contact First Name': primaryContactFirstName,
      'Contact Last Name': primaryContactLastName,
      'Contact Email': primaryContactEmail,
      'Contact Phone': primaryContactPhone || '',
      ...(smsConsent ? { 'SMS Consent Date': new Date().toISOString() } : {}),
      'Number of Participants': movingParticipantIds.length,
      'Participants': movingParticipantIds,
      'Original Booking ID': originalBookingId,
      'Total Amount': 0,
    };

    if (newClassScheduleId) {
      childFields['Class Schedule'] = [newClassScheduleId];
    } else {
      childFields['Reschedule Status'] = 'Pending Reschedule';
    }

    if (rescheduleNotes) {
      childFields['Reschedule Notes'] = rescheduleNotes;
    }

    const createRes = await fetch(`${BASE_URL}/Bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fields: childFields }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      return res.status(500).json({ error: `Failed to create child booking: ${err}` });
    }

    const childBooking = await createRes.json();
    const childBookingId = childBooking.id;

    // Update the original booking's Offshoot Booking IDs
    const existingOffshoots = ob['Offshoot Booking IDs'] || '';
    const updatedOffshoots = existingOffshoots
      ? `${existingOffshoots},${childBookingId}`
      : childBookingId;

    // Update original booking: offshoot IDs + stayer contact info if booker is moving
    const offshootPatchFields = { 'Offshoot Booking IDs': updatedOffshoots };
    if (stayerContactEmail) {
      offshootPatchFields['Contact First Name'] = stayerContactFirstName || '';
      offshootPatchFields['Contact Last Name'] = stayerContactLastName || '';
      offshootPatchFields['Contact Email'] = stayerContactEmail;
      if (stayerContactPhone) offshootPatchFields['Contact Phone'] = stayerContactPhone;
    }

    const offshootPatchRes = await fetch(`${BASE_URL}/Bookings/${originalBookingId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields: offshootPatchFields }),
    });

    if (!offshootPatchRes.ok) {
      const err = await offshootPatchRes.text();
      console.error(`Warning: Failed to update original booking: ${err}`);
      // Non-fatal — continue
    }

    // ── Step 4: Update each moving participant's Booking link ──
    for (const participantId of movingParticipantIds) {
      const partPatchRes = await fetch(`${BASE_URL}/Participants/${participantId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ fields: { 'Booking': [childBookingId] } }),
      });

      if (!partPatchRes.ok) {
        const err = await partPatchRes.text();
        console.error(`Warning: Failed to update participant ${participantId}: ${err}`);
        // Non-fatal — continue
      }
    }

    // ── Step 5: Send reschedule email if moving to a specific class ──
    if (newClassScheduleId) {
      await sendRescheduleEmail({
        bookingId: childBookingId,
        contactFirstName: primaryContactFirstName,
        contactEmail: primaryContactEmail,
        participantCount: movingParticipantIds.length,
        classScheduleId: newClassScheduleId,
        baseUrl: BASE_URL,
        atHeaders: headers,
        req,
      });
    }

    // ── Step 6: Return result ──
    return res.json({
      type: 'split',
      originalBookingId,
      childBookingId,
      movedParticipantCount: movingParticipantIds.length,
      remainingParticipantCount: stayingParticipantIds.length,
    });

  } catch (error) {
    console.error('Reschedule error:', error);
    return res.status(500).json({ error: `Reschedule failed: ${error.message}` });
  }
}
