// Airtable API configuration - these will be accessed server-side
// For client-side code, these values come from API endpoints
// Export a flag to check if Airtable is properly configured

// Types for our data
export interface Class {
  id: string;
  title: string;
  description: string;
  type: 'mothers-daughters' | 'adult-teen' | 'corporate' | 'cbo';
  age_range: string;
  duration_minutes: number;
  max_participants: number;
  price_dollars: number;
  instructor_id?: string;
  sponsoring_entity_id?: string;
  we_handle_registration: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sponsoring_entity?: SponsoringEntity;
}

export interface ClassSchedule {
  id: string;
  class_id: string;
  start_time: string;
  end_time: string;
  available_spots: number;
  is_cancelled: boolean;
  external_registration_url?: string;
  created_at: string;
  class?: Class;
  classes?: Class;
}

export interface Booking {
  id: string;
  schedule_id: string;
  user_id?: string;
  participant_name: string;
  participant_email: string;
  participant_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripe_payment_intent_id?: string;
  amount_paid_cents?: number;
  special_requirements?: string;
  created_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  title?: string;
  content: string;
  rating: number;
  class_type?: string;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactInquiry {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  message?: string;
  inquiry_type: 'general' | 'corporate' | 'cbo' | 'class';
  status: 'new' | 'contacted' | 'closed';
  created_at: string;
}

export interface CorporateClient {
  id: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

export interface CboPartner {
  id: string;
  name: string;
  logo_url?: string;
  website_url?: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

export interface Instructor {
  id: string;
  name: string;
  bio?: string;
  photo_url?: string;
  certifications: string[];
  is_lead_instructor: boolean;
  is_active: boolean;
  created_at: string;
}

export interface SponsoringEntity {
  id: string;
  name: string;
  website_url?: string;
  address?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
}
