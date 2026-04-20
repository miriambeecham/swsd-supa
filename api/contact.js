// /api/contact.js
import { requireSupabase } from './_supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const RECAPTCHA_API_KEY = process.env.RECAPTCHA_API_KEY;
    const { recaptchaToken, ...formData } = req.body || {};

    if (recaptchaToken && RECAPTCHA_API_KEY) {
      const params = new URLSearchParams({ secret: RECAPTCHA_API_KEY, response: recaptchaToken });
      const verify = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });
      if (!verify.ok || !(await verify.json())?.success) {
        return res.status(400).json({ error: 'Invalid reCAPTCHA token' });
      }
    }

    const row = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      city: formData.city,
      state: formData.state,
      web_lead_message: formData.webRequestDetails,
      newsletter_signup: !!formData.newsletter,
      form_type: formData.formType,
      submitted_date: new Date().toISOString(),
    };
    if (formData.organization) row.organization = formData.organization;
    if (formData.title) row.title = formData.title;

    const { data, error } = await supabase
      .from('form_submissions')
      .insert(row)
      .select('id, submission_id')
      .single();
    if (error) throw error;

    res.status(201).json({
      success: true,
      submission: { id: data.id, submissionId: data.submission_id },
      recaptcha: !!recaptchaToken,
    });
  } catch (error) {
    console.error('Contact form submission error:', error.message);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
}
