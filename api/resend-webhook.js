// /api/resend-webhook.js
import { Webhook } from 'svix';

// Rate limiting: Track requests per IP
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

// Helper: Check rate limit
function checkRateLimit(ip) {
  const now = Date.now();
  const requestLog = rateLimitMap.get(ip) || [];
  
  // Remove old requests outside the window
  const recentRequests = requestLog.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimitMap.set(ip, recentRequests);
  return true;
}

// Helper: Validate event payload structure
function isValidResendEvent(event) {
  if (!event || typeof event !== 'object') return false;
  if (!event.type || typeof event.type !== 'string') return false;
  if (!event.data || typeof event.data !== 'object') return false;
  if (!event.data.email_id) return false;
  
  // Valid event types from Resend
  const validTypes = [
    'email.sent',
    'email.delivered',
    'email.delivery_delayed',
    'email.complained',
    'email.bounced',
    'email.opened',
    'email.clicked'
  ];
  
  return validTypes.includes(event.type);
}

// Helper: Update booking record
async function updateBookingRecord(booking, emailId, eventType) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  
  const isConfirmationEmail = booking.fields['Confirmation Email ID'] === emailId;
  
  const statusField = isConfirmationEmail ? 'Confirmation Email Status' : 'Reminder Email Status';
  const timestampField = eventType === 'email.delivered' 
    ? (isConfirmationEmail ? 'Confirmation Email Delivered At' : 'Reminder Email Delivered At')
    : eventType === 'email.opened'
    ? (isConfirmationEmail ? 'Confirmation Email Opened At' : 'Reminder Email Opened At')
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

// Helper: Update participant record (for future use)
async function updateParticipantRecord(participant, emailId, eventType) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  
  const isConfirmationEmail = participant.fields['Confirmation Email ID'] === emailId;
  
  const statusField = isConfirmationEmail ? 'Confirmation Email Status' : 'Reminder Email Status';
  const timestampField = eventType === 'email.delivered' 
    ? (isConfirmationEmail ? 'Confirmation Email Delivered At' : 'Reminder Email Delivered At')
    : eventType === 'email.opened'
    ? (isConfirmationEmail ? 'Confirmation Email Opened At' : 'Reminder Email Opened At')
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
  
  const updateUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants/${participant.id}`;
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
  
  console.log(`✅ Updated participant ${participant.id}: ${statusField} = ${statusMap[eventType]}`);
  return true;
}

// Helper: Update email status (checks Participants first, then Bookings)
async function updateEmailStatus(emailId, eventType, eventData) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Airtable not configured');
  }
  
  try {
    // 🔍 STEP 1: Check Participants table first (future-proof)
    const participantSearchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants?filterByFormula=OR({Confirmation Email ID}='${emailId}',{Reminder Email ID}='${emailId}')`;
    
    const participantSearchResponse = await fetch(participantSearchUrl, {
      headers: { 
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (participantSearchResponse.ok) {
      const participantData = await participantSearchResponse.json();
      
      if (participantData.records && participantData.records.length > 0) {
        // Found in Participants table - update participant
        return await updateParticipantRecord(participantData.records[0], emailId, eventType);
      }
    }
    
    // 🔍 STEP 2: Not found in Participants? Check Bookings table
    const bookingSearchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings?filterByFormula=OR({Confirmation Email ID}='${emailId}',{Reminder Email ID}='${emailId}')`;
    
    const bookingSearchResponse = await fetch(bookingSearchUrl, {
      headers: { 
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!bookingSearchResponse.ok) {
      console.error('Airtable search failed:', await bookingSearchResponse.text());
      return false;
    }
    
    const bookingData = await bookingSearchResponse.json();
    
    if (!bookingData.records || bookingData.records.length === 0) {
      console.log('No booking or participant found for email ID:', emailId);
      return false;
    }
    
    // Found in Bookings table - update booking
    return await updateBookingRecord(bookingData.records[0], emailId, eventType);
    
  } catch (error) {
    console.error('Error updating email status:', error);
    return false;
  }
}

// Main webhook handler
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Rate limiting by IP
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    console.warn(`⚠️ Rate limit exceeded for IP: ${ip}`);
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  // Get webhook secret
  const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    console.error('❌ RESEND_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }
  
  try {
    // Get raw body as string for signature verification
    const payload = JSON.stringify(req.body);
    
    // Get Svix headers for signature verification
    const headers = {
      'svix-id': req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature']
    };
    
    // Verify all required headers are present
    if (!headers['svix-id'] || !headers['svix-timestamp'] || !headers['svix-signature']) {
      console.warn('⚠️ Missing Svix headers');
      return res.status(400).json({ error: 'Missing signature headers' });
    }
    
    // CRITICAL: Verify webhook signature
    const webhook = new Webhook(WEBHOOK_SECRET);
    let event;
    
    try {
      event = webhook.verify(payload, headers);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    console.log('✅ Webhook signature verified');
    
    // Validate event structure
    if (!isValidResendEvent(event)) {
      console.warn('⚠️ Invalid event structure:', event);
      return res.status(400).json({ error: 'Invalid event structure' });
    }
    
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
    // (Even if update failed, we don't want Resend to retry)
    return res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    // Don't expose internal error details to external caller
    return res.status(500).json({ error: 'Internal error' });
  }
}

// IMPORTANT: Vercel handles body parsing automatically
export const config = {
  api: {
    bodyParser: true
  }
};
