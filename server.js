import express from 'express';

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

// Form submission endpoint
app.post('/api/form-submissions', async (req, res) => {
  try {
    const formData = req.body;
    console.log('Received form data:', formData);

    // Map form fields to Airtable field names
    const airtableFields = {
      'First Name': formData.firstName,
      'Last Name': formData.lastName,
      'Email': formData.email,
      'Phone': formData.phone,
      'Newsletter Signup': formData.newsletter,
    };

    // Map form types to match Airtable select options
    const formTypeMapping = {
      'Private Classes': 'Private Training',
      'CBO': 'CBO Partnership',
      'Corporate': 'Corporate Training'
    };

    if (formData.formType && formTypeMapping[formData.formType]) {
      airtableFields['Form Type'] = formTypeMapping[formData.formType];
    }

    // Add page-specific fields
    if (formData.groupSize) airtableFields['Group Size'] = formData.groupSize;
    if (formData.goals) airtableFields['Goals'] = formData.goals;
    if (formData.availability) airtableFields['Availability'] = formData.availability;
    if (formData.organizationType) airtableFields['Organization Type'] = formData.organizationType;
    if (formData.demographics) airtableFields['Demographics'] = formData.demographics;
    if (formData.needs) airtableFields['Needs'] = formData.needs;
    if (formData.logistics) airtableFields['Logistics'] = formData.logistics;
    if (formData.companyName) airtableFields['WS_Organization'] = formData.companyName;
    if (formData.industry) airtableFields['Industry'] = formData.industry;
    if (formData.employeeCount) airtableFields['Employee Count'] = formData.employeeCount;
    if (formData.safetyGoals) airtableFields['Safety Goals'] = formData.safetyGoals;

    console.log('Mapped Airtable fields:', airtableFields);

    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Form Submissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: airtableFields
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Airtable form submission error:', errorText);
      throw new Error(`Failed to submit: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Form submission successful:', result.id);
    res.json(result);
  } catch (error) {
    console.error('Error submitting form:', error.message);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

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

app.get('/api/testimonials', async (req, res) => {
  try {
    const { filter } = req.query;
    const endpoint = filter 
      ? `/Testimonials?filterByFormula=${encodeURIComponent(filter)}`
      : '/Testimonials';

    const data = await makeAirtableRequest(endpoint);

    // Map to the format expected by the frontend
    const testimonials = data.records.map((record) => {
      // Handle profile picture - could be direct URL or Airtable attachment
      let profileImageUrl = null;
      const profileField = record.fields['Profile Image URL'];

      if (typeof profileField === 'string') {
        // Direct URL
        profileImageUrl = profileField;
      } else if (Array.isArray(profileField) && profileField.length > 0) {
        // Airtable attachment format
        profileImageUrl = profileField[0].url;
      }

      return {
        id: record.id,
        name: record.fields.Name || '',
        content: record.fields.Content || '',
        rating: parseInt(record.fields.Rating) || 5,
        class_type: record.fields['Class Type'] || '',
        platform: record.fields.Platform?.toLowerCase(),
        profile_image_url: profileImageUrl,
        review_url: record.fields['Original Review URL'],
        homepage_position: record.fields['Homepage position'],
        is_featured: record.fields['Is Featured'] || false,
        is_published: record.fields['Is Published'] || false,
      };
    });

    res.json(testimonials);
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express API server running on http://0.0.0.0:${PORT}`);
  console.log(`Base ID: ${AIRTABLE_BASE_ID}`);
  console.log(`API Key exists: ${!!AIRTABLE_API_KEY}`);
});