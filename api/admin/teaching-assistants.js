// /api/admin/teaching-assistants.js
// GET: List all teaching assistants
// POST: Create new teaching assistant
// PATCH: Update existing teaching assistant

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // GET - List all teaching assistants
    if (req.method === 'GET') {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assistants`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );

      if (!response.ok) {
        throw new Error(`Airtable error: ${response.status}`);
      }

      const data = await response.json();
      const assistants = (data.records || []).map(record => ({
        id: record.id,
        name: record.fields['Name'] || '',
        email: record.fields['Email'] || '',
        phone: record.fields['Phone'] || '',
        status: record.fields['Status'] || 'Active',
        notes: record.fields['Notes'] || '',
        dateAdded: record.fields['Date Added'] || record.createdTime,
        sourceParticipantId: record.fields['Source Participant']?.[0] || null
      }));

      // Sort by name
      assistants.sort((a, b) => a.name.localeCompare(b.name));

      return res.status(200).json({ assistants });
    }

    // POST - Create new teaching assistant
    if (req.method === 'POST') {
      const { name, email, phone, notes, sourceParticipantId } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Check if TA with same email already exists (if email provided)
      if (email) {
        const checkResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assistants`,
          { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
        );
        
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          const existingTA = checkData.records.find(
            r => r.fields['Email']?.toLowerCase() === email.toLowerCase()
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

      const fields = {
        'Name': name.trim(),
        'Status': 'Active'
      };

      if (email) fields['Email'] = email.trim();
      if (phone) fields['Phone'] = phone.trim();
      if (notes) fields['Notes'] = notes.trim();
      if (sourceParticipantId) fields['Source Participant'] = [sourceParticipantId];

      const createResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assistants`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fields })
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Failed to create TA: ${errorText}`);
      }

      const result = await createResponse.json();

      return res.status(201).json({
        success: true,
        assistant: {
          id: result.id,
          name: result.fields['Name'],
          email: result.fields['Email'] || '',
          phone: result.fields['Phone'] || '',
          status: result.fields['Status'],
          notes: result.fields['Notes'] || '',
          dateAdded: result.fields['Date Added'] || result.createdTime
        }
      });
    }

    // PATCH - Update existing teaching assistant
    if (req.method === 'PATCH') {
      const { id, name, email, phone, status, notes } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Teaching assistant ID is required' });
      }

      const fields = {};
      if (name !== undefined) fields['Name'] = name.trim();
      if (email !== undefined) fields['Email'] = email.trim();
      if (phone !== undefined) fields['Phone'] = phone.trim();
      if (status !== undefined) fields['Status'] = status;
      if (notes !== undefined) fields['Notes'] = notes.trim();

      const updateResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assistants/${id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fields })
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(`Failed to update TA: ${errorText}`);
      }

      const result = await updateResponse.json();

      return res.status(200).json({
        success: true,
        assistant: {
          id: result.id,
          name: result.fields['Name'],
          email: result.fields['Email'] || '',
          phone: result.fields['Phone'] || '',
          status: result.fields['Status'],
          notes: result.fields['Notes'] || '',
          dateAdded: result.fields['Date Added'] || result.createdTime
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('[TEACHING-ASSISTANTS] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
