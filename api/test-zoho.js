export default async function handler(req, res) {
  try {
    const tokenResponse = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: process.env.ZOHO_REFRESH_TOKEN,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: 'refresh_token'
      })
    });

    const data = await tokenResponse.json();
    
    if (tokenResponse.ok && data.access_token) {
      return res.json({ success: true, message: 'Zoho tokens are valid!' });
    } else {
      return res.json({ success: false, message: 'Tokens expired or invalid', error: data });
    }
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
}
