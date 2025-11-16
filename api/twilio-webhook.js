// /api/twilio-webhook.js
// ✅ ENHANCED: Handles both incoming SMS replies AND delivery status updates
// Incoming messages are logged to Airtable and optionally forwarded to your phone

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
    const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
    const FORWARD_SMS_TO = process.env.FORWARD_SMS_TO; // Your personal phone number (optional)

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.error('[TWILIO-WEBHOOK] Airtable not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Optionally verify webhook signature (recommended for production)
    // Uncomment this in production:
    // const twilio = require('twilio');
    // const signature = req.headers['x-twilio-signature'];
    // const url = `https://${req.headers.host}${req.url}`;
    // if (!twilio.validateRequest(TWILIO_AUTH_TOKEN, signature, url, req.body)) {
    //   return res.status(403).json({ error: 'Invalid signature' });
    // }

    // Extract data from Twilio webhook
    const {
      MessageSid,
      MessageStatus,
      To,
      From,
      Body,
      ErrorCode,
      ErrorMessage,
      SmsStatus,
      SmsSid
    } = req.body;

    // Determine if this is a STATUS CALLBACK or an INCOMING MESSAGE
    const isStatusCallback = MessageStatus || SmsStatus;
    const isIncomingMessage = Body && !isStatusCallback;

    console.log(`[TWILIO-WEBHOOK] Received ${isIncomingMessage ? 'INCOMING MESSAGE' : 'STATUS UPDATE'}`);

    // ========================================
    // HANDLE INCOMING SMS REPLIES
    // ========================================
    if (isIncomingMessage) {
      console.log(`[TWILIO-WEBHOOK] 📱 Incoming message from: ${From}`);
      console.log(`[TWILIO-WEBHOOK] Message: ${Body}`);

      // Clean phone number for matching (remove +1)
      const cleanFrom = From.replace(/\D/g, '').replace(/^1/, '');

      // Try to find the booking by phone number
      let booking = null;
      try {
        // Search for booking with this phone number
        const bookingsResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings?filterByFormula=SUBSTITUTE(SUBSTITUTE(SUBSTITUTE({Contact Phone}, '-', ''), '(', ''), ')', '')='${cleanFrom}'`,
          {
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`
            }
          }
        );

        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          if (bookingsData.records && bookingsData.records.length > 0) {
            // Get most recent booking
            booking = bookingsData.records[0];
            console.log(`[TWILIO-WEBHOOK] Found booking ${booking.id} for phone ${From}`);
          }
        }
      } catch (err) {
        console.error('[TWILIO-WEBHOOK] Error finding booking:', err);
      }

      // Log incoming message to Airtable (create SMS Replies table or use notes)
      try {
        // Option 1: Add to booking notes (if booking found)
        if (booking) {
          const currentNotes = booking.fields['Validation Notes'] || '';
          const timestamp = new Date().toLocaleString('en-US', { 
            timeZone: 'America/Los_Angeles',
            dateStyle: 'short',
            timeStyle: 'short'
          });
          const newNote = `[${timestamp}] SMS Reply: "${Body}"`;
          
          await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking.id}`,
            {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                fields: {
                  'Validation Notes': currentNotes ? `${currentNotes}\n${newNote}` : newNote
                }
              })
            }
          );
          
          console.log(`[TWILIO-WEBHOOK] ✅ Logged SMS reply to booking ${booking.id}`);
        }

        // Option 2: Also log to a separate SMS Replies table (if you create one)
        // This is better for keeping a complete conversation history
        /*
        await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/SMS%20Replies`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fields: {
                'Phone Number': From,
                'Message': Body,
                'Booking': booking ? [booking.id] : [],
                'Received At': new Date().toISOString(),
                'Message SID': MessageSid || SmsSid
              }
            })
          }
        );
        */

      } catch (err) {
        console.error('[TWILIO-WEBHOOK] Error logging message:', err);
      }

      // ========================================
      // FORWARD SMS TO YOUR PERSONAL PHONE (OPTIONAL)
      // ========================================
      if (FORWARD_SMS_TO && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
        try {
          const twilio = await import('twilio');
          const client = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

          const contactName = booking?.fields['Contact First Name'] 
            ? `${booking.fields['Contact First Name']} ${booking.fields['Contact Last Name'] || ''}`
            : 'Unknown';
          
          const className = booking?.fields['Class Schedule'] 
            ? `(${booking.fields['Class Schedule']})` 
            : '';

          // Forward with context
          const forwardMessage = `📱 SMS Reply from ${contactName} ${className}\nPhone: ${From}\n\n"${Body}"`;

          await client.messages.create({
            body: forwardMessage,
            from: TWILIO_PHONE_NUMBER,
            to: FORWARD_SMS_TO
          });

          console.log(`[TWILIO-WEBHOOK] ✅ Forwarded SMS to ${FORWARD_SMS_TO}`);
        } catch (err) {
          console.error('[TWILIO-WEBHOOK] ❌ Error forwarding SMS:', err);
        }
      }

      // Send auto-reply (optional)
      // You can customize this to send different replies based on message content
      /*
      if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
        try {
          const twilio = await import('twilio');
          const client = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

          await client.messages.create({
            body: "Thanks for your message! Jay will get back to you shortly. For urgent matters, call (925) 532-9953.",
            from: TWILIO_PHONE_NUMBER,
            to: From
          });

          console.log(`[TWILIO-WEBHOOK] ✅ Sent auto-reply to ${From}`);
        } catch (err) {
          console.error('[TWILIO-WEBHOOK] ❌ Error sending auto-reply:', err);
        }
      }
      */

      return res.status(200).json({
        success: true,
        message: 'Incoming SMS processed',
        from: From,
        logged: !!booking
      });
    }

    // ========================================
    // HANDLE DELIVERY STATUS UPDATES
    // ========================================
    const messageSid = MessageSid || SmsSid;
    const status = MessageStatus || SmsStatus;

    console.log(`[TWILIO-WEBHOOK] 📊 Status update for SID: ${messageSid}`);
    console.log(`[TWILIO-WEBHOOK] Status: ${status}`);
    console.log(`[TWILIO-WEBHOOK] To: ${To}, From: ${From}`);
    
    if (ErrorCode) {
      console.error(`[TWILIO-WEBHOOK] ❌ Error ${ErrorCode}: ${ErrorMessage}`);
    }

    // Find the booking with this SMS ID
    const bookingsResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings?filterByFormula=OR({Reminder SMS ID}='${messageSid}',{Confirmation SMS ID}='${messageSid}',{Followup SMS ID}='${messageSid}')`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`
        }
      }
    );

    if (!bookingsResponse.ok) {
      console.error(`[TWILIO-WEBHOOK] Failed to fetch booking: ${bookingsResponse.status}`);
      return res.status(500).json({ error: 'Failed to fetch booking' });
    }

    const bookingsData = await bookingsResponse.json();
    const bookings = bookingsData.records || [];

    if (bookings.length === 0) {
      console.log(`[TWILIO-WEBHOOK] ℹ️ No booking found for SMS ID: ${messageSid}`);
      return res.status(200).json({ message: 'No matching booking found' });
    }

    const booking = bookings[0];
    
    // Determine which SMS type this is (confirmation, reminder, or followup)
    const isConfirmationSms = booking.fields['Confirmation SMS ID'] === messageSid;
    const isReminderSms = booking.fields['Reminder SMS ID'] === messageSid;
    const isFollowupSms = booking.fields['Followup SMS ID'] === messageSid;

    const statusField = isConfirmationSms 
      ? 'Confirmation SMS Status'
      : isReminderSms 
      ? 'Reminder SMS Status'
      : 'Followup SMS Status';

    // Map Twilio statuses to our simplified statuses
    const statusMap = {
      'queued': 'Sent',
      'sending': 'Sent',
      'sent': 'Sent',
      'delivered': 'Delivered',
      'undelivered': 'Undelivered',
      'failed': 'Failed'
    };

    const mappedStatus = statusMap[status?.toLowerCase()] || 'Unknown';

    // Prepare fields to update
    const fieldsToUpdate = {
      [statusField]: mappedStatus
    };

    // Add delivered timestamp if delivered
    if (status?.toLowerCase() === 'delivered') {
      const deliveredField = isConfirmationSms
        ? 'Confirmation SMS Delivered At'
        : isReminderSms
        ? 'Reminder SMS Delivered At'
        : 'Followup SMS Delivered At';
      
      fieldsToUpdate[deliveredField] = new Date().toISOString();
    }

    // Update booking record
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking.id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: fieldsToUpdate })
      }
    );

    if (!updateResponse.ok) {
      console.error(`[TWILIO-WEBHOOK] Failed to update booking: ${updateResponse.status}`);
      const errorText = await updateResponse.text();
      console.error(`[TWILIO-WEBHOOK] Error details: ${errorText}`);
      return res.status(500).json({ error: 'Failed to update booking' });
    }

    console.log(`[TWILIO-WEBHOOK] ✅ Updated booking ${booking.id}: ${statusField} = ${mappedStatus}`);

    return res.status(200).json({
      success: true,
      message: 'SMS status updated successfully',
      bookingId: booking.id,
      status: mappedStatus
    });

  } catch (error) {
    console.error('[TWILIO-WEBHOOK] ❌ Error processing webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
