// /api/testimonials.js
import { requireSupabase } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    let query = supabase.from('testimonials').select('*');

    const { filter } = req.query;
    if (filter) {
      const recordIdMatch = filter.match(/^RECORD_ID\(\)='([^']+)'$/);
      if (!recordIdMatch) {
        return res.status(400).json({ error: `Unsupported filter formula: ${filter}` });
      }
      query = query.eq('airtable_record_id', recordIdMatch[1]);
    }

    const { data, error } = await query;
    if (error) throw error;

    const testimonials = (data || []).map((row) => {
      // profile_picture was an Airtable attachment array in legacy data;
      // fall back to the explicit string field profile_image_url otherwise.
      let profileImageUrl = null;
      if (typeof row.profile_image_url === 'string') {
        profileImageUrl = row.profile_image_url;
      } else if (Array.isArray(row.profile_picture) && row.profile_picture.length > 0) {
        profileImageUrl = row.profile_picture[0]?.url || null;
      }

      return {
        id: row.airtable_record_id,
        name: row.name || '',
        content: row.content || '',
        rating: parseInt(row.rating) || 5,
        class_type: row.class_type || '',
        platform: row.platform?.toLowerCase(),
        profile_image_url: profileImageUrl,
        review_url: row.original_review_url,
        homepage_position: row.homepage_position,
        is_featured: !!row.is_featured,
        is_published: !!row.is_published,
      };
    });

    res.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
}
