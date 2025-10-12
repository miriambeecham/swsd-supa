// /api/verify-payment.js
import { render } from '@react-email/render';
import RegistrationConfirmationEmail from '../src/emails/RegistrationConfirmationEmail.js';

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

      // Get class schedule details
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
          
          // Helper: Format time for display
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
          
          // Prepare times
          const startISO = convertToISO(scheduleData?.fields?.Date, scheduleData?.fields?.['Start Time New']);
          const endISO = convertToISO(scheduleData?.fields?.Date, scheduleData?.fields?.['End Time New']);
          const displayStartTime = formatTimeForDisplay(scheduleData?.fields?.['Start Time New']);
          const displayEndTime = formatTimeForDisplay(scheduleData?.fields?.['End Time New']);
          
          // Format date for email
          const formattedDate = scheduleData?.fields?.Date 
            ? new Date(scheduleData.fields.Date + 'T12:00:00').toLocaleDateString('en-US', { 
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
              })
            : 'TBD';
          
          // Google Calendar URL
          const gcalURL = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(classData?.fields?.['Class Name'] || 'Self Defense Class')}&dates=${new Date(startISO).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}/${new Date(endISO).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}&details=${encodeURIComponent('Self defense class registration confirmed')}&location=${encodeURIComponent(scheduleData?.fields?.Location || 'Walnut Creek, CA')}&ctz=America/Los_Angeles`;
          
          // Class prep URL (dynamic page for this specific class)
          const classPrepUrl = scheduleId 
            ? `https://www.streetwiseselfdefense.com/class-prep/${scheduleId}`
            : null;
          
          // iCal file
          const cal = ical({ name: 'Self Defense Class', timezone: 'America/Los_Angeles' });
          cal.createEvent({
            start: new Date(startISO),
            end: new Date(endISO),
            summary: classData?.fields?.['Class Name'] || 'Self Defense Class',
            location: scheduleData?.fields?.Location || 'Walnut Creek, CA',
            description: 'Self defense class confirmed'
          });
          
          // Render React Email template
          const emailHTML = render(
            RegistrationConfirmationEmail({
              customerName: booking.fields['Contact First Name'] || 'Valued Customer',
              className: classData?.fields?.['Class Name'] || 'Self Defense Class',
              classDate: formattedDate,
              classTime: `${displayStartTime} - ${displayEndTime}`,
              location: scheduleData?.fields?.Location || 'Walnut Creek, CA',
              registeredParticipants: String(booking.fields['Number of Participants'] || 1),
              totalAmount: String(booking.fields['Total Amount'] || 0),
              classPrepUrl: classPrepUrl,
              googleCalendarUrl: gcalURL
            })
          );
          
          await resend.emails.send({
            from: FROM_EMAIL,
            to: booking.fields['Contact Email'],
            cc: 'confirmations@streetwiseselfdefense.com', 
            subject: 'Your Self Defense Class Registration is Confirmed!',
            html: emailHTML,
            attachments: [{ filename: 'class-event.ics', content: cal.toString() }]
          });
          
          console.log('[EMAIL] Sent to:', booking.fields['Contact Email']);
        }
      } catch (emailErr) {
        console.error('[EMAIL] Failed:', emailErr);
        // Don't fail the request if email fails
      }

      // Return booking data
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
      // Payment failed or pending - cancel the booking
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