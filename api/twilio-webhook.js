// /api/twilio-webhook.js
// Two paths: incoming SMS (auto-handle STOP, log replies, optional forward)
// and Twilio delivery status callbacks for the SMS we sent.
import { requireSupabase } from './_supabase.js';

const STATUS_MAP = {
  queued: 'Sent',
  sending: 'Sent',
  sent: 'Sent',
  delivered: 'Delivered',
  undelivered: 'Undelivered',
  failed: 'Failed',
};

// Normalise a phone number to "digits only, no leading 1".
function normalisePhone(phone) {
  if (!phone) return null;
  return String(phone).replace(/\D/g, '').replace(/^1/, '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = requireSupabase(res);
  if (!supabase) return;

  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
  const FORWARD_SMS_TO = process.env.FORWARD_SMS_TO;

  try {
    const { MessageSid, MessageStatus, To, From, Body, ErrorCode, ErrorMessage, SmsStatus, SmsSid } = req.body;
    const isStatusCallback = MessageStatus || SmsStatus;
    const isIncomingMessage = Body && !isStatusCallback;

    // ── Incoming SMS ────────────────────────────────────────────────────
    if (isIncomingMessage) {
      const cleanFrom = normalisePhone(From);
      console.log(`[TWILIO-WEBHOOK] Incoming from ${From}: ${Body}`);

      const stopKeywords = ['STOP', 'UNSUBSCRIBE', 'END', 'CANCEL', 'QUIT', 'STOPALL'];
      if (stopKeywords.includes(Body.trim().toUpperCase())) {
        const todayDate = new Date().toISOString().split('T')[0];

        // Bookings to opt out: matching phone, not cancelled, with a class on/after today.
        const { data: candidates, error: cErr } = await supabase
          .from('bookings')
          .select('id, contact_phone, class_schedules(date)')
          .neq('status', 'Cancelled');
        if (cErr) throw cErr;

        const toOptOut = (candidates || []).filter(b =>
          normalisePhone(b.contact_phone) === cleanFrom &&
          b.class_schedules?.date && b.class_schedules.date >= todayDate
        );

        const optOutTimestamp = new Date().toISOString();
        let updatedCount = 0;
        for (const b of toOptOut) {
          const { error } = await supabase
            .from('bookings')
            .update({ sms_opted_out_date: optOutTimestamp })
            .eq('id', b.id);
          if (!error) updatedCount++;
        }
        console.log(`[TWILIO-WEBHOOK] Opted out ${updatedCount} booking(s) from SMS`);

        if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
          try {
            const twilio = await import('twilio');
            const client = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
            await client.messages.create({
              body: "You've been unsubscribed from SMS reminders. You'll still receive email notifications. To resubscribe, book a new class or contact us at (925) 532-9953.",
              from: TWILIO_PHONE_NUMBER,
              to: From,
            });
          } catch (err) {
            console.error('[TWILIO-WEBHOOK] Confirmation send failed:', err);
          }
        }

        return res.status(200).json({ success: true, message: 'STOP request processed', bookingsUpdated: updatedCount });
      }

      // Non-STOP message: find a booking by phone, append the message to validation_notes, optionally forward.
      const { data: matches } = await supabase
        .from('bookings')
        .select('id, contact_phone, contact_first_name, contact_last_name, class_schedule_id, validation_notes')
        .limit(200);
      const booking = (matches || []).find(b => normalisePhone(b.contact_phone) === cleanFrom);

      if (booking) {
        const timestamp = new Date().toLocaleString('en-US', {
          timeZone: 'America/Los_Angeles', dateStyle: 'short', timeStyle: 'short',
        });
        const newNote = `[${timestamp}] SMS Reply: "${Body}"`;
        const updated = booking.validation_notes
          ? `${booking.validation_notes}\n${newNote}`
          : newNote;
        await supabase.from('bookings').update({ validation_notes: updated }).eq('id', booking.id);
      }

      if (FORWARD_SMS_TO && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
        try {
          const twilio = await import('twilio');
          const client = twilio.default(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
          const contactName = booking?.contact_first_name
            ? `${booking.contact_first_name} ${booking.contact_last_name || ''}`
            : 'Unknown';
          const forwardMessage = `📱 SMS Reply from ${contactName}\nPhone: ${From}\n\n"${Body}"`;
          await client.messages.create({ body: forwardMessage, from: TWILIO_PHONE_NUMBER, to: FORWARD_SMS_TO });
        } catch (err) {
          console.error('[TWILIO-WEBHOOK] Forward failed:', err);
        }
      }

      return res.status(200).json({ success: true, message: 'Incoming SMS processed', from: From, logged: !!booking });
    }

    // ── Status callback ─────────────────────────────────────────────────
    const messageSid = MessageSid || SmsSid;
    const status = (MessageStatus || SmsStatus || '').toLowerCase();
    if (ErrorCode) console.error(`[TWILIO-WEBHOOK] Error ${ErrorCode}: ${ErrorMessage}`);

    // Match the SID against either of the two SMS ID columns.
    const { data: byReminder } = await supabase
      .from('bookings')
      .select('id, reminder_sms_id, preclass_sms_id')
      .or(`reminder_sms_id.eq.${messageSid},preclass_sms_id.eq.${messageSid}`)
      .maybeSingle();

    if (!byReminder) {
      console.log(`[TWILIO-WEBHOOK] No booking found for SMS SID ${messageSid}`);
      return res.status(200).json({ message: 'No matching booking found' });
    }

    const isReminder = byReminder.reminder_sms_id === messageSid;
    const isPreclass = byReminder.preclass_sms_id === messageSid;
    const mappedStatus = STATUS_MAP[status] || 'Unknown';

    const updates = isReminder
      ? { reminder_sms_status: mappedStatus, ...(status === 'delivered' ? { reminder_sms_delivered_at: new Date().toISOString() } : {}) }
      : isPreclass
        ? { preclass_sms_status: mappedStatus, ...(status === 'delivered' ? { preclass_sms_delivered_at: new Date().toISOString() } : {}) }
        : null;

    if (!updates) {
      return res.status(200).json({ message: 'Unknown SMS type' });
    }

    const { error: updErr } = await supabase.from('bookings').update(updates).eq('id', byReminder.id);
    if (updErr) throw updErr;

    return res.status(200).json({
      success: true,
      bookingId: byReminder.id,
      smsType: isReminder ? 'Reminder' : 'Preclass',
      status: mappedStatus,
    });
  } catch (error) {
    console.error('[TWILIO-WEBHOOK] Error processing webhook:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
