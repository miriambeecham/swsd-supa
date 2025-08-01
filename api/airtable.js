// Helper function to create filter URL parameter
function createFilterParam(filterFormula) {
  return filterFormula ? `?filterByFormula=${encodeURIComponent(filterFormula)}` : '';
}

// Get testimonials from Airtable
export async function getTestimonials(filterFormula) {
  const filterParam = createFilterParam(filterFormula);
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Testimonials${filterParam}`;

  console.log('Fetching testimonials from:', url);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return data.records.map(record => {
    // Handle profile picture - could be direct URL or Airtable attachment
    let profileImageUrl = null;
    const profileField = record.fields['Profile Image URL'];

    if (typeof profileField === 'string') {
      // Direct URL
      profileImageUrl = profileField;
    } else if (Array.isArray(profileField) && profileField.length > 0) {
      // Airtable attachment format
      profileImageUrl = profileField[0].url;
    }

    return {
      id: record.id,
      name: record.fields.Name || '',
      content: record.fields.Content || '',
      rating: parseInt(record.fields.Rating) || 5,
      class_type: record.fields['Class Type'] || '',
      platform: record.fields.Platform?.toLowerCase(),
      profile_image_url: profileImageUrl,
      review_url: record.fields['Original Review URL'],
      homepage_position: record.fields['Homepage position'],
      is_featured: record.fields['Is Featured'] || false,
      is_published: record.fields['Is Published'] || false,
    };
  });
}