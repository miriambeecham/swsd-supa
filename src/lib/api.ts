
import type { Class, ClassSchedule, Booking } from './supabase';

// Fetch all active classes with their schedules
export async function getClassesWithSchedules() {
  try {
    const response = await fetch('/api/classes');
    if (!response.ok) {
      throw new Error(`Failed to fetch classes: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
}

// Fetch upcoming schedules for a specific class type
export async function getUpcomingSchedules(classType?: string) {
  try {
    const url = classType ? `/api/schedules?type=${classType}` : '/api/schedules';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch schedules: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching schedules:', error);
    throw error;
  }
}

// Get mother-daughter classes specifically
export async function getMotherDaughterClasses() {
  return getUpcomingSchedules('mothers-daughters');
}

// Get adult-teen classes specifically  
export async function getAdultTeenClasses() {
  return getUpcomingSchedules('adult-teen');
}

// Create a new booking
export async function createBooking(bookingData: {
  schedule_id: string;
  participant_name: string;
  participant_email: string;
  participant_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  special_requirements?: string;
}) {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create booking: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

// Update booking payment status
export async function updateBookingPayment(
  bookingId: string, 
  paymentIntentId: string, 
  amountPaid: number
) {
  try {
    const response = await fetch(`/api/bookings/${bookingId}/payment`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
        amountPaid,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update booking payment: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error updating booking payment:', error);
    throw error;
  }
}

// Get booking by ID
export async function getBooking(bookingId: string) {
  try {
    const response = await fetch(`/api/bookings/${bookingId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch booking: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
}

// Update available spots after booking
export async function updateAvailableSpots(scheduleId: string, spotsToReduce: number = 1) {
  try {
    const response = await fetch(`/api/schedules/${scheduleId}/spots`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spotsToReduce,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update available spots: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error updating available spots:', error);
    throw error;
  }
}

// Get testimonials
export async function getTestimonials(filter?: string) {
  try {
    const url = filter ? `/api/testimonials?filter=${encodeURIComponent(filter)}` : '/api/testimonials';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch testimonials: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    throw error;
  }
}

// Get FAQs
export async function getFAQs() {
  try {
    const response = await fetch('/api/faqs');
    if (!response.ok) {
      throw new Error(`Failed to fetch FAQs: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    throw error;
  }
}

// Get FAQ categories
export async function getFAQCategories() {
  try {
    const response = await fetch('/api/faq-categories');
    if (!response.ok) {
      throw new Error(`Failed to fetch FAQ categories: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    throw error;
  }
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
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create contact inquiry: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error creating contact inquiry:', error);
    throw error;
  }
}
