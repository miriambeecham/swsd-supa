// src/pages/StripeSuccessPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

type BookingInfo = {
  className: string;
  classDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  participantCount?: number | null;
  totalAmount?: number | null;
  classPrepUrl?: string | null;  // Changed from waiverUrl
};

export default function StripeSuccessPage() {
  const [sp] = useSearchParams();

  const sessionId = sp.get('session_id') || '';
  const bookingId = sp.get('booking_id') || '';

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);

        if (!sessionId || !bookingId) {
          throw new Error(
            `Missing data from Stripe: ${!sessionId ? 'session_id' : ''}${
              !sessionId && !bookingId ? ' and ' : ''
            }${!bookingId ? 'booking_id' : ''}`
          );
        }

        const res = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, booking_id: bookingId }),
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Verify failed (HTTP ${res.status}): ${txt}`);
        }

        const json = await res.json();
        if (!json?.success || !json?.booking) {
          throw new Error('Verify succeeded but booking payload is missing.');
        }

        setBooking(json.booking as BookingInfo);
      } catch (e: any) {
        console.error('verify-payment error:', e);
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [sessionId, bookingId]);

  const safeDate = useMemo(
    () => normalizeDate(booking?.classDate ?? null),
    [booking?.classDate]
  );

  const startDT = useMemo(() => {
    const precise = buildDateTime(safeDate, booking?.startTime ?? null);
    if (precise) return precise;
    return safeDate ? new Date(`${safeDate}T12:00:00`) : null;
  }, [safeDate, booking?.startTime]);

  const endDT = useMemo(() => {
    if (!startDT) return null;
    const mins = minutesBetween(safeDate, booking?.startTime ?? null, booking?.endTime ?? null);
    return new Date(startDT.getTime() + mins * 60 * 1000);
  }, [startDT, safeDate, booking?.startTime, booking?.endTime]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block relative w-16 h-16 mb-6">
            <div className="absolute border-4 border-gray-200 rounded-full w-16 h-16"></div>
            <div className="absolute border-4 border-teal-500 border-t-transparent rounded-full w-16 h-16 animate-spin"></div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            Processing your registration...
          </h2>
          <p className="text-gray-600 mb-2">
            Please wait while we confirm your booking and sync your information.
          </p>
          <p className="text-sm text-gray-500">
            This may take 10-15 seconds.
          </p>
        </div>
      )}

      {!loading && error && (
        <>
          <h1 className="text-3xl font-semibold mb-4">Payment Successful</h1>
          <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 mb-6">
            <p className="font-medium">We completed your payment, but couldn't load your booking details.</p>
            <p className="text-sm mt-1">{error}</p>
            {bookingId && (
              <p className="text-sm mt-2">
                If this keeps happening, please email support with booking ID <code>{bookingId}</code>.
              </p>
            )}
          </div>
          <Link to="/classes" className="text-teal-600 hover:text-teal-700 font-medium">
            Back to classes
          </Link>
        </>
      )}

      {!loading && !error && booking && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Registration Confirmed!
                </h1>
                <p className="text-gray-700">
                  Payment successful. Check your email for confirmation details.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Class Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Class:</span>
                <span className="font-medium text-gray-900">{booking.className}</span>
              </div>
              {booking.classDate && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium text-gray-900">
                    {startDT?.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              )}
              {booking.startTime && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium text-gray-900">
                    {startDT?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    {endDT && ` - ${endDT.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                  </span>
                </div>
              )}
              {booking.location && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-gray-900">{booking.location}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Participants:</span>
                <span className="font-medium text-gray-900">{booking.participantCount || 1}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Total Paid:</span>
                <span className="font-semibold text-gray-900">${booking.totalAmount || 0}</span>
              </div>
            </div>
          </div>

          {startDT && endDT && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Add to Calendar</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() =>
                    window.open(
                      `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                        booking.className
                      )}&dates=${startDT.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endDT
                        .toISOString()
                        .replace(/[-:]/g, '')
                        .replace(/\.\d{3}/, '')}&details=${encodeURIComponent(
                        `Confirmed${
                          booking.participantCount && booking.participantCount > 1
                            ? ` for ${booking.participantCount} participant(s)`
                            : ''
                        }.`
                      )}&location=${encodeURIComponent(booking.location || '')}&ctz=America/Los_Angeles`,
                      '_blank'
                    )
                  }
                  className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  Google Calendar
                </button>

                <button
                  onClick={() =>
                    downloadICS({
                      title: booking.className,
                      start: startDT,
                      end: endDT,
                      description: `Confirmed${
                        booking.participantCount && booking.participantCount > 1
                          ? ` for ${booking.participantCount} participant(s)`
                          : ''
                      }.`,
                      location: booking.location || '',
                    })
                  }
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Download .ics
                </button>
              </div>
            </div>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">What's Next?</h3>
            <ul className="text-sm text-gray-700 space-y-1 mb-4">
              <li>✓ Check your email for confirmation details</li>
              <li>✓ Add the class to your calendar</li>
              {booking.classPrepUrl && (
                <li>✓ Visit the class prep page to complete your waiver (required)</li>
              )}
              <li>✓ Wear comfortable athletic clothing</li>
            </ul>

            {booking.classPrepUrl && (
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex items-start gap-2 mb-2">
                  <svg className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Class Prep & Waiver</p>
                    <p className="text-sm text-gray-700">
                      Visit your class prep page for important details and to complete your required waiver.
                      {booking.participantCount && booking.participantCount > 1 && (
                        <span className="font-medium"> Each participant must complete a separate waiver.</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <a
                    href={booking.classPrepUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Class Prep & Complete Waiver
                  </a>
                  
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(booking.classPrepUrl!);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      } catch (err) {
                        console.error('Failed to copy:', err);
                      }
                    }}
                    className="inline-flex items-center justify-center px-4 py-2 bg-white text-teal-700 font-medium rounded-lg border-2 border-teal-600 hover:bg-teal-50 transition-colors text-sm"
                  >
                    {copiedLink ? (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link to="/classes" className="text-teal-600 hover:text-teal-700 font-medium">
              ← Back to classes
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// Helper functions below (keep all existing helper functions)
function normalizeDate(d: string | null): string | null {
  if (!d) return null;
  const m = d.match(/^\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}

function buildDateTime(dateStr: string | null, timeStr: string | null): Date | null {
  if (!dateStr || !timeStr) return null;
  if (!timeStr.includes('T')) return null;
  return new Date(timeStr);
}

function minutesBetween(
  dateStr: string | null,
  startStr: string | null,
  endStr: string | null
): number {
  const s = buildDateTime(dateStr, startStr);
  const e = buildDateTime(dateStr, endStr);
  if (!s || !e) return 120;
  return Math.round((e.getTime() - s.getTime()) / 60000);
}

function downloadICS(evt: {
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
}) {
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(evt.start)}`,
    `DTEND:${fmt(evt.end)}`,
    `SUMMARY:${evt.title}`,
    evt.description ? `DESCRIPTION:${evt.description}` : '',
    evt.location ? `LOCATION:${evt.location}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'class-event.ics';
  a.click();
  URL.revokeObjectURL(url);
}