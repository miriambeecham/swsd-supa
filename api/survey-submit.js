// /api/survey-submit.js
import { requireSupabase, airtableIdToUuid } from './_supabase.js';

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

    if (!formData.classScheduleId) {
      return res.status(400).json({ error: 'Class schedule is required' });
    }
    if (!formData.q1OverallExperience || !formData.q2ConfidenceLevel ||
        !formData.q5WouldRecommend || !formData.q6OptInCommunication ||
        !formData.q7WillingToShare) {
      return res.status(400).json({ error: 'Required questions not answered' });
    }
    if (formData.q7WillingToShare === 'Write Here' && !formData.q7WrittenTestimonial?.trim()) {
      return res.status(400).json({ error: 'Testimonial text is required' });
    }
    const needsContact =
      formData.q6OptInCommunication === 'Yes' || formData.q7WillingToShare === 'Write Here';
    if (needsContact) {
      if (!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.email?.trim()) {
        return res.status(400).json({ error: 'Contact information (first name, last name, email) is required' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
    }

    const scheduleUuid = /^rec/.test(formData.classScheduleId)
      ? await airtableIdToUuid('class_schedules', formData.classScheduleId)
      : formData.classScheduleId;

    const ipAddress =
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.connection?.remoteAddress ||
      'unknown';

    const row = {
      class_schedule_id: scheduleUuid,
      submission_date: new Date().toISOString(),
      q1_overall_experience: formData.q1OverallExperience,
      q2_confidence_level: formData.q2ConfidenceLevel,
      q5_would_recommend: formData.q5WouldRecommend,
      q6_opt_in_future_communication: formData.q6OptInCommunication,
      q7_willing_to_share_experience: formData.q7WillingToShare,
      ip_address: ipAddress,
      user_agent: req.headers['user-agent'] || 'unknown',
    };
    if (formData.q3MostValuable?.trim()) row.q3_most_valuable_part = formData.q3MostValuable;
    if (formData.q4AreasForImprovement?.trim()) row.q4_areas_for_improvement = formData.q4AreasForImprovement;
    if (formData.q7WrittenTestimonial?.trim()) row.q7_written_testimonial = formData.q7WrittenTestimonial;
    if (formData.firstName?.trim()) row.first_name = formData.firstName;
    if (formData.lastName?.trim()) row.last_name = formData.lastName;
    if (formData.email?.trim()) row.email = formData.email;
    if (formData.phone?.trim()) row.phone = formData.phone;
    if (formData.preferredContactMethod?.length > 0) row.preferred_contact_method = formData.preferredContactMethod;

    const { data, error } = await supabase
      .from('satisfaction_surveys')
      .insert(row)
      .select('id, survey_id')
      .single();
    if (error) throw error;

    res.status(201).json({
      success: true,
      recordId: data.id,
      surveyId: data.survey_id,
      message: 'Survey submitted successfully',
    });
  } catch (error) {
    console.error('Survey submission error:', error.message);
    res.status(500).json({ error: 'Failed to submit survey' });
  }
}
