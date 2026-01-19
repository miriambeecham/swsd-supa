// /api/send-afternoon-sms-reminders.js
// ✅ UPDATED: Runs at 3 PM Pacific Time
// Sends SMS to students who haven't clicked the morning email
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
    // Get today's date range in Pacific time
    const now = new Date();
    const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    
    const todayStart = new Date(pacificTime);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(pacificTime);
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch class schedules for today (only classes that haven't started yet)
    const classesResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedule?filterByFormula=AND(IS_AFTER({Class Date}, '${todayStart.toISOString()}'), IS_BEFORE({Class Date}, '${todayEnd.toISOString()}'), IS_AFTER({Class Date}, '${now.toISOString()}'), {Status} = 'Scheduled')`,
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
      return res.status(200).json({ message: 'No upcoming classes today', sent: 0 });
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

      const classDateTime = new Date(classDate);
      const formattedTime = classDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Los_Angeles'
      });

      // ========================================
      // SEND SMS TO STUDENTS (who didn't open morning email)
      // ========================================
      
      // Fetch bookings that haven't opened the morning email
      const bookingsResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings?filterByFormula=AND({Class Schedule} = '${classId}', {Status} = 'Confirmed', {Morning Email Opened} = FALSE())`,
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
            const message = `Hi${firstName ? ` ${firstName}` : ''}! Reminder: Your ${className} is today at ${formattedTime}${location ? ` at ${location}` : ''}. See you soon! - Streetwise Self Defense`;

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
              
              // Record that SMS was sent
              await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking.id}`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  fields: {
                    'Afternoon SMS Sent': new Date().toISOString()
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
                const message = `Hi ${firstName}! Reminder: You're helping teach ${className} today at ${formattedTime}${location ? ` at ${location}` : ''}. Please arrive 15-20 min early. Thanks! - Streetwise`;

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
    console.error('Send afternoon SMS error:', error);
    return res.status(500).json({ error: error.message });
  }
}
