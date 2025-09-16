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
};

export default function StripeSuccessPage() {
  const [sp] = useSearchParams();

  // Values set by your Stripe success_url:
  // success_url: `${baseUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingId}`
  const sessionId = sp.get('session_id') || '';
  const bookingId = sp.get('booking_id') || '';

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // ----- Calendar derivations -----
  const safeDate = useMemo(
    () => normalizeDate(booking?.classDate ?? null),
    [booking?.classDate]
  );

  const startDT = useMemo(() => {
    // try exact start time, else noon fallback
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
      <h1 className="text-3xl font-semibold mb-4">Payment Successful 🎉</h1>

      {loading && <div className="text-gray-600">Finalizing your booking…</div>}

      {!loading && error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 mb-6">
          <p className="font-medium">We completed your payment, but couldn’t load your booking details.</p>
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
      )}

      {!loading && !error && booking && (
        <div className="space-y-6">
          <div className="rounded-lg border p-4">
            <h2 className="text-xl font-semibold">{booking.className}</h2>
            <div className="mt-2 text-gray-700">
              <div><span className="font-medium">Date:</span> {booking.classDate || 'TBD'}</div>
              <div><span className="font-medium">Time:</span> {booking.startTime || 'TBD'} – {booking.endTime || 'TBD'}</div>
              <div><span className="font-medium">Location:</span> {booking.location || 'TBD'}</div>
              <div><span className="font-medium">Participants:</span> {booking.participantCount ?? 1}</div>
              <div><span className="font-medium">Total:</span> ${booking.totalAmount?.toFixed?.(2) ?? '0.00'}</div>
              {bookingId && <div className="text-sm text-gray-500 mt-2">Booking ID: {bookingId}</div>}
            </div>
          </div>

          {/* Add to Calendar */}
          {startDT && endDT && (
            <div className="flex gap-3">
              <a
                className="px-3 py-2 rounded border hover:bg-gray-50"
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
                Add to Google Calendar
              </a>

              <button
                className="px-3 py-2 rounded border hover:bg-gray-50"
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
                Download .ics
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ===================== helpers (module scope) ===================== */

// Normalize to YYYY-MM-DD even if Airtable sends ISO like "2025-10-12T00:00:00.000Z"
function normalizeDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const s = String(dateStr);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // already date-only
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

// Parse "18:00", "18:00:00", "6:00 PM", "6 PM" → { hh, mm }
function parseTimeString(t: string | null): { hh: number; mm: number } | null {
  if (!t) return null;
  const s = String(t).trim().toUpperCase();

  // 24h: "HH:MM" or "HH:MM:SS"
  let m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (m) {
    const hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) return { hh, mm };
  }

  // 12h: "H PM", "H:MM PM"
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

// Build a Date from date-only string + time string
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

// Duration from start/end time or fallback to 90 minutes
function minutesBetween(dateStr: string | null, start: string | null, end: string | null): number {
  const s = buildDateTime(dateStr, start);
  const e = buildDateTime(dateStr, end);
  if (s && e && e > s) return Math.round((e.getTime() - s.getTime()) / 60000);
  return 90; // default
}

// Calendar helpers
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
