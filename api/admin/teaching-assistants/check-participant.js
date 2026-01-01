// /api/admin/teaching-assistants/check-participant.js
// GET: Check if a participant has already been converted to a TA

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { participantId } = req.query;

    if (!participantId) {
      return res.status(400).json({ error: 'participantId query parameter is required' });
    }

    console.log(`[CHECK-PARTICIPANT-TA] Checking if participant ${participantId} is already a TA`);

    // Fetch all TAs and filter by Source Participant in JavaScript
    // (Linked record fields don't work well with filterByFormula)
    const taResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assistants`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!taResponse.ok) {
      throw new Error(`Failed to fetch teaching assistants: ${taResponse.status}`);
    }

    const taData = await taResponse.json();
    const allTAs = taData.records || [];

    // Find TA linked to this participant
    const matchingTA = allTAs.find(ta => {
      const sourceParticipantIds = ta.fields['Source Participant'] || [];
      return sourceParticipantIds.includes(participantId);
    });

    if (matchingTA) {
      console.log(`[CHECK-PARTICIPANT-TA] Participant ${participantId} is already TA ${matchingTA.id}`);
      return res.status(200).json({
        isTA: true,
        assistant: {
          id: matchingTA.id,
          name: matchingTA.fields['Name'] || '',
          email: matchingTA.fields['Email'] || '',
          status: matchingTA.fields['Status'] || 'Active'
        }
      });
    }

    // Also check by name match (in case they were added manually)
    // First get the participant's name
    const participantResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants/${participantId}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (participantResponse.ok) {
      const participantData = await participantResponse.json();
      const firstName = participantData.fields['First Name'] || '';
      const lastName = participantData.fields['Last Name'] || '';
      const fullName = `${firstName} ${lastName}`.trim().toLowerCase();

      if (fullName) {
        const nameMatchTA = allTAs.find(ta => {
          const taName = (ta.fields['Name'] || '').toLowerCase();
          return taName === fullName;
        });

        if (nameMatchTA) {
          console.log(`[CHECK-PARTICIPANT-TA] Found TA with matching name: ${nameMatchTA.id}`);
          return res.status(200).json({
            isTA: true,
            matchType: 'name',
            assistant: {
              id: nameMatchTA.id,
              name: nameMatchTA.fields['Name'] || '',
              email: nameMatchTA.fields['Email'] || '',
              status: nameMatchTA.fields['Status'] || 'Active'
            }
          });
        }
      }
    }

    console.log(`[CHECK-PARTICIPANT-TA] Participant ${participantId} is not a TA`);
    return res.status(200).json({ isTA: false });

  } catch (error) {
    console.error('[CHECK-PARTICIPANT-TA] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
