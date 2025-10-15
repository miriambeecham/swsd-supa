// /src/pages/AdminLoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

const AdminLoginPage = () => {
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify-session');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            navigate('/admin/attendance');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (!captchaToken) {
      setError('Please complete the CAPTCHA');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, rememberMe })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        navigate('/admin/attendance');
      } else {
        setError(data.error || 'Invalid password');
        setPassword('');
        setCaptchaToken(null);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Instructor Login - Streetwise Self Defense</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-accent-primary rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-navy">
            Instructor Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Access attendance management
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me for 30 days
            </label>
          </div>

          <div className="flex justify-center">
            <ReCAPTCHA
              sitekey="6LCg7JArAAAAAJSqTBmdDCKBVc2dW3UyqQ037CMq"
              onChange={(token) => setCaptchaToken(token)}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !captchaToken}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white 
              ${loading || !captchaToken
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-accent-primary hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary'
              } transition-colors`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="text-center text-xs text-gray-500 mt-4">
            This page is for authorized instructors only
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
