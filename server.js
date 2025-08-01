import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import API handlers
import classesHandler from './api/classes.js';
import schedulesHandler from './api/schedules.js';
import testimonialsHandler from './api/testimonials.js';
import faqsHandler from './api/faqs.js';
import faqCategoriesHandler from './api/faq-categories.js';
import contactHandler from './api/contact.js';
import bookingsHandler from './api/bookings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// API Routes - handle each endpoint specifically
app.get('/api/classes', async (req, res) => {
  try {
    const { getClasses } = await import('./api/airtable.js');
    const filter = req.query.filter;
    const classes = await getClasses(filter);
    res.json({ records: classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/schedules', async (req, res) => {
  try {
    const { getSchedules } = await import('./api/airtable.js');
    const filter = req.query.filter;
    const schedules = await getSchedules(filter);
    res.json({ records: schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/testimonials', async (req, res) => {
  try {
    const { getTestimonials } = await import('./api/airtable.js');
    const filter = req.query.filter;
    const testimonials = await getTestimonials(filter);
    res.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/faqs', async (req, res) => {
  try {
    const { getFAQs } = await import('./api/airtable.js');
    const faqs = await getFAQs();
    res.json(faqs);
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/faq-categories', async (req, res) => {
  try {
    const { getFAQCategories } = await import('./api/airtable.js');
    const categories = await getFAQCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on port ${port}`);
});