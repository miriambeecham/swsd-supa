// /api/unsubscribe.js
// Handles one-click unsubscribe from List-Unsubscribe header.
import { requireSupabase } from './_supabase.js';

const errorPage = (title, body) => `<!DOCTYPE html>
<html><head><title>${title}</title>
<style>body{font-family:Arial,sans-serif;max-width:600px;margin:50px auto;padding:20px;text-align:center}.error{color:#991B1B;background:#FEE2E2;padding:20px;border-radius:8px}</style>
</head><body><div class="error"><h1>${title}</h1><p>${body}</p></div></body></html>`;

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const bookingId = req.query.id;
    if (!bookingId) {
      return res.status(400).send(errorPage(
        'Invalid Unsubscribe Request',
        'The unsubscribe link appears to be invalid. Please contact us at jay@streetwiseselfdefense.com if you need assistance.',
      ));
    }

    const isAirtableId = /^rec/.test(bookingId);
    const q = supabase.from('bookings').select('id, email_unsubscribed');
    const { data: booking, error: bErr } = await (isAirtableId
      ? q.eq('airtable_record_id', bookingId)
      : q.eq('id', bookingId)
    ).maybeSingle();
    if (bErr) throw bErr;
    if (!booking) {
      return res.status(404).send(errorPage(
        'Booking Not Found',
        "We couldn't find your booking. Please contact us at jay@streetwiseselfdefense.com for assistance.",
      ));
    }

    if (booking.email_unsubscribed) {
      return res.status(200).send(`<!DOCTYPE html>
<html><head><title>Already Unsubscribed</title>
<style>body{font-family:Arial,sans-serif;max-width:600px;margin:50px auto;padding:20px;text-align:center}.success{color:#065F46;background:#D1FAE5;padding:20px;border-radius:8px}</style>
</head><body>
<div class="success"><h1>Already Unsubscribed</h1>
<p>You were previously unsubscribed from our emails.</p>
<p style="margin-top:20px;font-size:14px;color:#6B7280">If you have questions, contact us at <a href="mailto:jay@streetwiseselfdefense.com">jay@streetwiseselfdefense.com</a></p>
</div></body></html>`);
    }

    const { error: updErr } = await supabase
      .from('bookings')
      .update({
        email_unsubscribed: true,
        email_unsubscribed_at: new Date().toISOString(),
      })
      .eq('id', booking.id);
    if (updErr) throw updErr;

    console.log(`[UNSUBSCRIBE] Booking ${booking.id} unsubscribed from emails`);

    return res.status(200).send(`<!DOCTYPE html>
<html><head><title>Unsubscribed Successfully</title>
<style>
body{font-family:Arial,sans-serif;max-width:600px;margin:50px auto;padding:20px;text-align:center}
.success{color:#065F46;background:#D1FAE5;padding:30px;border-radius:8px;margin-bottom:20px}
.info{background:#F3F4F6;padding:20px;border-radius:8px;text-align:left}
h1{margin-top:0}a{color:#20B2AA;text-decoration:none}a:hover{text-decoration:underline}
</style></head><body>
<div class="success"><h1>✓ Unsubscribed Successfully</h1><p>You've been removed from our email list for this booking.</p></div>
<div class="info">
<h3>What this means:</h3>
<ul style="line-height:1.8">
<li>You won't receive reminder emails about this class</li>
<li>You'll still receive your confirmation email (already sent)</li>
<li>You may still receive SMS reminders if you provided a phone number</li>
</ul>
<p style="margin-top:20px;font-size:14px;color:#6B7280"><strong>Changed your mind?</strong> Contact us at
<a href="mailto:jay@streetwiseselfdefense.com">jay@streetwiseselfdefense.com</a>
or <a href="tel:+19255329953">(925) 532-9953</a></p>
</div></body></html>`);
  } catch (error) {
    console.error('[UNSUBSCRIBE] Error:', error);
    return res.status(500).send(errorPage(
      'Something Went Wrong',
      'We encountered an error processing your request. Please contact us at jay@streetwiseselfdefense.com for assistance.',
    ));
  }
}
