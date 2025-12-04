// /api/unsubscribe.js
// Handles one-click unsubscribe from List-Unsubscribe header

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get booking ID from query params
    const bookingId = req.query.id;

    if (!bookingId) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Request</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #991B1B; background: #FEE2E2; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Invalid Unsubscribe Request</h1>
            <p>The unsubscribe link appears to be invalid. Please contact us at jay@streetwiseselfdefense.com if you need assistance.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Fetch booking
    const bookingResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`
        }
      }
    );

    if (!bookingResponse.ok) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Booking Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { color: #991B1B; background: #FEE2E2; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Booking Not Found</h1>
            <p>We couldn't find your booking. Please contact us at jay@streetwiseselfdefense.com for assistance.</p>
          </div>
        </body>
        </html>
      `);
    }

    const booking = await bookingResponse.json();

    // Check if already unsubscribed
    if (booking.fields['Email Unsubscribed']) {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Already Unsubscribed</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .success { color: #065F46; background: #D1FAE5; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="success">
            <h1>Already Unsubscribed</h1>
            <p>You were previously unsubscribed from our emails.</p>
            <p style="margin-top: 20px; font-size: 14px; color: #6B7280;">
              If you have questions, contact us at <a href="mailto:jay@streetwiseselfdefense.com">jay@streetwiseselfdefense.com</a>
            </p>
          </div>
        </body>
        </html>
      `);
    }

    // Mark as unsubscribed
    const updateResponse = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Bookings/${bookingId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            'Email Unsubscribed': true,
            'Email Unsubscribed At': new Date().toISOString()
          }
        })
      }
    );

    if (!updateResponse.ok) {
      throw new Error('Failed to update booking');
    }

    console.log(`[UNSUBSCRIBE] Booking ${bookingId} unsubscribed from emails`);

    // Success page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Unsubscribed Successfully</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px; 
            text-align: center; 
          }
          .success { 
            color: #065F46; 
            background: #D1FAE5; 
            padding: 30px; 
            border-radius: 8px; 
            margin-bottom: 20px;
          }
          .info {
            background: #F3F4F6;
            padding: 20px;
            border-radius: 8px;
            text-align: left;
          }
          h1 { margin-top: 0; }
          a { color: #20B2AA; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>✓ Unsubscribed Successfully</h1>
          <p>You've been removed from our email list for this booking.</p>
        </div>
        
        <div class="info">
          <h3>What this means:</h3>
          <ul style="line-height: 1.8;">
            <li>You won't receive reminder emails about this class</li>
            <li>You'll still receive your confirmation email (already sent)</li>
            <li>You may still receive SMS reminders if you provided a phone number</li>
          </ul>
          
          <p style="margin-top: 20px; font-size: 14px; color: #6B7280;">
            <strong>Changed your mind?</strong> Contact us at 
            <a href="mailto:jay@streetwiseselfdefense.com">jay@streetwiseselfdefense.com</a> 
            or <a href="tel:+19255329953">(925) 532-9953</a>
          </p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('[UNSUBSCRIBE] Error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          .error { color: #991B1B; background: #FEE2E2; padding: 20px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>Something Went Wrong</h1>
          <p>We encountered an error processing your request. Please contact us at jay@streetwiseselfdefense.com for assistance.</p>
        </div>
      </body>
      </html>
    `);
  }
}
