// /api/admin/persons.js
// GET: Fetch persons (optionally filtered by role)
// POST: Create a new person
// PATCH: Update an existing person

export default async function handler(req, res) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // ========================================
  // GET - Fetch persons
  // ========================================
  if (req.method === 'GET') {
    try {
      const { role, status } = req.query;

      // Fetch all persons
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Persons`,
        {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch persons');
      }

      const data = await response.json();
      let persons = data.records || [];

      // Filter by role if specified (Roles is a multiple select field)
      if (role) {
        persons = persons.filter(person => {
          const roles = person.fields['Roles'] || [];
          return roles.includes(role);
        });
      }

      // Filter by status if specified
      if (status) {
        persons = persons.filter(person => person.fields['Status'] === status);
      }

      // Map to cleaner format
      const formattedPersons = persons.map(person => ({
        id: person.id,
        name: person.fields['Name'] || '',
        email: person.fields['Email'] || '',
        phone: person.fields['Phone'] || '',
        roles: person.fields['Roles'] || [],
        status: person.fields['Status'] || 'Active',
        notes: person.fields['Notes'] || '',
        emergencyContactName: person.fields['Emergency Contact Name'] || '',
        emergencyContactRelationship: person.fields['Emergency Contact Relationship'] || '',
        emergencyContactPhone: person.fields['Emergency Contact Phone'] || '',
        emergencyContactEmail: person.fields['Emergency Contact Email'] || ''
      }));

      return res.status(200).json({ persons: formattedPersons });

    } catch (error) {
      console.error('Error fetching persons:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ========================================
  // POST - Create a new person
  // ========================================
  if (req.method === 'POST') {
    try {
      const { 
        name, 
        email, 
        phone, 
        roles, 
        notes,
        emergencyContactName,
        emergencyContactRelationship,
        emergencyContactPhone,
        emergencyContactEmail
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Build fields object
      const fields = {
        'Name': name.trim(),
        'Status': 'Active'
      };

      if (email) fields['Email'] = email.trim();
      if (phone) fields['Phone'] = phone.trim();
      if (roles && Array.isArray(roles)) fields['Roles'] = roles;
      if (notes) fields['Notes'] = notes.trim();
      if (emergencyContactName) fields['Emergency Contact Name'] = emergencyContactName.trim();
      if (emergencyContactRelationship) fields['Emergency Contact Relationship'] = emergencyContactRelationship.trim();
      if (emergencyContactPhone) fields['Emergency Contact Phone'] = emergencyContactPhone.trim();
      if (emergencyContactEmail) fields['Emergency Contact Email'] = emergencyContactEmail.trim();

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Persons`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fields })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Airtable error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to create person');
      }

      const data = await response.json();

      const person = {
        id: data.id,
        name: data.fields['Name'] || '',
        email: data.fields['Email'] || '',
        phone: data.fields['Phone'] || '',
        roles: data.fields['Roles'] || [],
        status: data.fields['Status'] || 'Active',
        notes: data.fields['Notes'] || '',
        emergencyContactName: data.fields['Emergency Contact Name'] || '',
        emergencyContactRelationship: data.fields['Emergency Contact Relationship'] || '',
        emergencyContactPhone: data.fields['Emergency Contact Phone'] || '',
        emergencyContactEmail: data.fields['Emergency Contact Email'] || ''
      };

      return res.status(201).json({ person });

    } catch (error) {
      console.error('Error creating person:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ========================================
  // PATCH - Update an existing person
  // ========================================
  if (req.method === 'PATCH') {
    try {
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

      // Build fields object with only provided fields
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

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Persons/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fields })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Airtable error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to update person');
      }

      const data = await response.json();

      const person = {
        id: data.id,
        name: data.fields['Name'] || '',
        email: data.fields['Email'] || '',
        phone: data.fields['Phone'] || '',
        roles: data.fields['Roles'] || [],
        status: data.fields['Status'] || 'Active',
        notes: data.fields['Notes'] || '',
        emergencyContactName: data.fields['Emergency Contact Name'] || '',
        emergencyContactRelationship: data.fields['Emergency Contact Relationship'] || '',
        emergencyContactPhone: data.fields['Emergency Contact Phone'] || '',
        emergencyContactEmail: data.fields['Emergency Contact Email'] || ''
      };

      return res.status(200).json({ person });

    } catch (error) {
      console.error('Error updating person:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
