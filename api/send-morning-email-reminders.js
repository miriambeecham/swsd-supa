// /api/send-morning-email-reminders.js
// ✅ UPDATED: Runs at 9 AM Pacific Time - sends comprehensive email reminder
// ✅ Uses Persons + Teaching Assignments tables (not old Teaching Assistants table)

export default async function handler(req, res) {
  // Verify authorization
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  try {
    // Get today's date range in Pacific time
    const now = new Date();
    const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    
    const todayStart = new Date(pacificTime);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(pacificTime);
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch class schedules for today
    const classesResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedule?filterByFormula=AND(IS_AFTER({Class Date}, '${todayStart.toISOString()}'), IS_BEFORE({Class Date}, '${todayEnd.toISOString()}'), {Status} = 'Scheduled')`,
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
      return res.status(200).json({ message: 'No classes today', sent: 0 });
    }

    let emailsSent = 0;
    let taEmailsSent = 0;
    const errors = [];

    for (const classRecord of classes) {
      const classId = classRecord.id;
      const classFields = classRecord.fields;
      const className = classFields['Class Name'] || 'Self-Defense Class';
      const classDate = classFields['Class Date'];
      const location = classFields['Location'] || '';
      const locationAddress = classFields['Location Address'] || '';

      // Format date/time for email
      const classDateTime = new Date(classDate);
      const formattedTime = classDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Los_Angeles'
      });

      // ========================================
      // SEND REMINDERS TO STUDENTS
      // ========================================
      
      // Fetch bookings for this class
      const bookingsResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings?filterByFormula=AND({Class Schedule} = '${classId}', {Status} = 'Confirmed')`,
        {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        }
      );
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        const bookings = bookingsData.records || [];

        for (const booking of bookings) {
          const email = booking.fields['Contact Email'];
          const firstName = booking.fields['Contact First Name'] || 'Student';
          const trackingId = booking.id;

          if (!email) continue;

          try {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'Streetwise Self Defense <notifications@streetwiseselfdefense.com>',
                to: email,
                subject: `Today's Class: ${className} at ${formattedTime}`,
                html: generateMorningStudentEmail({
                  firstName,
                  className,
                  formattedTime,
                  location,
                  locationAddress,
                  trackingId
                })
              })
            });

            if (emailResponse.ok) {
              emailsSent++;
              
              // Record that morning reminder was sent
              await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking.id}`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  fields: {
                    'Morning Reminder Sent': new Date().toISOString()
                  }
                })
              });
            }
          } catch (emailError) {
            errors.push(`Student email error for ${email}: ${emailError.message}`);
          }
        }
      }

      // ========================================
      // SEND REMINDERS TO TEACHING ASSISTANTS
      // ========================================
      
      // Fetch all Teaching Assignments (no filterByFormula on linked records)
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
              const email = person.fields['Email'];
              const name = person.fields['Name'] || 'Teaching Assistant';
              const firstName = name.split(' ')[0];

              if (!email) continue;

              try {
                const emailResponse = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    from: 'Streetwise Self Defense <notifications@streetwiseselfdefense.com>',
                    to: email,
                    subject: `Today: You're Helping Teach ${className} at ${formattedTime}`,
                    html: generateMorningTAEmail({
                      firstName,
                      className,
                      formattedTime,
                      location,
                      locationAddress
                    })
                  })
                });

                if (emailResponse.ok) {
                  taEmailsSent++;
                }
              } catch (emailError) {
                errors.push(`TA email error for ${email}: ${emailError.message}`);
              }
            }
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      classesProcessed: classes.length,
      studentEmailsSent: emailsSent,
      taEmailsSent: taEmailsSent,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Send morning reminders error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Morning student email template
function generateMorningStudentEmail({ firstName, className, formattedTime, location, locationAddress, trackingId }) {
  const trackingPixelUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://streetwiseselfdefense.com'}/api/track-email-open?id=${trackingId}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #1a365d; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">See You Today!</h1>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Good morning ${firstName}!</p>
        
        <p>Your <strong>${className}</strong> is TODAY!</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e53e3e;">
          <p style="margin: 0 0 10px 0;"><strong>🕐 Time:</strong> ${formattedTime}</p>
          ${location ? `<p style="margin: 0 0 10px 0;"><strong>📍 Location:</strong> ${location}</p>` : ''}
          ${locationAddress ? `<p style="margin: 0;"><strong>🗺️ Address:</strong> ${locationAddress}</p>` : ''}
        </div>
        
        <h3 style="color: #1a365d;">Quick Reminders:</h3>
        <ul>
          <li>Wear comfortable clothing and athletic shoes</li>
          <li>Bring a water bottle</li>
          <li>Arrive 5-10 minutes early if possible</li>
        </ul>
        
        <p>We can't wait to see you!</p>
        
        <p style="margin-top: 30px;">
          <strong>Streetwise Self Defense</strong>
        </p>
      </div>
      
      <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
    </body>
    </html>
  `;
}

// Morning TA email template
function generateMorningTAEmail({ firstName, className, formattedTime, location, locationAddress }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #553c9a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Teaching Today!</h1>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Good morning ${firstName}!</p>
        
        <p>Just a reminder that you're helping teach <strong>${className}</strong> today!</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #553c9a;">
          <p style="margin: 0 0 10px 0;"><strong>🕐 Time:</strong> ${formattedTime}</p>
          ${location ? `<p style="margin: 0 0 10px 0;"><strong>📍 Location:</strong> ${location}</p>` : ''}
          ${locationAddress ? `<p style="margin: 0;"><strong>🗺️ Address:</strong> ${locationAddress}</p>` : ''}
        </div>
        
        <p><strong>Please arrive 15-20 minutes early</strong> to help with setup and meet the students as they arrive.</p>
        
        <p>Thank you for being part of the team!</p>
        
        <p style="margin-top: 30px;">
          <strong>Streetwise Self Defense</strong>
        </p>
      </div>
    </body>
    </html>
  `;
}
