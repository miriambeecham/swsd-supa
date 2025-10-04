// /api/post-payment-sync.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bookingId } = req.body;
  
  if (!bookingId) {
    return res.status(400).json({ error: 'Missing bookingId' });
  }

  console.log('[POST-PAYMENT-SYNC] Starting sync for booking:', bookingId);

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    
    // Wait 5 seconds to ensure participants are created
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Fetch booking from Airtable
    const bookingResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    
    if (!bookingResponse.ok) {
      throw new Error('Failed to fetch booking from Airtable');
    }
    
    const bookingData = await bookingResponse.json();
    const booking = bookingData.fields;
    
    // Get class schedule and class data
    let classData = null;
    let scheduleData = null;
    
    const classScheduleId = booking['Class Schedule']?.[0];
    if (classScheduleId) {
      const scheduleResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedule/${classScheduleId}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      if (scheduleResponse.ok) {
        const scheduleJson = await scheduleResponse.json();
        scheduleData = scheduleJson.fields;
        
        const classId = scheduleData.Class?.[0];
        if (classId) {
          const classResponse = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`,
            { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
          );
          if (classResponse.ok) {
            classData = (await classResponse.json()).fields;
          }
        }
      }
    }
    
    // Call Zoho integration
    const { default: zohoCreateContact } = await import('./zoho-create-contact.js');
    
    const classPreparationUrl = `https://streetwiseselfdefense.com/class-prep/${bookingId}`;
    
    const zohoResult = await zohoCreateContact({
      body: {
        contactInfo: {
          firstName: booking['Contact First Name'],
          lastName: booking['Contact Last Name'],
          email: booking['Contact Email'],
          phone: booking['Contact Phone'] || ''
        },
        classInfo: {
          className: classData?.['Class Name'] || 'Self-Defense Class',
          date: scheduleData?.Date || '',
          participantCount: booking['Number of Participants'] || 1
        },
        prepPageUrl: classPreparationUrl,
        bookingId: bookingId,
        classType: classData?.Type?.toLowerCase().includes('mother') ? 'mother-daughter' : 'adult'
      }
    }, res);
    
    console.log('[POST-PAYMENT-SYNC] Zoho sync completed successfully');
    return res.json({ success: true, zohoResult });
    
  } catch (error) {
    console.error('[POST-PAYMENT-SYNC] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
