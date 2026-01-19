// /api/send-class-reminders.js
// Cron job to send reminder emails 1 day before class
// ✅ UPDATED: Uses Persons + Teaching Assignments tables (not old Teaching Assistants table)

export default async function handler(req, res) {
  // Verify this is called by Vercel Cron or with proper auth
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  try {
    // Get tomorrow's date range in Pacific time
    const now = new Date();
    const pacificTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    
    const tomorrow = new Date(pacificTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
    const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

    // Fetch class schedules for tomorrow
    const classesResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedule?filterByFormula=AND(IS_AFTER({Class Date}, '${tomorrowStart.toISOString()}'), IS_BEFORE({Class Date}, '${tomorrowEnd.toISOString()}'), {Status} = 'Scheduled')`,
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
      return res.status(200).json({ message: 'No classes tomorrow', sent: 0 });
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
      const formattedDate = classDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Los_Angeles'
      });
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
            // Send email via Resend
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'Streetwise Self Defense <notifications@streetwiseselfdefense.com>',
                to: email,
                subject: `Reminder: Your ${className} is Tomorrow!`,
                html: generateStudentReminderEmail({
                  firstName,
                  className,
                  formattedDate,
                  formattedTime,
                  location,
                  locationAddress,
                  trackingId
                })
              })
            });

            if (emailResponse.ok) {
              emailsSent++;
              
              // Record that reminder was sent
              await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking.id}`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  fields: {
                    'Day Before Reminder Sent': new Date().toISOString()
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
                    subject: `Reminder: You're Helping Teach ${className} Tomorrow!`,
                    html: generateTAReminderEmail({
                      firstName,
                      className,
                      formattedDate,
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
    console.error('Send reminders error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Student reminder email template
function generateStudentReminderEmail({ firstName, className, formattedDate, formattedTime, location, locationAddress, trackingId }) {
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
        <h1 style="color: white; margin: 0;">Class Reminder</h1>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi ${firstName},</p>
        
        <p>This is a friendly reminder that your <strong>${className}</strong> is tomorrow!</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e53e3e;">
          <p style="margin: 0 0 10px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
          <p style="margin: 0 0 10px 0;"><strong>🕐 Time:</strong> ${formattedTime}</p>
          ${location ? `<p style="margin: 0 0 10px 0;"><strong>📍 Location:</strong> ${location}</p>` : ''}
          ${locationAddress ? `<p style="margin: 0;"><strong>🗺️ Address:</strong> ${locationAddress}</p>` : ''}
        </div>
        
        <h3 style="color: #1a365d;">What to Bring:</h3>
        <ul>
          <li>Comfortable clothing you can move in</li>
          <li>Athletic shoes (no sandals or heels)</li>
          <li>Water bottle</li>
          <li>A positive attitude!</li>
        </ul>
        
        <p>We look forward to seeing you!</p>
        
        <p style="margin-top: 30px;">
          Best regards,<br>
          <strong>Streetwise Self Defense</strong>
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
        <p>Questions? Reply to this email or call us.</p>
      </div>
      
      <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />
    </body>
    </html>
  `;
}

// TA reminder email template (modified messaging)
function generateTAReminderEmail({ firstName, className, formattedDate, formattedTime, location, locationAddress }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #553c9a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Teaching Assistant Reminder</h1>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
        <p>Hi ${firstName},</p>
        
        <p>This is a reminder that you're scheduled to help teach <strong>${className}</strong> tomorrow!</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #553c9a;">
          <p style="margin: 0 0 10px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
          <p style="margin: 0 0 10px 0;"><strong>🕐 Time:</strong> ${formattedTime}</p>
          ${location ? `<p style="margin: 0 0 10px 0;"><strong>📍 Location:</strong> ${location}</p>` : ''}
          ${locationAddress ? `<p style="margin: 0;"><strong>🗺️ Address:</strong> ${locationAddress}</p>` : ''}
        </div>
        
        <p><strong>Please arrive 15-20 minutes early</strong> to help with setup.</p>
        
        <p>If you can no longer make it, please let us know ASAP so we can make arrangements.</p>
        
        <p style="margin-top: 30px;">
          Thank you for your help!<br>
          <strong>Streetwise Self Defense</strong>
        </p>
      </div>
    </body>
    </html>
  `;
}
