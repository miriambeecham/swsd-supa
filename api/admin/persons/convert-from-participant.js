// /api/admin/persons/convert-from-participant.js
// POST: Convert a participant to a person with Teaching Assistant role
// Creates Person record, then creates Teaching Assignment for a class

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { participantId, classScheduleId } = req.body;

    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    console.log(`[CONVERT-PERSON] Converting participant ${participantId} to Person with TA role`);

    // Step 1: Fetch the participant record
    const participantResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants/${participantId}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!participantResponse.ok) {
      if (participantResponse.status === 404) {
        return res.status(404).json({ error: 'Participant not found' });
      }
      throw new Error(`Failed to fetch participant: ${participantResponse.status}`);
    }

    const participantData = await participantResponse.json();
    const participant = participantData.fields;

    const participantFirstName = participant['First Name'] || '';
    const participantLastName = participant['Last Name'] || '';
    const participantFullName = `${participantFirstName} ${participantLastName}`.trim();

    if (!participantFullName) {
      return res.status(400).json({ error: 'Participant has no name' });
    }

    console.log(`[CONVERT-PERSON] Participant name: ${participantFullName}`);

    // Step 2: Get the linked booking to check if participant is the booker
    const bookingIds = participant['Booking'] || [];
    let bookerEmail = null;
    let bookerPhone = null;

    if (bookingIds.length > 0) {
      const bookingResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingIds[0]}`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );

      if (bookingResponse.ok) {
        const bookingData = await bookingResponse.json();
        const booking = bookingData.fields;

        const bookerFirstName = booking['Contact First Name'] || '';
        const bookerLastName = booking['Contact Last Name'] || '';

        const isBooker = 
          participantFirstName.toLowerCase() === bookerFirstName.toLowerCase() &&
          participantLastName.toLowerCase() === bookerLastName.toLowerCase();

        if (isBooker) {
          bookerEmail = booking['Contact Email'] || null;
          bookerPhone = booking['Contact Phone'] || null;
          console.log(`[CONVERT-PERSON] Participant is the booker, copying email: ${bookerEmail}, phone: ${bookerPhone}`);
        } else {
          console.log(`[CONVERT-PERSON] Participant is NOT the booker (${bookerFirstName} ${bookerLastName})`);
        }
      }
    }

    // Step 3: Check if Person with same email already exists
    let existingPerson = null;
    
    if (bookerEmail) {
      const checkResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Persons`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        existingPerson = checkData.records.find(
          r => r.fields['Email']?.toLowerCase() === bookerEmail.toLowerCase()
        );
      }
    }

    // Also check by name match if no email match
    if (!existingPerson) {
      const checkResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Persons`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        existingPerson = checkData.records.find(
          r => r.fields['Name']?.toLowerCase() === participantFullName.toLowerCase()
        );
      }
    }

    let personId;
    let personRecord;
    let wasExisting = false;

    if (existingPerson) {
      // Person exists - just add TA role if not already present
      console.log(`[CONVERT-PERSON] Found existing person: ${existingPerson.id}`);
      personId = existingPerson.id;
      wasExisting = true;

      const currentRoles = existingPerson.fields['Roles'] || [];
      if (!currentRoles.includes('Teaching Assistant')) {
        const updatedRoles = [...currentRoles, 'Teaching Assistant'];
        
        const updateResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Persons/${personId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fields: { 'Roles': updatedRoles }
            })
          }
        );

        if (updateResponse.ok) {
          personRecord = await updateResponse.json();
        }
      } else {
        personRecord = existingPerson;
      }
    } else {
      // Create new Person
      console.log(`[CONVERT-PERSON] Creating new person`);
      
      const personFields = {
        'Name': participantFullName,
        'Roles': ['Teaching Assistant'],
        'Status': 'Active',
        'Source Participant': [participantId]
      };

      if (bookerEmail) personFields['Email'] = bookerEmail;
      if (bookerPhone) personFields['Phone'] = bookerPhone;

      const createResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Persons`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fields: personFields })
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create person: ${errorText}`);
      }

      personRecord = await createResponse.json();
      personId = personRecord.id;
    }

    // Step 4: Create Teaching Assignment if classScheduleId provided
    let assignmentCreated = false;
    let assignmentRecord = null;

    if (classScheduleId) {
      // Check if assignment already exists
      const checkAssignmentResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assignments`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );

      let assignmentExists = false;
      if (checkAssignmentResponse.ok) {
        const checkData = await checkAssignmentResponse.json();
        assignmentExists = checkData.records.some(a => {
          const aPersonId = a.fields['Person']?.[0];
          const aScheduleId = a.fields['Class Schedule']?.[0];
          return aPersonId === personId && aScheduleId === classScheduleId;
        });
      }

      if (!assignmentExists) {
        const assignmentResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assignments`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fields: {
                'Person': [personId],
                'Class Schedule': [classScheduleId]
              }
            })
          }
        );

        if (assignmentResponse.ok) {
          assignmentRecord = await assignmentResponse.json();
          assignmentCreated = true;
        }
      }
    }

    console.log(`[CONVERT-PERSON] Success - Person: ${personId}, Assignment created: ${assignmentCreated}`);

    const fields = personRecord.fields || personRecord;

    return res.status(201).json({
      success: true,
      wasExisting,
      person: {
        id: personId,
        name: fields['Name'] || participantFullName,
        email: fields['Email'] || '',
        phone: fields['Phone'] || '',
        roles: fields['Roles'] || ['Teaching Assistant'],
        status: fields['Status'] || 'Active'
      },
      assignmentCreated,
      assignment: assignmentRecord ? {
        id: assignmentRecord.id,
        assignmentId: assignmentRecord.fields['Assignment ID']
      } : null,
      contactInfoCopied: !!(bookerEmail || bookerPhone)
    });

  } catch (error) {
    console.error('[CONVERT-PERSON] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
