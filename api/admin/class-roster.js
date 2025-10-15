// /api/admin/class-roster.js
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Get classScheduleId from query params
    const { classScheduleId } = req.query;

    if (!classScheduleId) {
      return res.status(400).json({ error: 'classScheduleId is required' });
    }

    // Fetch class schedule
    const scheduleResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${classScheduleId}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!scheduleResponse.ok) {
      return res.status(404).json({ error: 'Class schedule not found' });
    }

    const schedule = await scheduleResponse.json();
    const classId = schedule.fields?.Class?.[0];

    // Fetch class details
    let classData = null;
    if (classId) {
      const classResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );
      if (classResponse.ok) {
        classData = await classResponse.json();
      }
    }

    // Fetch bookings for this schedule
    const bookingIds = schedule.fields?.Bookings || [];
    let bookings = [];

    if (bookingIds.length > 0) {
      const orConditions = bookingIds.map(id => `RECORD_ID()="${id}"`).join(',');
      const filterFormula = `OR(${orConditions})`;
      
      const bookingsResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings?filterByFormula=${encodeURIComponent(filterFormula)}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        bookings = bookingsData.records || [];
      }
    }

    // Fetch all participants for these bookings
    const allParticipantIds = bookings.flatMap(b => b.fields?.Participants || []);
    let participants = [];

    if (allParticipantIds.length > 0) {
      const orConditions = allParticipantIds.map(id => `RECORD_ID()="${id}"`).join(',');
      const filterFormula = `OR(${orConditions})`;
      
      const participantsResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants?filterByFormula=${encodeURIComponent(filterFormula)}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );

      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        participants = participantsData.records || [];
      }
    }

    // Combine participant data with booking contact info
    const roster = participants.map(participant => {
      const booking = bookings.find(b => 
        b.fields?.Participants?.includes(participant.id)
      );

      return {
        id: participant.id,
        firstName: participant.fields['First Name'],
        lastName: participant.fields['Last Name'],
        ageGroup: participant.fields['Age Group'],
        attendance: participant.fields['Attendance'] || 'Not Recorded',
        contactEmail: booking?.fields['Contact Email'],
        contactPhone: booking?.fields['Contact Phone'],
        bookingId: booking?.id
      };
    });

    // Sort roster by last name, then first name
    roster.sort((a, b) => {
      const lastNameCompare = (a.lastName || '').localeCompare(b.lastName || '');
      if (lastNameCompare !== 0) return lastNameCompare;
      return (a.firstName || '').localeCompare(b.firstName || '');
    });

    // Prepare response
    const response = {
      classInfo: {
        id: classScheduleId,
        className: classData?.fields['Class Name'] || 'Unknown Class',
        date: schedule.fields?.Date,
        startTime: schedule.fields['Start Time New'] || schedule.fields['Start Time'],
        endTime: schedule.fields['End Time New'] || schedule.fields['End Time'],
        location: schedule.fields?.Location || classData?.fields?.Location,
        availableSpots: schedule.fields['Available Spots'],
        bookedSpots: schedule.fields['Booked Spots']
      },
      roster,
      totalParticipants: roster.length
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Class roster error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
