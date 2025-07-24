import { supabase, isSupabaseConfigured } from './supabase';
import type { Class, ClassSchedule, Booking } from './supabase';

// Fetch all active classes with their schedules
export async function getClassesWithSchedules() {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - returning empty classes array');
    return [];
  }

  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      sponsoring_entity:sponsoring_entities (*),
      class_schedules (
        *
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }

  return data;
}

// Fetch upcoming schedules for a specific class type
export async function getUpcomingSchedules(classType?: string) {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured - returning empty schedules array');
    return [];
  }

  const query = supabase
    .from('class_schedules')
    .select(`
      *,
      classes!inner (
        *,
        sponsoring_entity:sponsoring_entities (*)
      )
    `)
    .eq('is_cancelled', false)
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true });

  // Filter by class type if specified
  const { data, error } = classType 
    ? await query.eq('classes.type', classType)
    : await query;

  if (error) {
    console.error('Error fetching schedules:', error);
    throw error;
  }

  return data;
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
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured. Please connect to Supabase to create bookings.');
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert([{
      ...bookingData,
      payment_status: 'pending'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    throw error;
  }

  return data;
}

// Update booking payment status
export async function updateBookingPayment(
  bookingId: string, 
  paymentIntentId: string, 
  amountPaid: number
) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured. Please connect to Supabase to update payments.');
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({
      payment_status: 'completed',
      stripe_payment_intent_id: paymentIntentId,
      amount_paid_cents: amountPaid
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking payment:', error);
    throw error;
  }

  return data;
}

// Get booking by ID
export async function getBooking(bookingId: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured. Please connect to Supabase to fetch bookings.');
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      class_schedule:class_schedules (
        *,
        class:classes (*)
      )
    `)
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }

  return data;
}

// Update available spots after booking
export async function updateAvailableSpots(scheduleId: string, spotsToReduce: number = 1) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase not configured. Please connect to Supabase to update spots.');
  }

  const { data, error } = await supabase
    .from('class_schedules')
    .update({
      available_spots: supabase.raw(`available_spots - ${spotsToReduce}`)
    })
    .eq('id', scheduleId)
    .select()
    .single();

  if (error) {
    console.error('Error updating available spots:', error);
    throw error;
  }

  return data;
}