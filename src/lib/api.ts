import { airtableApiKey, airtableBaseId, isAirtableConfigured } from './supabase';

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

// Get classes
export async function getClasses(filterFormula?: string) {
  const endpoint = filterFormula 
    ? `/Classes?filterByFormula=${encodeURIComponent(filterFormula)}`
    : '/Classes';

  const data = await makeAirtableRequest(endpoint);

  return {
    records: data.records.map((record: any) => ({
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
    }))
  };
}

// Get schedules
export async function getSchedules(filterFormula?: string) {
  const endpoint = filterFormula 
    ? `/Class%20Schedules?filterByFormula=${encodeURIComponent(filterFormula)}`
    : '/Class%20Schedules';

  const data = await makeAirtableRequest(endpoint);

  return {
    records: data.records.map((record: any) => ({
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
    }))
  };
}

// Legacy functions for backward compatibility
export async function getClassesWithSchedules() {
  return getClasses();
}

export async function getUpcomingSchedules(classType?: string) {
  return getSchedules();
}

export async function getMotherDaughterClasses() {
  return getUpcomingSchedules('mothers-daughters');
}

export async function getAdultTeenClasses() {
  return getUpcomingSchedules('adult-teen');
}