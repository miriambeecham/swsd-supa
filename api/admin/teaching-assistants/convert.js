// /api/admin/teaching-assistants/convert.js
// POST: Convert a participant to a teaching assistant
// Copies over name, and email/phone if participant is the booker

export default async function handler(req, res) {
  // CORS headers
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
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    console.log(`[CONVERT-TA] Converting participant ${participantId} to teaching assistant`);

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

    console.log(`[CONVERT-TA] Participant name: ${participantFullName}`);

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

        // Check if participant name matches booker name
        const isBooker = 
          participantFirstName.toLowerCase() === bookerFirstName.toLowerCase() &&
          participantLastName.toLowerCase() === bookerLastName.toLowerCase();

        if (isBooker) {
          bookerEmail = booking['Contact Email'] || null;
          bookerPhone = booking['Contact Phone'] || null;
          console.log(`[CONVERT-TA] Participant is the booker, copying email: ${bookerEmail}, phone: ${bookerPhone}`);
        } else {
          console.log(`[CONVERT-TA] Participant is NOT the booker (${bookerFirstName} ${bookerLastName}), no contact info to copy`);
        }
      }
    }

    // Step 3: Check if TA with same email already exists (if we have an email)
    if (bookerEmail) {
      const checkResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assistants`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        const existingTA = checkData.records.find(
          r => r.fields['Email']?.toLowerCase() === bookerEmail.toLowerCase()
        );

        if (existingTA) {
          return res.status(409).json({
            error: 'A teaching assistant with this email already exists',
            existingTA: {
              id: existingTA.id,
              name: existingTA.fields['Name']
            }
          });
        }
      }
    }

    // Step 4: Create the teaching assistant record
    const taFields = {
      'Name': participantFullName,
      'Status': 'Active',
      'Source Participant': [participantId]
    };

    if (bookerEmail) taFields['Email'] = bookerEmail;
    if (bookerPhone) taFields['Phone'] = bookerPhone;

    const createResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assistants`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: taFields })
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create TA: ${errorText}`);
    }

    const result = await createResponse.json();

    console.log(`[CONVERT-TA] Successfully created TA ${result.id} from participant ${participantId}`);

    return res.status(201).json({
      success: true,
      assistant: {
        id: result.id,
        name: result.fields['Name'],
        email: result.fields['Email'] || '',
        phone: result.fields['Phone'] || '',
        status: result.fields['Status'],
        notes: result.fields['Notes'] || '',
        dateAdded: result.fields['Date Added'] || result.createdTime,
        sourceParticipantId: participantId
      },
      contactInfoCopied: !!(bookerEmail || bookerPhone)
    });

  } catch (error) {
    console.error('[CONVERT-TA] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
