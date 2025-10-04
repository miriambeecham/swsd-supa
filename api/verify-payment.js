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
          
          // Get class details too
          const classId = scheduleData.fields?.Class?.[0];
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
      try {
        const { Resend } = await import('resend');
        const { default: ical } = await import('ical-generator');
        
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        
        if (RESEND_API_KEY && booking.fields['Contact Email']) {
          const resend = new Resend(RESEND_API_KEY);
          
          // Helper: Convert time to ISO
          const convertToISO = (dateStr, timeStr) => {
            if (!dateStr || !timeStr) return new Date().toISOString();
            const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (!match) return new Date(dateStr + 'T12:00:00').toISOString();
            
            let hours = parseInt(match[1]);
            const mins = parseInt(match[2]);
            const meridiem = match[3].toUpperCase();
            
            if (meridiem === 'PM' && hours !== 12) hours += 12;
            if (meridiem === 'AM' && hours === 12) hours = 0;
            
            return new Date(`${dateStr}T${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:00-08:00`).toISOString();
          };
          
          const startISO = convertToISO(scheduleData?.fields?.Date, scheduleData?.fields?.['Start Time']);
          const endISO = convertToISO(scheduleData?.fields?.Date, scheduleData?.fields?.['End Time']);
          
          // Google Calendar URL
          const gcalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(classData?.fields?.['Class Name'] || 'Self-Defense Class')}&dates=${new Date(startISO).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}/${new Date(endISO).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}&details=${encodeURIComponent('Self-defense class registration confirmed')}&location=${encodeURIComponent(scheduleData?.fields?.Location || 'Walnut Creek, CA')}&ctz=America/Los_Angeles`;
          
          // iCal file
          const cal = ical({ name: 'Self Defense Class', timezone: 'America/Los_Angeles' });
          cal.createEvent({
            start: new Date(startISO),
            end: new Date(endISO),
            summary: classData?.fields?.['Class Name'] || 'Self-Defense Class',
            location: scheduleData?.fields?.Location || 'Walnut Creek, CA',
            description: 'Self-defense class confirmed'
          });
          
          // Format date for email
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
  
  <p>Congratulations on taking this empowering step! Your registration for our self-defense class has been confirmed.</p>
  
  <div style="background: #F0FDFC; border: 1px solid #14b8a6; border-radius: 8px; padding: 20px; margin: 20px 0;">
    <h2 style="color: #1E293B; margin-top: 0;">Your Class Details</h2>
    <p><strong>Class:</strong> ${classData?.fields?.['Class Name'] || 'Self-Defense Class'}</p>
    <p><strong>Date:</strong> ${formattedDate}</p>
    <p><strong>Time:</strong> ${scheduleData?.fields?.['Start Time']} - ${scheduleData?.fields?.['End Time']}</p>
    <p><strong>Location:</strong> ${scheduleData?.fields?.Location || 'Walnut Creek, CA'}</p>
    <p><strong>Participants:</strong> ${booking.fields['Number of Participants'] || 1}</p>
    <p><strong>Total Paid:</strong> $${booking.fields['Total Amount'] || 0}</p>
  </div>
  
  <div style="margin: 30px 0;">
    <h2 style="color: #1E293B;">Prepare for Success</h2>
    <p style="text-align: center;">
      <a href="${gcalURL}" style="display: inline-block; background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px;">Add to Google Calendar</a>
    </p>
    ${scheduleData?.fields?.['Waiver URL'] ? `
    <p style="text-align: center;">
      <a href="${scheduleData.fields['Waiver URL']}" style="display: inline-block; border: 2px solid #14b8a6; color: #14b8a6; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px;">Complete Waiver Form</a>
    </p>
    <p style="font-size: 14px; color: #6B7280; text-align: center;"><strong>Important:</strong> Each participant must complete the waiver form before attending class.</p>
    ` : ''}
  </div>
  
  <h2 style="color: #1E293B;">What to Bring</h2>
  <ul style="color: #1E293B;">
    <li>Comfortable athletic clothing (yoga pants, t-shirt, etc.)</li>
    <li>Water bottle to stay hydrated</li>
    <li>Athletic shoes (no sandals or flip-flops)</li>
    <li>Open mind and willingness to learn!</li>
  </ul>
  
  <p>Questions? Visit <a href="https://www.streetwiseselfdefense.com" style="color: #14b8a6;">streetwiseselfdefense.com</a> or reply to this email.</p>
  
  <p>We're proud of you for taking this important step toward empowerment. See you in class!</p>
  <p><strong>The Streetwise Self Defense Team</strong></p>
  
  <hr style="border: 1px solid #E5E7EB; margin: 30px 0;">
  
  <p style="text-align: center; font-size: 14px; color: #6B7280;">
    Empowering women and vulnerable populations through practical self-defense training.<br>
    Streetwise Self Defense | Walnut Creek, CA<br>
    © 2025 Streetwise Self Defense. All rights reserved.
  </p>
</body>
</html>
`;
          
          await resend.emails.send({
            from: FROM_EMAIL,
            to: booking.fields['Contact Email'],
            subject: 'Your Self-Defense Class Registration is Confirmed!',
            html: emailHTML,
            attachments: [{ filename: 'class-event.ics', content: cal.toString() }]
          });
          
          console.log('[EMAIL] Sent to:', booking.fields['Contact Email']);
        }
      } catch (emailErr) {
        console.error('[EMAIL] Failed:', emailErr);
        // Don't fail the request if email fails
      }

      // ====== ZOHO INTEGRATION ======
      try {
        console.log('[VERIFY-PAYMENT] Waiting 30 seconds for participants to be created in Airtable...');
        await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
        
        console.log('[VERIFY-PAYMENT] About to call Zoho integration...');

        const classPreparationUrl = `https://streetwiseselfdefense.com/class-prep/${booking_id}`;

        // Import and call the Zoho function directly instead of using fetch
        const { default: zohoCreateContact } = await import('./zoho-create-contact.js');
        
        // Create a mock request/response for the function
        const mockReq = {
          method: 'POST',
          body: {
            contactInfo: {
              firstName: booking.fields['Contact First Name'],
              lastName: booking.fields['Contact Last Name'],
              email: booking.fields['Contact Email'],
              phone: booking.fields['Contact Phone'] || ''
            },
            classInfo: {
              className: classData?.fields?.['Class Name'] || 'Self-Defense Class',
              date: scheduleData?.fields?.Date || '',
              participantCount: booking.fields['Number of Participants'] || 1
            },
            prepPageUrl: classPreparationUrl,
            bookingId: booking_id,
            classType: classData?.fields?.['Type']?.toLowerCase().includes('mother') ? 'mother-daughter' : 'adult'
          }
        };

        const mockRes = {
          status: (code) => mockRes,
          json: (data) => {
            console.log('[VERIFY-PAYMENT] Zoho function returned:', JSON.stringify(data));
            return data;
          }
        };

        await zohoCreateContact(mockReq, mockRes);
        console.log('[VERIFY-PAYMENT] Zoho sync completed');
        
      } catch (zohoErr) {
        console.error('[VERIFY-PAYMENT] Zoho sync failed with error:', zohoErr.message);
        console.error('[VERIFY-PAYMENT] Full error:', zohoErr);
      }
      // ====== END ZOHO INTEGRATION ======

      return res.json({
        success: true,
        booking: {
          className: classData?.fields?.['Class Name'] || classData?.fields?.['Title'] || 'Self-Defense Class',
          classDate: scheduleData?.fields?.Date,
          startTime: scheduleData?.fields?.['Start Time'],
          endTime: scheduleData?.fields?.['End Time'],
          location: scheduleData?.fields?.Location || classData?.fields?.Location,
          participantCount: booking.fields['Number of Participants'],
          totalAmount: booking.fields['Total Amount']
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
