// /api/twilio-webhook.js
// ✅ UPDATED: Added Preclass SMS status tracking, removed Followup SMS
// Handles both incoming SMS replies AND delivery status updates

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

      // ========================================
      // AUTO-HANDLE STOP/UNSUBSCRIBE REQUESTS
      // ========================================
      const stopKeywords = ['STOP', 'UNSUBSCRIBE', 'END', 'CANCEL', 'QUIT', 'STOPALL'];
      if (stopKeywords.includes(Body.trim().toUpperCase())) {
        console.log(`[TWILIO-WEBHOOK] 🛑 STOP request received from ${From}`);

        // Get today's date for filtering (only update current/future class bookings)
        const today = new Date().toISOString().split('T')[0];

        // Find ALL bookings for this phone number with class date >= today
        let bookingsToUpdate = [];
        try {
          const bookingsResponse = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings?filterByFormula=AND(SUBSTITUTE(SUBSTITUTE(SUBSTITUTE({Contact Phone}, '-', ''), '(', ''), ')', '')='${cleanFrom}', NOT({Status}='Cancelled'))`,
            {
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`
              }
            }
          );

          if (bookingsResponse.ok) {
            const bookingsData = await bookingsResponse.json();
            const allBookings = bookingsData.records || [];
            
            for (const booking of allBookings) {
              const classScheduleId = booking.fields['Class Schedule']?.[0];
              if (!classScheduleId) continue;

              try {
                const scheduleResponse = await fetch(
                  `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${classScheduleId}`,
                  {
                    headers: {
                      Authorization: `Bearer ${AIRTABLE_API_KEY}`
                    }
                  }
                );

                if (scheduleResponse.ok) {
                  const scheduleData = await scheduleResponse.json();
                  const classDate = scheduleData.fields?.Date;
                  
                  if (classDate && classDate >= today) {
                    bookingsToUpdate.push(booking);
                    console.log(`[TWILIO-WEBHOOK] Will opt-out booking ${booking.id} (class date: ${classDate})`);
                  } else {
                    console.log(`[TWILIO-WEBHOOK] Skipping booking ${booking.id} (class date: ${classDate} is in the past)`);
                  }
                }
              } catch (scheduleErr) {
                console.error(`[TWILIO-WEBHOOK] Error fetching schedule for booking ${booking.id}:`, scheduleErr);
              }
            }

            console.log(`[TWILIO-WEBHOOK] Found ${bookingsToUpdate.length} current/future booking(s) to opt out`);
          }
        } catch (err) {
          console.error('[TWILIO-WEBHOOK] Error finding bookings for STOP request:', err);
        }

        // Update all matching bookings with SMS Opted Out Date
        const optOutTimestamp = new Date().toISOString();
        let updatedCount = 0;

        for (const booking of bookingsToUpdate) {
          try {
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
                    'SMS Opted Out Date': optOutTimestamp
                  }
                })
              }
            );

            console.log(`[TWILIO-WEBHOOK] ✅ Opted out booking ${booking.id} from SMS`);
            updatedCount++;
          } catch (err) {
            console.error(`[TWILIO-WEBHOOK] ❌ Error updating booking ${booking.id}:`, err);
          }
        }

        // Send confirmation reply
        if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
          try {
            const twilio = await import('twilio');
            const client = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

            await client.messages.create({
              body: "You've been unsubscribed from SMS reminders. You'll still receive email notifications. To resubscribe, book a new class or contact us at (925) 532-9953.",
              from: TWILIO_PHONE_NUMBER,
              to: From
            });

            console.log(`[TWILIO-WEBHOOK] ✅ Sent unsubscribe confirmation to ${From}`);
          } catch (err) {
            console.error('[TWILIO-WEBHOOK] ❌ Error sending unsubscribe confirmation:', err);
          }
        }

        return res.status(200).json({
          success: true,
          message: 'STOP request processed',
          bookingsUpdated: updatedCount
        });
      }

      // Try to find the booking by phone number (for regular messages)
      let booking = null;
      try {
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
            booking = bookingsData.records[0];
            console.log(`[TWILIO-WEBHOOK] Found booking ${booking.id} for phone ${From}`);
          }
        }
      } catch (err) {
        console.error('[TWILIO-WEBHOOK] Error finding booking:', err);
      }

      // Log incoming message to booking notes
      try {
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
      } catch (err) {
        console.error('[TWILIO-WEBHOOK] Error logging message:', err);
      }

      // Forward SMS to personal phone (optional)
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

    // ✅ UPDATED: Search for both Reminder SMS and Preclass SMS
    const bookingsResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings?filterByFormula=OR({Reminder SMS ID}='${messageSid}',{Preclass SMS ID}='${messageSid}')`,
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
    
    // ✅ UPDATED: Determine which SMS type (Reminder = Afternoon, Preclass = morning-of)
    const isReminderSms = booking.fields['Reminder SMS ID'] === messageSid;
    const isPreclassSms = booking.fields['Preclass SMS ID'] === messageSid;

    let statusField;
    let deliveredField;

    if (isReminderSms) {
      statusField = 'Reminder SMS Status';
      deliveredField = 'Reminder SMS Delivered At';
    } else if (isPreclassSms) {
      statusField = 'Preclass SMS Status';
      deliveredField = 'Preclass SMS Delivered At';
    } else {
      console.log(`[TWILIO-WEBHOOK] ⚠️ Could not determine SMS type for SID: ${messageSid}`);
      return res.status(200).json({ message: 'Unknown SMS type' });
    }

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
      smsType: isReminderSms ? 'Afternoon Reminder' : 'Pre-class Reminder',
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
