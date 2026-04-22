// /api/cleanup-expired-bookings.js
import { requireSupabase } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'Cancelled', payment_status: 'Expired' })
      .eq('status', 'Pending Payment')
      .lt('booking_date', thirtyMinutesAgo)
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
