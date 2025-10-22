// /api/admin/class-schedules.js
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

    // Fetch all class schedules
    const schedulesResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!schedulesResponse.ok) {
      throw new Error('Failed to fetch schedules');
    }

    const schedulesData = await schedulesResponse.json();
    const schedules = schedulesData.records || [];

    // Fetch all classes
    const classesResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!classesResponse.ok) {
      throw new Error('Failed to fetch classes');
    }

    const classesData = await classesResponse.json();
    const classes = classesData.records || [];

    // Create a map of class ID to class data for quick lookup
    const classMap = {};
    classes.forEach(classRecord => {
      classMap[classRecord.id] = classRecord.fields;
    });

    // Helper function to check if registration is open
    const isRegistrationOpen = (schedule) => {
      const now = new Date();
      
      // If registration opens date is set and in the future, registration is not open yet
      if (schedule.fields['Registration Opens']) {
        const regOpens = new Date(schedule.fields['Registration Opens']);
        if (regOpens > now) {
          return false;
        }
      }
      
      // Check if class is more than 4 hours away
      const startTimeNew = schedule.fields['Start Time New'];
      if (startTimeNew) {
        const classDateTime = new Date(startTimeNew);
        const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
        return classDateTime > fourHoursFromNow;
      }
      
      // Fallback to date-only check (conservative - assume it's at end of day)
      const classDate = new Date(schedule.fields.Date);
      classDate.setHours(23, 59, 59, 999);
      const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      return classDate > fourHoursFromNow;
    };

    // Combine schedule data with class data
    const enrichedSchedules = schedules.map(schedule => {
      const classId = schedule.fields.Class?.[0];
      const classData = classId ? classMap[classId] : null;

      // Get start time for display
      const startTimeNew = schedule.fields['Start Time New'];
      let startTime = '';
      if (startTimeNew) {
        const date = new Date(startTimeNew);
        startTime = date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        });
      }

      return {
        id: schedule.id,
        date: schedule.fields.Date || '',
        startTime: startTime,
        startTimeNew: startTimeNew,
        classId: classData?.ID || '',
        className: classData?.['Class Name'] || '',
        type: classData?.Type || '',
        bookingMethod: classData?.['Booking Method'] || '',
        city: classData?.City || '',
        availableSpots: schedule.fields['Available Spots'] || 0,
        bookedSpots: schedule.fields['Booked Spots'] || 0,
        remainingSpots: schedule.fields['Remaining Spots'] || 0,
        registrationOpens: schedule.fields['Registration Opens'] || null,
        isCancelled: schedule.fields['Is Cancelled'] || false,
        isRegistrationOpen: isRegistrationOpen(schedule)
      };
    });

    return res.json({ schedules: enrichedSchedules });

  } catch (error) {
    console.error('Error fetching schedules:', error);
    return res.status(500).json({ error: 'Failed to fetch schedules' });
  }
}
