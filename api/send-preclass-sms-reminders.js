// /api/send-preclass-sms-reminders.js
// ✅ UPDATED: Runs multiple times throughout the day
// Sends final SMS reminder 2 hours before class starts
// Also sends reminders to Teaching Assistants

export default async function handler(req, res) {
  // Verify authorization
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  const bypassToken = req.headers['x-vercel-protection-bypass'] || req.query['x-vercel-protection-bypass'];
  const expectedBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  
  const isAuthorized = authHeader === expectedAuth || bypassToken === expectedBypass;
  
  if (!isAuthorized) {
    console.log('[PRECLASS-SMS] Unauthorized request');
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

  // Track which TAs we've already messaged this run (to avoid duplicates)
  const taSmsAlreadySent = new Set();

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

    const twilioConfigured = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER;

    if (!twilioConfigured) {
      console.log('[PRECLASS-SMS] ⚠️ Twilio not configured - job skipped');
      return res.json({ success: true, message: 'Twilio not configured', smsSent: 0 });
    }

    console.log('[PRECLASS-SMS] Starting pre-class SMS reminder job...');

    // Initialize Twilio
    const twilio = await import('twilio');
    const twilioClient = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    // Get current time in Pacific Time
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));
    const twoHoursFifteenMinsFromNow = new Date(now.getTime() + (2.25 * 60 * 60 * 1000));

    console.log(`[PRECLASS-SMS] Current time: ${now.toISOString()}`);
    console.log(`[PRECLASS-SMS] Looking for classes starting between ${twoHoursFromNow.toISOString()} and ${twoHoursFifteenMinsFromNow.toISOString()}`);

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

    // Filter for classes starting in ~2 hours AND NOT cancelled
    const schedules = allSchedules.filter(schedule => {
      const isCancelled = schedule.fields['Is Cancelled'];
      if (isCancelled) return false;

      const startTimeStr = schedule.fields['Start Time New'];
      if (!startTimeStr) return false;

      try {
        const startTime = new Date(startTimeStr);
        
        // Check if class starts between 2 hours and 2 hours 15 mins from now
        // The 15-minute window accounts for cron job timing variations
        return startTime >= twoHoursFromNow && startTime <= twoHoursFifteenMinsFromNow;
      } catch (err) {
        console.error(`[PRECLASS-SMS] Error parsing start time for schedule ${schedule.id}:`, err);
        return false;
      }
    });

    console.log(`[PRECLASS-SMS] Found ${schedules.length} classes starting in ~2 hours`);

    if (schedules.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No classes starting in 2 hours',
        classesFound: 0,
        smsSent: 0,
        taSmsSent: 0
      });
    }

    // Fetch all Teaching Assistants for later lookup
    const allTAsResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assistants`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    
    let allTAs = [];
    if (allTAsResponse.ok) {
      const allTAsData = await allTAsResponse.json();
      allTAs = allTAsData.records || [];
    }
    console.log(`[PRECLASS-SMS] Loaded ${allTAs.length} teaching assistants`);

    const results = [];
    let totalSmsSent = 0;
    let totalSmsSkipped = 0;
    let totalTASmsSent = 0;

    // Process each class schedule
    for (const schedule of schedules) {
      try {
        console.log(`[PRECLASS-SMS] Processing schedule ${schedule.id}`);

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

        // Get class details for SMS
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
        const className = classData?.fields?.['Class Name'] || 'class';
        const classLocation = classData?.fields?.Location || 'the location';
        
        // Create Google Maps link
        const mapsLink = classLocation !== 'the location' 
          ? `https://maps.google.com/?q=${encodeURIComponent(classLocation)}`
          : '';

        // Class prep URL for waiver link
        const classPrepUrl = `https://streetwiseselfdefense.com/class-prep/${schedule.id}`;

        // ============================================
        // SEND SMS TO TEACHING ASSISTANTS
        // ============================================
        const assignedTAIds = schedule.fields['Teaching Assistants'] || [];
        
        if (assignedTAIds.length > 0) {
          console.log(`[PRECLASS-SMS] Found ${assignedTAIds.length} TAs assigned to schedule ${schedule.id}`);
          
          for (const taId of assignedTAIds) {
            // Skip if we already sent to this TA in this run
            if (taSmsAlreadySent.has(taId)) {
              console.log(`[PRECLASS-SMS] ⏭️ Already sent to TA ${taId} this run`);
              continue;
            }

            const ta = allTAs.find(t => t.id === taId);
            if (!ta) {
              console.log(`[PRECLASS-SMS] TA ${taId} not found in database`);
              continue;
            }

            const taPhone = ta.fields['Phone'];
            const taName = ta.fields['Name'] || 'Teaching Assistant';
            const taFirstName = taName.split(' ')[0];
            const taStatus = ta.fields['Status'];

            // Skip inactive TAs
            if (taStatus === 'Inactive') {
              console.log(`[PRECLASS-SMS] ⏭️ Skipping inactive TA: ${taName}`);
              continue;
            }

            // Skip if no phone
            if (!taPhone) {
              console.log(`[PRECLASS-SMS] ⏭️ Skipping TA ${taName} - no phone`);
              continue;
            }

            // Format phone number
            const formattedPhone = formatPhoneNumber(taPhone);
            if (!formattedPhone) {
              console.log(`[PRECLASS-SMS] ⏭️ Skipping TA ${taName} - invalid phone format`);
              continue;
            }

            // TA-specific pre-class SMS message
            const taSmsMessage = `🎉 Class starts at ${displayStartTime}! Address: ${classLocation}${mapsLink ? ` ${mapsLink}` : ''}

Heading over now - see you soon!

~Jay`;

            console.log(`[PRECLASS-SMS] Sending TA pre-class SMS to ${formattedPhone} (${taName})`);

            try {
              const message = await twilioClient.messages.create({
                body: taSmsMessage,
                from: TWILIO_PHONE_NUMBER,
                to: formattedPhone
              });

              console.log(`[PRECLASS-SMS] ✅ Sent TA SMS - SID: ${message.sid}`);

              // Mark this TA as sent for this run
              taSmsAlreadySent.add(taId);

              totalTASmsSent++;
              results.push({
                scheduleId: schedule.id,
                recipientType: 'TA',
                taId: ta.id,
                taName: taName,
                phone: formattedPhone,
                success: true,
                classTime: displayStartTime
              });

              await sleep(1000); // Twilio rate limiting

            } catch (taSmsError) {
              console.error(`[PRECLASS-SMS] ❌ Failed TA SMS to ${taName}:`, taSmsError);
              results.push({
                scheduleId: schedule.id,
                recipientType: 'TA',
                taId: ta.id,
                taName: taName,
                phone: formattedPhone,
                success: false,
                error: taSmsError.message
              });
            }
          }
        }

        // ============================================
        // SEND SMS TO STUDENTS (existing logic)
        // ============================================

        // Get confirmed bookings for this schedule
        const bookingIds = schedule.fields.Bookings || [];
        if (bookingIds.length === 0) {
          console.log(`[PRECLASS-SMS] No bookings linked to schedule ${schedule.id}`);
          continue;
        }

        const orConditions = bookingIds.map(id => `RECORD_ID()="${id}"`).join(',');
        const filterFormula = `AND(OR(${orConditions}), {Status}="Confirmed")`;
        
        const bookingsResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings?filterByFormula=${encodeURIComponent(filterFormula)}`,
          { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
        );

        if (!bookingsResponse.ok) {
          throw new Error(`Failed to fetch bookings for schedule ${schedule.id}`);
        }

        const bookingsData = await bookingsResponse.json();
        const bookings = bookingsData.records || [];

        console.log(`[PRECLASS-SMS] Found ${bookings.length} confirmed bookings`);

        // Send SMS to each booking
        for (const booking of bookings) {
          try {
            const contactPhone = booking.fields['Contact Phone'];
            const contactFirstName = booking.fields['Contact First Name'] || 'there';
            const smsConsentDate = booking.fields['SMS Consent Date'];
            const smsOptedOutDate = booking.fields['SMS Opted Out Date'];
            
            // ELIGIBILITY CHECKS
            
            // 1. Must have phone number
            if (!contactPhone) {
              console.log(`[PRECLASS-SMS] ⏭️ Skipping booking ${booking.id} - no phone number`);
              totalSmsSkipped++;
              continue;
            }

            // 2. Must have given SMS consent
            if (!smsConsentDate) {
              console.log(`[PRECLASS-SMS] ⏭️ Skipping booking ${booking.id} - no SMS consent`);
              totalSmsSkipped++;
              continue;
            }

            // 3. Must NOT have opted out of SMS
            if (smsOptedOutDate) {
              console.log(`[PRECLASS-SMS] ⏭️ Skipping booking ${booking.id} - opted out on ${smsOptedOutDate}`);
              totalSmsSkipped++;
              continue;
            }

            // 4. Must not have already received pre-class SMS
            if (booking.fields['Preclass SMS ID']) {
              console.log(`[PRECLASS-SMS] ⏭️ Skipping booking ${booking.id} - pre-class SMS already sent`);
              totalSmsSkipped++;
              continue;
            }

            // Format phone number
            const formattedPhone = formatPhoneNumber(contactPhone);
            if (!formattedPhone) {
              console.log(`[PRECLASS-SMS] ⏭️ Skipping booking ${booking.id} - invalid phone format`);
              totalSmsSkipped++;
              continue;
            }

            // SMS Message - user's requested wording
            const smsMessage = `🎉 Your Streetwise Self Defense class starts at ${displayStartTime}. The address is: ${classLocation}${mapsLink ? ` ${mapsLink}` : ''}

If you haven't signed your waiver yet, click here ${classPrepUrl}. Text or call (925) 532-9953 with any questions.

See you there!
~Jay`;

            console.log(`[PRECLASS-SMS] Sending pre-class SMS to ${formattedPhone} for booking ${booking.id}`);

            // Send SMS via Twilio
            const message = await twilioClient.messages.create({
              body: smsMessage,
              from: TWILIO_PHONE_NUMBER,
              to: formattedPhone
            });

            console.log(`[PRECLASS-SMS] ✅ Sent SMS - SID: ${message.sid}`);

            // Store tracking info
            await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking.id}`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                fields: {
                  'Preclass SMS ID': message.sid,
                  'Preclass SMS Status': 'Sent',
                  'Preclass SMS Sent At': new Date().toISOString()
                }
              })
            });

            totalSmsSent++;
            results.push({
              scheduleId: schedule.id,
              recipientType: 'Student',
              bookingId: booking.id,
              phone: formattedPhone,
              success: true,
              classTime: displayStartTime
            });

            await sleep(1000); // Twilio rate limiting

          } catch (smsError) {
            console.error(`[PRECLASS-SMS] ❌ Error for booking ${booking.id}:`, smsError);
            results.push({
              scheduleId: schedule.id,
              recipientType: 'Student',
              bookingId: booking.id,
              success: false,
              error: smsError.message
            });
          }
        }

      } catch (scheduleError) {
        console.error(`[PRECLASS-SMS] ❌ Error processing schedule ${schedule.id}:`, scheduleError);
      }
    }

    console.log(`[PRECLASS-SMS] ✅ Complete. Student SMS: ${totalSmsSent}, TA SMS: ${totalTASmsSent}, Skipped: ${totalSmsSkipped}`);

    return res.json({
      success: true,
      message: 'Pre-class SMS reminders sent',
      classesFound: schedules.length,
      smsSent: totalSmsSent,
      taSmsSent: totalTASmsSent,
      smsSkipped: totalSmsSkipped,
      results
    });

  } catch (error) {
    console.error('[PRECLASS-SMS] ❌ Fatal error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
