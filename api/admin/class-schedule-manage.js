// /api/admin/class-schedule-manage.js
// CRUD operations for Class Schedules (create, read single, update, soft-delete)
import jwt from 'jsonwebtoken';

function verifyAuth(req) {
  const JWT_SECRET = process.env.JWT_SECRET;
  const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});

  const token = cookies?.auth_token;
  if (!token) return false;

  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET || !AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (!verifyAuth(req)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const baseUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules`;
  const headers = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };

  // GET - Fetch a single schedule record by ID
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Record ID is required' });
    }

    try {
      const response = await fetch(`${baseUrl}/${id}`, { headers });
      if (!response.ok) {
        throw new Error(`Airtable error: ${response.status}`);
      }
      const record = await response.json();
      return res.json({ record });
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return res.status(500).json({ error: 'Failed to fetch schedule' });
    }
  }

  // POST - Create a new schedule record
  if (req.method === 'POST') {
    try {
      const { fields } = req.body;
      if (!fields) {
        return res.status(400).json({ error: 'Fields are required' });
      }

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Airtable create error:', errorData);
        throw new Error(`Airtable error: ${response.status}`);
      }

      const record = await response.json();
      return res.json({ record });
    } catch (error) {
      console.error('Error creating schedule:', error);
      return res.status(500).json({ error: 'Failed to create schedule' });
    }
  }

  // PATCH - Update an existing schedule record
  if (req.method === 'PATCH') {
    try {
      const { id, fields } = req.body;
      if (!id || !fields) {
        return res.status(400).json({ error: 'Record ID and fields are required' });
      }

      const response = await fetch(`${baseUrl}/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Airtable update error:', errorData);
        throw new Error(`Airtable error: ${response.status}`);
      }

      const record = await response.json();
      return res.json({ record });
    } catch (error) {
      console.error('Error updating schedule:', error);
      return res.status(500).json({ error: 'Failed to update schedule' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
