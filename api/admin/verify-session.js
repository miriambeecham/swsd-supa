// /api/admin/verify-session.js
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get token from cookie
    const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});

    const token = cookies?.auth_token;

    if (!token) {
      return res.status(401).json({ authenticated: false, error: 'No token found' });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      return res.status(200).json({ 
        authenticated: true,
        role: decoded.role,
        loginTime: decoded.loginTime
      });
    } catch (jwtError) {
      // Token is invalid or expired
      return res.status(401).json({ authenticated: false, error: 'Invalid or expired token' });
    }

  } catch (error) {
    console.error('Session verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
