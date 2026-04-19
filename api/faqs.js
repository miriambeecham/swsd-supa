// /api/faqs.js
import { requireSupabase } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    let faqQuery = supabase.from('faq').select('*, categories(airtable_record_id)');

    const { filter } = req.query;
    if (filter) {
      const recordIdMatch = filter.match(/^RECORD_ID\(\)='([^']+)'$/);
      if (!recordIdMatch) {
        return res.status(400).json({ error: `Unsupported filter formula: ${filter}` });
      }
      faqQuery = faqQuery.eq('airtable_record_id', recordIdMatch[1]);
    }

    const [categoriesResult, faqsResult] = await Promise.all([
      supabase.from('categories').select('*'),
      faqQuery,
    ]);
    if (categoriesResult.error) throw categoriesResult.error;
    if (faqsResult.error) throw faqsResult.error;

    const categories = (categoriesResult.data || []).map((row) => ({
      id: row.airtable_record_id,
      name: row.category_name || '',
      displayOrder: row.display_order || 999,
      isActive: !!row.is_active,
      description: row.description || undefined,
    }));

    const faqs = (faqsResult.data || []).map((row) => ({
      id: row.airtable_record_id,
      question: row.question || '',
      answer: row.answer || '',
      categoryId: row.categories?.airtable_record_id || null,
      questionOrder: row.question_order || 999,
      isPublished: !!row.is_published,
    }));

    res.json({ categories, faqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
}
