// /api/admin/class-roster.js
// Updated to use "Clicked At" instead of "Opened At"
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

    if (!classId) {
      return res.status(404).json({ error: 'Class not linked to schedule' });
    }

    // Fetch class data
    const classResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!classResponse.ok) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const classData = await classResponse.json();

    // Fetch all bookings for this class schedule
    const bookingsUrl = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`);
    bookingsUrl.searchParams.append('filterByFormula', `{Class Schedule} = '${classScheduleId}'`);

    const bookingsResponse = await fetch(bookingsUrl, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
    });

    if (!bookingsResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }

    const bookingsData = await bookingsResponse.json();
    const bookings = bookingsData.records || [];

    // Fetch all participants for these bookings with pagination
    const participantIds = bookings
      .map(booking => booking.fields?.Participants || [])
      .flat()
      .filter(Boolean);

    if (participantIds.length === 0) {
      return res.status(200).json({
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
        roster: [],
        totalParticipants: 0
      });
    }

    // Fetch participants with pagination (Airtable limits to 100 records per request)
    let participants = [];
    let offset = null;

    do {
      const participantsUrl = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants`);
      participantsUrl.searchParams.append('filterByFormula', `OR(${participantIds.map(id => `RECORD_ID()='${id}'`).join(',')})`);
      if (offset) {
        participantsUrl.searchParams.append('offset', offset);
      }

      const participantsResponse = await fetch(participantsUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
      });

      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        participants = participants.concat(participantsData.records || []);
        offset = participantsData.offset; // Get next page offset
      } else {
        break;
      }
    } while (offset); // Keep fetching until no more pages

    // Combine participant data with booking contact info
    const roster = participants.map(participant => {
      const booking = bookings.find(b => 
        b.fields?.Participants?.includes(participant.id)
      );

      // Check if this participant is the primary contact for the booking
      const isPrimaryContact = 
        participant.fields['First Name'] === booking?.fields['Contact First Name'] &&
        participant.fields['Last Name'] === booking?.fields['Contact Last Name'];

      return {
        id: participant.id,
        firstName: participant.fields['First Name'],
        lastName: participant.fields['Last Name'],
        ageGroup: participant.fields['Age Group'],
        attendance: participant.fields['Attendance'] || 'Not Recorded',
        contactEmail: booking?.fields['Contact Email'],
        contactPhone: booking?.fields['Contact Phone'],
        bookingId: booking?.id,
        bookingNumber: booking?.fields['Booking ID'],
        isPrimaryContact,
        bookingDate: booking?.fields['Booking Date'],
        // ✅ UPDATED: Using "Clicked At" instead of "Opened At"
        confirmationEmailStatus: booking?.fields['Confirmation Email Status'],
        confirmationEmailSentAt: booking?.fields['Confirmation Email Sent At'],
        confirmationEmailDeliveredAt: booking?.fields['Confirmation Email Delivered At'],
        confirmationEmailClickedAt: booking?.fields['Confirmation Email Clicked At'],
        reminderEmailStatus: booking?.fields['Reminder Email Status'],
        reminderEmailSentAt: booking?.fields['Reminder Email Sent At'],
        reminderEmailDeliveredAt: booking?.fields['Reminder Email Delivered At'],
        reminderEmailClickedAt: booking?.fields['Reminder Email Clicked At'],
        followupEmailStatus: booking?.fields['Followup Email Status'],
        followupEmailSentAt: booking?.fields['Followup Email Sent At'],
        followupEmailDeliveredAt: booking?.fields['Followup Email Delivered At'],
        followupEmailClickedAt: booking?.fields['Followup Email Clicked At']
      };
    });

    // Sort by booking (keeps booking groups together), then put primary contact first
    roster.sort((a, b) => {
      // First sort by booking ID
      if (a.bookingId !== b.bookingId) {
        // Sort bookings by booking date/number
        const aBookingNum = a.bookingNumber || 0;
        const bBookingNum = b.bookingNumber || 0;
        return aBookingNum - bBookingNum;
      }
      
      // Within same booking, put primary contact first
      if (a.isPrimaryContact && !b.isPrimaryContact) return -1;
      if (!a.isPrimaryContact && b.isPrimaryContact) return 1;
      
      // Then sort by name
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
