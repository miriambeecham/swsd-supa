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

    // ── Step 5: Return result ──
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
