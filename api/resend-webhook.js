// /api/resend-webhook.js
// Updated to handle Confirmation, Reminder, AND Followup emails

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
    
  const timestampField = eventType === 'email.delivered' 
    ? (isConfirmationEmail ? 'Confirmation Email Delivered At' 
       : isReminderEmail ? 'Reminder Email Delivered At' 
       : 'Followup Email Delivered At')
    : eventType === 'email.opened'
    ? (isConfirmationEmail ? 'Confirmation Email Opened At' 
       : isReminderEmail ? 'Reminder Email Opened At'
       : 'Followup Email Opened At')
    : null;
  
  const statusMap = {
    'email.sent': 'Sent',
    'email.delivered': 'Delivered',
    'email.delivery_delayed': 'Delayed',
    'email.bounced': 'Bounced',
    'email.complained': 'Spam',
    'email.opened': 'Opened',
    'email.clicked': 'Clicked'
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
    // Search Bookings table for this email ID (could be confirmation, reminder, or followup)
    const bookingSearchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings?filterByFormula=OR({Confirmation Email ID}='${emailId}',{Reminder Email ID}='${emailId}',{Followup Email ID}='${emailId}')`;
    
    const bookingSearchResponse = await fetch(bookingSearchUrl, {
      headers: { 
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!bookingSearchResponse.ok) {
      console.error('Booking search failed:', bookingSearchResponse.status);
      return false;
    }
    
    const bookingData = await bookingSearchResponse.json();
    
    if (bookingData.records && bookingData.records.length > 0) {
      // Found booking - update it
      return await updateBookingRecord(bookingData.records[0], emailId, eventType);
    }
    
    // Not found
    console.log(`⚠️ No booking found for email ID: ${emailId}`);
    return false;
    
  } catch (error) {
    console.error('Error updating email status:', error);
    return false;
  }
}

export default async function handler(req, res) {
  try {
    const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;
    
    if (!RESEND_WEBHOOK_SECRET) {
      console.error('❌ RESEND_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }
    
    // Get the raw body and signature
    const payload = JSON.stringify(req.body);
    const signature = req.headers['svix-signature'];
    
    if (!signature) {
      console.warn('⚠️ No signature in request headers');
      return res.status(401).json({ error: 'Missing signature' });
    }
    
    // Verify webhook signature
    const wh = new Webhook(RESEND_WEBHOOK_SECRET);
    let event;
    
    try {
      event = wh.verify(payload, {
        'svix-id': req.headers['svix-id'],
        'svix-timestamp': req.headers['svix-timestamp'],
        'svix-signature': signature
      });
    } catch (err) {
      console.error('❌ Webhook verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    console.log('✅ Webhook signature verified');
    console.log(`📧 Received event: ${event.type} for email ${event.data.email_id}`);
    
    // Process the event
    const emailId = event.data.email_id;
    const eventType = event.type;
    
    // Update Airtable with email status
    const updated = await updateEmailStatus(emailId, eventType, event.data);
    
    if (updated) {
      console.log(`✅ Successfully processed ${eventType} for ${emailId}`);
    } else {
      console.log(`⚠️ Could not update booking for ${emailId}`);
    }
    
    // Always return 200 to acknowledge receipt
    return res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return res.status(500).json({ error: 'Internal error' });
  }
}

export const config = {
  api: {
    bodyParser: true
  }
};
