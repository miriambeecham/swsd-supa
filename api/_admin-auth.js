// JWT verification for /api/admin/* endpoints. Returns true if the request is
// authenticated; otherwise writes the appropriate response and returns false.
import jwt from 'jsonwebtoken';

export function requireAdminAuth(req, res) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    res.status(500).json({ error: 'Server configuration error' });
    return false;
  }

  const cookies = req.headers.cookie?.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {}) || {};
  const token = cookies.auth_token;
  if (!token) {
    res.status(401).json({ error: 'Not authenticated' });
    return false;
  }

  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return false;
  }
}
