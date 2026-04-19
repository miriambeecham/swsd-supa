// /api/admin/mark-attendance.js
import { requireSupabase } from '../_supabase.js';
import { requireAdminAuth } from '../_admin-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdminAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const { classScheduleId, attendanceRecords } = req.body;
    if (!classScheduleId || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const results = await Promise.all(attendanceRecords.map(async ({ participantId, attendance }) => {
      if (!participantId || !attendance) {
        return { success: false, participantId, error: 'Missing data' };
      }
      const isAirtableId = /^rec/.test(participantId);
      const filter = isAirtableId
        ? supabase.from('participants').update({ attendance }).eq('airtable_record_id', participantId)
        : supabase.from('participants').update({ attendance }).eq('id', participantId);
      const { error } = await filter;
      if (error) {
        console.error(`Failed to update participant ${participantId}:`, error.message);
        return { success: false, participantId, error: error.message };
      }
      return { success: true, participantId };
    }));

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log('Attendance marked:', {
      timestamp: new Date().toISOString(),
      classScheduleId,
      ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
      successCount, failureCount,
    });

    return res.status(200).json({
      success: true,
      updated: successCount,
      failed: failureCount,
      results,
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
