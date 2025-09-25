// /api/contact.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const RECAPTCHA_API_KEY = process.env.RECAPTCHA_API_KEY;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return res.status(500).json({ error: 'Airtable not configured' });
    }

    const { recaptchaToken, ...formData } = req.body || {};

    // Verify reCAPTCHA if token provided
    if (recaptchaToken && RECAPTCHA_API_KEY) {
      const params = new URLSearchParams({ secret: RECAPTCHA_API_KEY, response: recaptchaToken });
      const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, 
        body: params
      });
      if (!verify.ok || !(await verify.json())?.success) {
        return res.status(400).json({ error: 'Invalid reCAPTCHA token' });
      }
    }

    // Create Airtable record
    const fields = {
      'First Name': formData.firstName,
      'Last Name' : formData.lastName,
      'Email'     : formData.email,
      'Phone'     : formData.phone,
      'City'      : formData.city,
      'State'     : formData.state,
      'Web Lead Message': formData.webRequestDetails,
      'Newsletter Signup': formData.newsletter,
      'Form Type' : formData.formType,
      ...(formData.organization ? { 'Organization': formData.organization } : {}),
      ...(formData.title ? { 'Title': formData.title } : {})
    };

    const airtableResponse = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Form%20Submissions`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ fields })
    });

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      throw new Error(`Failed to submit to Airtable: ${airtableResponse.status} - ${errorText}`);
    }

    const airtableResult = await airtableResponse.json();

    // TODO: Add Zoho integration here if needed

    res.status(201).json({ 
      success: true,
      airtable: airtableResult, 
      recaptcha: !!recaptchaToken 
    });

  } catch (error) {
    console.error('Contact form submission error:', error.message);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
}