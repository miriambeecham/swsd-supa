import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Zoho CRM configuration
const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
const ZOHO_DOMAIN = process.env.ZOHO_DOMAIN || 'https://www.zohoapis.com'; // Default to .com, can be .eu, .in, etc.

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

// Function to get Zoho access token
const getZohoAccessToken = async () => {
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    console.error('Missing Zoho credentials:', {
      clientIdExists: !!ZOHO_CLIENT_ID,
      clientSecretExists: !!ZOHO_CLIENT_SECRET,
      refreshTokenExists: !!ZOHO_REFRESH_TOKEN,
      domain: ZOHO_DOMAIN
    });
    throw new Error('Zoho CRM not configured properly');
  }

  // Use accounts server for OAuth, not API server
  const tokenUrl = `https://accounts.zoho.com/oauth/v2/token`;
  const params = new URLSearchParams({
    refresh_token: ZOHO_REFRESH_TOKEN,
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token'
  });

  console.log('Making Zoho token request:', {
    url: tokenUrl,
    domain: ZOHO_DOMAIN,
    clientId: ZOHO_CLIENT_ID ? `${ZOHO_CLIENT_ID.substring(0, 10)}...` : 'missing',
    refreshToken: ZOHO_REFRESH_TOKEN ? `${ZOHO_REFRESH_TOKEN.substring(0, 10)}...` : 'missing',
    bodyParams: params.toString()
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });

  console.log('Zoho token response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Zoho token refresh error details:', {
      status: response.status,
      statusText: response.statusText,
      url: tokenUrl,
      domain: ZOHO_DOMAIN,
      clientIdExists: !!ZOHO_CLIENT_ID,
      clientSecretExists: !!ZOHO_CLIENT_SECRET,
      refreshTokenExists: !!ZOHO_REFRESH_TOKEN,
      requestBody: params.toString(),
      errorResponse: errorText
    });
    throw new Error(`Zoho token refresh failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('Zoho token refresh successful:', data);
  return data.access_token;
};

// Function to create record in Zoho CRM (configurable for Leads, Contacts, etc.)
const createZohoRecord = async (formData, recordType = 'Leads') => {
  try {
    const accessToken = await getZohoAccessToken();

    // Base fields that map to standard Zoho fields
    const baseFields = {
      First_Name: formData.firstName,
      Last_Name: formData.lastName,
      Email: formData.email,
      Mobile: formData.phone,
      City: formData.city,
      State: formData.state,
      State_Territory: formData.state,
      Lead_Source: 'Website',
      Newsletter_Opt_In: formData.newsletter || false,
      Description: formData.webRequestDetails || '',
      Web_Lead_Type: formData.formType
    };

    // Add organization and title for Community Organizations and Workplace Safety forms
    if (formData.formType === 'Community Organizations' || formData.formType === 'Workplace Safety') {
      if (formData.organization) baseFields.Company = formData.organization;
      if (formData.title) baseFields.Title = formData.title;
    } else {
      baseFields.Company = 'Individual';
    }

    // Custom field mappings - all forms use the same base mapping
    const customFields = {
      Web_Lead_Specific_Interests: formData.webRequestDetails || ''
    };

    // Add organization and title fields for Community Organizations and Workplace Safety
    if (formData.formType === 'Community Organizations' || formData.formType === 'Workplace Safety') {
      if (formData.organization) customFields.Organization_Name = formData.organization;
      if (formData.title) customFields.Job_Title = formData.title;
    }

    // Combine base and custom fields
    const recordData = {
      data: [{
        ...baseFields,
        ...customFields
      }]
    };

    console.log(`Creating ${recordType} in Zoho CRM:`, {
      url: `${ZOHO_DOMAIN}/crm/v2/${recordType}`,
      recordData: JSON.stringify(recordData, null, 2),
      accessToken: accessToken ? `${accessToken.substring(0, 10)}...` : 'missing'
    });

    console.log('Detailed field mapping for Zoho:');
    console.log('Base fields:', baseFields);
    console.log('Custom fields:', customFields);
    console.log('Combined record data:', recordData.data[0]);

    const response = await fetch(`${ZOHO_DOMAIN}/crm/v2/${recordType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(recordData)
    });

    console.log(`Zoho CRM ${recordType} response status:`, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zoho CRM API error details:', {
        status: response.status,
        statusText: response.statusText,
        url: `${ZOHO_DOMAIN}/crm/v2/${recordType}`,
        domain: ZOHO_DOMAIN,
        recordType: recordType,
        errorResponse: errorText,
        requestBody: JSON.stringify(recordData, null, 2)
      });
      throw new Error(`Zoho API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`Zoho ${recordType} created successfully:`, result);
    return result;
  } catch (error) {
    console.error(`Error creating Zoho ${recordType}:`, error.message);
    // Don't throw error to prevent Airtable submission from failing
    return null;
  }
};

// Test endpoint for Zoho integration
app.get('/api/test-zoho', async (req, res) => {
  try {
    console.log('=== TESTING ZOHO INTEGRATION ===');
    const accessToken = await getZohoAccessToken();
    res.json({ 
      success: true, 
      message: 'Zoho integration working',
      tokenExists: !!accessToken,
      tokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : null
    });
  } catch (error) {
    console.error('Zoho test failed:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Form submission endpoint
app.post('/api/form-submissions', async (req, res) => {
  try {
    const formData = req.body;
    console.log('=== FORM SUBMISSION START ===');
    console.log('Received form data:', formData);
    console.log('Form type:', formData.formType);
    console.log('Basic fields:', {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email
    });

    // Map form fields to Airtable field names
    const airtableFields = {
      'First Name': formData.firstName,
      'Last Name': formData.lastName,
      'Email': formData.email,
      'Phone': formData.phone,
      'City': formData.city,
      'State': formData.state,
      'Web Lead Message': formData.webRequestDetails,
      'Newsletter Signup': formData.newsletter,
      'Form Type': formData.formType
    };

    // Add organization and title for CBO and Corporate forms
    if (formData.formType === 'Community Organizations' || formData.formType === 'Workplace Safety') {
      if (formData.organization) airtableFields['Organization'] = formData.organization;
      if (formData.title) airtableFields['Title'] = formData.title;
    }

    console.log('Mapped Airtable fields:', airtableFields);

    // Submit to Airtable
    const airtableResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Form Submissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: airtableFields
      })
    });

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      console.error('Airtable form submission error:', errorText);
      throw new Error(`Failed to submit to Airtable: ${airtableResponse.status} - ${errorText}`);
    }

    const airtableResult = await airtableResponse.json();
    console.log('Airtable submission successful:', airtableResult.id);

    // Submit to Zoho CRM (non-blocking) - defaults to Leads
    const zohoResult = await createZohoRecord(formData, 'Leads');

    // Return success response
    res.json({
      airtable: airtableResult,
      zoho: zohoResult ? 'success' : 'failed'
    });
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

// Serve static files from the built Vite app
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    // This shouldn't happen as API routes are defined above, but just in case
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express API server running on http://0.0.0.0:${PORT}`);
  console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`PORT: ${process.env.PORT}`);
  console.log(`AIRTABLE_BASE_ID: ${AIRTABLE_BASE_ID ? `${AIRTABLE_BASE_ID.substring(0, 10)}...` : 'NOT SET'}`);
  console.log(`AIRTABLE_API_KEY exists: ${!!AIRTABLE_API_KEY}`);
  console.log(`ZOHO_CLIENT_ID exists: ${!!ZOHO_CLIENT_ID}`);
  console.log(`ZOHO_CLIENT_SECRET exists: ${!!ZOHO_CLIENT_SECRET}`);
  console.log(`ZOHO_REFRESH_TOKEN exists: ${!!ZOHO_REFRESH_TOKEN}`);
  console.log(`ZOHO_DOMAIN: ${ZOHO_DOMAIN}`);
  console.log('Raw ZOHO_DOMAIN from env:', process.env.ZOHO_DOMAIN);
  console.log('Available env vars:', Object.keys(process.env).filter(key => 
    key.includes('AIRTABLE') || key.includes('ZOHO')
  ));
  console.log('=====================================');
});