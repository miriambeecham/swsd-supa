// /api/faqs.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return res.status(500).json({ error: 'Airtable not configured' });
    }

    const { filter } = req.query;
    // ✅ FIXED: Changed /FAQs to /FAQ (matching Airtable table name)
    const endpoint = filter
      ? `/FAQ?filterByFormula=${encodeURIComponent(filter)}`
      : '/FAQ';

    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Map to expected format
    const faqs = (data.records || []).map((record) => ({
      id: record.id,
      question: record.fields.Question || '',
      answer: record.fields.Answer || '',
      category: record.fields.Category || '',
      order: record.fields['Question Order'] || 0,  // ✅ Updated to match schema
      is_published: !!record.fields['Is Published'],
      created_at: record.createdTime,
    }));

    res.json(faqs);

  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
}
