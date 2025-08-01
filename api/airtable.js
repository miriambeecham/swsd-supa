
// Server-side Airtable API functions
const airtableApiKey = process.env.AIRTABLE_API_KEY;
const airtableBaseId = process.env.AIRTABLE_BASE_ID;

// Check if we have valid Airtable credentials
const hasValidCredentials = airtableApiKey && 
  airtableBaseId && 
  airtableApiKey !== 'your_airtable_api_key_here' &&
  airtableBaseId !== 'your_airtable_base_id_here';

const isAirtableConfigured = hasValidCredentials;

if (!hasValidCredentials) {
  console.warn('⚠️ Airtable not configured properly. Some features may not work.');
  console.warn('Please set up your AIRTABLE_API_KEY and AIRTABLE_BASE_ID environment variables.');
}

const AIRTABLE_BASE_URL = `https://api.airtable.com/v0/${airtableBaseId}`;

async function makeAirtableRequest(endpoint, options = {}) {
  if (!isAirtableConfigured) {
    throw new Error('Airtable not configured properly');
  }

  const response = await fetch(`${AIRTABLE_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${airtableApiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Get classes
export async function getClasses(filterFormula) {
  const endpoint = filterFormula 
    ? `/Classes?filterByFormula=${encodeURIComponent(filterFormula)}`
    : '/Classes';
  
  const data = await makeAirtableRequest(endpoint);
  
  return data.records.map((record) => ({
    id: record.id,
    fields: {
      'Class Name': record.fields['Class Name'] || record.fields.Title,
      'Description': record.fields.Description,
      'Type': record.fields.Type,
      'Age Range': record.fields['Age Range'],
      'Duration': record.fields.Duration,
      'Max Participants': record.fields['Max Participants'],
      'Location': record.fields.Location,
      'Instructor': record.fields.Instructor,
      'Price': record.fields.Price,
      'Partner Organization': record.fields['Partner Organization'],
      'Booking Method': record.fields['Booking Method'],
      'Registration Instructions': record.fields['Registration Instructions'],
      'Is Active': record.fields['Is Active'],
    }
  }));
}

// Get schedules
export async function getSchedules(filterFormula) {
  const endpoint = filterFormula 
    ? `/Class%20Schedules?filterByFormula=${encodeURIComponent(filterFormula)}`
    : '/Class%20Schedules';
  
  const data = await makeAirtableRequest(endpoint);
  
  return data.records.map((record) => ({
    id: record.id,
    fields: {
      'Class': record.fields.Class,
      'Date': record.fields.Date,
      'Start Time': record.fields['Start Time'],
      'End Time': record.fields['End Time'],
      'Booking URL': record.fields['Booking URL'],
      'Registration Opens': record.fields['Registration Opens'],
      'Is Cancelled': record.fields['Is Cancelled'],
      'Special Notes': record.fields['Special Notes'],
      'Pricing Unit': record.fields['Pricing Unit'],
    }
  }));
}

// Get testimonials
export async function getTestimonials(filterFormula) {
  const endpoint = filterFormula 
    ? `/Testimonials?filterByFormula=${encodeURIComponent(filterFormula)}`
    : '/Testimonials';
  
  const data = await makeAirtableRequest(endpoint);
  
  return data.records.map((record) => ({
    id: record.id,
    name: record.fields.Name || '',
    content: record.fields.Content || '',
    rating: parseInt(record.fields.Rating) || 5,
    class_type: record.fields['Class type'] || '',
    platform: record.fields.Platform?.toLowerCase(),
    profile_image_url: record.fields['Profile image URL'],
    review_url: record.fields['Original review URL'],
    homepage_position: record.fields['Homepage position'],
    is_published: record.fields['Is published'] || false,
  }));
}

// Get FAQs
export async function getFAQs() {
  const data = await makeAirtableRequest('/FAQ?filterByFormula={Is Published}=1&sort[0][field]=Question Order');
  
  return data.records.map((record) => ({
    id: record.id,
    question: record.fields.Question || '',
    answer: record.fields.Answer || '',
    categoryId: record.fields.Category?.[0] || 'other',
    questionOrder: record.fields['Question Order'] || 999,
    isPublished: record.fields['Is Published'] || false,
  }));
}

// Get FAQ categories
export async function getFAQCategories() {
  const data = await makeAirtableRequest('/FAQ Categories?sort[0][field]=Display Order');
  
  return data.records.map((record) => ({
    id: record.id,
    name: record.fields.Name || '',
    displayOrder: record.fields['Display Order'] || 999,
  }));
}

// Update booking payment
export async function updateBookingPayment(bookingId, paymentIntentId, amountPaid) {
  const response = await makeAirtableRequest(`/Bookings/${bookingId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fields: {
        'Payment Status': 'completed',
        'Stripe Payment Intent ID': paymentIntentId,
        'Amount Paid Cents': amountPaid,
      }
    }),
  });

  return response;
}
