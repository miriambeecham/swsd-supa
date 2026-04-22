// /api/resend-webhook.js
// Receives Resend email events (sent/delivered/bounced/clicked/etc.) and
// updates the matching booking row's tracking columns. The same booking row
// can hold a confirmation, reminder, and followup email ID — we resolve which
// one this event belongs to by matching the email_id.
import { Webhook } from 'svix';
import { requireSupabase } from './_supabase.js';

const STATUS_MAP = {
  'email.sent': 'Sent',
  'email.delivered': 'Delivered',
  'email.delivery_delayed': 'Delayed',
  'email.bounced': 'Bounced',
  'email.complained': 'Spam',
  'email.opened': 'Clicked',  // Treat opens as clicks (opens are unreliable)
  'email.clicked': 'Clicked',
};

// (column on the booking row, prefix used in tracking field names)
const EMAIL_KIND_BY_ID_COLUMN = [
  ['confirmation_email_id', 'confirmation'],
  ['reminder_email_id', 'reminder'],
  ['followup_email_id', 'followup'],
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;
    if (!RESEND_WEBHOOK_SECRET) {
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    const svixId = req.headers['svix-id'];
    const svixTimestamp = req.headers['svix-timestamp'];
    const svixSignature = req.headers['svix-signature'];
    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({ error: 'Missing webhook headers' });
    }

    const wh = new Webhook(RESEND_WEBHOOK_SECRET);
    let event;
    try {
      event = wh.verify(JSON.stringify(req.body), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err) {
      console.error('Webhook verification failed:', err);
      return res.status(400).json({ error: 'Webhook verification failed' });
    }

    const eventType = event.type;
    const emailId = event.data.email_id;
    if (!STATUS_MAP[eventType]) {
      return res.status(200).json({ success: true, message: 'Event type not processed' });
    }
    if (!emailId) {
      return res.status(400).json({ error: 'Missing email_id' });
    }

    // Find which kind of email this is by matching the email_id against
    // the three possible columns on the booking.
    let booking = null;
    let kind = null;
    for (const [col, prefix] of EMAIL_KIND_BY_ID_COLUMN) {
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq(col, emailId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        booking = data;
        kind = prefix;
        break;
      }
    }

    if (!booking) {
      console.warn(`No booking found for email ID: ${emailId}`);
      return res.status(200).json({ success: false, message: 'Email ID not found in bookings' });
    }

    const status = STATUS_MAP[eventType];
    const updates = { [`${kind}_email_status`]: status };
    if (eventType === 'email.delivered') {
      updates[`${kind}_email_delivered_at`] = new Date().toISOString();
    } else if (eventType === 'email.opened' || eventType === 'email.clicked') {
      updates[`${kind}_email_clicked_at`] = new Date().toISOString();
    }

    const { error: updErr } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', booking.id);
    if (updErr) throw updErr;

    console.log(`Updated booking ${booking.id}: ${kind}_email_status = ${status}`);
    return res.status(200).json({ success: true, message: `Processed ${eventType}` });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
