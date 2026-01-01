// /api/send-morning-email-reminders.js
// ✅ UPDATED: Runs at 9 AM Pacific Time - sends comprehensive email reminder
// Also sends reminders to Teaching Assistants with modified messaging

export default async function handler(req, res) {
  // Verify this is called by Vercel Cron or with proper auth
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  const bypassToken = req.headers['x-vercel-protection-bypass'] || req.query['x-vercel-protection-bypass'];
  const expectedBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  
  const isAuthorized = authHeader === expectedAuth || bypassToken === expectedBypass;
  
  if (!isAuthorized) {
    console.log('[MORNING-EMAIL] Unauthorized request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Helper function to delay execution (rate limiting)
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const FROM_EMAIL = `"Streetwise Self Defense" <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    console.log('[MORNING-EMAIL] Starting 9 AM email reminder job...');

    // Calculate tomorrow's date in Pacific Time
    const nowPacific = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
    const todayPacific = new Date(nowPacific);
    const tomorrowPacific = new Date(todayPacific);
    tomorrowPacific.setDate(tomorrowPacific.getDate() + 1);
    const tomorrowDateStr = tomorrowPacific.toISOString().split('T')[0];

    console.log('[MORNING-EMAIL] Current Pacific Time:', nowPacific);
    console.log('[MORNING-EMAIL] Looking for classes on:', tomorrowDateStr);

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

    console.log(`[MORNING-EMAIL] Found ${schedules.length} classes scheduled for tomorrow`);

    if (schedules.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No classes scheduled for tomorrow',
        classesFound: 0,
        emailsSent: 0,
        taEmailsSent: 0
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
    console.log(`[MORNING-EMAIL] Loaded ${allTAs.length} teaching assistants`);

    const results = [];
    let totalEmailsSent = 0;
    let totalTAEmailsSent = 0;

    // Process each class schedule
    for (const schedule of schedules) {
      try {
        console.log(`[MORNING-EMAIL] Processing schedule ${schedule.id}`);

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

        // Common formatting helpers
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
        const classLocation = classData?.fields?.Location || 'Location TBD';

        // Class prep URL
        const classPrepUrl = `https://streetwiseselfdefense.com/class-prep/${schedule.id}`;

        // ============================================
        // SEND REMINDERS TO TEACHING ASSISTANTS
        // ============================================
        const assignedTAIds = schedule.fields['Teaching Assistants'] || [];
        
        if (assignedTAIds.length > 0) {
          console.log(`[MORNING-EMAIL] Found ${assignedTAIds.length} TAs assigned to schedule ${schedule.id}`);
          
          for (const taId of assignedTAIds) {
            const ta = allTAs.find(t => t.id === taId);
            if (!ta) {
              console.log(`[MORNING-EMAIL] TA ${taId} not found in database`);
              continue;
            }

            const taEmail = ta.fields['Email'];
            const taName = ta.fields['Name'] || 'Teaching Assistant';
            const taFirstName = taName.split(' ')[0];
            const taStatus = ta.fields['Status'];

            // Skip inactive TAs
            if (taStatus === 'Inactive') {
              console.log(`[MORNING-EMAIL] Skipping inactive TA: ${taName}`);
              continue;
            }

            // Skip if no email
            if (!taEmail) {
              console.log(`[MORNING-EMAIL] Skipping TA ${taName} - no email`);
              continue;
            }

            // TA-specific email HTML
            const taEmailHTML = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://www.streetwiseselfdefense.com/swsd-logo-official.png" alt="Streetwise Self Defense" style="max-width: 300px;">
  </div>
  
  <h1 style="color: #2C3E50; text-align: center; font-size: 32px; margin-bottom: 10px;">You're Helping Teach Tomorrow!</h1>
  
  <p style="font-size: 16px; line-height: 1.6;">Hi ${taFirstName},</p>
  
  <p style="font-size: 16px; line-height: 1.6;">This is a friendly reminder that you're scheduled to <strong>help teach</strong> a self-defense class tomorrow. Thank you so much for volunteering your time!</p>
  
  <div style="background: #F0F4F8; border: 2px solid #2C3E50; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <h2 style="color: #2C3E50; margin-top: 0; margin-bottom: 20px; font-size: 24px;">Class Details</h2>
    <table style="width: 100%; font-size: 16px;" cellpadding="8" cellspacing="0">
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; font-weight: bold; color: #2C3E50; width: 35%;">Class:</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; color: #1E293B;">${className}</td>
      </tr>
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; font-weight: bold; color: #2C3E50;">Date:</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; color: #1E293B;">${formattedDate}</td>
      </tr>
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; font-weight: bold; color: #2C3E50;">Time:</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; color: #1E293B;">${displayStartTime} - ${displayEndTime}</td>
      </tr>
      <tr>
        <td style="padding: 12px 8px; font-weight: bold; color: #2C3E50;">Location:</td>
        <td style="padding: 12px 8px; color: #1E293B;">${classLocation}</td>
      </tr>
    </table>
  </div>
  
  <div style="background: #E0F2FE; border: 2px solid #0284C7; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <h2 style="color: #0369A1; margin-top: 0; font-size: 22px;">📋 TA Reminders</h2>
    <ul style="font-size: 15px; color: #0C4A6E; margin: 15px 0; line-height: 1.8;">
      <li>Please arrive <strong>15-20 minutes early</strong> to help with setup</li>
      <li>Wear comfortable clothes you can move in</li>
      <li>Bring water and any equipment we discussed</li>
      <li>Let me know ASAP if anything comes up and you can't make it</li>
    </ul>
  </div>
  
  <div style="background: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
    <p style="font-size: 16px; margin-bottom: 15px; color: #374151;">Questions? Call or text:</p>
    <p style="font-size: 22px; font-weight: bold; color: #2C3E50; margin: 15px 0;">
      <a href="tel:+19255329953" style="color: #20B2AA; text-decoration: none;">(925) 532-9953</a>
    </p>
    <p style="margin-top: 20px; font-size: 16px; color: #374151;">Thanks again for your help!</p>
    <p style="font-weight: bold; margin-top: 15px; font-size: 18px; color: #2C3E50;">See you tomorrow!</p>
  </div>
  
  <div style="background: #F8F9FA; border: 1px solid #D1D5DB; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
    <p style="font-weight: bold; font-size: 16px; color: #2C3E50; margin-bottom: 8px;">Warm regards,</p>
    <p style="font-size: 18px; margin: 8px 0; color: #2C3E50;">Jay Beecham</p>
    <p style="color: #6B7280; font-size: 15px; margin: 8px 0;">Streetwise Self Defense</p>
  </div>
</body>
</html>
`;

            // Send TA email
            try {
              const { Resend } = await import('resend');
              const resend = new Resend(RESEND_API_KEY);

              const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: taEmail,
                reply_to: 'jay@streetwiseselfdefense.com',
                subject: `Tomorrow: You're Helping Teach ${className}`,
                html: taEmailHTML
              });

              if (error) {
                console.error(`[MORNING-EMAIL] Resend error for TA ${taName}:`, error);
                throw error;
              }

              console.log(`[MORNING-EMAIL] ✅ Sent TA email to ${taEmail} (${taName})`);

              totalTAEmailsSent++;
              results.push({
                scheduleId: schedule.id,
                recipientType: 'TA',
                taId: ta.id,
                taName: taName,
                email: taEmail,
                success: true
              });

              await sleep(600);
              
            } catch (taEmailErr) {
              console.error(`[MORNING-EMAIL] ❌ Failed to send TA email to ${taName}:`, taEmailErr);
              results.push({
                scheduleId: schedule.id,
                recipientType: 'TA',
                taId: ta.id,
                taName: taName,
                email: taEmail,
                success: false,
                error: taEmailErr.message
              });
            }
          }
        }

        // ============================================
        // SEND REMINDERS TO STUDENTS (existing logic)
        // ============================================

        // Get confirmed bookings for this schedule
        const bookingIds = schedule.fields.Bookings || [];
        if (bookingIds.length === 0) {
          console.log(`[MORNING-EMAIL] No bookings linked to schedule ${schedule.id}`);
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

        console.log(`[MORNING-EMAIL] Found ${bookings.length} confirmed bookings`);

        if (bookings.length === 0) {
          continue;
        }

        // Fetch participants
        const participantsResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants`,
          { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
        );

        let allParticipants = [];
        if (participantsResponse.ok) {
          const participantsData = await participantsResponse.json();
          allParticipants = participantsData.records || [];
        }

        // Map participants to bookings
        const participantsMap = new Map();
        if (allParticipants.length > 0) {
          allParticipants.forEach(p => {
            if (p.fields.Booking && p.fields.Booking.length > 0) {
              const bookingId = p.fields.Booking[0];
              if (bookingId) {
                if (!participantsMap.has(bookingId)) {
                  participantsMap.set(bookingId, []);
                }
                participantsMap.get(bookingId).push(p);
              }
            }
          });
        }

        // Send email to each booking
        for (const booking of bookings) {
          try {
            const contactEmail = booking.fields['Contact Email'];
            const contactFirstName = booking.fields['Contact First Name'] || 'Valued Customer';
            
            if (!contactEmail) {
              console.log(`[MORNING-EMAIL] Skipping booking ${booking.id} - no email`);
              continue;
            }

            // Skip if reminder already sent
            if (booking.fields['Reminder Email ID']) {
              console.log(`[MORNING-EMAIL] Skipping booking ${booking.id} - reminder already sent`);
              continue;
            }

            // Skip if confirmation email bounced
            if (booking.fields['Confirmation Email Status'] === 'Bounced') {
              console.log(`[MORNING-EMAIL] Skipping booking ${booking.id} - confirmation email bounced`);
              continue;
            }

            // Skip if unsubscribed
            if (booking.fields['Email Unsubscribed']) {
              console.log(`[MORNING-EMAIL] Skipping booking ${booking.id} - unsubscribed`);
              continue;
            }

            // Get participant info
            const bookingParticipants = participantsMap.get(booking.id) || [];
            const participantCount = booking.fields['Number of Participants'] || bookingParticipants.length || 1;
            
            const allParticipantNames = bookingParticipants.length > 0
              ? bookingParticipants.map(p => `${p.fields['First Name']} ${p.fields['Last Name']}`).join(', ')
              : contactFirstName;

            // Email HTML - ORIGINAL TEMPLATE from send-class-reminders.js
            const emailHTML = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://www.streetwiseselfdefense.com/swsd-logo-official.png" alt="Streetwise Self Defense" style="max-width: 300px;">
  </div>
  
  <h1 style="color: #2C3E50; text-align: center; font-size: 32px; margin-bottom: 10px;">Your Class is Tomorrow!</h1>
  
  <p style="font-size: 16px; line-height: 1.6;">Hi ${contactFirstName},</p>
  
  <p style="font-size: 16px; line-height: 1.6;">This is a friendly reminder that your self-defense class is happening <strong>tomorrow</strong>! We're excited to work with ${participantCount > 1 ? 'your group' : 'you'}.</p>
  
  <div style="background: #F0F4F8; border: 2px solid #2C3E50; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <h2 style="color: #2C3E50; margin-top: 0; margin-bottom: 20px; font-size: 24px;">Your Class Details</h2>
    <table style="width: 100%; font-size: 16px;" cellpadding="8" cellspacing="0">
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; font-weight: bold; color: #2C3E50; width: 35%;">Class:</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; color: #1E293B;">${className}</td>
      </tr>
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; font-weight: bold; color: #2C3E50;">Date:</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; color: #1E293B;">${formattedDate}</td>
      </tr>
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; font-weight: bold; color: #2C3E50;">Time:</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; color: #1E293B;">${displayStartTime} - ${displayEndTime}</td>
      </tr>
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; font-weight: bold; color: #2C3E50;">Location:</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #CBD5E0; color: #1E293B;">${classLocation}</td>
      </tr>
      <tr>
        <td style="padding: 12px 8px; font-weight: bold; color: #2C3E50;">Registered:</td>
        <td style="padding: 12px 8px; color: #1E293B;">${allParticipantNames}</td>
      </tr>
    </table>
  </div>
  
  <div style="background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <h2 style="color: #92400E; margin-top: 0; font-size: 22px;">📋 Class Prep & Waiver</h2>
    <p style="font-size: 15px; color: #78350F; line-height: 1.7;">Please visit your class prep page for everything you need to know:</p>
    <ul style="font-size: 14px; color: #78350F; margin: 15px 0; line-height: 1.8;">
      <li>Complete your liability waiver ${participantCount > 1 ? '- <strong>if you booked for multiple people, forward this email to everyone!</strong>' : ''}</li>
      <li>Get detailed directions & parking info</li>
      <li>See what to bring (and what NOT to bring)</li>
      <li>Review recommended attire</li>
      <li>Learn about the photography policy</li>
      <li>Access map links (Google & Apple Maps)</li>
    </ul>
    <p style="text-align: center; margin: 25px 0;">
      <a href="${classPrepUrl}" style="background: #20B2AA; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">View Class Prep & Complete Waiver</a>
    </p>
    <p style="font-size: 14px; color: #6B7280; margin-top: 20px;"><strong>Important Waiver Instructions:</strong></p>
    <ul style="font-size: 14px; color: #6B7280; margin: 10px 0; line-height: 1.8;">
      <li><strong>Adults (18+):</strong> Select "Myself"</li>
      <li><strong>Teens (15-17):</strong> Select "Minors Only" (parent/guardian must sign)</li>
      <li><strong>Teens with parent:</strong> Select "Parent/Guardian & Minor"</li>
    </ul>
    <p style="font-size: 13px; color: #6B7280; font-style: italic; margin-top: 15px;">Pro tip: On mobile, scroll down for the "Continue" button!</p>
  </div>
  
  <div style="background: #F8F9FA; border: 1px solid #D1D5DB; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <h2 style="color: #2C3E50; margin-top: 0; font-size: 22px;">Quick Favor</h2>
    <p style="font-size: 15px; line-height: 1.6; color: #374151;">I've had some deliverability issues with these emails landing in spam. If you could briefly reply confirming you received this and plan to attend, it would help me out tremendously!</p>
    <p style="font-size: 14px; color: #6B7280; font-style: italic; margin-top: 12px;">You can also respond to the text message reminder I may send.</p>
  </div>
  
  <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-left: 4px solid #20B2AA; border-radius: 8px; padding: 25px; margin: 30px 0;">
    <p style="font-size: 16px; line-height: 1.7; font-style: italic; color: #374151; margin: 0;">Bring any male-focused frustration you might have... take it out on me, with no judgment! First one to knock me down gets bragging rights! 😄</p>
  </div>
  
  <div style="background: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
    <p style="font-size: 16px; margin-bottom: 15px; color: #374151;">If you have any last-minute questions, feel free to call or text:</p>
    <p style="font-size: 22px; font-weight: bold; color: #2C3E50; margin: 15px 0;">
      <a href="tel:+19255329953" style="color: #20B2AA; text-decoration: none;">(925) 532-9953</a>
    </p>
    <p style="margin-top: 20px; font-size: 16px; color: #374151;">I'm looking forward to working with you!</p>
    <p style="font-weight: bold; margin-top: 15px; font-size: 18px; color: #2C3E50;">See you tomorrow!</p>
  </div>
  
  <div style="background: #F8F9FA; border: 1px solid #D1D5DB; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
    <p style="font-weight: bold; font-size: 16px; color: #2C3E50; margin-bottom: 8px;">Warm regards,</p>
    <p style="font-size: 18px; margin: 8px 0; color: #2C3E50;">Jay Beecham</p>
    <p style="color: #6B7280; font-size: 15px; margin: 8px 0;">Streetwise Self Defense</p>
    <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin-top: 12px;">
      Empowering women and vulnerable populations through practical self-defense training<br>
      Walnut Creek, CA | (925) 532-9953
    </p>
    <p style="margin-top: 20px; font-size: 12px; color: #9CA3AF;">
      <a href="https://streetwiseselfdefense.com/api/unsubscribe?id=${booking.id}" style="color: #6B7280; text-decoration: underline;">Unsubscribe from reminder emails</a>
    </p>
  </div>
</body>
</html>
`;

            // Send email
            try {
              const { Resend } = await import('resend');
              const resend = new Resend(RESEND_API_KEY);

              const { data, error } = await resend.emails.send({
                from: FROM_EMAIL,
                to: contactEmail,
                cc: 'reminders@streetwiseselfdefense.com',
                subject: `Tomorrow: Your ${className} Class`,
                html: emailHTML,
                headers: {
                  'List-Unsubscribe': `<https://streetwiseselfdefense.com/api/unsubscribe?id=${booking.id}>`,
                  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
                }
              });

              if (error) {
                console.error(`[MORNING-EMAIL] Resend error for booking ${booking.id}:`, error);
                throw error;
              }

              console.log(`[MORNING-EMAIL] ✅ Sent email to ${contactEmail}`);

              // Store tracking info
              if (data && data.id) {
                await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking.id}`, {
                  method: 'PATCH',
                  headers: {
                    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    fields: {
                      'Reminder Email ID': data.id,
                      'Reminder Email Status': 'Sent',
                      'Reminder Email Sent At': new Date().toISOString()
                    }
                  })
                });
              }

              totalEmailsSent++;
              results.push({
                scheduleId: schedule.id,
                recipientType: 'Student',
                bookingId: booking.id,
                email: contactEmail,
                success: true
              });

              await sleep(600); // Rate limiting
              
            } catch (emailErr) {
              console.error(`[MORNING-EMAIL] ❌ Failed for booking ${booking.id}:`, emailErr);
              results.push({
                scheduleId: schedule.id,
                recipientType: 'Student',
                bookingId: booking.id,
                email: contactEmail,
                success: false,
                error: emailErr.message
              });
            }

          } catch (bookingError) {
            console.error(`[MORNING-EMAIL] ❌ Error processing booking ${booking.id}:`, bookingError);
          }
        }

      } catch (scheduleError) {
        console.error(`[MORNING-EMAIL] ❌ Error processing schedule ${schedule.id}:`, scheduleError);
      }
    }

    console.log(`[MORNING-EMAIL] ✅ Complete. Student emails: ${totalEmailsSent}, TA emails: ${totalTAEmailsSent}`);

    return res.json({
      success: true,
      message: '9 AM email reminders sent',
      classesFound: schedules.length,
      emailsSent: totalEmailsSent,
      taEmailsSent: totalTAEmailsSent,
      results
    });

  } catch (error) {
    console.error('[MORNING-EMAIL] ❌ Fatal error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
