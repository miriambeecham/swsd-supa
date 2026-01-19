// /api/admin/persons.js
// GET: Fetch persons (optionally filtered by role)
// POST: Create a new person
// PATCH: Update an existing person
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
        return res.sta
