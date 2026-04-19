// Shared helpers for booking-related emails (datetime formatting, iCal,
// Resend send + tracking write-back). The email HTML itself varies per
// caller so it's passed in.

export const convertToISO = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return new Date().toISOString();
  if (timeStr.includes('T')) return new Date(timeStr).toISOString();
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return new Date(dateStr + 'T12:00:00').toISOString();
  let hours = parseInt(match[1]);
  const mins = parseInt(match[2]);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00-08:00`).toISOString();
};

export const formatTimeForDisplay = (timeStr) => {
  if (!timeStr) return 'TBD';
  if (timeStr.includes('T')) {
    return new Date(timeStr).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles',
    });
  }
  return timeStr;
};

export const formatDateForDisplay = (dateStr) =>
  dateStr
    ? new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      })
    : 'TBD';

export const stripeFmt = (d) =>
  new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

// Build a Google Calendar quick-add URL.
export function buildGcalURL({ className, startISO, endISO, location, details }) {
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(className)}&dates=${stripeFmt(startISO)}/${stripeFmt(endISO)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&ctz=America/Los_Angeles`;
}

// Build an iCal attachment for a single class event.
export async function buildClassIcal({ className, startISO, endISO, location, description }) {
  const { default: ical } = await import('ical-generator');
  const cal = ical({ name: 'Self Defense Class', timezone: 'America/Los_Angeles' });
  cal.createEvent({
    start: new Date(startISO),
    end: new Date(endISO),
    summary: className,
    location,
    description,
  });
  return cal.toString();
}

// Send an email via Resend, then write tracking columns onto the booking row.
// Caller is responsible for skip logic (unsubscribed, already-sent, etc.).
export async function sendBookingEmailAndTrack({
  supabase, bookingUuid, to, from, subject, html, icalString,
}) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromHeader = from || `"Streetwise Self Defense" <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`;

  const { data, error } = await resend.emails.send({
    from: fromHeader,
    to,
    subject,
    html,
    attachments: icalString ? [{ filename: 'class-event.ics', content: icalString }] : [],
    headers: {
      'List-Unsubscribe': `<https://streetwiseselfdefense.com/api/unsubscribe?id=${bookingUuid}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
  if (error) {
    console.error('[EMAIL] Resend error:', error);
    return { ok: false, error };
  }
  if (data?.id) {
    const { error: trackErr } = await supabase
      .from('bookings')
      .update({
        confirmation_email_id: data.id,
        confirmation_email_status: 'Sent',
        confirmation_email_sent_at: new Date().toISOString(),
      })
      .eq('id', bookingUuid);
    if (trackErr) console.error('[EMAIL-TRACKING] update failed:', trackErr.message);
  }
  return { ok: true, resendId: data?.id || null };
}
