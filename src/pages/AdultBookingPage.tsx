
SWSD Site Maintenance
/

// ============================================ // AdultBookingPage.tsx - UPDATED // ============================================ // Changes: // 1. Fixed time display to use start_time_new/end_time_new fields // 2. Added booking policies link to privacy statement import React, { useState } from 'r

pasted


// src/pages/CommunityMotherDaughterBookingPage.tsx import React, { useState, useEffect } from 'react'; import { useParams, Link } from 'react-router-dom'; import { Helmet } from 'react-helmet-async'; import { ArrowLeft, Calendar, Clock, MapPin, Users, Shield } from 'lucide-react'; import ReCAPTCHA

pasted


// src/pages/MotherDaughterBookingPage.tsx import React, { useState, useEffect } from 'react'; import { useLocation, Link } from 'react-router-dom'; import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react'; import ReCAPTCHA from 'react-google-recaptcha'; type AgeGroup = '' | 'Under 12' |

pasted

Locate our last conversation about the failed Twilio approval. I'd like to go ahead and add the feature on the class registration pages where the user is required to agree to receive text messages for class information and reminder purposes so that we can reapply. I don't want to change anything else on these pages.  Here are the current versions. Please work from these, not what you have in memory. Please let me know what quesitons you have or what options we should consider before you proceed.  ///


5 steps

Relevant chats
3 results





Let me search for more recent conversations specifically about the campaign rejection or failed

Let me search for more recent conversations about this topic.


Relevant chats
10 results












Identified implementation requirements and formulated clarifying questions.





I found the relevant conversation about Twilio. Here's the link: Twilio SMS reminders for class notifications

From our past discussion, you had registered your brand but the campaign registration failed because Twilio/10DLC requires proof of explicit opt-in consent from users before you can send them SMS messages. Adding a checkbox during booking is exactly the right approach to satisfy this requirement.

Before I make any changes, I have a few questions:

1. Checkbox text/wording: What would you like the consent text to say? Something like:

"I agree to receive text message reminders about my class"
"Yes, send me SMS reminders about my upcoming class (message and data rates may apply)"
Something else?
2. Required vs. Optional: Should this checkbox be:

Required to proceed with booking (they must opt in to book), or
Optional (they can book without opting in, but then won't get SMS reminders)?
3. Airtable field: I assume you'll want to store this consent in your Bookings table. Do you already have a field for SMS consent, or do we need to add one? (Something like SMS Consent - Checkbox type)

4. Placement on the form: Where would you like the checkbox? Options:

Near the phone number field
In the Privacy section (near the privacy policy/cancellation policy links)
In its own small section
Let me know your preferences and I'll provide the exact code changes for all three booking pages.

I'm wondering actually whether we should have a two part opt in one for information and reminders about this specific class and one for notices of upcoming events? What is best practice here for minmizing confusion and getting people to convert?


Weighed regulatory requirements against conversion friction, advocated dual-checkbox strategy.
16s









Great question! There are real tradeoffs here. Let me break down the options:

Option A: Single Checkbox (Simplest)
"I agree to receive text messages about my class and future events"

Pros:

Lowest friction, highest conversion
One decision for the user
Cons:

Mixes transactional (reminders) with marketing (promotions) - different legal treatments
People who just want reminders may decline entirely to avoid marketing
Higher unsubscribe/complaint rates later when they get promotional texts they didn't expect
Option B: Two Checkboxes (Clearest)
☑️ "Send me text reminders about this class" (required or optional)
☐ "Send me texts about future classes and events" (optional)
Pros:

Legally cleaner - transactional vs. marketing are separate
Easier Twilio campaign registration (can register as "transactional")
Builds trust - customers know exactly what they're agreeing to
Higher quality marketing list (people who actually want it)
Cons:

More friction
Slightly more complex UI
Option C: Hybrid (My Recommendation)
One checkbox, but worded to cover the class they're booking:

☑️ "Send me text message reminders about my upcoming class" (required to book)

Then after successful booking (on confirmation page or in confirmation email), offer:

"Want to hear about future classes? [Sign up for text updates]"

Why this works best:

Maximizes booking conversion - only one simple, relevant checkbox
High opt-in rate for reminders - it's clearly tied to what they just paid for
Clean Twilio registration - "transactional appointment reminders" is an easy category
Marketing list grows organically - you capture interested people post-purchase when they're already engaged
No confusion - each ask is contextually relevant
What do other businesses do?
Most appointment-based businesses (salons, dentists, fitness studios) use the hybrid approach - require consent for transactional reminders at booking, then market to them separately later through email or a "join our text list" landing page.

My recommendation: Start with Option C - just the class reminder checkbox for now. This solves your immediate Twilio approval problem with minimal friction. You can always add a marketing opt-in later once SMS is working.

What do you think?

We do ask them in the waiver and the satisfaction survey if they want to hear about future classes...we just don't specify text versus email...so maybe we add that later and for now we only put the option on the sign page specific to reminders for this class... I wish we could pre check it and have them uncheck if they don't want it...i like that better than making it required or defaulted to unchecked and optional, but I understand that Twilio doesn't allow that. Given the other two options, I would prefer to make it optional but we worry that our email gets sent to spam so often...


Weighed SMS consent tradeoffs against email deliverability concerns.









You raise a really good point about the email spam issue. Let me offer some perspective that might help you decide:

The Case for Making It Required
For transactional class reminders, requiring SMS consent is actually quite defensible:

It's in the customer's interest - They paid for a class. They need to know when/where to show up. If your emails are landing in spam, SMS is how they'll actually get that info.
It's standard practice - Airlines, doctors' offices, salons, and fitness studios routinely require a phone number and consent for appointment reminders. People expect it.
It's not marketing - You're not asking to sell them things. You're asking to remind them about something they already bought.
The alternative is worse - A no-show because they didn't see the email is bad for everyone.
If You Go Optional: Make It Compelling
If you prefer optional, the key is copy that explains the value:

☐ Text me reminders about my class
We'll send a reminder the day before with prep instructions and another on class day with the address. (Our emails sometimes land in spam, so this helps make sure you don't miss anything!)

This is honest, explains the benefit, and gives them a real reason to check it.

My Honest Take
Given that your emails have spam issues, I'd lean toward required for this specific use case. You're not being pushy - you're making sure the customer you just served actually gets the information they need to attend. That's good customer service.

But if "required" feels too heavy-handed, the compelling optional copy is a solid middle ground.

Which direction feels right to you? Once you decide, I'll write up the exact implementation.

Let's make it required...goodness knows they can always enter a fake phone number if they reallly don't want it...


Identified implementation requirements across three booking pages.



Ha! True. Alright, let's do it. A few final details before I write up the changes:

1. Proposed checkbox text:

☑️ Send me text message reminders about my class (required)

We'll text you the day before with prep info and on class day with the address. Reply STOP anytime to opt out.

The "Reply STOP" language is required by carriers and helps with Twilio approval. Does this wording work for you?

2. Placement: I'm thinking right below the phone number field makes the most sense - it's contextually connected to "here's my phone number, yes you can text me on it."

3. Airtable field: You'll need to add a field to your Bookings table (both staging and production):

Field name: SMS Consent
Field type: Checkbox
4. Backend: The create-booking API will need to pass this field through to Airtable when creating the booking record.

Does all of this sound right? If so, I'll provide:

Updated code for all 3 booking pages (AdultBookingPage, MotherDaughterBookingPage, CommunityMotherDaughterBookingPage)
The change needed for the create-booking API
Since we might change the timing of when we sent them...can we make the subtext more vague?


Weighed flexibility benefits and brainstormed vaguer alternative phrasings.


Absolutely. How about:

☑️ Send me text message reminders about my class (required)

We'll text you with class details and reminders. Reply STOP anytime to opt out.

Or even simpler:

☑️ Send me text message reminders about my class (required)

Message and data rates may apply. Reply STOP to opt out.

The second one is the standard carrier-friendly language you see everywhere. It's vague on purpose and gives you full flexibility on when/what you send (as long as it's related to their class).

Which do you prefer?

Will the message and data rates help it get through approval? If so, let's include it; otherwise i prefer the first one. it's friendlier...


Weighed compliance benefits against friendliness preference.





Yes, it does help! "Message and data rates may apply" is part of the standard CTIA (carrier industry) compliance language that Twilio/10DLC reviewers look for when approving campaigns.

Let's combine both - friendly AND compliant:

☑️ Send me text message reminders about my class (required)

We'll text you with class details and reminders. Message and data rates may apply. Reply STOP to opt out.

Best of both worlds - it explains what they're getting in plain language, but includes the magic compliance phrases at the end.

Sound good?

Yes, sounds good. Let's add it to one of the pages and see how the formatting works before we add it to the other two.


Strategized implementation plan for single booking page testing.






Let's start with AdultBookingPage since it's the simplest. Here are the specific changes needed:

1. Add state (around line 18, with the other useState declarations):

tsx
const [smsConsent, setSmsConsent] = useState(false);
2. Add validation (in the collectErrors function, around line 50, after the recaptcha check):

tsx
if (!smsConsent) errs.push('Please agree to receive text message reminders');
3. Add the checkbox UI (right after the Phone input field, around line 175):

tsx
{/* SMS Consent - after phone field */}
<div className="sm:col-span-2 mt-2">
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={smsConsent}
      onChange={(e) => setSmsConsent(e.target.checked)}
      className={`mt-1 h-5 w-5 rounded border-gray-300 text-accent-primary focus:ring-accent-primary ${
        showValidation && !smsConsent ? 'border-red-500' : ''
      }`}
    />
    <div>
      <span className="text-sm font-medium text-gray-700">
        Send me text message reminders about my class <span className="text-red-500">*</span>
      </span>
      <p className="text-xs text-gray-500 mt-1">
        We'll text you with class details and reminders. Message and data rates may apply. Reply STOP to opt out.
      </p>
    </div>
  </label>
</div>
4. Add to API payload (in handleSubmit, around line 95, add to the payload object):

tsx
smsConsent: smsConsent,
Want me to put together the complete updated file so you can copy it in, or would you prefer to make these changes manually and test?

Yes please, but question...would the check box work better at the bottom of the page right above the Captcha?  or do you think it is better tied closely to the phone number?


Weighed checkbox placement options and advocated for bottom positioning.






Good question! I'd actually recommend bottom of the page, above the reCAPTCHA for a few reasons:

Near phone number:

Logical connection to "here's my number"
But clutters up the contact info section
Near bottom (above reCAPTCHA):

Groups all "consent" items together - SMS consent, privacy policy, cancellation policy
Creates a clear "agreement zone" before they submit
It's the last thing they see before clicking "Proceed to Payment" - feels more intentional
Keeps the contact form clean and focused on data entry
This is the pattern most checkout flows use
Looking at the current page, the privacy/cancellation policy text is already at the bottom. The SMS checkbox would fit nicely right above that, creating a natural flow:

☑️ Send me text message reminders about my class (required)
We'll text you with class details and reminders...

By proceeding with your booking, you agree to our Privacy Policy and Cancellation/Rescheduling Policies.

[reCAPTCHA]

[Proceed to Payment]

Let me put together the complete updated file with the checkbox in that location.

Should we add a checkbox for the privacy and cancellation while we are at it? Or leave it alone to minimize friction...


Weighed consent checkbox necessity against user friction.







I'd leave it alone. Here's why:

SMS consent checkbox = legally required by TCPA/carrier rules. Twilio won't approve you without explicit opt-in.

Privacy policy / terms = "by proceeding you agree" is standard and legally sufficient for most purposes. Almost every e-commerce checkout uses this approach. An explicit checkbox isn't required and just adds friction.

You're already doing it right - the text is visible, the links are there, and continuing to payment implies agreement. That's the industry standard.

Adding another checkbox would mean two required checkboxes before they can pay, which starts to feel like a legal gauntlet rather than a booking form.

Let me get you the updated AdultBookingPage with just the SMS consent checkbox above the privacy text.


2 steps

Copy the updated AdultBookingPage to outputs for user download



Prepared to weigh feature addition against user experience friction.

Here's the updated file: AdultBookingPage.tsx

Changes I made:

Added state for smsConsent (line 33)
Added validation - error if checkbox not checked (line 87)
Added SMS consent checkbox in its own section with a border-top separator, right above the Privacy text (lines 347-370)
Added smsConsent to the API payload (line 163)
The flow is now:

Contact info fields
Additional participants (optional)
☑️ SMS consent checkbox ← new, with error styling if not checked
Privacy/Cancellation policy text
reCAPTCHA
Proceed to Payment
Before you test, you'll also need to:

Add Airtable field - Add SMS Consent (Checkbox type) to your Bookings table in both staging and production
Update create-booking API - Add the field to the Airtable record creation. Find where it creates the booking record and add:
javascript
   'SMS Consent': smsConsent || false,
Let me know how the formatting looks once you test it, and we can adjust before adding it to the other two pages!

Adultbookingpage
Code · TSX 








SWSD Site Maintenance



Adultbookingpage · TSX
Copy

// ============================================
// AdultBookingPage.tsx - UPDATED
// ============================================
// Changes:
// 1. Fixed time display to use start_time_new/end_time_new fields
// 2. Added booking policies link to privacy statement
// 3. Added required SMS consent checkbox

import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';

type AdditionalAdult = { firstName: string; lastName: string };

const AdultBookingPage: React.FC = () => {
  const location = useLocation();
  const classSchedule = location.state?.classSchedule;

  // Contact (primary attendee – assumed adult)
  const [contactInfo, setContactInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Optional additional adult participants
  const [additionalAdults, setAdditionalAdults] = useState<AdditionalAdult[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [smsConsent, setSmsConsent] = useState(false);

  // If user navigates here without state, bounce back to classes
  if (!classSchedule) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Class Selected</h2>
          <p className="text-gray-600 mb-6">Please select a class to book.</p>
          <Link
            to="/public-classes"
            className="bg-accent-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors"
          >
            Back to Classes
          </Link>
        </div>
      </div>
    );
  }

  const pricePerPerson = Number(classSchedule.price) || 0;
  const totalParticipants = 1 + additionalAdults.length;
  const totalPrice = pricePerPerson * totalParticipants;

  // ---------- helpers ----------
  const updateContactInfo = (field: 'firstName' | 'lastName' | 'email' | 'phone', value: string) =>
    setContactInfo((prev) => ({ ...prev, [field]: value }));

  const addAdult = () => setAdditionalAdults((prev) => [...prev, { firstName: '', lastName: '' }]);
  const removeAdult = (index: number) =>
    setAdditionalAdults((prev) => prev.filter((_, i) => i !== index));
  const updateAdult = (index: number, field: 'firstName' | 'lastName', value: string) =>
    setAdditionalAdults((prev) => {
      const next = [...prev];
      (next[index] as any)[field] = value;
      return next;
    });

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => {
    const digits = phone.replace(/[\s\-\(\)]/g, '');
    return /^[\+]?[1-9][\d]{0,15}$/.test(digits);
  };

  const collectErrors = (): string[] => {
    const errs: string[] = [];

    // Contact required fields
    if (!contactInfo.firstName.trim()) errs.push('Contact first name is required');
    if (!contactInfo.lastName.trim()) errs.push('Contact last name is required');
    if (!contactInfo.email.trim()) errs.push('Email is required');
    if (!contactInfo.phone.trim()) errs.push('Phone number is required');

    if (contactInfo.email && !validateEmail(contactInfo.email)) errs.push('Please enter a valid email address');
    if (contactInfo.phone && !validatePhone(contactInfo.phone)) errs.push('Please enter a valid phone number');

    // SMS Consent
    if (!smsConsent) errs.push('Please agree to receive text message reminders');

    // reCAPTCHA
    if (!recaptchaValue) errs.push('Please complete the reCAPTCHA verification');

    // Additional adult rows: if present, both names required
    additionalAdults.forEach((p, i) => {
      if (!p.firstName.trim()) errs.push(`Participant ${i + 2} first name is required`);
      if (!p.lastName.trim()) errs.push(`Participant ${i + 2} last name is required`);
    });

    return errs;
  };

  const handleSubmit = async () => {
    setPageError(null);
    setShowValidation(true);
    const errs = collectErrors();
    if (errs.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Build participants: primary adult + any additional adults
      const participants = [
        {
          firstName: contactInfo.firstName,
          lastName: contactInfo.lastName,
          ageGroup: '16+',
          participantNumber: 1,
        },
        ...additionalAdults.map((p, idx) => ({
          firstName: p.firstName,
          lastName: p.lastName,
          ageGroup: '16+',
          participantNumber: idx + 2,
        })),
      ];

      // 1) Preflight availability
      const pre = await fetch('/api/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classScheduleId: classSchedule.id,
          requestedSpots: totalParticipants,
          requestedSeats: totalParticipants,
        }),
      });

      if (!pre.ok) {
        if (pre.status === 409) {
          const j = await pre.json().catch(() => ({}));
          const remaining = typeof j?.remaining === 'number' ? j.remaining : 0;
          const msg =
            remaining === 0
              ? 'Sorry, this class is already full.'
              : `This class is almost full. Only ${remaining} spot(s) remain.`;
          setPageError(msg);
          setIsSubmitting(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        throw new Error(`Preflight failed (${pre.status})`);
      }

      // 2) Proceed with booking
      const payload = {
        classScheduleId: classSchedule.id,
        contactInfo,
        participants,
        totalParticipants,
        participantCount: totalParticipants,
        totalAmount: totalPrice,
        recaptchaToken: recaptchaValue,
        classType: 'adult',
        smsConsent: smsConsent,
      };

      const res = await fetch('/api/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 409) {
          const errJson = await res.json().catch(() => ({}));
          const remaining = errJson.remaining ?? 0;
          const msg =
            remaining > 0
              ? `This class is almost full. Only ${remaining} spot(s) remain.`
              : 'Sorry, this class is already full.';
          throw new Error(msg);
        }
        throw new Error(`Unexpected booking error (${res.status})`);
      }

      const json = await res.json();
      if (!json?.checkoutUrl) throw new Error('No checkout URL received');
      window.location.href = json.checkoutUrl;
    } catch (err: any) {
      console.error('Booking error:', err);
      setPageError(err?.message || 'There was an error processing your booking.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecaptchaChange = (v: string | null) => setRecaptchaValue(v);

  const formatClassDate = (dateString: string) => {
    const d = new Date(dateString + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

const formatDisplayTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return 'TBD';
  
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
  
  return timeStr;
};

  const errorsToShow = showValidation ? collectErrors() : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/public-classes"
              className="flex items-center gap-2 text-gray-600 hover:text-accent-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Classes
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-navy">
            Book: {classSchedule.class_name || 'Adult Self-Defense'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">This class is intended for ages <strong>15+</strong>.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Error banner */}
          {pageError && (
            <div className="lg:col-span-3 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 -mt-2">
              <div className="font-medium">We couldn't complete your booking:</div>
              <div className="text-sm mt-1">{pageError}</div>
            </div>
          )}

          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-8">
              {/* Errors summary */}
              {errorsToShow.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Please fix these issues:</h4>
                  <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                    {errorsToShow.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h3 className="text-xl font-semibold text-navy mb-2">Primary Attendee</h3>
                <p className="text-gray-600 mb-6">Enter the information for the person who will attend the class.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactInfo.firstName}
                      onChange={(e) => updateContactInfo('firstName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent ${
                        showValidation && !contactInfo.firstName.trim() ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactInfo.lastName}
                      onChange={(e) => updateContactInfo('lastName', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent ${
                        showValidation && !contactInfo.lastName.trim() ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => updateContactInfo('email', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent ${
                        showValidation && (!contactInfo.email.trim() || !validateEmail(contactInfo.email)) ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => updateContactInfo('phone', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent ${
                        showValidation && (!contactInfo.phone.trim() || !validatePhone(contactInfo.phone)) ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Additional Adult Participants (optional) */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-navy">Additional Participants (optional)</h3>
                  <button
                    onClick={addAdult}
                    className="text-accent-primary hover:text-accent-dark font-medium transition-colors"
                  >
                    + Add Adult
                  </button>
                </div>

                {additionalAdults.length === 0 && (
                  <p className="text-sm text-gray-600">
                    You can add more adult participants if you're booking for a group.
                  </p>
                )}

                {additionalAdults.length > 0 && (
                  <div className="space-y-6">
                    {additionalAdults.map((p, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={p.firstName}
                              onChange={(e) => updateAdult(index, 'firstName', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={p.lastName}
                              onChange={(e) => updateAdult(index, 'lastName', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={() => removeAdult(index)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SMS Consent */}
              <div className="border-t pt-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smsConsent}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                    className={`mt-1 h-5 w-5 rounded border-gray-300 text-accent-primary focus:ring-accent-primary ${
                      showValidation && !smsConsent ? 'border-red-500 ring-2 ring-red-200' : ''
                    }`}
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Send me text message reminders about my class <span className="text-red-500">*</span>
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      We'll text you with class details and reminders. Message and data rates may apply. Reply STOP to opt out.
                    </p>
                  </div>
                </label>
                {showValidation && !smsConsent && (
                  <p className="text-red-500 text-sm mt-2 ml-8">
                    Please agree to receive text message reminders
                  </p>
                )}
              </div>

              {/* Privacy */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  By proceeding with your booking, you agree to our{' '}
                  <a
                    href="/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary hover:text-accent-dark underline"
                  >
                    Privacy Policy
                  </a>
                  {' '}and{' '}
                  <a
                    href="/public-class-policies"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary hover:text-accent-dark underline"
                  >
                    Cancellation/Rescheduling Policies
                  </a>.
                </p>
              </div>

              {/* reCAPTCHA */}
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Security Verification</h3>
                <div className="flex justify-center">
                  <ReCAPTCHA
                    sitekey={
                      import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
                      (process.env as any).REACT_APP_RECAPTCHA_SITE_KEY ||
                      '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
                    }
                    onChange={setRecaptchaValue}
                  />
                </div>
                {showValidation && !recaptchaValue && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    Please complete the reCAPTCHA verification
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              {/* Class Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-navy mb-4">Class Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">{formatClassDate(classSchedule.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-500" />
                   <span className="text-gray-700">
  {formatDisplayTime(classSchedule.start_time)} - {formatDisplayTime(classSchedule.end_time)}
</span>
                  </div>
                  {classSchedule.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">{classSchedule.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-navy mb-4">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Participants: </span>
                    <span className="text-gray-900">{totalParticipants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per person:</span>
                    <span className="text-gray-900">${pricePerPerson}</span>
                  </div>
                  <div className="border-t pt-2 mt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-accent-primary">${totalPrice}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Adult classes are designed for ages <strong>15+</strong>.
                  </p>
                </div>
              </div>

              {/* Submit */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-accent-primary hover:bg-accent-dark text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                </button>
                <Link
                  to="/public-classes"
                  className="block text-center text-gray-600 hover:text-accent-primary transition-colors text-sm"
                >
                  Back to Classes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdultBookingPage;



