// /api/cleanup-expired-bookings.js
// Cron job to cancel abandoned checkouts so their seats are released.
import { requireSupabase } from './_supabase.js';
import { requireCronAuth } from './_cron-auth.js';

export default async function handler(req, res) {
  if (!requireCronAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    // Stripe sessions expire 30 min after creation; the extra 5 min covers the
    // gap between inserting the booking and creating the session.
    const cutoff = new Date(Date.now() - 35 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'Cancelled', payment_status: 'Expired' })
      .eq('status', 'Pending Payment')
      .lt('booking_date', cutoff)
      .select('id');
    if (error) throw error;

    return res.json({
      success: true,
      message: `Cleaned up ${data?.length || 0} expired bookings`,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({ error: error.message });
  }
}
