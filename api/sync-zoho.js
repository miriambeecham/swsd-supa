// /api/cron/sync-zoho.js
export default async function handler(req, res) {
  // Accept either CRON_SECRET or Vercel's bypass token
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  const bypassToken = req.headers['x-vercel-protection-bypass'] || req.query['x-vercel-protection-bypass'];
  const expectedBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  
  const isAuthorized = authHeader === expectedAuth || bypassToken === expectedBypass;
  
  if (!isAuthorized) {
    console.log('[CRON] Unauthorized request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (authHeader !== expectedAuth) {
    console.log('[CRON] Unauthorized request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    console.log('[CRON] Starting Zoho sync job...');

    // Find all confirmed bookings from the last 2 minutes that haven't been synced
    const tenMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    
    const bookingsResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings?filterByFormula=AND({Status}='Confirmed',{Payment Date}>'${tenMinutesAgo}',{Zoho Synced}=FALSE())`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!bookingsResponse.ok) {
      throw new Error(`Failed to fetch bookings: ${bookingsResponse.status}`);
    }

    const bookingsData = await bookingsResponse.json();
    const bookings = bookingsData.records || [];

    console.log(`[CRON] Found ${bookings.length} bookings to sync`);

    const results = [];
    
    for (const booking of bookings) {
      try {
        console.log(`[CRON] Processing booking ${booking.id}`);
        
        // Get class schedule details
        const scheduleId = booking.fields['Class Schedule']?.[0];
        let scheduleData = null;
        let classData = null;

        if (scheduleId) {
          const scheduleResponse = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${scheduleId}`,
            { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
          );
          
          if (scheduleResponse.ok) {
            const scheduleJson = await scheduleResponse.json();
            scheduleData = scheduleJson.fields;
            
            // Get class details
            const classId = scheduleData?.Class?.[0];
            if (classId) {
              const classResponse = await fetch(
                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`,
                { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
              );
              if (classResponse.ok) {
                const classJson = await classResponse.json();
                classData = classJson.fields;
              }
            }
          }
        }

        // Call Zoho integration
     const { default: zohoCreateContact } = await import('/var/task/api/zoho-create-contact.js');
        
        const classPreparationUrl = `https://streetwiseselfdefense.com/class-prep/${booking.id}`;
        
        const mockRes = {
          status: (code) => ({
            json: (data) => {
              console.log(`[CRON] Zoho returned status ${code} for booking ${booking.id}`);
              return data;
            }
          }),
          json: (data) => {
            console.log(`[CRON] Zoho success for booking ${booking.id}`);
            return data;
          }
        };
        
        const zohoRequest = {
          method: 'POST',
          body: {
            contactInfo: {
              firstName: booking.fields['Contact First Name'],
              lastName: booking.fields['Contact Last Name'],
              email: booking.fields['Contact Email'],
              phone: booking.fields['Contact Phone'] || ''
            },
            classInfo: {
              className: classData?.['Class Name'] || 'Self-Defense Class',
              date: scheduleData?.Date || '',
              participantCount: booking.fields['Number of Participants'] || 1
            },
            prepPageUrl: classPreparationUrl,
            bookingId: booking.id,
            classType: classData?.Type?.toLowerCase().includes('mother') ? 'mother-daughter' : 'adult'
          }
        };
        
        await zohoCreateContact(zohoRequest, mockRes);
        
        // Mark as synced in Airtable
        await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking.id}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fields: { 'Zoho Synced': true }
            })
          }
        );
        
        console.log(`[CRON] Successfully synced booking ${booking.id}`);
        results.push({ bookingId: booking.id, success: true });
        
      } catch (err) {
        console.error(`[CRON] Failed to sync booking ${booking.id}:`, err);
        results.push({ bookingId: booking.id, success: false, error: err.message });
      }
    }

    console.log(`[CRON] Sync job completed. Synced ${results.filter(r => r.success).length} of ${results.length} bookings`);
    return res.json({ 
      success: true, 
      totalBookings: bookings.length,
      synced: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results 
    });
    
  } catch (error) {
    console.error('[CRON] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
