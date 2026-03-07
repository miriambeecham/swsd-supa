// /api/admin/class-schedule-assistants.js
// PATCH: Assign or unassign teaching assistants to a class schedule

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { classScheduleId, teachingAssistantIds } = req.body;

    if (!classScheduleId) {
      return res.status(400).json({ error: 'Class schedule ID is required' });
    }

    if (!Array.isArray(teachingAssistantIds)) {
      return res.status(400).json({ error: 'teachingAssistantIds must be an array' });
    }

    console.log(`[CLASS-ASSISTANTS] Updating TAs for class ${classScheduleId}:`, teachingAssistantIds);

    // Update the class schedule with the new teaching assistants
    // Pass empty array to clear all TAs, or array of IDs to set them
    const fields = {
      'Teaching Assistants': teachingAssistantIds.length > 0 ? teachingAssistantIds : null
    };

    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${classScheduleId}`,
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
      throw new Error(`Failed to update class schedule: ${errorText}`);
    }

    const result = await updateResponse.json();

    console.log(`[CLASS-ASSISTANTS] Successfully updated TAs for class ${classScheduleId}`);

    return res.status(200).json({
      success: true,
      classScheduleId: result.id,
      teachingAssistantIds: result.fields['Teaching Assistants'] || []
    });

  } catch (error) {
    console.error('[CLASS-ASSISTANTS] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
