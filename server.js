
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

// API routes
app.get('/api/classes', async (req, res) => {
  try {
    const request = new Request(`http://localhost:${port}${req.originalUrl}`, {
      method: req.method,
      headers: req.headers,
    });
    const response = await classesHandler(request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Classes API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/schedules', async (req, res) => {
  try {
    const request = new Request(`http://localhost:${port}${req.originalUrl}`, {
      method: req.method,
      headers: req.headers,
    });
    const response = await schedulesHandler(request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Schedules API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/testimonials', async (req, res) => {
  try {
    const request = new Request(`http://localhost:${port}${req.originalUrl}`, {
      method: req.method,
      headers: req.headers,
    });
    const response = await testimonialsHandler(request);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Testimonials API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`API server running on port ${port}`);
});
