// /api/cleanup-expired-bookings.js
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

    // Find bookings that are "Pending Payment" and older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const filter = `AND(
      {Status} = "Pending Payment",
      IS_BEFORE({Booking Date}, "${thirtyMinutesAgo}")
    )`;

    let offset;
    let expiredCount = 0;
    const headers = { Authorization: `Bearer ${AIRTABLE_API_KEY}` };

    do {
      const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`);
      url.searchParams.set('filterByFormula', filter);
      url.searchParams.set('pageSize', '100');
      if (offset) url.searchParams.set('offset', offset);

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch expired bookings: ${response.status}`);
      }

      const data = await response.json();
      const expiredBookings = data.records || [];

      // Cancel expired bookings in batches
      if (expiredBookings.length > 0) {
        const updates = expiredBookings.map(booking => ({
          id: booking.id,
          fields: {
            'Status': 'Cancelled',
            'Payment Status': 'Expired'
          }
        }));

        // Update in batches of 10 (Airtable limit)
        for (let i = 0; i < updates.length; i += 10) {
          const batch = updates.slice(i, i + 10);
          const updateResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ records: batch })
          });

          if (!updateResponse.ok) {
            console.error('Batch update failed:', await updateResponse.text());
          } else {
            expiredCount += batch.length;
          }
        }
      }

      offset = data.offset;
    } while (offset);

    return res.json({ 
      success: true, 
      message: `Cleaned up ${expiredCount} expired bookings` 
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({ error: error.message });
  }
}
