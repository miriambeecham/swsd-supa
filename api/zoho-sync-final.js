// /api/zoho-sync-final.js
// Cron: syncs Confirmed bookings (paid in the last 24h, not yet synced) to Zoho CRM.
import { requireSupabase, outerId } from './_supabase.js';
import { requireCronAuth } from './_cron-auth.js';

export default async function handler(req, res) {
  if (!requireCronAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  try {
    const lookbackTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: bookings, error: bErr } = await supabase
      .from('bookings')
      .select(`
        id, airtable_record_id, booking_id,
        contact_first_name, contact_last_name, contact_email, contact_phone,
        number_of_participants,
        class_schedules(id, airtable_record_id, date, classes(class_name, type)),
        participants(first_name, last_name, age_group)
      `)
      .eq('status', 'Confirmed')
      .gt('payment_date', lookbackTime)
      .eq('zoho_synced', false);
    if (bErr) throw bErr;

    console.log(`[ZOHO-CRON] Found ${bookings?.length || 0} bookings to sync`);
    const results = [];

    for (const booking of bookings || []) {
      try {
        const schedule = booking.class_schedules;
        const klass = schedule?.classes;

        const contactInfo = {
          firstName: booking.contact_first_name,
          lastName: booking.contact_last_name,
          email: booking.contact_email,
          phone: booking.contact_phone || '',
        };
        const classInfo = {
          className: klass?.class_name || 'Self-Defense Class',
          date: schedule?.date || '',
          participantCount: booking.number_of_participants || 1,
        };
        // Note: zoho-sync-final has no req object (cron only); production URL is the right
        // default since these links land in Zoho records consumed by the prod team.
        const classPreparationUrl = `https://www.streetwiseselfdefense.com/class-prep/${outerId(booking)}`;
        const classType = (klass?.type || '').toLowerCase().includes('mother')
          ? 'mother-daughter'
          : 'adult';

        await createZohoContacts({
          contactInfo,
          classInfo,
          prepPageUrl: classPreparationUrl,
          bookingNumber: booking.booking_id,
          classType,
          participants: booking.participants || [],
        });

        const { error: updErr } = await supabase
          .from('bookings')
          .update({ zoho_synced: true })
          .eq('id', booking.id);
        if (updErr) throw updErr;

        results.push({ bookingId: outerId(booking), success: true });
      } catch (err) {
        console.error(`[ZOHO-CRON] Failed for booking ${booking.id}:`, err);
        results.push({ bookingId: outerId(booking), success: false, error: err.message });
      }
    }

    return res.json({
      success: true,
      totalBookings: bookings?.length || 0,
      synced: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (error) {
    console.error('[ZOHO-CRON] Fatal error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function createZohoContacts({ contactInfo, classInfo, prepPageUrl, bookingNumber, classType, participants }) {
  const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN } = process.env;
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error('Zoho credentials missing');
  }

  // OAuth refresh
  const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  if (!tokenResponse.ok) {
    throw new Error(`Zoho authentication failed: ${await tokenResponse.text()}`);
  }
  const { access_token } = await tokenResponse.json();
  const headers = {
    Authorization: `Zoho-oauthtoken ${access_token}`,
    'Content-Type': 'application/json',
  };

  // Step 1: upsert booker contact
  const newClassEntry = `• ${classInfo.className} (${classInfo.date})`;

  const bookerSearch = await fetch(
    `https://www.zohoapis.com/crm/v2/Contacts/search?email=${encodeURIComponent(contactInfo.email)}`,
    { headers },
  );
  let existingBooker = null;
  if (bookerSearch.ok) {
    const text = await bookerSearch.text();
    if (text.trim()) {
      try {
        const data = JSON.parse(text);
        if (data.data?.length > 0) existingBooker = data.data[0];
      } catch { /* no existing */ }
    }
  }
  const existingHistory = existingBooker?.Class_History || '';
  const existingCount = existingBooker?.Total_Classes_Attended || 0;
  const bookerData = {
    First_Name: contactInfo.firstName,
    Last_Name: contactInfo.lastName,
    Email: contactInfo.email,
    Phone: contactInfo.phone || '',
    Lead_Source: 'Website',
    Latest_Class: classInfo.className,
    Latest_Class_Date: classInfo.date,
    Latest_Prep_URL: prepPageUrl,
    Class_History: existingHistory ? `${existingHistory}\n${newClassEntry}` : newClassEntry,
    Total_Classes_Attended: existingCount + 1,
  };
  const bookerUpsert = await fetch('https://www.zohoapis.com/crm/v2/Contacts/upsert', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      data: [bookerData],
      duplicate_check_fields: ['Email', 'First_Name', 'Last_Name'],
      trigger: ['workflow'],
    }),
  });
  if (!bookerUpsert.ok) {
    throw new Error(`Failed to create booker contact: ${await bookerUpsert.text()}`);
  }
  const bookerResult = await bookerUpsert.json();
  const bookerContactId = bookerResult.data[0].details.id;

  // Step 2: build participant contacts (skip the one that matches the booker for adult classes)
  let contactsToCreate = [];
  if (classType === 'adult') {
    contactsToCreate = participants
      .filter(p => !(
        p.first_name === contactInfo.firstName &&
        p.last_name === contactInfo.lastName
      ))
      .map(p => ({
        Last_Name: p.last_name,
        First_Name: p.first_name,
        Phone: contactInfo.phone,
        Lead_Source: 'Website',
        Latest_Class: classInfo.className,
        Latest_Class_Date: classInfo.date,
        Latest_Prep_URL: prepPageUrl,
        Class_History: newClassEntry,
        Total_Classes_Attended: 1,
        Age_Group: p.age_group,
        Booked_By: bookerContactId,
      }));
  } else if (classType === 'mother-daughter') {
    const mothers = participants.filter(p => p.age_group === '16+');
    const daughterCount = participants.filter(p => p.age_group !== '16+').length;
    contactsToCreate = mothers.map(p => ({
      Last_Name: p.last_name,
      First_Name: p.first_name,
      Email: contactInfo.email,
      Phone: contactInfo.phone,
      Lead_Source: 'Website',
      Latest_Class: classInfo.className,
      Latest_Class_Date: classInfo.date,
      Latest_Prep_URL: prepPageUrl,
      Class_History: newClassEntry,
      Total_Classes_Attended: 1,
      Number_of_Daughters: daughterCount,
      Booked_By: bookerContactId,
    }));
  }

  // Step 3: upsert each participant contact
  for (const contactData of contactsToCreate) {
    if (contactData.Email) {
      const search = await fetch(
        `https://www.zohoapis.com/crm/v2/Contacts/search?criteria=(Email:equals:${encodeURIComponent(contactData.Email)})and(First_Name:equals:${encodeURIComponent(contactData.First_Name)})and(Last_Name:equals:${encodeURIComponent(contactData.Last_Name)})`,
        { headers },
      );
      if (search.ok) {
        const text = await search.text();
        if (text.trim()) {
          try {
            const data = JSON.parse(text);
            const existing = data.data?.[0];
            if (existing) {
              contactData.Class_History = existing.Class_History
                ? `${existing.Class_History}\n${newClassEntry}`
                : newClassEntry;
              contactData.Total_Classes_Attended = (existing.Total_Classes_Attended || 0) + 1;
            }
          } catch { /* no existing */ }
        }
      }
    }
    await fetch('https://www.zohoapis.com/crm/v2/Contacts/upsert', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        data: [contactData],
        duplicate_check_fields: ['Email', 'First_Name', 'Last_Name'],
        trigger: ['workflow'],
      }),
    });
  }
}
