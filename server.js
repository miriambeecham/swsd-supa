import express from 'express';

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
    throw new Error('Zoho CRM not configured properly');
  }

  const tokenUrl = `${ZOHO_DOMAIN}/oauth/v2/token`;
  const params = new URLSearchParams({
    refresh_token: ZOHO_REFRESH_TOKEN,
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token'
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params
  });

  if (!response.ok) {
    throw new Error(`Zoho token refresh failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
};

// Function to create lead in Zoho CRM
const createZohoLead = async (formData) => {
  try {
    const accessToken = await getZohoAccessToken();
    
    // Map form data to Zoho CRM lead format
    const leadData = {
      data: [{
        First_Name: formData.firstName,
        Last_Name: formData.lastName,
        Email: formData.email,
        Phone: formData.phone,
        Lead_Source: 'Website Form',
        Company: formData.companyName || formData.organizationName || 'Individual',
        Description: `Form Type: ${formData.formType}\n` +
                    (formData.goals ? `Goals: ${formData.goals}\n` : '') +
                    (formData.needs ? `Training Needs: ${formData.needs}\n` : '') +
                    (formData.availability ? `Availability: ${formData.availability}\n` : '') +
                    (formData.logistics ? `Logistics: ${formData.logistics}\n` : '') +
                    (formData.demographics ? `Demographics: ${formData.demographics}\n` : ''),
        // Custom fields based on form type
        ...(formData.formType === 'Private Classes' && {
          Training_Type: formData.trainingType,
          Group_Size: formData.groupSize,
        }),
        ...(formData.formType === 'Corporate' && {
          Organization_Name: formData.companyName,
          Role_Title: formData.role,
          Employee_Count: formData.employeeCount,
          Training_Format: formData.trainingFormat,
          Timeline: formData.timeline,
        }),
        ...(formData.formType === 'CBO' && {
          Organization_Name: formData.organizationName,
          Organization_Type: formData.organizationType,
          Age_Range: formData.ageRange,
          Participant_Count: formData.participantCount,
          Event_Date: formData.eventDate,
        }),
      }]
    };

    const response = await fetch(`${ZOHO_DOMAIN}/crm/v2/Leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zoho CRM API error:', errorText);
      throw new Error(`Zoho API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Zoho lead created successfully:', result.data[0].details.id);
    return result;
  } catch (error) {
    console.error('Error creating Zoho lead:', error.message);
    // Don't throw error to prevent Airtable submission from failing
    return null;
  }
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

    // Add page-specific fields based on form type
    if (formData.demographics) airtableFields['Demographics'] = formData.demographics;

    // Private Training fields
    if (formData.groupSize) airtableFields['PT_Group Size'] = formData.groupSize;
    if (formData.trainingType) airtableFields['PT_Training Type'] = formData.trainingType;
    if (formData.availability) airtableFields['PT_Availability'] = formData.availability;

    // Corporate/Workplace Safety fields
    if (formData.needs) airtableFields['WS_Training Needs'] = formData.needs;
    if (formData.companyName) airtableFields['WS_Organization Name'] = formData.companyName;
    if (formData.role) airtableFields['WS_Role Title'] = formData.role;
    if (formData.employeeCount) airtableFields['WS_Employee Count'] = formData.employeeCount;
    if (formData.trainingFormat) airtableFields['WS_Training Format'] = formData.trainingFormat;
    if (formData.timeline) airtableFields['WS_Timeline'] = formData.timeline;

    // CBO fields
    if (formData.organizationName) airtableFields['CBO_Organization Name'] = formData.organizationName;
    if (formData.organizationType) airtableFields['CBO_Organization Type'] = formData.organizationType;
    if (formData.ageRange) airtableFields['CBO_Age Range'] = formData.ageRange;
    if (formData.participantCount) airtableFields['CBO_Participant Count'] = formData.participantCount;
    if (formData.eventDate) airtableFields['CBO_Event Date'] = formData.eventDate;
    if (formData.logistics) airtableFields['CBO_Logistics'] = formData.logistics;

    // Handle goals field based on form type
    if (formData.goals) {
      if (formData.formType === 'Private Classes') {
        airtableFields['PT_Training Goals'] = formData.goals;
      } else if (formData.formType === 'CBO') {
        airtableFields['CBO_Training Goals'] = formData.goals;
      }
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

    // Submit to Zoho CRM (non-blocking)
    const zohoResult = await createZohoLead(formData);
    
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Express API server running on http://0.0.0.0:${PORT}`);
  console.log(`Base ID: ${AIRTABLE_BASE_ID}`);
  console.log(`API Key exists: ${!!AIRTABLE_API_KEY}`);
});