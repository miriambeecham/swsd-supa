// /src/pages/AdminImportPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Upload, CheckCircle, XCircle, AlertCircle, ArrowLeft, Download, Mail } from 'lucide-react';

const AdminImportPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [emailResults, setEmailResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify-session');
        if (!response.ok) {
          navigate('/admin/login');
          return;
        }
        const data = await response.json();
        if (!data.authenticated) {
          navigate('/admin/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/admin/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const downloadSampleCSV = () => {
    const sampleData = [
      ['bookingGroupId', 'firstName', 'lastName', 'email', 'phone', 'ageGroup', 'classScheduleId'],
      ['1', 'Jane', 'Smith', 'jane@email.com', '925-555-0100', '16+', 'recXXXXXXXXXXXXXX'],
      ['1', 'Emma', 'Smith', '', '925-555-0100', '12-15', 'recXXXXXXXXXXXXXX'],
      ['2', 'Maria', 'Garcia', 'maria@email.com', '925-555-0200', '16+', 'recXXXXXXXXXXXXXX'],
      ['2', 'Sofia', 'Garcia', '', '925-555-0200', '12-15', 'recXXXXXXXXXXXXXX']
    ];

    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'external_bookings_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
      setResults(null);
      setEmailResults(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['bookingGroupId', 'firstName', 'lastName', 'email', 'phone', 'ageGroup', 'classScheduleId'];
    
    // Validate headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return data;
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setImporting(true);
    setError(null);
    setResults(null);
    setEmailResults(null);

    try {
      // Read file
      const text = await file.text();
      const csvData = parseCSV(text);

      // Send to API
      const response = await fetch('/api/admin/import-external-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await response.json();
      setResults(result);
      
      // Clear file input if successful
      if (result.errorCount === 0) {
        setFile(null);
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import bookings');
    } finally {
      setImporting(false);
    }
  };

  const handleSendConfirmationEmails = async () => {
    if (!results || !results.results) {
      setEmailError('No import results available');
      return;
    }

    // Get successful booking IDs
    const bookingIds = results.results
      .filter((r: any) => r.success && r.bookingId)
      .map((r: any) => r.bookingId);

    if (bookingIds.length === 0) {
      setEmailError('No successful bookings to send emails for');
      return;
    }

    setSendingEmails(true);
    setEmailError(null);
    setEmailResults(null);

    try {
      const response = await fetch('/api/admin/send-external-confirmation-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingIds })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send emails');
      }

      const result = await response.json();
      setEmailResults(result);
    } catch (err: any) {
      console.error('Email sending error:', err);
      setEmailError(err.message || 'Failed to send confirmation emails');
    } finally {
      setSendingEmails(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Helmet>
        <title>Import External Bookings - Streetwise Self Defense</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/attendance')}
            className="flex items-center gap-2 text-gray-600 hover:text-navy transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Attendance
          </button>
          <h1 className="text-3xl font-bold text-navy">Import External Bookings</h1>
          <p className="text-gray-600 mt-2">
            Upload a CSV file to import bookings from external registration systems (e.g., City of Walnut Creek)
          </p>
        </div>

        {/* Instructions Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-navy mb-4">Instructions</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Step 1: Download Template</h3>
              <p className="text-gray-600 mb-3">
                Download the CSV template and fill it with your booking data. Each booking group must have one adult (16+) with an email address.
              </p>
              <button
                onClick={downloadSampleCSV}
                className="flex items-center gap-2 bg-white border-2 border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <Download className="w-5 h-5" />
                Download CSV Template
              </button>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Step 2: Get Class Schedule ID</h3>
              <p className="text-gray-600">
                Go to the <a href="/admin/attendance" className="text-accent-primary hover:underline font-medium">Attendance page</a>, 
                select the correct class, and copy the Class Schedule ID from the blue box. Paste this ID in the 
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm mx-1">classScheduleId</code> column for all rows.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Step 3: Fill in Booking Data</h3>
              <p className="text-gray-600 mb-2">Required fields:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1 ml-4">
                <li><strong>bookingGroupId:</strong> Assign a unique number (1, 2, 3...) to group participants in the same booking</li>
                <li><strong>firstName, lastName:</strong> Participant's name</li>
                <li><strong>email:</strong> Required for adults (16+) - becomes the booking contact email. Leave blank for children/teens.</li>
                <li><strong>phone:</strong> Contact phone number (optional but recommended)</li>
                <li><strong>ageGroup:</strong> Must be exactly: <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">Under 12</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">12-15</code>, or <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">16+</code></li>
                <li><strong>classScheduleId:</strong> The Class Schedule ID from Step 2</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Step 4: Upload & Import</h3>
              <p className="text-gray-600">
                Upload your completed CSV file below. The system will create confirmed bookings for all groups.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Step 5: Send Confirmation Emails</h3>
              <p className="text-gray-600">
                After successful import, click the "Send Confirmation Emails" button to notify all participants. 
                Emails include class details, calendar invites, and waiver links (no payment information shown).
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Each booking group must have exactly one adult (16+) with an email address</li>
                  <li>Confirmation emails can be sent immediately after import</li>
                  <li>Reminder emails will be sent automatically 1 day before the class</li>
                  <li>All bookings are created as "Confirmed" with $0 payment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-navy mb-4">Upload CSV File</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
              disabled={importing}
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer text-accent-primary hover:text-accent-dark font-medium"
            >
              Choose CSV file
            </label>
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name}
              </p>
            )}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900">{error}</div>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full mt-6 bg-accent-primary hover:bg-accent-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Import Bookings
              </>
            )}
          </button>
        </div>

        {/* Import Results */}
        {results && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-navy mb-4">Import Results</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Total Groups:</span>
                <span className="font-semibold text-gray-900">{results.totalGroups}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <span className="text-green-700">Successful:</span>
                <span className="font-semibold text-green-900">{results.successCount}</span>
              </div>
              {results.errorCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                  <span className="text-red-700">Errors:</span>
                  <span className="font-semibold text-red-900">{results.errorCount}</span>
                </div>
              )}
            </div>

            {/* Send Confirmation Emails Button */}
            {results.successCount > 0 && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Step 5: Send Confirmation Emails</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Send confirmation emails to all successfully imported bookings. 
                  Emails will include class details and waiver links (no payment information).
                </p>
                
                {emailError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-900">{emailError}</div>
                  </div>
                )}

                <button
                  onClick={handleSendConfirmationEmails}
                  disabled={sendingEmails}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {sendingEmails ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending Emails...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Send Confirmation Emails
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Detailed Results */}
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Detailed Results:</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.results.map((result: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded ${
                      result.success ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 text-sm">
                      <p className={result.success ? 'text-green-900' : 'text-red-900'}>
                        <strong>Group {result.bookingGroupId}:</strong>
                        {result.success ? (
                          <>
                            {result.skipped ? (
                              <> Already processed - {result.reason}</>
                            ) : (
                              <>
                                {' '}Created booking for {result.contactEmail}
                                {result.participantCount > 1 && ` (${result.participantCount} participants)`}
                              </>
                            )}
                          </>
                        ) : (
                          <> {result.error}</>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Email Results */}
        {emailResults && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-navy mb-4">Email Results</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-gray-700">Total Emails:</span>
                <span className="font-semibold text-gray-900">{emailResults.totalBookings}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <span className="text-green-700">Sent Successfully:</span>
                <span className="font-semibold text-green-900">{emailResults.successCount}</span>
              </div>
              {emailResults.errorCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                  <span className="text-red-700">Errors:</span>
                  <span className="font-semibold text-red-900">{emailResults.errorCount}</span>
                </div>
              )}
            </div>

            {/* Detailed Email Results */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Email Delivery Details:</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {emailResults.results.map((result: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded ${
                      result.success ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 text-sm">
                      <p className={result.success ? 'text-green-900' : 'text-red-900'}>
                        {result.success ? (
                          <>
                            {result.skipped ? (
                              <><strong>{result.email}</strong> - {result.reason}</>
                            ) : (
                              <><strong>{result.email}</strong> - Confirmation sent</>
                            )}
                          </>
                        ) : (
                          <><strong>Booking {result.bookingId}</strong> - {result.error}</>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminImportPage;
