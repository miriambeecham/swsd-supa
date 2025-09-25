// /api/check-availability.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return res.status(500).json({ error: 'Airtable not configured' });
    }

    const { classScheduleId, requestedSeats, requestedSpots } = req.body || {};
    const seats = Number(requestedSeats || requestedSpots);
    
    if (!classScheduleId || !seats) {
      return res.status(400).json({ error: 'Missing classScheduleId or requestedSeats' });
    }

    // Get the schedule record
    const scheduleResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${classScheduleId}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    if (!scheduleResponse.ok) {
      const errorText = await scheduleResponse.text().catch(() => '');
      throw new Error(`Airtable schedule fetch failed (${scheduleResponse.status}): ${errorText}`);
    }

    const schedule = await scheduleResponse.json();
    const fields = schedule.fields || {};

    // Helper function to safely convert to number
    const asNumber = (v) => {
      if (typeof v === 'number') return Number.isFinite(v) ? v : null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    // Calculate remaining spots using priority logic:
    // 1) Remaining Spots field (if set)
    // 2) Available Spots - Booked Spots
    // 3) Available Spots - sum of participant counts from active bookings
    let remaining = 0;

    const remainingDirect = asNumber(fields['Remaining Spots']);
    if (remainingDirect !== null) {
      remaining = Math.max(0, remainingDirect);
    } else {
      const available = asNumber(fields['Available Spots']);
      const booked = asNumber(fields['Booked Spots']);
      
      if (available !== null && booked !== null) {
        remaining = Math.max(0, available - booked);
      } else if (available !== null) {
        // Fallback: count actual participants from bookings
        let offset;
        let totalParticipants = 0;
        const headers = { Authorization: `Bearer ${AIRTABLE_API_KEY}` };
        const filter = `AND(FIND("${classScheduleId}", ARRAYJOIN({Class Schedule})), NOT({Status} = "Cancelled"))`;

        do {
          const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`);
          url.searchParams.set('filterByFormula', filter);
          url.searchParams.set('pageSize', '100');
          if (offset) url.searchParams.set('offset', offset);

          const bookingsResponse = await fetch(url, { headers });
          if (!bookingsResponse.ok) {
            const errorText = await bookingsResponse.text().catch(() => '');
            throw new Error(`Airtable bookings fetch failed (${bookingsResponse.status}): ${errorText}`);
          }

          const bookingsData = await bookingsResponse.json();
          for (const booking of bookingsData.records || []) {
            const participantCount = asNumber(booking.fields?.['Number of Participants'] ?? 1) ?? 0;
            totalParticipants += participantCount;
          }
          offset = bookingsData.offset;
        } while (offset);

        remaining = Math.max(0, available - totalParticipants);
      } else {
        throw new Error('Available Spots (capacity) is not set on Class Schedule');
      }
    }

    // Check if we have enough spots
    if (remaining >= seats) {
      return res.json({ ok: true, remaining });
    }

    // Not enough spots
    const message = remaining === 0 ? 'This class is full.' : `Only ${remaining} spot(s) left.`;
    return res.status(409).json({ ok: false, remaining, message });

  } catch (error) {
    console.error('[check-availability] error:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
