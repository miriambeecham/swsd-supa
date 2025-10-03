// Add to top of server.js with other imports
import ical from 'ical-generator';

// Helper function to create Google Calendar URL
function createGoogleCalendarUrl(classData) {
  const {
    className,
    startDateTime, // ISO format: 2025-03-15T10:00:00
    endDateTime,   // ISO format: 2025-03-15T12:00:00
    location,
    description
  } = classData;

  // Format dates for Google Calendar (needs format: 20250315T100000Z)
  const formatDateForGoogle = (isoDate) => {
    return new Date(isoDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const startFormatted = formatDateForGoogle(startDateTime);
  const endFormatted = formatDateForGoogle(endDateTime);

  // Build Google Calendar URL
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: className || 'Self-Defense Class',
    dates: `${startFormatted}/${endFormatted}`,
    details: description || 'Self-defense class registration confirmed. Check your email for preparation tips and waiver information.',
    location: location || 'Walnut Creek, CA',
    ctz: 'America/Los_Angeles' // Pacific Time
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Helper function to create iCal file content
function createICalFile(classData) {
  const {
    className,
    startDateTime,
    endDateTime,
    location,
    description,
    organizerEmail
  } = classData;

  const calendar = ical({
    name: 'Streetwise Self Defense Class',
    prodId: '//Streetwise Self Defense//Class Registration//EN',
    timezone: 'America/Los_Angeles'
  });

  calendar.createEvent({
    start: new Date(startDateTime),
    end: new Date(endDateTime),
    summary: className || 'Self-Defense Class',
    description: description || 'Self-defense class registration confirmed. Check your email for preparation tips and waiver information.',
    location: location || 'Walnut Creek, CA',
    url: 'https://www.streetwiseselfdefense.com',
    organizer: {
      name: 'Streetwise Self Defense',
      email: organizerEmail || 'info@streetwiseselfdefense.com'
    },
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    sequence: 0
  });

  return calendar.toString();
}

// Usage in /api/verify-payment endpoint:
async function verifyPaymentHandler(req, res) {
  try {
    // ... existing code to fetch booking, schedule, class data ...

    // Construct datetime strings for calendar
    const classDate = schedule.fields?.Date; // e.g., "2025-03-15"
    const startTime = schedule.fields?.['Start Time']; // e.g., "10:00 AM"
    const endTime = schedule.fields?.['End Time']; // e.g., "12:00 PM"

    // Convert to ISO datetime format
    const startDateTime = convertToISODateTime(classDate, startTime);
    const endDateTime = convertToISODateTime(classDate, endTime);

    // Prepare calendar data
    const calendarData = {
      className: className,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      location: location || 'Walnut Creek, CA',
      description: `Self-Defense Class Registration\n\nParticipants: ${booking.fields?.['Number of Participants']}\nInstructor: ${classData.fields?.Instructor || 'TBD'}\n\nPlease arrive 10 minutes early. Wear comfortable athletic clothing.`,
      organizerEmail: 'info@streetwiseselfdefense.com'
    };

    // Generate Google Calendar URL
    const googleCalendarUrl = createGoogleCalendarUrl(calendarData);

    // Generate iCal file content
    const icalContent = createICalFile(calendarData);

    // Send email with calendar attachments
    const emailHtml = await renderAsync(
      RegistrationConfirmationEmail({
        customerName: booking.fields?.['Contact First Name'] || 'Valued Customer',
        className: className,
        classDate: classDate 
          ? new Date(classDate + 'T12:00:00').toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })
          : 'TBD',
        classTime: startTime && endTime ? `${startTime} - ${endTime}` : 'TBD',
        location: location || 'Walnut Creek, CA',
        registeredParticipants: String(booking.fields?.['Number of Participants'] || 1),
        totalAmount: booking.fields?.['Total Amount'] || 0,
        prepTipsUrl: `${getBaseUrl(req)}/class-prep/${scheduleId}`,
        waiverUrl: schedule.fields?.['Waiver URL'] || null,
        googleCalendarUrl: googleCalendarUrl,
        icalAttachment: true
      })
    );

    await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.fields?.['Contact Email'] || '',
      subject: 'Your Self-Defense Class Registration is Confirmed!',
      html: emailHtml,
      attachments: [
        {
          filename: 'class-event.ics',
          content: icalContent,
        }
      ]
    });

    // ... rest of response ...

  } catch (e) {
    console.error('verify-payment error:', e);
    res.status(500).json({ error: e?.message || String(e) });
  }
}

// Helper to convert Airtable date + time to ISO format
function convertToISODateTime(dateString, timeString) {
  // dateString: "2025-03-15"
  // timeString: "10:00 AM" or "2:00 PM"
  
  if (!dateString || !timeString) {
    return new Date().toISOString();
  }

  // Parse time
  const timeParts = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeParts) {
    return new Date(dateString + 'T12:00:00').toISOString();
  }

  let hours = parseInt(timeParts[1]);
  const minutes = parseInt(timeParts[2]);
  const meridiem = timeParts[3].toUpperCase();

  // Convert to 24-hour format
  if (meridiem === 'PM' && hours !== 12) {
    hours += 12;
  } else if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  // Create date object in Pacific Time
  const dateTime = new Date(`${dateString}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-08:00`);
  
  return dateTime.toISOString();
}

export { createGoogleCalendarUrl, createICalFile, convertToISODateTime };
