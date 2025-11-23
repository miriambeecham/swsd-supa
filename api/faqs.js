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

    // Fetch Categories
    const categoriesResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Categories`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!categoriesResponse.ok) {
      throw new Error(`Airtable Categories API error: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
    }

    const categoriesData = await categoriesResponse.json();

    // Fetch FAQs
    const { filter } = req.query;
    const faqEndpoint = filter
      ? `/FAQ?filterByFormula=${encodeURIComponent(filter)}`
      : '/FAQ';

    const faqsResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}${faqEndpoint}`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!faqsResponse.ok) {
      throw new Error(`Airtable FAQ API error: ${faqsResponse.status} ${faqsResponse.statusText}`);
    }

    const faqsData = await faqsResponse.json();

    // Map categories to expected format
    const categories = (categoriesData.records || []).map((record) => ({
      id: record.id,
      name: record.fields['Category Name'] || '',
      displayOrder: record.fields['Display Order'] || 999,
      isActive: !!record.fields['Is Active'],
      description: record.fields.Description || undefined,
    }));

    // Map FAQs to expected format
    const faqs = (faqsData.records || []).map((record) => {
      const categoryIds = record.fields.Category || [];
      const categoryId = Array.isArray(categoryIds) && categoryIds.length > 0 
        ? categoryIds[0] 
        : null;

      return {
        id: record.id,
        question: record.fields.Question || '',
        answer: record.fields.Answer || '',
        categoryId: categoryId,
        questionOrder: record.fields['Question Order'] || 999,
        isPublished: !!record.fields['Is Published'],
      };
    });

    // Return both categories and FAQs
    res.json({ categories, faqs });

  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
}
