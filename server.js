
import express from 'express';
import { ViteDevServer } from 'vite';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const makeAirtableRequest = async (endpoint) => {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Airtable not configured properly');
  }

  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// API Routes
app.get('/api/classes', async (req, res) => {
  try {
    const { filter } = req.query;
    const endpoint = filter 
      ? `/Classes?filterByFormula=${encodeURIComponent(filter)}`
      : '/Classes';
    
    const data = await makeAirtableRequest(endpoint);
    
    const classes = data.records.map((record) => ({
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

    res.json({ records: classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

app.get('/api/schedules', async (req, res) => {
  try {
    const { filter } = req.query;
    const endpoint = filter 
      ? `/Class%20Schedules?filterByFormula=${encodeURIComponent(filter)}`
      : '/Class%20Schedules';
    
    const data = await makeAirtableRequest(endpoint);
    
    const schedules = data.records.map((record) => ({
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

    res.json({ records: schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// Vite setup
let vite;
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
} else {
  const { default: sirv } = await import('sirv');
  app.use(sirv('dist', { single: true }));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
