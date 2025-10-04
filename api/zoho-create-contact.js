export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[ZOHO] Starting contact creation process');
    
    const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
    const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
    const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    
    if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
      console.error('[ZOHO] Missing Zoho credentials');
      return res.status(500).json({ error: 'Zoho credentials missing' });
    }
    
    const { contactInfo, classInfo, prepPageUrl, bookingId, classType } = req.body;
    console.log('[ZOHO] Request data:', { bookingId, classType, email: contactInfo.email });

    // Get access token
    console.log('[ZOHO] Requesting access token...');
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
      console.error('[ZOHO] Token error:', errorText);
      return res.status(500).json({ error: 'Zoho authentication failed', details: errorText });
    }

    const tokenData = await tokenResponse.json();
    console.log('[ZOHO] Access token received:', tokenData.access_token ? 'Yes' : 'No');
    
    if (tokenData.error) {
      console.error('[ZOHO] Token error:', tokenData);
      return res.status(500).json({ error: 'Zoho token error', details: tokenData });
    }
    
    const access_token = tokenData.access_token;

    // === STEP 1: CREATE/UPDATE BOOKER CONTACT ===
    console.log('[ZOHO] Creating/updating booker contact...');
    
    // Search for existing booker contact
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
      const searchData = await bookerSearchResponse.json();
      if (searchData.data && searchData.data.length > 0) {
        existingBookerData = searchData.data[0];
        bookerContactId = existingBookerData.id;
        console.log('[ZOHO] Found existing booker contact:', bookerContactId);
      }
    }

    // Prepare booker contact data
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

    // Upsert booker contact
    const bookerUpsertResponse = await fetch('https://www.zohoapis.com/crm/v2/Contacts/upsert', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: [bookerData],
        duplicate_check_fields: ['Email'],
        trigger: ['workflow']
      })
    });

    if (!bookerUpsertResponse.ok) {
      const errorText = await bookerUpsertResponse.text();
      console.error('[ZOHO] Booker upsert failed:', errorText);
      return res.status(500).json({ error: 'Failed to create booker contact', details: errorText });
    }

    const bookerResult = await bookerUpsertResponse.json();
    bookerContactId = bookerResult.data[0].details.id;
    console.log('[ZOHO] Booker contact ID:', bookerContactId);

    // === STEP 2: FETCH PARTICIPANTS FROM AIRTABLE ===
    console.log('[ZOHO] Fetching participants from Airtable...');
    const participantsResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants?filterByFormula=FIND("${bookingId}",ARRAYJOIN({Booking}))`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    
    const participantsData = await participantsResponse.json();
    const participants = participantsData.records || [];
    console.log('[ZOHO] Found participants:', participants.length);

    // === STEP 3: CREATE PARTICIPANT CONTACTS ===
    let contactsToCreate = [];

    if (classType === 'adult') {
      // Adult class: Create contact for each participant
      contactsToCreate = participants.map(p => ({
        participant: p,
        data: {
          Last_Name: p.fields['Last Name'],
          First_Name: p.fields['First Name'],
          Email: contactInfo.email, // Use booking contact's email
          Phone: contactInfo.phone,
          Lead_Source: 'Website',
          Latest_Class: classInfo.className,
          Latest_Class_Date: classInfo.date,
          Latest_Prep_URL: prepPageUrl,
          Class_History: newClassEntry,
          Total_Classes_Attended: 1,
          Age_Group: p.fields['Age Group'],
          Booked_By: bookerContactId // Link to booker
        }
      }));
    } else if (classType === 'mother-daughter') {
      // Mother-daughter: Only create contacts for 16+ (mothers/guardians)
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
          Booked_By: bookerContactId // Link to booker
        }
      }));
    }

    console.log('[ZOHO] Contacts to create:', contactsToCreate.length);

    // === STEP 4: UPSERT PARTICIPANT CONTACTS ===
    const results = [];
    
    for (const { participant, data: contactData } of contactsToCreate) {
      try {
        // Check if participant already exists and append to their history
        const participantEmail = contactData.Email;
        const participantName = `${contactData.First_Name} ${contactData.Last_Name}`;
        
        const searchResponse = await fetch(
          `https://www.zohoapis.com/crm/v2/Contacts/search?criteria=(Email:equals:${encodeURIComponent(participantEmail)})and(First_Name:equals:${encodeURIComponent(contactData.First_Name)})and(Last_Name:equals:${encodeURIComponent(contactData.Last_Name)})`,
          {
            headers: {
              'Authorization': `Zoho-oauthtoken ${access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.data && searchData.data.length > 0) {
            const existing = searchData.data[0];
            // Append to existing history
            contactData.Class_History = existing.Class_History 
              ? `${existing.Class_History}\n${newClassEntry}`
              : newClassEntry;
            contactData.Total_Classes_Attended = (existing.Total_Classes_Attended || 0) + 1;
            console.log(`[ZOHO] Found existing participant, appending to history: ${participantName}`);
          }
        }

        console.log(`[ZOHO] Upserting contact: ${participantName}`);
        
        const contactResponse = await fetch('https://www.zohoapis.com/crm/v2/Contacts/upsert', {
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

        const responseText = await contactResponse.text();
        console.log(`[ZOHO] Response status: ${contactResponse.status}`);

        if (contactResponse.ok) {
          const result = JSON.parse(responseText);
          results.push({
            success: true,
            name: participantName,
            contactId: result.data[0].details.id
          });
          console.log(`[ZOHO] ✓ Successfully created/updated contact: ${participantName}`);
        } else {
          console.error(`[ZOHO] ✗ Failed to create contact: ${responseText}`);
          results.push({
            success: false,
            name: participantName,
            error: responseText
          });
        }
      } catch (error) {
        console.error(`[ZOHO] Exception creating contact for ${contactData.First_Name}:`, error);
        results.push({
          success: false,
          name: `${contactData.First_Name} ${contactData.Last_Name}`,
          error: error.message
        });
      }
    }

    console.log('[ZOHO] Final results:', results);
    return res.json({ 
      success: true,
      bookerContactId,
      contacts: results,
      totalCreated: results.filter(r => r.success).length
    });

  } catch (error) {
    console.error('[ZOHO] Fatal error:', error);
    return res.status(500).json({ error: error.message });
  }
}
