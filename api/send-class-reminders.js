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

    // Fetch ALL class schedules (no filter - same approach as /api/admin/class-schedules.js)
    const schedulesResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!schedulesResponse.ok) {
      throw new Error(`Failed to fetch schedules: ${schedulesResponse.status}`);
    }

    const schedulesData = await schedulesResponse.json();
    const allSchedules = schedulesData.records || [];

    // Filter for tomorrow's date AND NOT cancelled in JavaScript
    const schedules = allSchedules.filter(schedule => {
      const scheduleDate = schedule.fields.Date;
      const isCancelled = schedule.fields['Is Cancelled'];
      
      // Skip if no date or if cancelled
      if (!scheduleDate || isCancelled) return false;
      
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
            
            // Build list of ALL participant names (including booker)
            const allParticipantNames = bookingParticipants.length > 0
              ? bookingParticipants.map(p => `${p.fields['First Name']} ${p.fields['Last Name']}`).join(', ')
              : contactFirstName;
            
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
            const location = schedule.fields?.Location || classData?.fields?.Location || 'Location TBD';
            
            // Use Waiver URL from schedule, fallback to general waiver page
            const waiverUrl = schedule.fields?.['Waiver URL'] || 'https://www.streetwiseselfdefense.com/waiver';
            
            // Make class prep URL environment-aware
            const host = req.headers?.host || 'www.streetwiseselfdefense.com';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const baseUrl = `${protocol}://${host}`;
            const classPrepUrl = `${baseUrl}/class-prep/${schedule.id}`;

            // Build HTML email
            const emailHTML = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://www.streetwiseselfdefense.com/swsd-logo-official.png" alt="Streetwise Self Defense" style="max-width: 300px;">
  </div>
  
  <h1 style="color: #2C3E50; text-align: center; font-size: 32px; margin-bottom: 10px;">Your Class is Tomorrow!</h1>
  
  <p style="font-size: 16px; line-height: 1.6;">Hi ${contactFirstName},</p>
  
  <p style="font-size: 16px; line-height: 1.6;">This is an <strong>eye-opening, fun, practical, and empowering</strong> experience that builds confidence from the get-go! You'll even practice your new striking skills against a real male "attacker" during simulated scenarios.</p>
  
  <!-- Action Photo -->
  <div style="text-align: center; margin: 30px 0;">
    <img src="https://www.streetwiseselfdefense.com/self-defense-action.png" alt="Self-defense training in action" style="max-width: 100%; height: auto; border-radius: 8px;">
  </div>
  
  <!-- CLASS DETAILS - 2 Column Table -->
  <div style="background: #F0FDFC; border: 2px solid #20B2AA; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <h2 style="color: #2C3E50; margin-top: 0; margin-bottom: 20px; font-size: 24px;">📅 Your Class Details</h2>
    <table style="width: 100%; font-size: 16px;" cellpadding="8" cellspacing="0">
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #14b8a6; font-weight: bold; color: #2C3E50; width: 35%;">Class:</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #14b8a6; color: #1E293B;">${className}</td>
      </tr>
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #14b8a6; font-weight: bold; color: #2C3E50;">Date:</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #14b8a6; color: #1E293B;">${formattedDate}</td>
      </tr>
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #14b8a6; font-weight: bold; color: #2C3E50;">Time:</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #14b8a6; color: #1E293B;">${displayStartTime} - ${displayEndTime}</td>
      </tr>
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #14b8a6; font-weight: bold; color: #2C3E50;">Location:</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #14b8a6; color: #1E293B;">${location}</td>
      </tr>
      <tr>
        <td style="padding: 12px 8px; font-weight: bold; color: #2C3E50;">Registered:</td>
        <td style="padding: 12px 8px; color: #1E293B;">${allParticipantNames}</td>
      </tr>
    </table>
  </div>
  
  <!-- WAIVER WITH FORWARD REMINDER -->
  <div style="background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <h2 style="color: #92400E; margin-top: 0; font-size: 22px;">⚠️ Action Needed: Complete Your Waiver</h2>
    <p style="font-size: 15px; color: #78350F; line-height: 1.7;"><strong>Each participant</strong> must complete their waiver before class to ensure a smooth check-in.${participantCount > 1 ? ' <strong>If you booked for multiple people, please forward this email to everyone attending!</strong>' : ''}</p>
    <p style="text-align: center; margin: 25px 0;">
      <a href="${waiverUrl}" style="background: #20B2AA; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Complete Waiver Now</a>
    </p>
    <p style="font-size: 14px; color: #92400E; margin-top: 20px;"><strong>Important Waiver Instructions:</strong></p>
    <ul style="font-size: 14px; color: #92400E; margin: 10px 0; line-height: 1.8;">
      <li><strong>Adults (18+):</strong> Select "Myself"</li>
      <li><strong>Teens (15-17):</strong> Select "Minors Only" (parent/guardian must sign)</li>
      <li><strong>Teens with parent:</strong> Select "Parent/Guardian & Minor"</li>
    </ul>
    <p style="font-size: 13px; color: #92400E; font-style: italic; margin-top: 15px;">Pro tip: On mobile, scroll down for the "Continue" button!</p>
  </div>
  
  <!-- WHAT TO EXPECT -->
  <div style="background: #F3F4F6; border: 1px solid #D1D5DB; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <h2 style="color: #2C3E50; margin-top: 0; font-size: 22px;">📋 What to Expect</h2>
    <p style="font-size: 15px; line-height: 1.7;">Review important details about your class experience:</p>
    <ul style="line-height: 2; font-size: 15px;">
      <li>Workshop experience overview</li>
      <li>Detailed directions & parking info</li>
      <li>What to bring (and what NOT to bring)</li>
      <li>Recommended attire</li>
      <li>Photography policy</li>
    </ul>
    <p style="text-align: center; margin: 25px 0;">
      <a href="${classPrepUrl}" style="color: #20B2AA; font-weight: bold; text-decoration: underline; font-size: 16px;">View What to Expect Page</a>
    </p>
  </div>
  
  <!-- EMAIL CONFIRMATION REQUEST -->
  <div style="background: #F8F9FA; border: 1px solid #D1D5DB; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <h2 style="color: #2C3E50; margin-top: 0; font-size: 22px;">📧 Quick Favor</h2>
    <p style="font-size: 15px; line-height: 1.6;">I've had some deliverability issues with these emails landing in spam. If you could briefly reply confirming you received this and plan to attend, it would help me out tremendously!</p>
    <p style="font-size: 14px; color: #6B7280; font-style: italic; margin-top: 12px;">You can also respond to the text message reminder I may send.</p>
  </div>
  
  <!-- ENCOURAGEMENT -->
  <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-left: 4px solid #20B2AA; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <p style="font-size: 16px; line-height: 1.7; font-style: italic; color: #374151; margin: 0;">Bring any male-focused frustration you might have... take it out on me, with no judgment! First one to knock me down gets bragging rights! 😄</p>
  </div>
  
  <!-- CONTACT INFO -->
  <div style="background: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
    <p style="font-size: 16px; margin-bottom: 15px;">If you have any last-minute questions, feel free to call or text:</p>
    <p style="font-size: 22px; font-weight: bold; color: #2C3E50; margin: 15px 0;">
      <a href="tel:+19255329953" style="color: #20B2AA; text-decoration: none;">📱 (925) 532-9953</a>
    </p>
    <p style="margin-top: 20px; font-size: 16px;">I'm looking forward to working with you!</p>
    <p style="font-weight: bold; margin-top: 15px; font-size: 18px; color: #2C3E50;">See you tomorrow! 🥋</p>
  </div>
  
  <!-- SIGNATURE -->
  <div style="background: #F8F9FA; border: 1px solid #D1D5DB; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
    <p style="font-weight: bold; font-size: 16px; color: #2C3E50; margin-bottom: 8px;">Warm regards,</p>
    <p style="font-size: 18px; margin: 8px 0; color: #2C3E50;">Jay Beecham</p>
    <p style="color: #6B7280; font-size: 15px; margin: 8px 0;">Streetwise Self Defense</p>
    <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 12px;">
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
