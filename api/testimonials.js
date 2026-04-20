// /api/testimonials.js
import { requireSupabase, outerId } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    let query = supabase.from('testimonials').select('*');

    // Translate the Airtable filterByFormula patterns the frontend actually uses
    // into equivalent Supabase predicates. Unknown formulas return 400 so the
    // caller can add an explicit pattern here rather than silently over-fetching.
    const { filter } = req.query;
    if (filter) {
      const recordId = filter.match(/^RECORD_ID\(\)='([^']+)'$/);
      // HomePage — all homepage-positioned published testimonials
      const homepageAll = filter.match(
        /^AND\(\{Is [Pp]ublished\}=1,\{Homepage position\}!="None",\{Homepage position\}!=""\)$/,
      );
      // AboutPage — exact homepage_position match
      const homepageExact = filter.match(
        /^AND\(\{Is [Pp]ublished\}=1,\{Homepage position\}="([^"]+)"\)$/,
      );
      // CorporatePage — homepage_position in (A, B)
      const homepageOr = filter.match(
        /^AND\(\{Is [Pp]ublished\}=1,OR\(\{Homepage position\}="([^"]+)",\{Homepage position\}="([^"]+)"\)\)$/,
      );

      if (recordId) {
        query = query.eq('airtable_record_id', recordId[1]);
      } else if (homepageAll) {
        query = query
          .eq('is_published', true)
          .not('homepage_position', 'is', null)
          .neq('homepage_position', '')
          .neq('homepage_position', 'None');
      } else if (homepageExact) {
        query = query.eq('is_published', true).eq('homepage_position', homepageExact[1]);
      } else if (homepageOr) {
        query = query
          .eq('is_published', true)
          .in('homepage_position', [homepageOr[1], homepageOr[2]]);
      } else {
        return res.status(400).json({ error: `Unsupported filter formula: ${filter}` });
      }
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
        id: outerId(row),
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
