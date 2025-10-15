// /api/admin/login.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password, rememberMe } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const INSTRUCTOR_PASSWORD_HASH = process.env.INSTRUCTOR_PASSWORD_HASH;
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!INSTRUCTOR_PASSWORD_HASH || !JWT_SECRET) {
      console.error('Missing environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Compare password with hash
    const isValid = await bcrypt.compare(password, INSTRUCTOR_PASSWORD_HASH);

    if (!isValid) {
      // Log failed attempt (optional - for security monitoring)
      console.log('Failed login attempt:', {
        timestamp: new Date().toISOString(),
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
      });
      
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const expiresIn = rememberMe ? '30d' : '8h';
    const token = jwt.sign(
      { 
        role: 'instructor',
        loginTime: new Date().toISOString()
      },
      JWT_SECRET,
      { expiresIn }
    );

    // Set httpOnly cookie
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000;
    
    res.setHeader('Set-Cookie', `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge / 1000}`);

    // Log successful login (optional - for audit trail)
    console.log('Successful login:', {
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      rememberMe
    });

    return res.status(200).json({ 
      success: true,
      expiresIn: rememberMe ? '30 days' : '8 hours'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
