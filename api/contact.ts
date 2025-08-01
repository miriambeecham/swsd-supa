
import { createContactInquiry } from './airtable';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const contactData = await req.json();
    
    const inquiry = await createContactInquiry(contactData);
    
    return new Response(JSON.stringify(inquiry), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating contact inquiry:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
