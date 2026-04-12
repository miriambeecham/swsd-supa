// /api/admin/pending-reschedules.js
// Returns all bookings with Reschedule Status = "Pending Reschedule",
// enriched with participant details and original/assigned class info.
import jwt from 'jsonwebtoken';

function verifyAuth(req) {
  const JWT_SECRET = process.env.JWT_SECRET;
  const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});

  const token = cookies?.auth_token;
  if (!token) return false;

  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET || !AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!verifyAuth(req)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;
  const headers = { Authorization: `Bearer ${AIRTABLE_API_KEY}` };

  try {
    // ── Step 1: Fetch all bookings with Reschedule Status = "Pending Reschedule" ──
    const filter = encodeURIComponent('{Reschedule Status}="Pending Reschedule"');
    const bookingsRes = await fetch(
      `${BASE_URL}/Bookings?filterByFormula=${filter}`,
      { headers }
    );

    if (!bookingsRes.ok) {
      const err = await bookingsRes.text();
      return res.status(500).json({ error: `Failed to fetch pending reschedules: ${err}` });
    }

    const bookingsData = await bookingsRes.json();
    const pendingBookings = bookingsData.records || [];

    if (pendingBookings.length === 0) {
      return res.json([]);
    }

    // ── Step 2: Enrich each booking with participants and class info ──
    const enriched = await Promise.all(pendingBookings.map(async (booking) => {
      const bf = booking.fields;

      // Fetch participants
      const participantIds = bf['Participants'] || [];
      const participants = await Promise.all(participantIds.map(async (pid) => {
        try {
          const pRes = await fetch(`${BASE_URL}/Participants/${pid}`, { headers });
          if (!pRes.ok) return { id: pid, firstName: '', lastName: '', ageGroup: '' };
          const pData = await pRes.json();
          return {
            id: pid,
            firstName: pData.fields['First Name'] || '',
            lastName: pData.fields['Last Name'] || '',
            ageGroup: pData.fields['Age Group'] || '',
          };
        } catch {
          return { id: pid, firstName: '', lastName: '', ageGroup: '' };
        }
      }));

      // Fetch original class info.
      // For split moves: Original Booking ID points to the parent booking.
      // For whole-group moves: notes contain [Original Schedule: recXXX].
      let originalBooking = null;
      const originalBookingId = bf['Original Booking ID'];

      // Helper to build originalBooking from a schedule ID
      const buildOriginalFromSchedule = async (scheduleId) => {
        try {
          const schedRes = await fetch(`${BASE_URL}/Class%20Schedules/${scheduleId}`, { headers });
          if (!schedRes.ok) return null;
          const schedData = await schedRes.json();
          const sf = schedData.fields;
          let className = '';
          const classLinkId = (sf['Class'] || [])[0];
          if (classLinkId) {
            const classRes = await fetch(`${BASE_URL}/Classes/${classLinkId}`, { headers });
            if (classRes.ok) {
              const classData = await classRes.json();
              className = classData.fields['Class Name'] || '';
            }
          }
          return {
            bookingId: null,
            bookingNumber: null,
            scheduleId,
            className,
            classDate: sf['Date'] || '',
            classStartTime: sf['Start Time New'] || '',
          };
        } catch { return null; }
      };

      if (originalBookingId) {
        // Split move — fetch the parent booking's class schedule
        try {
          const obRes = await fetch(`${BASE_URL}/Bookings/${originalBookingId}`, { headers });
          if (obRes.ok) {
            const obData = await obRes.json();
            const obFields = obData.fields;
            const obScheduleId = (obFields['Class Schedule'] || [])[0];

            if (obScheduleId) {
              const info = await buildOriginalFromSchedule(obScheduleId);
              if (info) {
                info.bookingId = originalBookingId;
                info.bookingNumber = obFields['Booking ID'] || null;
                originalBooking = info;
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch original booking ${originalBookingId}:`, err);
        }
      } else {
        // Whole-group move — check notes for [Original Schedule: recXXX]
        const notes = bf['Reschedule Notes'] || '';
        const schedMatch = notes.match(/\[Original Schedule: (rec[^\]]+)\]/);
        if (schedMatch) {
          originalBooking = await buildOriginalFromSchedule(schedMatch[1]);
        }
      }

      // Fetch assigned class info (if a class schedule is already set on this booking)
      let assignedClass = null;
      const assignedScheduleId = (bf['Class Schedule'] || [])[0];
      if (assignedScheduleId) {
        try {
          const schedRes = await fetch(`${BASE_URL}/Class%20Schedules/${assignedScheduleId}`, { headers });
          if (schedRes.ok) {
            const schedData = await schedRes.json();
            const sf = schedData.fields;

            let className = '';
            const classLinkId = (sf['Class'] || [])[0];
            if (classLinkId) {
              const classRes = await fetch(`${BASE_URL}/Classes/${classLinkId}`, { headers });
              if (classRes.ok) {
                const classData = await classRes.json();
                className = classData.fields['Class Name'] || '';
              }
            }

            assignedClass = {
              scheduleId: assignedScheduleId,
              className,
              classDate: sf['Date'] || '',
              classStartTime: sf['Start Time New'] || '',
            };
          }
        } catch (err) {
          console.error(`Failed to fetch assigned schedule ${assignedScheduleId}:`, err);
        }
      }

      return {
        bookingId: booking.id,
        bookingNumber: bf['Booking ID'] || null,
        contactFirstName: bf['Contact First Name'] || '',
        contactLastName: bf['Contact Last Name'] || '',
        contactEmail: bf['Contact Email'] || '',
        rescheduleNotes: bf['Reschedule Notes'] || '',
        createdAt: booking.createdTime || '',
        participants,
        originalBooking,
        assignedClass,
      };
    }));

    return res.json(enriched);

  } catch (error) {
    console.error('Pending reschedules error:', error);
    return res.status(500).json({ error: `Failed to fetch pending reschedules: ${error.message}` });
  }
}
