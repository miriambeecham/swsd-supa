// /api/survey-submit.js
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
      const params = new URLSearchParams({ 
        secret: RECAPTCHA_API_KEY, 
        response: recaptchaToken 
      });
      const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });
      if (!verify.ok || !(await verify.json())?.success) {
        return res.status(400).json({ error: 'Invalid reCAPTCHA token' });
      }
    }

    // Validation
    if (!formData.classScheduleId) {
      return res.status(400).json({ error: 'Class schedule is required' });
    }
    if (!formData.q1OverallExperience || !formData.q2ConfidenceLevel || 
        !formData.q5WouldRecommend || !formData.q6OptInCommunication || 
        !formData.q7WillingToShare) {
      return res.status(400).json({ error: 'Required questions not answered' });
    }

    // Check if testimonial text required
    if (formData.q7WillingToShare === 'Write Here' && !formData.q7WrittenTestimonial?.trim()) {
      return res.status(400).json({ error: 'Testimonial text is required' });
    }

    // Check if contact info required
    const needsContact = (
      formData.q6OptInCommunication === 'Yes' || 
      formData.q7WillingToShare === 'Write Here'
    );
    
    if (needsContact) {
      if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.email?.trim()) {
        return res.status(400).json({ 
          error: 'Contact information (first name, last name, email) is required' 
        });
      }
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    // Get client info
    const ipAddress = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection?.remoteAddress || 
                     'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Prepare Airtable fields
    const fields = {
      'Class Schedule': [formData.classScheduleId],
      'Q1: Overall Experience': formData.q1OverallExperience,
      'Q2: Confidence Level': formData.q2ConfidenceLevel,
      'Q5: Would Recommend': formData.q5WouldRecommend,
      'Q6: Opt-in to Future Communication': formData.q6OptInCommunication,
      'Q7: Willing to Share Experience': formData.q7WillingToShare,
      'IP Address': ipAddress,
      'User Agent': userAgent,
    };

    // Add optional fields
    if (formData.q3MostValuable?.trim()) {
      fields['Q3: Most Valuable Part'] = formData.q3MostValuable;
    }
    if (formData.q4AreasForImprovement?.trim()) {
      fields['Q4: Areas for Improvement'] = formData.q4AreasForImprovement;
    }
    if (formData.q7WrittenTestimonial?.trim()) {
      fields['Q7: Written Testimonial'] = formData.q7WrittenTestimonial;
    }
    if (formData.q7ReviewPlatformClicked) {
      fields['Q7: Review Platform Clicked'] = formData.q7ReviewPlatformClicked;
    }

    // Add contact info if provided
    if (formData.firstName?.trim()) fields['First Name'] = formData.firstName;
    if (formData.lastName?.trim()) fields['Last Name'] = formData.lastName;
    if (formData.email?.trim()) fields['Email'] = formData.email;
    if (formData.phone?.trim()) fields['Phone'] = formData.phone;
    if (formData.preferredContactMethod?.length > 0) {
      fields['Preferred Contact Method'] = formData.preferredContactMethod;
    }

    // Submit to Airtable
    const airtableResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Satisfaction%20Surveys`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
      }
    );

    if (!airtableResponse.ok) {
      const errorText = await airtableResponse.text();
      console.error('Airtable submission failed:', airtableResponse.status, errorText);
      throw new Error(`Failed to submit to Airtable: ${airtableResponse.status}`);
    }

    const airtableResult = await airtableResponse.json();

    res.status(201).json({
      success: true,
      recordId: airtableResult.id,
      message: 'Survey submitted successfully'
    });

  } catch (error) {
    console.error('Survey submission error:', error.message);
    res.status(500).json({ error: 'Failed to submit survey' });
  }
}
