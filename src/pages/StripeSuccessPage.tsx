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

  const safeDate = useMemo(
    () => normalizeDate(booking?.classDate ?? null),
    [booking?.classDate]
  );

  const startDT = useMemo(() => {
    const precise = buildDateTime(safeDate, booking?.startTime ?? null);
    if (precise) return precise;
    return safeDate ? new Date(`${safeDate}T12:00:00`) : null;
  }, [safeDate, booking?.startTime]);

  const endDT = useMemo(() =>
