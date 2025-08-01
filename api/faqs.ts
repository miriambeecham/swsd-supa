
import { getFAQs } from './airtable';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const faqs = await getFAQs();
    
    return new Response(JSON.stringify(faqs), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
