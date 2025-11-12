// /api/resend-webhook.js
// Updated to use "Clicked At" fields for both opened and clicked events
// (Since open tracking doesn't work reliably anyway)

import { Webhook } from 'svix';

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
    
  // For opened AND clicked events, use "Clicked At" field
  const timestampField = eventType === 'email.delivered' 
    ? (isConfirmationEmail ? 'Confirmation Email Delivered At' 
       : isReminderEmail ? 'Reminder Email Delivered At' 
       : 'Followup Email Delivered At')
    : (eventType === 'email.opened' || eventType === 'email.clicked')
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
    'email.opened': 'Clicked', // Treat as clicked since field is "Clicked At"
    'email.clicked': 'Clicked'
  };
  
  const fieldsToUpdate = {
    [statusField]: statusMap[eventType] || 'Unknown'
  };
  
  if (timestampField) {
    fieldsToUpdate[timestampField] = new Date().toISOString();
  }
  
  console.log(`[WEBHOOK] Updating booking ${booking.id}:`, JSON.stringify(fieldsToUpdate));
  
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
    const errorText = await updateResponse.text();
    console.error(`[WEBHOOK] Airtable update failed (${updateResponse.status}):`, errorText);
    return false;
  }
  
  console.log(`✅ Updated booking ${booking.id}: ${statusField} = ${statusMap[eventType]}`);
  return true;
}

async function updateEmailStatus(emailId, eventType) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Airtable not configured');
  }
  
  try {
    console.log(`[WEBHOOK] Searching for booking with email ID: ${emailId}`);
    
    // Search for this email ID in any of the three email ID fields
    const bookingSearchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings?filterByFormula=OR({Confirmation Email ID}='${emailId}',{Reminder Email ID}='${emailId}',{Followup Email ID}='${emailId}')`;
    
    const bookingSearchResponse = await fetch(bookingSearchUrl, {
      headers: { 
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!bookingSearchResponse.ok) {
      const errorText = await bookingSearchResponse.text();
      console.error(`[WEBHOOK] Booking search failed (${bookingSearchResponse.status}):`, errorText);
      return false;
    }
    
    const bookingData = await bookingSearchResponse.json();
    console.log(`[WEBHOOK] Search returned ${bookingData.records?.length || 0} records`);
    
    if (bookingData.records && bookingData.records.length > 0) {
      if (bookingData.records.length > 1) {
        console.warn(`⚠️ Found ${bookingData.records.length} bookings with email ID ${emailId} - updating first one`);
      }
      
      // Found booking - update it
      return await updateBookingRecord(bookingData.records[0], emailId, eventType);
    }
    
    // Not found
    console.log(`⚠️ No booking found for email ID: ${emailId}`);
    return false;
    
  } catch (error) {
    console.error('[WEBHOOK] Error updating email status:', error);
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
    const updated = await updateEmailStatus(emailId, eventType);
    
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
