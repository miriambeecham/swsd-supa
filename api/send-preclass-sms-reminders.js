// /api/send-preclass-sms-reminders.js
// ✅ UPDATED: Runs multiple times throughout the day
// Sends final SMS reminder 2 hours before class starts
// ✅ Uses Persons + Teaching Assignments tables
// ✅ TAs assumed to have SMS consent (no consent check required)

export default async function handler(req, res) {
  // Verify authorization
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

  try {
    // Get current time and 2-hour window in Pacific time
    const now = new Date();
    const pacificNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    
    // Classes starting between now and 2.5 hours from now (to catch 2-hour window with buffer)
    const windowStart = new Date(pacificNow);
    const windowEnd = new Date(pacificNow);
    windowEnd.setHours(windowEnd.getHours() + 2, windowEnd.getMinutes() + 30);

    // Fetch class schedules in the window
    const classesResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedule?filterByFormula=AND(IS_AFTER({Class Date}, '${windowStart.toISOString()}'), IS_BEFORE({Class Date}, '${windowEnd.toISOString()}'), {Status} = 'Scheduled')`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      }
    );
    
    if (!classesResponse.ok) {
      throw new Error('Failed to fetch class schedules');
    }
    
    const classesData = await classesResponse.json();
    const classes = classesData.records || [];

    if (classes.length === 0) {
      return res.status(200).json({ message: 'No classes starting in ~2 hours', sent: 0 });
    }

    let smsSent = 0;
    let taSmsSent = 0;
    const errors = [];

    for (const classRecord of classes) {
      const classId = classRecord.id;
      const classFields = classRecord.fields;
      const className = classFields['Class Name'] || 'Self-Defense Class';
      const classDate = classFields['Class Date'];
      const location = classFields['Location'] || '';
      const locationAddress = classFields['Location Address'] || '';

      const classDateTime = new Date(classDate);
      const formattedTime = classDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Los_Angeles'
      });

      // Calculate minutes until class
      const minutesUntilClass = Math.round((classDateTime - pacificNow) / (1000 * 60));
      
      // Only send if class is 90-150 minutes away (to avoid duplicate sends)
      if (minutesUntilClass < 90 || minutesUntilClass > 150) continue;

      // ========================================
      // SEND SMS TO STUDENTS
      // ========================================
      
      // Fetch bookings that haven't received preclass SMS
      const bookingsResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings?filterByFormula=AND({Class Schedule} = '${classId}', {Status} = 'Confirmed', {Preclass SMS Sent} = BLANK())`,
        {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        }
      );
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        const bookings = bookingsData.records || [];

        for (const booking of bookings) {
          const phone = booking.fields['Contact Phone'];
          const firstName = booking.fields['Contact First Name'] || '';
          const smsConsent = booking.fields['SMS Consent Date'];
          const smsOptedOut = booking.fields['SMS Opted Out Date'];

          // Skip if no phone, no consent, or opted out
          if (!phone || !smsConsent || smsOptedOut) continue;

          try {
            const message = `Hi${firstName ? ` ${firstName}` : ''}! Your ${className} starts in about 2 hours at ${formattedTime}${location ? `. Location: ${location}` : ''}${locationAddress ? ` (${locationAddress})` : ''}. See you soon! - Streetwise`;

            const twilioResponse = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
              {
                method: 'POST',
                headers: {
                  'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                  To: phone,
                  From: TWILIO_PHONE_NUMBER,
                  Body: message
                })
              }
            );

            if (twilioResponse.ok) {
              smsSent++;
              
              // Record that preclass SMS was sent
              await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking.id}`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  fields: {
                    'Preclass SMS Sent': new Date().toISOString()
                  }
                })
              });
            }
          } catch (smsError) {
            errors.push(`Student SMS error for ${phone}: ${smsError.message}`);
          }
        }
      }

      // ========================================
      // SEND SMS TO TEACHING ASSISTANTS
      // ========================================
      
      // Fetch all Teaching Assignments
      const assignmentsResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assignments`,
        {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        }
      );

      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        const allAssignments = assignmentsData.records || [];
        
        // Filter to assignments for this class
        const classAssignments = allAssignments.filter(assignment => {
          const linkedClassIds = assignment.fields['Class Schedule'] || [];
          return linkedClassIds.includes(classId);
        });

        // Get Person IDs from assignments
        const personIds = classAssignments
          .map(a => a.fields['Person']?.[0])
          .filter(Boolean);

        if (personIds.length > 0) {
          // Fetch Person records
          const personsResponse = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Persons`,
            {
              headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
            }
          );

          if (personsResponse.ok) {
            const personsData = await personsResponse.json();
            const allPersons = personsData.records || [];
            
            // Filter to just the persons we need
            const taPersons = allPersons.filter(p => personIds.includes(p.id));

            for (const person of taPersons) {
              const phone = person.fields['Phone'];
              const name = person.fields['Name'] || 'Teaching Assistant';
              const firstName = name.split(' ')[0];
              const smsOptedOut = person.fields['SMS Opted Out Date'];

              // Skip if no phone or opted out (but NO consent check - TAs assumed to consent)
              if (!phone || smsOptedOut) continue;

              try {
                const message = `Hi ${firstName}! ${className} starts in ~2 hours at ${formattedTime}${location ? ` at ${location}` : ''}. Please arrive 15-20 min early for setup. Thanks! - Streetwise`;

                const twilioResponse = await fetch(
                  `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
                  {
                    method: 'POST',
                    headers: {
                      'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
                      'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                      To: phone,
                      From: TWILIO_PHONE_NUMBER,
                      Body: message
                    })
                  }
                );

                if (twilioResponse.ok) {
                  taSmsSent++;
                }
              } catch (smsError) {
                errors.push(`TA SMS error for ${phone}: ${smsError.message}`);
              }
            }
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      classesProcessed: classes.length,
      studentSmsSent: smsSent,
      taSmsSent: taSmsSent,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Send preclass SMS error:', error);
    return res.status(500).json({ error: error.message });
  }
}
