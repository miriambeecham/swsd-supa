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
  waiverUrl?: string | null;
};

export default function StripeSuccessPage() {
  const [sp] = useSearchParams();

  const sessionId = sp.get('session_id') || '';
  const bookingId = sp.get('booking_id') || '';

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedWaiver, setCopiedWaiver] = useState<boolean>(false);

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
            <div className="mt-4">
              <Link to="/public-classes" className="underline">Back to classes</Link>
            </div>
          </div>
        </>
      )}

      {!loading && !error && booking && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-gray-900">Registration Confirmed!</h1>
            <p className="text-gray-600 mt-2">You're all set for your self-defense class</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{booking.className}</h2>
            <div className="space-y-3 text-gray-700">
              <div className="flex">
                <span className="font-medium w-32 flex-shrink-0">Date:</span>
                <span>{booking.classDate || 'TBD'}</span>
              </div>
              
              <div className="flex">
                <span className="font-medium w-32 flex-shrink-0">Time:</span>
                <span>
                  {formatDisplayTime(booking.startTime)} – {formatDisplayTime(booking.endTime)}
                </span>
              </div>
              
              <div className="flex">
                <span className="font-medium w-32 flex-shrink-0">Location:</span>
                <span className="flex-1">{booking.location || 'TBD'}</span>
              </div>
              
              <div className="flex">
                <span className="font-medium w-32 flex-shrink-0">Participants:</span>
                <span>{booking.participantCount ?? 1}</span>
              </div>
              
              <div className="flex">
                <span className="font-medium w-32 flex-shrink-0">Total Paid:</span>
                <span className="text-teal-600 font-semibold">${booking.totalAmount?.toFixed?.(2) ?? '0.00'}</span>
              </div>
              
              {bookingId && (
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Booking ID: {bookingId}</span>
                </div>
              )}
            </div>
          </div>

          {startDT && endDT && (
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Add to Your Calendar</h3>
              <div className="flex flex-col sm:flex-row gap-3">

                <a
                  className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
                  href={makeGoogleCalendarUrl({
                    title: booking.className,
                    start: startDT,
                    end: endDT,
                    description: `Streetwise Self-Defense booking${
                      booking.participantCount ? ` for ${booking.participantCount} participant(s)` : ''
                    }.`,
                    location: booking.location || '',
                  })}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"></path>
                  </svg>
                  Google Calendar
                </a>

                <button
                  className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
                  onClick={() =>
                    downloadICS({
                      title: booking.className,
                      start: startDT,
                      end: endDT,
                      description: `Streetwise Self-Defense booking${
                        booking.participantCount ? ` for ${booking.participantCount} participant(s)` : ''
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
              {booking.waiverUrl && (
                <li>✓ Complete the waiver form below (required for each participant)</li>
              )}
              <li>✓ Wear comfortable athletic clothing (no shorts or jewelry, please)</li>
            </ul>

            {booking.waiverUrl && (
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex items-start gap-2 mb-2">
                  <svg className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Waiver Required</p>
                    <p className="text-sm text-gray-700">
                      Each participant must complete a waiver before class. 
                      {booking.participantCount && booking.participantCount > 1 && (
                        <span className="font-medium"> Please share this link with everyone in your party.</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <a
                    href={booking.waiverUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open Waiver Form
                  </a>
                  
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(booking.waiverUrl!);
                        setCopiedWaiver(true);
                        setTimeout(() => setCopiedWaiver(false), 2000);
                      } catch (err) {
                        console.error('Failed to copy:', err);
                      }
                    }}
                    className="inline-flex items-center justify-center px-4 py-2 bg-white text-teal-700 font-medium rounded-lg border-2 border-teal-600 hover:bg-teal-50 transition-colors text-sm"
                  >
                    {copiedWaiver ? (
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

          <div className="text-center pt-6">
            <Link
              to="/public-classes"
              className="text-teal-600 hover:text-teal-700 font-medium underline"
            >
              ← Back to classes
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== helpers (module scope) ===================== */

function formatDisplayTime(timeStr: string | null | undefined): string {
  if (!timeStr) return 'TBD';
  
  // If it's an ISO datetime string (YYYY-MM-DDTHH:mm:ss), extract and format the time
  if (timeStr.includes('T')) {
    try {
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Los_Angeles'
        });
      }
    } catch (e) {
      console.error('Error parsing time:', e);
    }
  }
  
  // If it's already formatted nicely (e.g., "10:00 AM"), return as-is
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(timeStr)) {
    return timeStr;
  }
  
  // Try to parse with parseTimeString as fallback
  const parsed = parseTimeString(timeStr);
  if (parsed) {
    const { hh, mm } = parsed;
    const hour12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    return `${hour12}:${String(mm).padStart(2, '0')} ${ampm}`;
  }
  
  return timeStr; // Fallback to whatever we received
}

function normalizeDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const s = String(dateStr);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function parseTimeString(t: string | null): { hh: number; mm: number } | null {
  if (!t) return null;
  const s = String(t).trim().toUpperCase();

  let m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (m) {
    const hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) return { hh, mm };
  }

  m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (m) {
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2] || '0', 10);
    const mer = m[3] as 'AM' | 'PM';
    if (hh === 12 && mer === 'AM') hh = 0;
    if (hh < 12 && mer === 'PM') hh += 12;
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) return { hh, mm };
  }

  return null;
}

function buildDateTime(dateStr: string | null, timeStr: string | null): Date | null {
  const d = normalizeDate(dateStr);
  if (!d) return null;
  const tm = parseTimeString(timeStr);
  if (!tm) return null;
  const hh = String(tm.hh).padStart(2, '0');
  const mm = String(tm.mm).padStart(2, '0');
  const iso = `${d}T${hh}:${mm}:00`;
  const out = new Date(iso);
  return isNaN(out.getTime()) ? null : out;
}

function minutesBetween(dateStr: string | null, start: string | null, end: string | null): number {
  const s = buildDateTime(dateStr, start);
  const e = buildDateTime(dateStr, end);
  if (s && e && e > s) return Math.round((e.getTime() - s.getTime()) / 60000);
  return 90;
}

function pad(n: number) { return String(n).padStart(2, '0'); }
function toIcsDate(dt: Date) {
  const y = dt.getUTCFullYear();
  const m = pad(dt.getUTCMonth() + 1);
  const d = pad(dt.getUTCDate());
  const h = pad(dt.getUTCHours());
  const mi = pad(dt.getUTCMinutes());
  const s = pad(dt.getUTCSeconds());
  return `${y}${m}${d}T${h}${mi}${s}Z`;
}

function makeGoogleCalendarUrl(opts: { title: string; start: Date; end: Date; description?: string; location?: string; }) {
  const base = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title || 'Class',
    dates: `${toIcsDate(opts.start)}/${toIcsDate(opts.end)}`,
    location: opts.location || '',
    details: opts.description || '',
  });
  return `${base}?${params.toString()}`;
}

function downloadICS(opts: { title: string; start: Date; end: Date; description?: string; location?: string; }) {
  const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Streetwise Self-Defense//Booking//EN
BEGIN:VEVENT
DTSTAMP:${toIcsDate(new Date())}
DTSTART:${toIcsDate(opts.start)}
DTEND:${toIcsDate(opts.end)}
SUMMARY:${(opts.title || 'Class').replace(/\n/g, ' ')}
DESCRIPTION:${(opts.description || '').replace(/\n/g, ' ')}
LOCATION:${(opts.location || '').replace(/\n/g, ' ')}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'class.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
