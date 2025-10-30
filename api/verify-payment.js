// /api/verify-payment.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: 'Server configuration missing' });
    }

    const { session_id, booking_id } = req.body;

    if (!session_id || !booking_id) {
      return res.status(400).json({ error: 'Missing session_id or booking_id' });
    }

    // Initialize Stripe
    const stripe = (await import('stripe')).default(STRIPE_SECRET_KEY);

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      // Payment successful - update booking status
      const updateResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking_id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            'Status': 'Confirmed',
            'Payment Status': 'Completed',
            'Stripe Payment Intent ID': session.id,
            'Payment Date': new Date().toLocaleString('en-US', { 
              timeZone: 'America/Los_Angeles',
              year: 'numeric',
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(/(\d+)\/(\d+)\/(\d+),\s*(.+)/, '$3-$1-$2 $4')
          }
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Airtable update failed:', {
          status: updateResponse.status,
          statusText: updateResponse.statusText,
          error: errorText,
          bookingId: booking_id
        });
        return res.status(500).json({ 
          error: 'Failed to confirm booking',
          details: `HTTP ${updateResponse.status}: ${errorText}`
        });
      }

      // Get booking details for response
      const bookingResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking_id}`, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });

      if (!bookingResponse.ok) {
        return res.status(500).json({ error: 'Failed to fetch booking details' });
      }

      const booking = await bookingResponse.json();

      // Get class schedule details for calendar
      const scheduleId = booking.fields['Class Schedule']?.[0];
      let scheduleData = null;
      let classData = null;

      if (scheduleId) {
        const scheduleResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${scheduleId}`, {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        });
        if (scheduleResponse.ok) {
          scheduleData = await scheduleResponse.json();
          
          const classId = scheduleData.fields['Class']?.[0];
          if (classId) {
            const classResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`, {
              headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
            });
            if (classResponse.ok) {
              classData = await classResponse.json();
            }
          }
        }
      }

      // ====== SEND CONFIRMATION EMAIL ======
     // Class prep URL (define BEFORE email block so it's available in return statement)
     // Class prep URL - dynamic based on environment
const host = req.headers.host || 'www.streetwiseselfdefense.com';
const protocol = host.includes('localhost') ? 'http' : 'https';
const classPrepUrl = scheduleId 
  ? `${protocol}://${host}/class-prep/${scheduleId}`
  : null;
     
// In /api/verify-payment.js
// Find the email sending try/catch block and replace it with this:

try {
  const { Resend } = await import('resend');
  const { default: ical } = await import('ical-generator');
  
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = `"Streetwise Self Defense" <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;
  
  if (RESEND_API_KEY && booking.fields['Contact Email']) {
    const resend = new Resend(RESEND_API_KEY);
    
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
    
    const emailHTML = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <img src="https://www.streetwiseselfdefense.com/swsd-logo-official.png" alt="Streetwise Self Defense" style="max-width: 300px;">
  </div>
  
  <h1 style="color: #1E293B; text-align: center;">Registration Confirmed!</h1>
  
  <p>Dear ${booking.fields['Contact First Name'] || 'Valued Customer'},</p>
  
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
    
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.fields['Contact Email'],
      cc: 'confirmations@streetwiseselfdefense.com', 
      subject: 'Your Self Defense Class Registration is Confirmed!',
      html: emailHTML,
      attachments: [{ filename: 'class-event.ics', content: cal.toString() }]
    });
    
    if (error) {
      console.error('[EMAIL] Resend error:', error);
      throw error;
    }
    
    console.log('[EMAIL] Sent to:', booking.fields['Contact Email']);
    console.log('[EMAIL] Resend ID:', data.id);
    
    if (data && data.id) {
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking_id}`, {
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
      });
      
      console.log('[EMAIL] Stored email tracking data in Airtable');
    }
  }
} catch (emailErr) {
  console.error('[EMAIL] Failed:', emailErr);
}

      // Return booking data with class prep URL
      return res.json({
        success: true,
        booking: {
          className: classData?.fields?.['Class Name'] || 'Self Defense Class',
          classDate: scheduleData?.fields?.Date || null,
          startTime: scheduleData?.fields?.['Start Time New'] || null,
          endTime: scheduleData?.fields?.['End Time New'] || null,
          location: scheduleData?.fields?.Location || null,
          participantCount: booking.fields['Number of Participants'] || 1,
          totalAmount: booking.fields['Total Amount'] || 0,
          classPrepUrl: classPrepUrl
        }
      });

    } else {
      // Payment failed or pending - cancel the booking to release seats
      const cancelResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking_id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            'Status': 'Cancelled',
            'Payment Status': 'Failed'
          }
        })
      });

      if (!cancelResponse.ok) {
        console.error('Failed to cancel booking:', await cancelResponse.text());
      }

      return res.status(400).json({ 
        success: false, 
        error: 'Payment was not completed. Your seats have been released.' 
      });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
}
