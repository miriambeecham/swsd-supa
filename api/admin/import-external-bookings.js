// /api/admin/import-external-bookings.js
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

    // Parse CSV data from request
    const { csvData } = req.body;
    
    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({ error: 'Invalid CSV data format' });
    }

    console.log(`[IMPORT] Processing ${csvData.length} rows`);

    // Group rows by bookingGroupId
    const bookingGroups = new Map();
    
    for (const row of csvData) {
      const groupId = row.bookingGroupId;
      if (!bookingGroups.has(groupId)) {
        bookingGroups.set(groupId, []);
      }
      bookingGroups.get(groupId).push(row);
    }

    console.log(`[IMPORT] Found ${bookingGroups.size} booking groups`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    // Process each booking group
    for (const [groupId, participants] of bookingGroups.entries()) {
      try {
        console.log(`[IMPORT] Processing booking group ${groupId} with ${participants.length} participants`);

        // Validate: Must have at least one participant
        if (participants.length === 0) {
          throw new Error('Booking group has no participants');
        }

        // Find the adult (16+) with email - this becomes the booking contact
        const adult = participants.find(p => p.ageGroup === '16+' && p.email);
        
        if (!adult) {
          throw new Error('Each booking group must have one adult (16+) with an email address');
        }

        // Get class schedule ID (should be same for all in group)
        const classScheduleId = participants[0].classScheduleId;
        
        if (!classScheduleId) {
          throw new Error('Missing classScheduleId');
        }

        // Verify all participants have the same classScheduleId
        const allSameSchedule = participants.every(p => p.classScheduleId === classScheduleId);
        if (!allSameSchedule) {
          throw new Error('All participants in a booking group must have the same classScheduleId');
        }

        // Fetch class schedule to verify it exists
        const scheduleResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${classScheduleId}`,
          { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
        );

        if (!scheduleResponse.ok) {
          throw new Error(`Class schedule ${classScheduleId} not found`);
        }

        // Create booking record
        const bookingFields = {
          'Class Schedule': [classScheduleId],
          'Booking Date': new Date().toISOString().split('T')[0],
          'Status': 'Confirmed',
          'Contact First Name': adult.firstName,
          'Contact Last Name': adult.lastName,
          'Contact Email': adult.email,
          'Contact Phone': adult.phone || '',
          'Number of Participants': participants.length,
          'Total Amount': 0, // External registration - no payment
          'Payment Status': 'Completed', // Mark as completed so it doesn't look pending
          'Payment Date': new Date().toISOString().split('T')[0]
        };

        const bookingResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: bookingFields })
          }
        );

        if (!bookingResponse.ok) {
          const errorText = await bookingResponse.text();
          throw new Error(`Failed to create booking: ${errorText}`);
        }

        const bookingResult = await bookingResponse.json();
        const bookingId = bookingResult.id;

        console.log(`[IMPORT] Created booking ${bookingId} for group ${groupId}`);

        // Create participant records
        const participantIds = [];
        
        for (let i = 0; i < participants.length; i++) {
          const participant = participants[i];
          
          const participantFields = {
            'Booking': [bookingId],
            'First Name': participant.firstName,
            'Last Name': participant.lastName,
            'Age Group': participant.ageGroup,
            'Participant Number': i + 1
          };

          const participantResponse = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ fields: participantFields })
            }
          );

          if (!participantResponse.ok) {
            const errorText = await participantResponse.text();
            throw new Error(`Failed to create participant: ${errorText}`);
          }

          const participantResult = await participantResponse.json();
          participantIds.push(participantResult.id);
          
          console.log(`[IMPORT] Created participant ${participantResult.id}: ${participant.firstName} ${participant.lastName}`);
        }

        // Update booking with participant links
        await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fields: {
                'Participants': participantIds
              }
            })
          }
        );

        successCount++;
        results.push({
          bookingGroupId: groupId,
          success: true,
          bookingId,
          participantCount: participants.length,
          contactEmail: adult.email
        });

      } catch (error) {
        errorCount++;
        console.error(`[IMPORT] Error processing booking group ${groupId}:`, error);
        results.push({
          bookingGroupId: groupId,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`[IMPORT] Complete. Success: ${successCount}, Errors: ${errorCount}`);

    return res.json({
      success: true,
      totalGroups: bookingGroups.size,
      successCount,
      errorCount,
      results
    });

  } catch (error) {
    console.error('[IMPORT] Fatal error:', error);
    return res.status(500).json({ error: error.message });
  }
}
