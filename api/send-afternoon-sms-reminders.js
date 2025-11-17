// /api/send-afternoon-sms-reminders.js
// ✅ NEW: Runs at 3 PM Pacific Time
// Sends SMS ONLY to people who haven't clicked the morning email
// Encourages checking spam and provides prep page link

export default async function handler(req, res) {
  // Verify authorization
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  const bypassToken = req.headers['x-vercel-protection-bypass'] || req.query['x-vercel-protection-bypass'];
  const expectedBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  
  const isAuthorized = authHeader === expectedAuth || bypassToken === expectedBypass;
  
  if (!isAuthorized) {
    console.log('[AFTERNOON-SMS] Unauthorized request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper to format phone number
  const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return null;
  };

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

    const twilioConfigured = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER;

    if (!twilioConfigured) {
      console.log('[AFTERNOON-SMS] ⚠️ Twilio not configured - job skipped');
      return res.json({ success: true, message: 'Twilio not configured', smsSent: 0 });
    }

    console.log('[AFTERNOON-SMS] Starting 3 PM SMS reminder job...');

    // Initialize Twilio
    const twilio = await import('twilio');
    const twilioClient = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0];

    console.log('[AFTERNOON-SMS] Looking for classes on:', tomorrowDateStr);

    // Fetch all class schedules
    const schedulesResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!schedulesResponse.ok) {
      throw new Error(`Failed to fetch schedules: ${schedulesResponse.status}`);
    }

    const schedulesData = await schedulesResponse.json();
    const allSchedules = schedulesData.records || [];

    // Filter for tomorrow's date AND NOT cancelled
    const schedules = allSchedules.filter(schedule => {
      const scheduleDate = schedule.fields.Date;
      const isCancelled = schedule.fields['Is Cancelled'];
      
      if (!scheduleDate || isCancelled) return false;
      
      const dateObj = new Date(scheduleDate);
      const scheduleDateStr = dateObj.toISOString().split('T')[0];
      
      return scheduleDateStr === tomorrowDateStr;
    });

    console.log(`[AFTERNOON-SMS] Found ${schedules.length} classes scheduled for tomorrow`);

    if (schedules.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No classes scheduled for tomorrow',
        classesFound: 0,
        smsSent: 0
      });
    }

    const results = [];
    let totalSmsSent = 0;
    let totalSmsSkipped = 0;

    // Process each class schedule
    for (const schedule of schedules) {
      try {
        console.log(`[AFTERNOON-SMS] Processing schedule ${schedule.id}`);

        // Get class details
        const classId = schedule.fields.Class?.[0];
        let classData = null;
        
        if (classId) {
          const classResponse = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`,
            { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
          );
          
          if (classResponse.ok) {
            classData = await classResponse.json();
          }
        }

        // Get confirmed bookings
        const bookingsResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings?filterByFormula=AND({Class Schedule}='${schedule.id}', {Status}='Confirmed')`,
          { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
        );

        if (!bookingsResponse.ok) {
          throw new Error(`Failed to fetch bookings for schedule ${schedule.id}`);
        }

        const bookingsData = await bookingsResponse.json();
        const bookings = bookingsData.records || [];

        console.log(`[AFTERNOON-SMS] Found ${bookings.length} confirmed bookings`);

        // Send SMS to each booking (if eligible)
        for (const booking of bookings) {
          try {
            const contactPhone = booking.fields['Contact Phone'];
            const contactFirstName = booking.fields['Contact First Name'] || 'there';
            const emailClicked = booking.fields['Reminder Email Clicked At'];
            
            // ELIGIBILITY CHECKS
            
            // 1. Must have phone number
            if (!contactPhone) {
              console.log(`[AFTERNOON-SMS] ⏭️ Skipping booking ${booking.id} - no phone number`);
              totalSmsSkipped++;
              continue;
            }

            // 2. Must NOT be unsubscribed from SMS
            if (booking.fields['SMS Unsubscribed']) {
              console.log(`[AFTERNOON-SMS] ⏭️ Skipping booking ${booking.id} - SMS unsubscribed`);
              totalSmsSkipped++;
              continue;
            }

            // 3. Must NOT have clicked the email (key logic!)
            if (emailClicked) {
              console.log(`[AFTERNOON-SMS] ⏭️ Skipping booking ${booking.id} - already clicked email at ${emailClicked}`);
              totalSmsSkipped++;
              continue;
            }

            // 4. Must not have already received afternoon SMS
            if (booking.fields['Reminder SMS ID']) {
              console.log(`[AFTERNOON-SMS] ⏭️ Skipping booking ${booking.id} - SMS already sent`);
              totalSmsSkipped++;
              continue;
            }

            // Format phone number
            const formattedPhone = formatPhoneNumber(contactPhone);
            if (!formattedPhone) {
              console.log(`[AFTERNOON-SMS] ⏭️ Skipping booking ${booking.id} - invalid phone format`);
              totalSmsSkipped++;
              continue;
            }

            // Get class time
            const formatTimeForDisplay = (timeStr) => {
              if (!timeStr) return 'TBD';
              if (timeStr.includes('T')) {
                const date = new Date(timeStr);
                return date.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                  timeZone: 'America/Los_Angeles'
                });
              }
              return timeStr;
            };

            const displayStartTime = formatTimeForDisplay(schedule.fields?.['Start Time New']);
            const className = classData?.fields?.['Class Name'] || 'self-defense class';
            
            // Class prep URL
            const classPrepUrl = `https://streetwiseselfdefense.com/class-prep/${schedule.id}`;

            // SMS Message - user's requested wording
            const smsMessage = `Your Streetwise Self Defense class is tomorrow! View the class prep instructions and mandatory waiver here: ${classPrepUrl}

Or check this morning's email (it may be in spam/junk folder if you don't see it).

I'm looking forward to seeing you!

Jay, Streetwise Self Defense`;

            console.log(`[AFTERNOON-SMS] Sending SMS to ${formattedPhone} for booking ${booking.id}`);

            // Send SMS via Twilio
            const message = await twilioClient.messages.create({
              body: smsMessage,
              from: TWILIO_PHONE_NUMBER,
              to: formattedPhone
            });

            console.log(`[AFTERNOON-SMS] ✅ Sent SMS - SID: ${message.sid}`);

            // Store tracking info
            await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking.id}`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                fields: {
                  'Reminder SMS ID': message.sid,
                  'Reminder SMS Status': 'Sent',
                  'Reminder SMS Sent At': new Date().toISOString()
                }
              })
            });

            totalSmsSent++;
            results.push({
              scheduleId: schedule.id,
              bookingId: booking.id,
              phone: formattedPhone,
              success: true,
              reason: 'Email not clicked - SMS sent'
            });

            await sleep(1000); // Twilio rate limiting

          } catch (smsError) {
            console.error(`[AFTERNOON-SMS] ❌ Error for booking ${booking.id}:`, smsError);
            results.push({
              scheduleId: schedule.id,
              bookingId: booking.id,
              success: false,
              error: smsError.message
            });
          }
        }

      } catch (scheduleError) {
        console.error(`[AFTERNOON-SMS] ❌ Error processing schedule ${schedule.id}:`, scheduleError);
      }
    }

    console.log(`[AFTERNOON-SMS] ✅ Complete. SMS sent: ${totalSmsSent}, Skipped: ${totalSmsSkipped}`);

    return res.json({
      success: true,
      message: '3 PM SMS reminders sent',
      classesFound: schedules.length,
      smsSent: totalSmsSent,
      smsSkipped: totalSmsSkipped,
      results
    });

  } catch (error) {
    console.error('[AFTERNOON-SMS] ❌ Fatal error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
