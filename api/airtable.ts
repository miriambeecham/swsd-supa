
import { airtableApiKey, airtableBaseId, isAirtableConfigured } from '../src/lib/supabase';

const AIRTABLE_BASE_URL = `https://api.airtable.com/v0/${airtableBaseId}`;

async function makeAirtableRequest(endpoint: string, options: RequestInit = {}) {
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

// Get testimonials
export async function getTestimonials(filterFormula?: string) {
  const endpoint = filterFormula 
    ? `/Testimonials?filterByFormula=${encodeURIComponent(filterFormula)}`
    : '/Testimonials';
  
  const data = await makeAirtableRequest(endpoint);
  
  return data.records.map((record: any) => ({
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
  
  return data.records.map((record: any) => ({
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
  
  return data.records.map((record: any) => ({
    id: record.id,
    name: record.fields.Name || '',
    displayOrder: record.fields['Display Order'] || 999,
  }));
}

// Get classes
export async function getClasses(filterFormula?: string) {
  const endpoint = filterFormula 
    ? `/Classes?filterByFormula=${encodeURIComponent(filterFormula)}`
    : '/Classes';
  
  const data = await makeAirtableRequest(endpoint);
  
  return data.records.map((record: any) => ({
    id: record.id,
    title: record.fields.Title || '',
    description: record.fields.Description || '',
    type: record.fields.Type || '',
    date: record.fields.Date || '',
    time: record.fields.Time || '',
    location: record.fields.Location || '',
    price: record.fields.Price || 0,
    maxParticipants: record.fields['Max Participants'] || 0,
    availableSpots: record.fields['Available Spots'] || 0,
    externalRegistrationUrl: record.fields['External Registration URL'],
    weHandleRegistration: record.fields['We Handle Registration'] || false,
    isActive: record.fields['Is Active'] || false,
  }));
}

// Create contact inquiry
export async function createContactInquiry(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  message?: string;
  inquiryType: string;
}) {
  const response = await makeAirtableRequest('/Contact Inquiries', {
    method: 'POST',
    body: JSON.stringify({
      fields: {
        'First Name': data.firstName,
        'Last Name': data.lastName,
        'Email': data.email,
        'Phone': data.phone,
        'City': data.city,
        'State': data.state,
        'Message': data.message,
        'Inquiry Type': data.inquiryType,
        'Status': 'new',
      }
    }),
  });

  return response;
}

// Create booking
export async function createBooking(data: {
  scheduleId: string;
  participantName: string;
  participantEmail: string;
  participantPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  specialRequirements?: string;
}) {
  const response = await makeAirtableRequest('/Bookings', {
    method: 'POST',
    body: JSON.stringify({
      fields: {
        'Schedule ID': data.scheduleId,
        'Participant Name': data.participantName,
        'Participant Email': data.participantEmail,
        'Participant Phone': data.participantPhone,
        'Emergency Contact Name': data.emergencyContactName,
        'Emergency Contact Phone': data.emergencyContactPhone,
        'Special Requirements': data.specialRequirements,
        'Payment Status': 'pending',
      }
    }),
  });

  return response;
}

// Update booking payment
export async function updateBookingPayment(
  bookingId: string,
  paymentIntentId: string,
  amountPaid: number
) {
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
