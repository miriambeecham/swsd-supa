// /api/sync-zoho.js
// new comment
export default async function handler(req, res) {
  // Verify this is called by Vercel Cron or with proper auth
  const authHeader = req.headers.authorization;
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
  const bypassToken = req.headers['x-vercel-protection-bypass'] || req.query['x-vercel-protection-bypass'];
  const expectedBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  
  const isAuthorized = authHeader === expectedAuth || bypassToken === expectedBypass;
  
  if (!isAuthorized) {
    console.log('[CRON] Unauthorized request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    console.log('[CRON] Starting Zoho sync job...');

    // Find all confirmed bookings from the last 10 minutes that haven't been synced
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    const bookingsResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings?filterByFormula=AND({Status}='Confirmed',{Payment Date}>'${tenMinutesAgo}',{Zoho Synced}=FALSE())`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );

    if (!bookingsResponse.ok) {
      throw new Error(`Failed to fetch bookings: ${bookingsResponse.status}`);
    }

    const bookingsData = await bookingsResponse.json();
    const bookings = bookingsData.records || [];

    console.log(`[CRON] Found ${bookings.length} bookings to sync`);

    const results = [];
    
    for (const booking of bookings) {
      try {
        console.log(`[CRON] Processing booking ${booking.id}`);
        
        // Get class schedule details
        const scheduleId = booking.fields['Class Schedule']?.[0];
        let scheduleData = null;
        let classData = null;

        if (scheduleId) {
          const scheduleResponse = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Class%20Schedules/${scheduleId}`,
            { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
          );
          
          if (scheduleResponse.ok) {
            const scheduleJson = await scheduleResponse.json();
            scheduleData = scheduleJson.fields;
            
            const classId = scheduleData?.Class?.[0];
            if (classId) {
              const classResponse = await fetch(
                `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Classes/${classId}`,
                { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
              );
              if (classResponse.ok) {
                const classJson = await classResponse.json();
                classData = classJson.fields;
              }
            }
          }
        }

        // Call inline Zoho function
        const contactInfo = {
          firstName: booking.fields['Contact First Name'],
          lastName: booking.fields['Contact Last Name'],
          email: booking.fields['Contact Email'],
          phone: booking.fields['Contact Phone'] || ''
        };

        const classInfo = {
          className: classData?.['Class Name'] || 'Self-Defense Class',
          date: scheduleData?.Date || '',
          participantCount: booking.fields['Number of Participants'] || 1
        };

        const classPreparationUrl = `https://streetwiseselfdefense.com/class-prep/${booking.id}`;
        const classType = classData?.Type?.toLowerCase().includes('mother') ? 'mother-daughter' : 'adult';

        await createZohoContacts({
          contactInfo,
          classInfo,
          prepPageUrl: classPreparationUrl,
          bookingId: booking.id,
          classType
        });
        
        // Mark as synced in Airtable
        await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${booking.id}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${AIRTABLE_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fields: { 'Zoho Synced': true }
            })
          }
        );
        
        console.log(`[CRON] Successfully synced booking ${booking.id}`);
        results.push({ bookingId: booking.id, success: true });
        
      } catch (err) {
        console.error(`[CRON] Failed to sync booking ${booking.id}:`, err);
        results.push({ bookingId: booking.id, success: false, error: err.message });
      }
    }

    console.log(`[CRON] Sync job completed. Synced ${results.filter(r => r.success).length} of ${results.length} bookings`);
    return res.json({ 
      success: true, 
      totalBookings: bookings.length,
      synced: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results 
    });
    
  } catch (error) {
    console.error('[CRON] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Inline Zoho contact creation function
async function createZohoContacts({ contactInfo, classInfo, prepPageUrl, bookingId, classType }) {
  console.log('[ZOHO] Starting contact creation process');
  
  const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
  const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
  const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    throw new Error('Zoho credentials missing');
  }
  
  console.log('[ZOHO] Request data:', { bookingId, classType, email: contactInfo.email });

  // Get access token
  const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token'
    })
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Zoho authentication failed: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  const access_token = tokenData.access_token;

  // STEP 1: CREATE/UPDATE BOOKER CONTACT
  console.log('[ZOHO] Creating/updating booker contact...');
  
  const bookerSearchResponse = await fetch(
    `https://www.zohoapis.com/crm/v2/Contacts/search?email=${encodeURIComponent(contactInfo.email)}`,
    {
      headers: {
        'Authorization': `Zoho-oauthtoken ${access_token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  let bookerContactId = null;
  let existingBookerData = null;

  if (bookerSearchResponse.ok) {
    const responseText = await bookerSearchResponse.text();
    
    if (responseText && responseText.trim().length > 0) {
      try {
        const searchData = JSON.parse(responseText);
        if (searchData.data && searchData.data.length > 0) {
          existingBookerData = searchData.data[0];
          bookerContactId = existingBookerData.id;
          console.log('[ZOHO] Found existing booker contact:', bookerContactId);
        }
      } catch (parseErr) {
        console.log('[ZOHO] Will create new contact');
      }
    }
  }

  const newClassEntry = `• ${classInfo.className} (${classInfo.date})`;
  const existingHistory = existingBookerData?.Class_History || '';
  const existingCount = existingBookerData?.Total_Classes_Attended || 0;

  const bookerData = {
    First_Name: contactInfo.firstName,
    Last_Name: contactInfo.lastName,
    Email: contactInfo.email,
    Phone: contactInfo.phone || '',
    Lead_Source: 'Website',
    Latest_Class: classInfo.className,
    Latest_Class_Date: classInfo.date,
    Latest_Prep_URL: prepPageUrl,
    Class_History: existingHistory 
      ? `${existingHistory}\n${newClassEntry}`
      : newClassEntry,
    Total_Classes_Attended: existingCount + 1
  };

  const bookerUpsertResponse = await fetch('https://www.zohoapis.com/crm/v2/Contacts/upsert', {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: [bookerData],
      duplicate_check_fields: ['Email', 'First_Name', 'Last_Name'],
      trigger: ['workflow']
    })
  });

  if (!bookerUpsertResponse.ok) {
    const errorText = await bookerUpsertResponse.text();
    throw new Error(`Failed to create booker contact: ${errorText}`);
  }

  const bookerResult = await bookerUpsertResponse.json();
  bookerContactId = bookerResult.data[0].details.id;
  console.log('[ZOHO] Booker contact ID:', bookerContactId);

  // STEP 2: FETCH PARTICIPANTS FROM AIRTABLE
  console.log('[ZOHO] Fetching participants from Airtable...');
  
  const filterFormula = `{Booking} = "${bookingId}"`;
  const participantsUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants?filterByFormula=${encodeURIComponent(filterFormula)}`;

  const participantsResponse = await fetch(participantsUrl, { 
    headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } 
  });

  const participantsText = await participantsResponse.text();
  const participantsData = JSON.parse(participantsText);
  const participants = participantsData.records || [];
  console.log('[ZOHO] Found participants:', participants.length);

  // STEP 3: CREATE PARTICIPANT CONTACTS
  let contactsToCreate = [];

  if (classType === 'adult') {
    contactsToCreate = participants
      .filter(p => {
        const isDuplicate = p.fields['First Name'] === contactInfo.firstName && 
                           p.fields['Last Name'] === contactInfo.lastName;
        if (isDuplicate) {
          console.log(`[ZOHO] Skipping participant ${p.fields['First Name']} ${p.fields['Last Name']} - same as booker`);
        }
        return !isDuplicate;
      })
      .map(p => ({
        participant: p,
        data: {
          Last_Name: p.fields['Last Name'],
          First_Name: p.fields['First Name'],
          Email: contactInfo.email,
          Phone: contactInfo.phone,
          Lead_Source: 'Website',
          Latest_Class: classInfo.className,
          Latest_Class_Date: classInfo.date,
          Latest_Prep_URL: prepPageUrl,
          Class_History: newClassEntry,
          Total_Classes_Attended: 1,
          Age_Group: p.fields['Age Group'],
          Booked_By: bookerContactId
        }
      }));
  } else if (classType === 'mother-daughter') {
    const mothers = participants.filter(p => p.fields['Age Group'] === '16+');
    const daughterCount = participants.filter(p => p.fields['Age Group'] !== '16+').length;
    
    contactsToCreate = mothers.map(p => ({
      participant: p,
      data: {
        Last_Name: p.fields['Last Name'],
        First_Name: p.fields['First Name'],
        Email: contactInfo.email,
        Phone: contactInfo.phone,
        Lead_Source: 'Website',
        Latest_Class: classInfo.className,
        Latest_Class_Date: classInfo.date,
        Latest_Prep_URL: prepPageUrl,
        Class_History: newClassEntry,
        Total_Classes_Attended: 1,
        Number_of_Daughters: daughterCount,
        Booked_By: bookerContactId
      }
    }));
  }

  console.log('[ZOHO] Contacts to create:', contactsToCreate.length);

  // STEP 4: UPSERT PARTICIPANT CONTACTS
  for (const { data: contactData } of contactsToCreate) {
    const participantName = `${contactData.First_Name} ${contactData.Last_Name}`;
    
    const searchResponse = await fetch(
      `https://www.zohoapis.com/crm/v2/Contacts/search?criteria=(Email:equals:${encodeURIComponent(contactData.Email)})and(First_Name:equals:${encodeURIComponent(contactData.First_Name)})and(Last_Name:equals:${encodeURIComponent(contactData.Last_Name)})`,
      {
        headers: {
          'Authorization': `Zoho-oauthtoken ${access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (searchResponse.ok) {
      const searchText = await searchResponse.text();
      
      if (searchText && searchText.trim().length > 0) {
        try {
          const searchData = JSON.parse(searchText);
          if (searchData.data && searchData.data.length > 0) {
            const existing = searchData.data[0];
            contactData.Class_History = existing.Class_History 
              ? `${existing.Class_History}\n${newClassEntry}`
              : newClassEntry;
            contactData.Total_Classes_Attended = (existing.Total_Classes_Attended || 0) + 1;
          }
        } catch (parseErr) {
          // New participant
        }
      }
    }

    console.log(`[ZOHO] Upserting contact: ${participantName}`);
    
    await fetch('https://www.zohoapis.com/crm/v2/Contacts/upsert', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: [contactData],
        duplicate_check_fields: ['Email', 'First_Name', 'Last_Name'],
        trigger: ['workflow']
      })
    });
  }

  console.log('[ZOHO] Sync completed');
}

// Updated Sun Oct  5 22:20:28 UTC 2025
