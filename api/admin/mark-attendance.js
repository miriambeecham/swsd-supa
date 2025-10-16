// /api/admin/mark-attendance.js
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!JWT_SECRET || !AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify authentication
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    const token = cookies?.auth_token;

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get attendance data from request body
    const { classScheduleId, attendanceRecords } = req.body;

    if (!classScheduleId || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Update each participant's attendance in Airtable
    const updatePromises = attendanceRecords.map(async (record) => {
      const { participantId, attendance } = record;

      if (!participantId || !attendance) {
        return { success: false, participantId, error: 'Missing data' };
      }

      try {
        const response = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants/${participantId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fields: {
                Attendance: attendance
              }
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to update participant ${participantId}:`, errorText);
          return { success: false, participantId, error: errorText };
        }

        return { success: true, participantId };
      } catch (error) {
        console.error(`Error updating participant ${participantId}:`, error);
        return { success: false, participantId, error: error.message };
      }
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    // Log audit trail (optional)
    console.log('Attendance marked:', {
      timestamp: new Date().toISOString(),
      classScheduleId,
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      successCount,
      failureCount
    });

    return res.status(200).json({
      success: true,
      updated: successCount,
      failed: failureCount,
      results
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
