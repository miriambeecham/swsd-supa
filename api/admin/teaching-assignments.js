// /api/admin/teaching-assignments.js
// GET: Fetch teaching assignments (optionally filtered by classScheduleId)
// POST: Create a new teaching assignment
// DELETE: Remove a teaching assignment
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
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

  // ========================================
  // GET - Fetch teaching assignments
  // ========================================
  if (req.method === 'GET') {
    try {
      const { classScheduleId } = req.query;

      // Fetch all teaching assignments
      const assignmentsResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assignments`,
        {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        }
      );

      if (!assignmentsResponse.ok) {
        throw new Error('Failed to fetch teaching assignments');
      }

      const assignmentsData = await assignmentsResponse.json();
      let assignments = assignmentsData.records || [];

      // Filter by classScheduleId if provided (linked record field)
      if (classScheduleId) {
        assignments = assignments.filter(assignment => {
          const linkedClassIds = assignment.fields['Class Schedule'] || [];
          return linkedClassIds.includes(classScheduleId);
        });
      }

      // Get unique person IDs to fetch person details
      const personIds = [...new Set(
        assignments
          .map(a => a.fields['Person']?.[0])
          .filter(Boolean)
      )];

      // Fetch person details if there are any
      let personsMap = {};
      if (personIds.length > 0) {
        const personsResponse = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Persons`,
          {
            headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
          }
        );

        if (personsResponse.ok) {
          const personsData = await personsResponse.json();
          const persons = personsData.records || [];
          
          persons.forEach(person => {
            if (personIds.includes(person.id)) {
              personsMap[person.id] = {
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
              };
            }
          });
        }
      }

      // Format assignments with person details
      const formattedAssignments = assignments.map(assignment => {
        const personId = assignment.fields['Person']?.[0];
        return {
          id: assignment.id,
          personId: personId || null,
          person: personId ? personsMap[personId] || null : null,
          classScheduleId: assignment.fields['Class Schedule']?.[0] || null,
          assignmentNotes: assignment.fields['Assignment Notes'] || ''
        };
      });

      return res.status(200).json({ assignments: formattedAssignments });

    } catch (error) {
      console.error('Error fetching teaching assignments:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ========================================
  // POST - Create a new teaching assignment
  // ========================================
  if (req.method === 'POST') {
    try {
      const { personId, classScheduleId, assignmentNotes } = req.body;

      if (!personId) {
        return res.status(400).json({ error: 'Person ID is required' });
      }

      if (!classScheduleId) {
        return res.status(400).json({ error: 'Class Schedule ID is required' });
      }

      // Check if assignment already exists
      const existingResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assignments`,
        {
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        }
      );

      if (existingResponse.ok) {
        const existingData = await existingResponse.json();
        const existingAssignment = existingData.records?.find(a => {
          const linkedPersonIds = a.fields['Person'] || [];
          const linkedClassIds = a.fields['Class Schedule'] || [];
          return linkedPersonIds.includes(personId) && linkedClassIds.includes(classScheduleId);
        });

        if (existingAssignment) {
          return res.status(400).json({ error: 'This person is already assigned to this class' });
        }
      }

      // Create the assignment
      const fields = {
        'Person': [personId],
        'Class Schedule': [classScheduleId]
      };

      if (assignmentNotes) {
        fields['Assignment Notes'] = assignmentNotes.trim();
      }

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assignments`,
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
        throw new Error(errorData.error?.message || 'Failed to create teaching assignment');
      }

      const data = await response.json();

      return res.status(201).json({ 
        assignment: {
          id: data.id,
          personId: data.fields['Person']?.[0] || null,
          classScheduleId: data.fields['Class Schedule']?.[0] || null,
          assignmentNotes: data.fields['Assignment Notes'] || ''
        }
      });

    } catch (error) {
      console.error('Error creating teaching assignment:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ========================================
  // DELETE - Remove a teaching assignment
  // ========================================
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Assignment ID is required' });
      }

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assignments/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Airtable error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to delete teaching assignment');
      }

      return res.status(200).json({ success: true, deletedId: id });

    } catch (error) {
      console.error('Error deleting teaching assignment:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
