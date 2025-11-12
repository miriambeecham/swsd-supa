// /api/resend-webhook.js
// ✅ UPDATED: Changed from "Opened At" to "Clicked At" fields
// Handles Resend email webhooks for confirmation, reminder, and follow-up emails

import { Webhook } from 'svix';

// Helper: Update booking record for all three email types
async function updateBookingRecord(booking, emailId, eventType) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  
  const isConfirmationEmail = booking.fields['Confirmation Email ID'] === emailId;
  const isReminderEmail = booking.fields['Reminder Email ID'] === emailId;
  const isFollowupEmail = booking.fields['Followup Email ID'] === emailId;
  
  // Determine which email type this is
  const statusField = isConfirmationEmail 
    ? 'Confirmation Email Status' 
    : isReminderEmail 
    ? 'Reminder Email Status'
    : 'Followup Email Status';
  
  // ✅ UPDATED: Using "Clicked At" instead of "Opened At"
  const timestampField = eventType === 'email.delivered' 
    ? (isConfirmationEmail ? 'Confirmation Email Delivered At' 
       : isReminderEmail ? 'Reminder Email Delivered At' 
       : 'Followup Email Delivered At')
    : (eventType === 'email.opened' || eventType === 'email.clicked')  // Handle both as "clicked"
    ? (isConfirmationEmail ? 'Confirmation Email Clicked At' 
       : isReminderEmail ? 'Reminder Email Clicked At'
       : 'Followup Email Clicked At')
    : null;
  
  const statusMap = {
    'email.sent': 'Sent',
    'email.delivered': 'Delivered',
    'email.delivery_delayed': 'Delayed',
    'email.bounced': 'Bounced',
    'email.complained': 'Spam',
    'email.opened': 'Clicked',   // ✅ Treat opens as clicks (since opens are unreliable)
    'email.clicked': 'Clicked'   // ✅ Changed from 'Opened' to 'Clicked'
  };
  
  const fieldsToUpdate = {
    [statusField]: statusMap[eventType] || 'Unknown'
  };
  
  if (timestampField) {
    fieldsToUpdate[timestampField] = new Date().toISOString();
  }
  
  const updateUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking.id}`;
  const updateResponse = await fetch(updateUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: fieldsToUpdate })
  });
  
  if (!updateResponse.ok) {
    console.error('Airtable update failed:', await updateResponse.text());
    return false;
  }
  
  console.log(`✅ Updated booking ${booking.id}: ${statusField} = ${statusMap[eventType]}`);
  return true;
}

// Helper: Update email status (searches Bookings for confirmation, reminder, or followup)
async function updateEmailStatus(emailId, eventType, eventData) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Airtable not configured');
  }
  
  try {
    // Search Bookings table for this email ID across all email types
    // Try each field individually to avoid 422 errors if fields are missing
    let booking = null;
    
    // Try confirmation email
    try {
      const confirmationUrl = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`);
      confirmationUrl.searchParams.append('filterByFormula', `{Confirmation Email ID}='${emailId}'`);
      confirmationUrl.searchParams.append('maxRecords', '1');
      
      const confirmationResponse = await fetch(confirmationUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });
      
      if (confirmationResponse.ok) {
        const confirmationData = await confirmationResponse.json();
        if (confirmationData.records && confirmationData.records.length > 0) {
          booking = confirmationData.records[0];
        }
      }
    } catch (err) {
      console.error('Error searching Confirmation Email ID:', err);
    }
    
    // Try reminder email if not found
    if (!booking) {
      try {
        const reminderUrl = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`);
        reminderUrl.searchParams.append('filterByFormula', `{Reminder Email ID}='${emailId}'`);
        reminderUrl.searchParams.append('maxRecords', '1');
        
        const reminderResponse = await fetch(reminderUrl, {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        });
        
        if (reminderResponse.ok) {
          const reminderData = await reminderResponse.json();
          if (reminderData.records && reminderData.records.length > 0) {
            booking = reminderData.records[0];
          }
        }
      } catch (err) {
        console.error('Error searching Reminder Email ID:', err);
      }
    }
    
    // Try followup email if still not found
    if (!booking) {
      try {
        const followupUrl = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`);
        followupUrl.searchParams.append('filterByFormula', `{Followup Email ID}='${emailId}'`);
        followupUrl.searchParams.append('maxRecords', '1');
        
        const followupResponse = await fetch(followupUrl, {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        });
        
        if (followupResponse.ok) {
          const followupData = await followupResponse.json();
          if (followupData.records && followupData.records.length > 0) {
            booking = followupData.records[0];
          }
        }
      } catch (err) {
        console.error('Error searching Followup Email ID:', err);
      }
    }
    
    if (!booking) {
      console.warn(`⚠️ No booking found for email ID: ${emailId}`);
      return false;
    }
    
    return await updateBookingRecord(booking, emailId, eventType);
    
  } catch (error) {
    console.error('Error in updateEmailStatus:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;
    
    if (!RESEND_WEBHOOK_SECRET) {
      console.error('❌ RESEND_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Get the webhook signature from headers
    const svixId = req.headers['svix-id'];
    const svixTimestamp = req.headers['svix-timestamp'];
    const svixSignature = req.headers['svix-signature'];

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('❌ Missing svix headers');
      return res.status(400).json({ error: 'Missing webhook headers' });
    }

    // Verify the webhook signature
    const wh = new Webhook(RESEND_WEBHOOK_SECRET);
    let event;

    try {
      event = wh.verify(JSON.stringify(req.body), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      console.error('❌ Webhook verification failed:', err);
      return res.status(400).json({ error: 'Webhook verification failed' });
    }

    console.log('✅ Webhook signature verified');

    const eventType = event.type;
    const eventData = event.data;
    const emailId = eventData.email_id;

    console.log(`📧 Received event: ${eventType} for email ${emailId}`);

    // Handle relevant email events
    const relevantEvents = [
      'email.sent',
      'email.delivered',
      'email.delivery_delayed',
      'email.bounced',
      'email.complained',
      'email.opened',
      'email.clicked'
    ];

    if (relevantEvents.includes(eventType)) {
      try {
        const updated = await updateEmailStatus(emailId, eventType, eventData);
        
        if (updated) {
          console.log(`✅ Successfully processed ${eventType} for ${emailId}`);
          return res.status(200).json({ 
            success: true, 
            message: `Processed ${eventType}` 
          });
        } else {
          console.warn(`⚠️ Could not update booking for ${emailId}`);
          return res.status(200).json({ 
            success: false, 
            message: 'Email ID not found in bookings' 
          });
        }
      } catch (error) {
        console.error(`❌ Error processing ${eventType}:`, error);
        return res.status(500).json({ error: 'Failed to update booking' });
      }
    } else {
      // Event type we don't handle - acknowledge but don't process
      console.log(`ℹ️ Ignoring event type: ${eventType}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Event type not processed' 
      });
    }

  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
