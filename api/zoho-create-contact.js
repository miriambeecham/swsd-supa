export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
    const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
    const ZOHO_REFRESH_TOKEN = process.env.ZOHO_REFRESH_TOKEN;
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    
    const { contactInfo, classInfo, prepPageUrl, bookingId, classType } = req.body;

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

    const { access_token } = await tokenResponse.json();

    // Fetch participants from Airtable
    const participantsResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Participants?filterByFormula=FIND("${bookingId}",ARRAYJOIN({Booking}))`,
      { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } }
    );
    
    const participantsData = await participantsResponse.json();
    const participants = participantsData.records || [];

    // Determine which contacts to create
    let contactsToCreate = [];

    if (classType === 'adult') {
      // Adult class: Create contact for each participant
      contactsToCreate = participants.map(p => ({
        Last_Name: p.fields['Last Name'],
        First_Name: p.fields['First Name'],
        Email: contactInfo.email, // Use booking contact's email
        Phone: contactInfo.phone,
        Lead_Source: 'Website',
        Description: `Registered for ${classInfo.className} on ${classInfo.date}`,
        Latest_Class: classInfo.className,
        Latest_Class_Date: classInfo.date,
        Prep_Page_URL: prepPageUrl,
        Age_Group: p.fields['Age Group']
      }));
    } else if (classType === 'mother-daughter') {
      // Mother-daughter: Only create contacts for 16+ (mothers/guardians)
      const mothers = participants.filter(p => p.fields['Age Group'] === '16+');
      contactsToCreate = mothers.map(p => ({
        Last_Name: p.fields['Last Name'],
        First_Name: p.fields['First Name'],
        Email: contactInfo.email,
        Phone: contactInfo.phone,
        Lead_Source: 'Website',
        Description: `Registered for ${classInfo.className} on ${classInfo.date} with daughter(s)`,
        Latest_Class: classInfo.className,
        Latest_Class_Date: classInfo.date,
        Prep_Page_URL: prepPageUrl,
        Number_of_Daughters: participants.filter(p => p.fields['Age Group'] !== '16+').length
      }));
    }

    // Create contacts in Zoho (batch upsert)
    const results = [];
    
    for (const contactData of contactsToCreate) {
      try {
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

        if (contactResponse.ok) {
          const result = await contactResponse.json();
          results.push({
            success: true,
            name: `${contactData.First_Name} ${contactData.Last_Name}`,
            contactId: result.data[0].details.id
          });
        }
      } catch (error) {
        console.error(`Failed to create contact for ${contactData.First_Name}:`, error);
        results.push({
          success: false,
          name: `${contactData.First_Name} ${contactData.Last_Name}`,
          error: error.message
        });
      }
    }

    return res.json({ 
      success: true, 
      contacts: results,
      totalCreated: results.filter(r => r.success).length
    });

  } catch (error) {
    console.error('Zoho integration error:', error);
    return res.status(500).json({ error: error.message });
  }
}
