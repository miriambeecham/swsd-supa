
import { createBooking } from './airtable';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const bookingData = await req.json();
    
    const booking = await createBooking({
      scheduleId: bookingData.schedule_id,
      participantName: bookingData.participant_name,
      participantEmail: bookingData.participant_email,
      participantPhone: bookingData.participant_phone,
      emergencyContactName: bookingData.emergency_contact_name,
      emergencyContactPhone: bookingData.emergency_contact_phone,
      specialRequirements: bookingData.special_requirements,
    });
    
    return new Response(JSON.stringify(booking), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
