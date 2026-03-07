// /api/admin/class-schedule-assistants-list.js
// GET: Get teaching assistants assigned to a specific class schedule

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
    const { classScheduleId } = req.query;

    if (!classScheduleId) {
      return res.status(400).json({ error: 'classScheduleId query parameter is required' });
    }

    console.log(`[CLASS-ASSISTANTS-LIST] Fetching TAs for class ${classScheduleId}`);

    // Step 1: Fetch the class schedule to get linked TA IDs
    const scheduleResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${classScheduleId}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!scheduleResponse.ok) {
      if (scheduleResponse.status === 404) {
        return res.status(404).json({ error: 'Class schedule not found' });
      }
      throw new Error(`Failed to fetch class schedule: ${scheduleResponse.status}`);
    }

    const scheduleData = await scheduleResponse.json();
    const taIds = scheduleData.fields['Teaching Assistants'] || [];

    if (taIds.length === 0) {
      return res.status(200).json({ assistants: [] });
    }

    // Step 2: Fetch the teaching assistant records
    // Build OR filter with all TA record IDs
    const orConditions = taIds.map(id => `RECORD_ID()="${id}"`).join(',');
    const filterFormula = `OR(${orConditions})`;

    const taResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Teaching%20Assistants?filterByFormula=${encodeURIComponent(filterFormula)}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!taResponse.ok) {
      throw new Error(`Failed to fetch teaching assistants: ${taResponse.status}`);
    }

    const taData = await taResponse.json();
    const assistants = (taData.records || []).map(record => ({
      id: record.id,
      name: record.fields['Name'] || '',
      email: record.fields['Email'] || '',
      phone: record.fields['Phone'] || '',
      status: record.fields['Status'] || 'Active',
      notes: record.fields['Notes'] || ''
    }));

    console.log(`[CLASS-ASSISTANTS-LIST] Found ${assistants.length} TAs for class ${classScheduleId}`);

    return res.status(200).json({ assistants });

  } catch (error) {
    console.error('[CLASS-ASSISTANTS-LIST] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
