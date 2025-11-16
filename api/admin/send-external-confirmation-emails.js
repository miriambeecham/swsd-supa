// /api/admin/send-external-confirmation-emails.js
// Sends confirmation emails to CSV-uploaded external registrants
// Similar to verify-payment.js confirmation email but without payment details

import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!JWT_SECRET || !AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !RESEND_API_KEY) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify authentication
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    const token = cookies?.auth_token;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get bookingIds from request
    const { bookingIds } = req.body;
    
    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({ error: 'Invalid bookingIds' });
    }

    console.log(`[EXTERNAL-EMAIL] Processing ${bookingIds.length} bookings`);

    const { Resend } = await import('resend');
    const { default: ical } = await import('ical-generator');
    const resend = new Resend(RESEND_API_KEY);
    const FROM_EMAIL = `"Streetwise Self Defense" <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each booking
    for (const bookingId of bookingIds) {
      try {
        // Fetch booking data
        const bookingResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`,
          {
            headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
          }
        );

        if (!bookingResponse.ok) {
          throw new Error('Booking not found');
        }

        const booking = await bookingResponse.json();
        const contactEmail = booking.fields['Contact Email'];

        if (!contactEmail) {
          throw new Error('No contact email found');
        }

        // Check if confirmation email already sent
        if (booking.fields['Confirmation Email Status'] === 'Sent' || 
            booking.fields['Confirmation Email Status'] === 'Delivered') {
          console.log(`[EXTERNAL-EMAIL] Skipping ${bookingId} - already sent`);
          results.push({
            bookingId,
            success: true,
            skipped: true,
            reason: 'Already sent'
          });
          successCount++;
          continue;
        }

        // Fetch schedule and class data
        const scheduleId = booking.fields['Class Schedule']?.[0];
        let scheduleData = null;
        let classData = null;

        if (scheduleId) {
          const scheduleResponse = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${scheduleId}`,
            {
              headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
            }
          );
          if (scheduleResponse.ok) {
            scheduleData = await scheduleResponse.json();
            
            const classId = scheduleData.fields['Class']?.[0];
            if (classId) {
              const classResponse = await fetch(
                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`,
                {
                  headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
                }
              );
              if (classResponse.ok) {
                classData = await classResponse.json();
              }
            }
          }
        }

        // Build class prep URL
        const host = req.headers.host || 'www.streetwiseselfdefense.com';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const classPrepUrl = scheduleId 
          ? `${protocol}://${host}/class-prep/${scheduleId}`
          : null;

        // Helper functions for time formatting
        const convertToISO = (dateStr, timeStr) => {
          if (!dateStr || !timeStr) return new Date().toISOString();
          
          if (timeStr.includes('T')) {
            return new Date(timeStr).toISOString();
          }
          
          const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (!match) return new Date(dateStr + 'T12:00:00').toISOString();
          
          let hours = parseInt(match[1]);
          const mins = parseInt(match[2]);
          const meridiem = match[3].toUpperCase();
          
          if (meridiem === 'PM' && hours !== 12) hours += 12;
          if (meridiem === 'AM' && hours === 12) hours = 0;
          
          return new Date(`${dateStr}T${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:00-08:00`).toISOString();
        };
        
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
        
        const startISO = convertToISO(scheduleData?.fields?.Date, scheduleData?.fields?.['Start Time New']);
        const endISO = convertToISO(scheduleData?.fields?.Date, scheduleData?.fields?.['End Time New']);
        
        const displayStartTime = formatTimeForDisplay(scheduleData?.fields?.['Start Time New']);
        const displayEndTime = formatTimeForDisplay(scheduleData?.fields?.['End Time New']);
        
        const gcalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(classData?.fields?.['Class Name'] || 'Self Defense Class')}&dates=${new Date(startISO).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}/${new Date(endISO).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}&details=${encodeURIComponent('Self defense class registration confirmed')}&location=${encodeURIComponent(scheduleData?.fields?.Location || 'Walnut Creek, CA')}&ctz=America/Los_Angeles`;
        
        // Create iCal attachment
        const cal = ical({ name: 'Self Defense Class', timezone: 'America/Los_Angeles' });
        cal.createEvent({
          start: new Date(startISO),
          end: new Date(endISO),
          summary: classData?.fields?.['Class Name'] || 'Self Defense Class',
          location: scheduleData?.fields?.Location || 'Walnut Creek, CA',
          description: 'Self defense class confirmed'
        });
        
        const formattedDate = scheduleData?.fields?.Date 
          ? new Date(scheduleData.fields.Date + 'T12:00:00').toLocaleDateString('en-US', { 
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
            })
          : 'TBD';

        // Build email HTML (WITHOUT payment details)
        const emailHTML = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://www.streetwiseselfdefense.com/swsd-logo-official.png" alt="Streetwise Self Defense" style="max-width: 300px;">
  </div>
  
  <h1 style="color: #1E293B; text-align: center;">Registration Confirmed!</h1>
  
  <p>Dear ${booking.fields['Contact First Name'] || 'Valued Participant'},</p>
  
  <p>Congratulations on taking this empowering step! Your registration for our self defense class has been confirmed.</p>
  
  <p>You're not just learning techniques – you're building strength, awareness, and the confidence that comes with knowing you can protect yourself.</p>
  
  <div style="background: #F0FDFC; border: 1px solid #14b8a6; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #1E293B; margin-top: 0;">Your Class Details</h2>
    <p><strong>Class:</strong> ${classData?.fields?.['Class Name'] || 'Self Defense Class'}</p>
    <p><strong>Date:</strong> ${formattedDate}</p>
    <p><strong>Time:</strong> ${displayStartTime} - ${displayEndTime}</p>
    <p><strong>Location:</strong> ${scheduleData?.fields?.Location || 'TBD'}</p>
    <p><strong>Participants:</strong> ${booking.fields['Number of Participants'] || 1}</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${gcalURL}" style="display: inline-block; background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Add to Google Calendar</a>
  </div>
  
  ${classPrepUrl ? `
  <div style="background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h3 style="color: #92400E; margin-top: 0;">📋 Important: Complete Your Waiver</h3>
    <p style="color: #78350F;">Before class, please complete your liability waiver and provide emergency contact information:</p>
    <div style="text-align: center; margin-top: 15px;">
      <a href="${classPrepUrl}" style="display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Complete Waiver & Class Prep</a>
    </div>
  </div>
  ` : ''}
  
  <h3 style="color: #1E293B;">What to Bring:</h3>
  <ul style="color: #4B5563; line-height: 1.8;">
    <li>Comfortable clothing you can move freely in</li>
    <li>Water bottle to stay hydrated</li>
    <li>Positive attitude and willingness to learn</li>
  </ul>
  
  <p style="color: #4B5563;">We're thrilled to have you join us. This class will equip you with practical skills and the mindset to handle challenging situations with confidence.</p>
  
  <p style="color: #4B5563;">If you have any questions before class, don't hesitate to reach out!</p>
  
  <p>See you in class!</p>
  <p><strong>The Streetwise Self Defense Team</strong></p>
  
  <hr style="border: 1px solid #E5E7EB; margin: 30px 0;">
  
  <p style="text-align: center; font-size: 14px; color: #6B7280;">
    Empowering women and vulnerable populations through practical self defense training.<br>
    Streetwise Self Defense | Walnut Creek, CA<br>
    © 2025 Streetwise Self Defense. All rights reserved.
  </p>
</body>
</html>
`;

        // Send email via Resend
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: contactEmail,
          reply_to: 'jay@streetwiseselfdefense.com',
          subject: 'Your Self Defense Class Registration is Confirmed!',
          html: emailHTML,
          attachments: [{ filename: 'class-event.ics', content: cal.toString() }]
        });

        if (error) {
          throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
        }

        console.log(`[EXTERNAL-EMAIL] Sent to ${contactEmail}, Resend ID: ${data.id}`);

        // Update booking with email tracking data
        if (data && data.id) {
          await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`,
            {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                fields: {
                  'Confirmation Email ID': data.id,
                  'Confirmation Email Status': 'Sent',
                  'Confirmation Email Sent At': new Date().toISOString()
                }
              })
            }
          );
          
          console.log(`[EXTERNAL-EMAIL] Updated booking ${bookingId} with email tracking data`);
        }

        successCount++;
        results.push({
          bookingId,
          success: true,
          email: contactEmail,
          resendId: data.id
        });

      } catch (error) {
        errorCount++;
        console.error(`[EXTERNAL-EMAIL] Error processing booking ${bookingId}:`, error);
        results.push({
          bookingId,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`[EXTERNAL-EMAIL] Complete. Success: ${successCount}, Errors: ${errorCount}`);

    return res.json({
      success: true,
      totalBookings: bookingIds.length,
      successCount,
      errorCount,
      results
    });

  } catch (error) {
    console.error('[EXTERNAL-EMAIL] Fatal error:', error);
    return res.status(500).json({ error: error.message });
  }
}
