// /api/send-class-followup.js
// Cron job to send follow-up survey/review emails 1 hour after class ends

export default async function handler(req, res) {
  // Verify this is called by Vercel Cron or with proper auth
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  const bypassToken = req.headers['x-vercel-protection-bypass'] || req.query['x-vercel-protection-bypass'];
  const expectedBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  
  const isAuthorized = authHeader === expectedAuth || bypassToken === expectedBypass;
  
  if (!isAuthorized) {
    console.log('[FOLLOWUP-CRON] Unauthorized request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Helper function to delay execution (rate limiting)
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const SITE_URL = process.env.SITE_URL || 'https://streetwiseselfdefense.com';
    const FROM_EMAIL = `"Jay Beecham - Streetwise Self Defense" <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    console.log('[FOLLOWUP-CRON] Starting follow-up email job...');

    // Calculate the time window: classes that ended approximately 1 hour ago
    // Look for classes that ended between 45 mins and 75 mins ago (30 min window)
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    const fortyFiveMinsAgo = new Date(now.getTime() - (45 * 60 * 1000));
    const seventyFiveMinsAgo = new Date(now.getTime() - (75 * 60 * 1000));

    console.log('[FOLLOWUP-CRON] Looking for classes that ended between', seventyFiveMinsAgo.toISOString(), 'and', fortyFiveMinsAgo.toISOString());

    // Fetch ALL class schedules (we'll filter in JavaScript)
    const schedulesResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!schedulesResponse.ok) {
      throw new Error(`Failed to fetch schedules: ${schedulesResponse.status}`);
    }

    const schedulesData = await schedulesResponse.json();
    const allSchedules = schedulesData.records || [];

    // Filter for classes that ended in our time window and are not cancelled
    const schedules = allSchedules.filter(schedule => {
      const isCancelled = schedule.fields['Is Cancelled'];
      const endTime = schedule.fields['End Time New'];
      
      if (isCancelled || !endTime) return false;
      
      const endDate = new Date(endTime);
      
      // Must have ended between 75 and 45 minutes ago
      return endDate >= seventyFiveMinsAgo && endDate <= fortyFiveMinsAgo;
    });

    console.log(`[FOLLOWUP-CRON] Found ${schedules.length} classes that ended ~1 hour ago`);

    if (schedules.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No classes found that ended ~1 hour ago',
        classesFound: 0,
        emailsSent: 0
      });
    }

    const results = [];
    let totalEmailsSent = 0;

    // Process each class schedule
    for (const schedule of schedules) {
      try {
        console.log(`[FOLLOWUP-CRON] Processing schedule ${schedule.id}`);

        // Get class details
        const classId = schedule.fields.Class?.[0];
        if (!classId) {
          console.log(`[FOLLOWUP-CRON] No class linked to schedule ${schedule.id}`);
          continue;
        }

        const classResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`,
          { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
        );

        if (!classResponse.ok) {
          console.log(`[FOLLOWUP-CRON] Failed to fetch class ${classId}`);
          continue;
        }

        const classData = await classResponse.json();

        // Get bookings for this schedule
        const bookingsResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`,
          { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
        );

        if (!bookingsResponse.ok) {
          throw new Error(`Failed to fetch bookings: ${bookingsResponse.status}`);
        }

        const bookingsData = await bookingsResponse.json();
        const allBookings = bookingsData.records || [];

        // Filter bookings for this specific schedule
        const bookings = allBookings.filter(booking => {
          const bookingScheduleIds = booking.fields['Class Schedule'] || [];
          return bookingScheduleIds.includes(schedule.id) && 
                 booking.fields.Status === 'Confirmed';
        });

        console.log(`[FOLLOWUP-CRON] Found ${bookings.length} confirmed bookings for schedule ${schedule.id}`);

        // Send follow-up email to each booking
        for (const booking of bookings) {
          try {
            const contactEmail = booking.fields['Contact Email'];
            const contactFirstName = booking.fields['Contact First Name'] || 'Valued Student';
            
            if (!contactEmail) {
              console.log(`[FOLLOWUP-CRON] Skipping booking ${booking.id} - no email`);
              continue;
            }

            // Skip if followup already sent (duplicate prevention)
            if (booking.fields['Followup Email ID']) {
              console.log(`[FOLLOWUP-CRON] Skipping booking ${booking.id} - followup already sent`);
              continue;
            }

            // Format date for display
            const classDate = schedule.fields?.Date 
              ? new Date(schedule.fields.Date + 'T12:00:00').toLocaleDateString('en-US', { 
                  month: 'long', day: 'numeric', year: 'numeric'
                })
              : 'recently';

            const className = classData?.fields?.['Class Name'] || 'Self Defense Class';
            
            // Create personalized survey link with pre-populated class
            const surveyLink = `${SITE_URL}/satisfaction-survey?classScheduleId=${schedule.id}`;

            // Build email HTML
            const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Attending!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #2C3E50; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Thank You, ${contactFirstName}!</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #2C3E50; font-size: 16px; line-height: 1.6;">
                Thank you for attending the <strong>Streetwise Self Defense & Personal Safety</strong> class on <strong>${classDate}</strong>!
              </p>
              
              <p style="margin: 0 0 20px 0; color: #2C3E50; font-size: 16px; line-height: 1.6;">
                I hope you left with some practical skills, a little more confidence, and a better understanding of what you're capable of under pressure.
              </p>

              <!-- Survey Section -->
              <div style="background-color: #E0F7F5; border-left: 4px solid: #20B2AA; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h2 style="margin: 0 0 15px 0; color: #2C3E50; font-size: 18px; font-weight: 600;">📋 Quick Feedback Survey</h2>
                <p style="margin: 0 0 15px 0; color: #2C3E50; font-size: 15px; line-height: 1.6;">
                  Your feedback helps me improve the class and empowers others to find quality self-defense training. Would you take 2-3 minutes to share your experience?
                </p>
                <table role="presentation" style="margin: 20px 0;">
                  <tr>
                    <td align="center">
                      <a href="${surveyLink}" style="display: inline-block; background-color: #20B2AA; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px; font-weight: 600; text-align: center;">
                        Take the 2-Minute Survey
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin: 15px 0 0 0; color: #6C757D; font-size: 13px; line-height: 1.5;">
                  📝 Your class is already pre-selected for you!
                </p>
              </div>

              <!-- Review Section -->
              <h2 style="margin: 30px 0 15px 0; color: #2C3E50; font-size: 18px; font-weight: 600;">⭐ Share Your Experience Publicly</h2>
              
              <p style="margin: 0 0 15px 0; color: #2C3E50; font-size: 15px; line-height: 1.6;">
                If you enjoyed the class and found it valuable, I'd greatly appreciate a quick review. These "Verified" Reviews (on Google or Yelp) accomplish several things:
              </p>
              
              <ol style="margin: 0 0 20px 0; padding-left: 25px; color: #2C3E50; font-size: 15px; line-height: 1.8;">
                <li style="margin-bottom: 10px;">
                  <strong>Help potential students commit to showing up.</strong> I believe there are benefits to having a male instructor, but it needs to be someone you are comfortable with, and that isn't always obvious from the class sign-up form. If you have had traumatic experiences in your past, it is even more difficult.
                </li>
                <li style="margin-bottom: 10px;">
                  <strong>Help others find this program.</strong> The more popular the class, the faster Streetwise will be known as the place to go for this kind of education.
                </li>
                <li style="margin-bottom: 10px;">
                  <strong>Support future classes in our community.</strong> Your positive reviews help ensure we can continue offering these empowering classes.
                </li>
              </ol>

              <!-- Review Links -->
              <div style="background-color: #F8F9FA; padding: 20px; margin: 25px 0; border-radius: 6px; text-align: center;">
                <p style="margin: 0 0 15px 0; color: #2C3E50; font-size: 15px; font-weight: 600;">
                  Leave a review on your preferred platform:
                </p>
                <table role="presentation" style="margin: 0 auto;">
                  <tr>
                    <td style="padding: 5px;">
                      <a href="https://bit.ly/Streetwise-Leave-Review-Google" style="display: inline-block; background-color: #2C3E50; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 15px; font-weight: 600;">
                        Google Review
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 5px;">
                      <a href="https://bit.ly/Streetwise-Leave-Review-Yelp" style="display: inline-block; background-color: #2C3E50; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 15px; font-weight: 600;">
                        Yelp Review
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Closing -->
              <p style="margin: 30px 0 0 0; color: #2C3E50; font-size: 15px; line-height: 1.6;">
                Whether or not you leave a positive review, or you are even comfortable leaving a review at all, I would like to thank you again for being part of the class and for supporting Streetwise Self Defense.
              </p>
              
              <p style="margin: 15px 0 0 0; color: #2C3E50; font-size: 15px; line-height: 1.6;">
                I look forward to seeing you again in a future workshop!
              </p>

              <p style="margin: 25px 0 0 0; color: #2C3E50; font-size: 15px; line-height: 1.6;">
                Warm regards,<br>
                <strong>Jay Beecham</strong><br>
                Streetwise Self Defense<br>
                <a href="tel:925-532-9953" style="color: #20B2AA; text-decoration: none;">925-532-9953</a><br>
                <a href="mailto:jay@streetwiseselfdefense.com" style="color: #20B2AA; text-decoration: none;">jay@streetwiseselfdefense.com</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #6C757D; font-size: 13px; line-height: 1.5;">
                Streetwise Self Defense<br>
                Empowering individuals through practical self-defense training
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            `.trim();

            // Send email via Resend
            try {
              const { Resend } = await import('resend');
              const resend = new Resend(RESEND_API_KEY);

              const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: contactEmail,
                cc: ['jay@streetwiseselfdefense.com'], 
                subject: `Thank you for attending ${className}!`,
                html: emailHTML
              });

              if (error) {
                console.error(`[FOLLOWUP-CRON] Resend error for booking ${booking.id}:`, error);
                throw error;
              }

              console.log(`[FOLLOWUP-CRON] Sent email to ${contactEmail} for booking ${booking.id}`);
              console.log(`[FOLLOWUP-CRON] Followup Email ID: ${data.id}`);

              // Store followup email ID and status in Airtable
              if (data && data.id) {
                await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking.id}`, {
                  method: 'PATCH',
                  headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    fields: {
                      'Followup Email ID': data.id,
                      'Followup Email Status': 'Sent',
                      'Followup Email Sent At': new Date().toISOString()
                    }
                  })
                });
                
                console.log(`[FOLLOWUP-CRON] Stored followup email tracking data for booking ${booking.id}`);
              }

              totalEmailsSent++;
              results.push({
                scheduleId: schedule.id,
                bookingId: booking.id,
                email: contactEmail,
                success: true
              });

              // Rate limit: wait 600ms between emails (allows ~1.6 emails/second, safely under 2/sec limit)
              await sleep(600);
              
            } catch (resendErr) {
              console.error(`[FOLLOWUP-CRON] Failed to send email for booking ${booking.id}:`, resendErr);
              results.push({
                scheduleId: schedule.id,
                bookingId: booking.id,
                email: contactEmail,
                success: false,
                error: resendErr.message
              });
            }
          } catch (bookingError) {
            console.error(`[FOLLOWUP-CRON] Error processing booking ${booking.id}:`, bookingError);
            results.push({
              scheduleId: schedule.id,
              bookingId: booking.id,
              success: false,
              error: bookingError.message
            });
          }
        }

        console.log(`[FOLLOWUP-CRON] Sent ${totalEmailsSent} followup emails for schedule ${schedule.id}`);

      } catch (scheduleError) {
        console.error(`[FOLLOWUP-CRON] Error processing schedule ${schedule.id}:`, scheduleError);
        results.push({
          scheduleId: schedule.id,
          success: false,
          error: scheduleError.message
        });
      }
    }

    console.log(`[FOLLOWUP-CRON] Followup job complete. Total emails sent: ${totalEmailsSent}`);

    return res.json({
      success: true,
      classesFound: schedules.length,
      emailsSent: totalEmailsSent,
      results
    });

  } catch (error) {
    console.error('[FOLLOWUP-CRON] Fatal error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
