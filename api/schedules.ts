
import { getClasses } from './airtable';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    
    let filter = '{Is Active}=1';
    if (type) {
      filter = `AND({Is Active}=1,{Type}="${type}")`;
    }
    
    const classes = await getClasses(filter);
    
    return new Response(JSON.stringify(classes), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
import { getSchedules } from './airtable';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const filter = url.searchParams.get('filter');
    
    const schedules = await getSchedules(filter || undefined);
    
    return new Response(JSON.stringify({ records: schedules }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
