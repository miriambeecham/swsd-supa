// /api/send-class-reminders.js
// Cron job to send reminder emails 1 day before class

export default async function handler(req, res) {
  // Verify this is called by Vercel Cron or with proper auth
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  const bypassToken = req.headers['x-vercel-protection-bypass'] || req.query['x-vercel-protection-bypass'];
  const expectedBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  
  const isAuthorized = authHeader === expectedAuth || bypassToken === expectedBypass;
  
  if (!isAuthorized) {
    console.log('[REMINDER-CRON] Unauthorized request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = `"Streetwise Self Defense" <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    console.log('[REMINDER-CRON] Starting class reminder job...');

    // Calculate tomorrow's date (24 hours from now)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log('[REMINDER-CRON] Looking for classes on:', tomorrowDateStr);

    // Fetch all scheduled classes (simpler query to avoid formula issues)
    const schedulesResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules?filterByFormula={Status}='Scheduled'`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!schedulesResponse.ok) {
      throw new Error(`Failed to fetch schedules: ${schedulesResponse.status}`);
    }

    const schedulesData = await schedulesResponse.json();
    const allSchedules = schedulesData.records || [];

    // Filter for tomorrow's date in JavaScript
    const schedules = allSchedules.filter(schedule => {
      const scheduleDate = schedule.fields.Date;
      if (!scheduleDate) return false;
      
      // Handle different date formats - convert to YYYY-MM-DD
      const dateObj = new Date(scheduleDate);
      const scheduleDateStr = dateObj.toISOString().split('T')[0];
      
      return scheduleDateStr === tomorrowDateStr;
    });

    console.log(`[REMINDER-CRON] Found ${schedules.length} classes scheduled for tomorrow`);

    if (schedules.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No classes scheduled for tomorrow',
        classesFound: 0,
        emailsSent: 0
      });
    }

    const results = [];
    let totalEmailsSent = 0;

    // Process each class schedule
    for (const schedule of schedules) {
      try {
        console.log(`[REMINDER-CRON] Processing schedule ${schedule.id}`);

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

        // Get all confirmed bookings for this schedule
        const bookingIds = schedule.fields.Bookings || [];
        if (bookingIds.length === 0) {
          console.log(`[REMINDER-CRON] No bookings for schedule ${schedule.id}`);
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

        console.log(`[REMINDER-CRON] Found ${bookings.length} confirmed bookings for schedule ${schedule.id}`);

        // Get all participants for these bookings
        const allParticipantIds = bookings.flatMap(b => b.fields?.Participants || []);
        let participantsMap = new Map();

        if (allParticipantIds.length > 0) {
          const participantOrConditions = allParticipantIds.map(id => `RECORD_ID()="${id}"`).join(',');
          const participantFilterFormula = `OR(${participantOrConditions})`;
          
          const participantsResponse = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants?filterByFormula=${encodeURIComponent(participantFilterFormula)}`,
            { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
          );

          if (participantsResponse.ok) {
            const participantsData = await participantsResponse.json();
            const participants = participantsData.records || [];
            
            // Create a map of bookingId -> participants
            participants.forEach(p => {
              const bookingId = p.fields.Booking?.[0];
              if (bookingId) {
                if (!participantsMap.has(bookingId)) {
                  participantsMap.set(bookingId, []);
                }
                participantsMap.get(bookingId).push(p);
              }
            });
          }
        }

        // Send reminder email to each booking
        for (const booking of bookings) {
          try {
            const contactEmail = booking.fields['Contact Email'];
            const contactFirstName = booking.fields['Contact First Name'] || 'Valued Customer';
            
            if (!contactEmail) {
              console.log(`[REMINDER-CRON] Skipping booking ${booking.id} - no email`);
              continue;
            }

            // Get participants for this booking
            const bookingParticipants = participantsMap.get(booking.id) || [];
            const participantCount = booking.fields['Number of Participants'] || bookingParticipants.length || 1;
            
            // Build list of other participants (excluding the booker)
            const otherParticipants = bookingParticipants.filter(p => {
              const isBooker = p.fields['First Name'] === booking.fields['Contact First Name'] && 
                              p.fields['Last Name'] === booking.fields['Contact Last Name'];
              return !isBooker;
            });

            const otherParticipantsList = otherParticipants.length > 0
              ? otherParticipants.map(p => `<li>${p.fields['First Name']} ${p.fields['Last Name']}</li>`).join('\n      ')
              : '';

            // Format time helpers
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
            const displayEndTime = formatTimeForDisplay(schedule.fields?.['End Time New']);
            
            const formattedDate = schedule.fields?.Date 
              ? new Date(schedule.fields.Date + 'T12:00:00').toLocaleDateString('en-US', { 
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                })
              : 'TBD';

            const className = classData?.fields?.['Class Name'] || 'Self Defense Class';
            const location = schedule.fields?.Location || 'Location TBD';
            
            // Use class prep URL (waiver link)
            const waiverUrl = 'https://www.streetwiseselfdefense.com/waiver';
            const classPrepUrl = `https://www.streetwiseselfdefense.com/class-prep/${schedule.id}`;

            // Build HTML email
            const emailHTML = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://www.streetwiseselfdefense.com/swsd-logo-official.png" alt="Streetwise Self Defense" style="max-width: 300px;">
  </div>
  
  <h1 style="color: #1E293B; text-align: center;">Your Class is Tomorrow!</h1>
  
  <p>Hi ${contactFirstName},</p>
  
  <p>Get ready for an empowering experience! Your Streetwise Self-Defense workshop is coming up tomorrow.</p>
  
  ${participantCount > 1 ? `
  <div style="background: #DBEAFE; border: 2px solid #3B82F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #1E40AF; margin-top: 0;">👥 You Registered ${participantCount} Participant${participantCount > 1 ? 's' : ''}</h2>
    <p style="font-weight: bold; color: #1E40AF;">Please forward this email to everyone attending!</p>
    ${otherParticipants.length > 0 ? `
    <p>Since you made the booking, you received this reminder. Please share it with:</p>
    <ul style="color: #1E40AF; line-height: 1.8;">
      ${otherParticipantsList}
    </ul>
    ` : ''}
    <p style="margin-top: 15px;"><strong>Important:</strong> Each participant must complete their own waiver before class.</p>
  </div>
  ` : ''}
  
  <div style="background: #F0FDFC; border: 1px solid #14b8a6; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #1E293B; margin-top: 0;">📅 Your Class Details</h2>
    <p><strong>Class:</strong> ${className}</p>
    <p><strong>Date:</strong> ${formattedDate}</p>
    <p><strong>Time:</strong> ${displayStartTime} - ${displayEndTime}</p>
    <p><strong>Location:</strong> ${location}</p>
    <p><strong>Participants:</strong> ${participantCount}</p>
  </div>
  
  <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #1E293B; margin-top: 0;">⚠️ Action Required: Complete Your Waiver</h2>
    <p><strong>Each participant</strong> must complete their waiver before class to ensure a smooth check-in:</p>
    <p style="text-align: center; margin: 20px 0;">
      <a href="${waiverUrl}" style="background: #14b8a6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Complete Waiver Now</a>
    </p>
    <p style="font-size: 14px; color: #92400E;"><strong>Important Waiver Instructions:</strong></p>
    <ul style="font-size: 14px; color: #92400E; margin: 10px 0;">
      <li><strong>Adults (18+):</strong> Select "Myself"</li>
      <li><strong>Teens (15-17):</strong> Select "Minors Only" (parent/guardian must sign)</li>
      <li><strong>Teens with parent:</strong> Select "Parent/Guardian & Minor"</li>
    </ul>
    <p style="font-size: 14px; color: #92400E;"><em>Pro tip: On mobile, scroll down for the "Continue" button!</em></p>
  </div>
  
  <div style="background: #F3F4F6; border: 1px solid #D1D5DB; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #1E293B; margin-top: 0;">📋 What to Expect</h2>
    <p>Review important details about your class experience:</p>
    <ul style="line-height: 1.8;">
      <li>Workshop experience overview</li>
      <li>Detailed directions & parking info</li>
      <li>What to bring (and what NOT to bring)</li>
      <li>Recommended attire</li>
      <li>Photography policy</li>
    </ul>
    <p style="text-align: center; margin: 20px 0;">
      <a href="${classPrepUrl}" style="color: #14b8a6; font-weight: bold; text-decoration: underline;">View What to Expect Page</a>
    </p>
  </div>
  
  <div style="background: #EFF6FF; border: 1px solid #3B82F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #1E293B; margin-top: 0;">📧 Quick Favor</h2>
    <p>I've had some deliverability issues with these emails landing in spam. If you could briefly reply confirming you received this and plan to attend, it would help me out tremendously!</p>
    <p style="font-size: 14px; color: #1E40AF;"><em>You can also respond to the text message reminder I may send.</em></p>
  </div>
  
  <div style="margin: 30px 0; padding: 20px; background: #F9FAFB; border-radius: 8px;">
    <h2 style="color: #1E293B; margin-top: 0;">What You'll Experience Tomorrow</h2>
    <p>${contactFirstName}, this is an <strong>eye-opening, fun, practical, and empowering</strong> experience that builds confidence from the get-go! You'll learn valuable techniques and even practice your new striking skills against a real male "attacker" during simulated scenarios.</p>
    <p style="font-style: italic;">Bring any male-focused frustration you might have... take it out on me, with no judgment! First one to knock me down gets bragging rights! 😄</p>
  </div>
  
  <div style="text-align: center; padding: 20px; border-top: 2px solid #E5E7EB; margin-top: 30px;">
    <p>If you have any last-minute questions, feel free to call or text:</p>
    <p style="font-size: 18px; font-weight: bold; color: #1E293B;">
      <a href="tel:+19255329953" style="color: #14b8a6; text-decoration: none;">📱 (925) 532-9953</a>
    </p>
    <p style="margin-top: 20px;">I'm looking forward to working with you!</p>
    <p style="font-weight: bold; margin-top: 20px;">See you tomorrow! 🥋</p>
  </div>
  
  <div style="text-align: center; padding: 20px; border-top: 1px solid #E5E7EB; margin-top: 30px;">
    <p style="font-weight: bold;">Warm regards,</p>
    <p style="font-size: 16px; margin: 10px 0;">Jay Beecham</p>
    <p style="color: #6B7280;">Streetwise Self Defense</p>
    <p style="color: #6B7280; font-size: 14px;">
      Empowering women and vulnerable populations through practical self-defense training<br>
      Walnut Creek, CA | (925) 532-9953
    </p>
  </div>
</body>
</html>
`;

            // Send email via Resend
            const { Resend } = await import('resend');
            const resend = new Resend(RESEND_API_KEY);

            await resend.emails.send({
              from: FROM_EMAIL,
              to: contactEmail,
              cc: 'confirmations@streetwiseselfdefense.com',
              subject: `Reminder: Your Class is Tomorrow! - ${className}`,
              html: emailHTML
            });

            console.log(`[REMINDER-CRON] Sent reminder to ${contactEmail} for booking ${booking.id}`);
            totalEmailsSent++;
            
            results.push({ 
              bookingId: booking.id, 
              email: contactEmail,
              success: true 
            });

          } catch (emailErr) {
            console.error(`[REMINDER-CRON] Failed to send email for booking ${booking.id}:`, emailErr);
            results.push({ 
              bookingId: booking.id, 
              success: false, 
              error: emailErr.message 
            });
          }
        }

      } catch (scheduleErr) {
        console.error(`[REMINDER-CRON] Failed to process schedule ${schedule.id}:`, scheduleErr);
        results.push({ 
          scheduleId: schedule.id, 
          success: false, 
          error: scheduleErr.message 
        });
      }
    }

    console.log(`[REMINDER-CRON] Reminder job completed. Sent ${totalEmailsSent} emails for ${schedules.length} classes`);
    
    return res.json({ 
      success: true, 
      classesFound: schedules.length,
      emailsSent: totalEmailsSent,
      results 
    });
    
  } catch (error) {
    console.error('[REMINDER-CRON] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
