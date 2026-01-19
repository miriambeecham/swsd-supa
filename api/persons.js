// /api/admin/persons.js
// GET: List all persons (optionally filter by role)
// POST: Create new person
// PATCH: Update existing person

export default async function handler(req, res) {
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
    // GET - List all persons
    if (req.method === 'GET') {
      const { role } = req.query;

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Persons`,
        { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
      );

      if (!response.ok) {
        throw new Error(`Airtable error: ${response.status}`);
      }

      const data = await response.json();
      let persons = (data.records || []).map(record => ({
        id: record.id,
        name: record.fields['Name'] || '',
        email: record.fields['Email'] || '',
        phone: record.fields['Phone'] || '',
        roles: record.fields['Roles'] || [],
        status: record.fields['Status'] || 'Active',
        notes: record.fields['Notes'] || '',
        emergencyContactName: record.fields['Emergency Contact Name'] || '',
        emergencyContactRelationship: record.fields['Emergency Contact Relationship'] || '',
        emergencyContactPhone: record.fields['Emergency Contact Phone'] || '',
        emergencyContactEmail: record.fields['Emergency Contact Email'] || '',
        dateAdded: record.fields['Date Added'] || record.createdTime,
        sourceParticipantId: record.fields['Source Participant']?.[0] || null,
        teachingAssignmentIds: record.fields['Teaching Assignments'] || []
      }));

      // Filter by role if specified
      if (role) {
        persons = persons.filter(p => p.roles.includes(role));
      }

      // Sort by name
      persons.sort((a, b) => a.name.localeCompare(b.name));

      return res.status(200).json({ persons });
    }

    // POST - Create new person
    if (req.method === 'POST') {
      const { 
        name, 
        email, 
        phone, 
        roles,
        notes, 
        sourceParticipantId,
        emergencyContactName,
        emergencyContactRelationship,
        emergencyContactPhone,
        emergencyContactEmail
      } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Check if person with same email already exists (if email provided)
      if (email) {
        const checkResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Persons`,
          { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
        );
        
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          const existingPerson = checkData.records.find(
            r => r.fields['Email']?.toLowerCase() === email.toLowerCase()
          );
          
          if (existingPerson) {
            return res.status(409).json({ 
              error: 'A person with this email already exists',
              existingPerson: {
                id: existingPerson.id,
                name: existingPerson.fields['Name'],
                roles: existingPerson.fields['Roles'] || []
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
      if (roles && roles.length > 0) fields['Roles'] = roles;
      if (notes) fields['Notes'] = notes.trim();
      if (sourceParticipantId) fields['Source Participant'] = [sourceParticipantId];
      if (emergencyContactName) fields['Emergency Contact Name'] = emergencyContactName.trim();
      if (emergencyContactRelationship) fields['Emergency Contact Relationship'] = emergencyContactRelationship.trim();
      if (emergencyContactPhone) fields['Emergency Contact Phone'] = emergencyContactPhone.trim();
      if (emergencyContactEmail) fields['Emergency Contact Email'] = emergencyContactEmail.trim();

      const createResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Persons`,
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
        throw new Error(`Failed to create person: ${errorText}`);
      }

      const result = await createResponse.json();

      return res.status(201).json({
        success: true,
        person: {
          id: result.id,
          name: result.fields['Name'],
          email: result.fields['Email'] || '',
          phone: result.fields['Phone'] || '',
          roles: result.fields['Roles'] || [],
          status: result.fields['Status'],
          notes: result.fields['Notes'] || '',
          dateAdded: result.fields['Date Added'] || result.createdTime,
          emergencyContactName: result.fields['Emergency Contact Name'] || '',
          emergencyContactRelationship: result.fields['Emergency Contact Relationship'] || '',
          emergencyContactPhone: result.fields['Emergency Contact Phone'] || '',
          emergencyContactEmail: result.fields['Emergency Contact Email'] || ''
        }
      });
    }

    // PATCH - Update existing person
    if (req.method === 'PATCH') {
      const { 
        id, 
        name, 
        email, 
        phone, 
        roles,
        status, 
        notes,
        emergencyContactName,
        emergencyContactRelationship,
        emergencyContactPhone,
        emergencyContactEmail
      } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Person ID is required' });
      }

      const fields = {};
      if (name !== undefined) fields['Name'] = name.trim();
      if (email !== undefined) fields['Email'] = email.trim();
      if (phone !== undefined) fields['Phone'] = phone.trim();
      if (roles !== undefined) fields['Roles'] = roles;
      if (status !== undefined) fields['Status'] = status;
      if (notes !== undefined) fields['Notes'] = notes.trim();
      if (emergencyContactName !== undefined) fields['Emergency Contact Name'] = emergencyContactName.trim();
      if (emergencyContactRelationship !== undefined) fields['Emergency Contact Relationship'] = emergencyContactRelationship.trim();
      if (emergencyContactPhone !== undefined) fields['Emergency Contact Phone'] = emergencyContactPhone.trim();
      if (emergencyContactEmail !== undefined) fields['Emergency Contact Email'] = emergencyContactEmail.trim();

      const updateResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Persons/${id}`,
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
        throw new Error(`Failed to update person: ${errorText}`);
      }

      const result = await updateResponse.json();

      return res.status(200).json({
        success: true,
        person: {
          id: result.id,
          name: result.fields['Name'],
          email: result.fields['Email'] || '',
          phone: result.fields['Phone'] || '',
          roles: result.fields['Roles'] || [],
          status: result.fields['Status'],
          notes: result.fields['Notes'] || '',
          dateAdded: result.fields['Date Added'] || result.createdTime,
          emergencyContactName: result.fields['Emergency Contact Name'] || '',
          emergencyContactRelationship: result.fields['Emergency Contact Relationship'] || '',
          emergencyContactPhone: result.fields['Emergency Contact Phone'] || '',
          emergencyContactEmail: result.fields['Emergency Contact Email'] || ''
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('[PERSONS] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
