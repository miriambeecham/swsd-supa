import React from 'react';
import { CreditCard, Calendar, XCircle, Info, Mail } from 'lucide-react';

const PrivateClassPolicies = () => {
  return (
    <div>
      {/* Header Section */}
      <section className="relative h-80 lg:h-96 flex items-center">
        <div
          className="absolute inset-8 lg:inset-12 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/swsd-logo-bug.png)' }}
        />
        <div className="absolute inset-0 bg-white/95" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4 lg:mb-6">
              Private Class Booking Policies
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6">
              We want planning your private training to be simple and stress-free. Here’s how booking, changes, and cancellations work.
            </p>
            <p className="text-base">
              <a
                href="/public-class-policies"
                className="text-accent-primary hover:text-accent-dark underline font-medium"
              >
                View Public Class Policies →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Payment Policy */}
          <div className="mb-8 rounded-2xl border-2 border-navy/20 bg-navy/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-navy text-white px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">Payment</h2>
              </div>
            </div>
            <div className="p-6 bg-white">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">50% deposit is due when you choose your date.</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">Remaining balance is due 14 days before the class.</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    If you cancel within 4 weeks of the class, the deposit becomes non-refundable.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    Payment plans are available for groups—email us and we&apos;ll set one up.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Rescheduling Policy */}
          <div className="mb-8 rounded-2xl border-2 border-navy/20 bg-navy/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-navy text-white px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">Rescheduling</h2>
              </div>
            </div>
            <div className="p-6 bg-white">
              <p className="text-sm text-gray-500 mb-2">
                Timeframes are measured from the scheduled start time. “2 weeks” = 14 days (336 hours).
              </p>
              {/* Bold bucket subheader */}
              <p className="font-semibold text-navy mb-4">
                <span className="uppercase tracking-wide text-xs mr-2">Windows:</span>
                14+ days / under 14 days
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">14+ days before the class:</strong> Move to another available date at no charge.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">Under 14 days:</strong> We can reschedule with a <strong>$50 rebooking fee</strong> (per change).
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    We&apos;ll do our best to match your preferred new date, subject to instructor availability.
                  </span>
                </li>
              </ul>

              <div className="mt-6 bg-gradient-to-r from-navy/10 to-accent-primary/10 border-l-4 border-navy p-4 rounded">
                <p className="text-gray-700">
                  <strong className="text-navy">Need to reschedule?</strong> Email us at{' '}
                  <a
                    href="mailto:support@streetwiseselfdefense.com"
                    className="text-accent-primary hover:text-accent-dark underline font-semibold"
                  >
                    support@streetwiseselfdefense.com
                  </a>{' '}
                  with your booking name, the email you used to register, your original date, and your preferred new date.
                </p>
              </div>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="mb-8 rounded-2xl border-2 border-navy/20 bg-navy/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-navy text-white px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <XCircle className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">Cancellations</h2>
              </div>
            </div>
            <div className="p-6 bg-white">
              {/* Bold bucket subheader */}
              <p className="font-semibold text-navy mb-4">
                <span className="uppercase tracking-wide text-xs mr-2">Windows:</span>
                4+ weeks / 2–4 weeks / under 2 weeks
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">4+ weeks before the class:</strong> Full refund available.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">2–4 weeks before the class:</strong> The deposit is non-refundable.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">Under 2 weeks:</strong> The full fee is non-refundable, but we&apos;ll work with you to find a new date.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">Substitutions are welcome:</strong> You may send someone in your place (age/eligibility and group size limits apply).
                  </span>
                </li>
              </ul>

              <div className="mt-6 bg-gradient-to-r from-navy/10 to-accent-primary/10 border-l-4 border-navy p-4 rounded">
                <p className="text-gray-700 mb-3">
                  <strong className="text-navy">Need to cancel?</strong> Email us at{' '}
                  <a
                    href="mailto:support@streetwiseselfdefense.com"
                    className="text-accent-primary hover:text-accent-dark underline font-semibold"
                  >
                    support@streetwiseselfdefense.com
                  </a>{' '}
                  with your booking details.
                </p>
                <p className="text-sm text-gray-600">
                  <strong className="text-navy">Why these timelines?</strong> Private classes require advance coordination and reserve instructor time. These windows help us rebook the slot and serve other clients.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Policies */}
          <div className="mb-8 rounded-2xl border-2 border-navy/20 bg-navy/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-navy text-white px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Info className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">Additional Policies</h2>
              </div>
            </div>
            <div className="p-6 bg-white space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-navy mb-3">Instructor Cancellations</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      If we ever need to cancel (illness, emergency, unsafe conditions), you&apos;ll get a full refund or priority rescheduling—your choice.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      We&apos;ll notify you as soon as possible, typically at least 48 hours in advance when feasible.
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-navy mb-3">Weather &amp; Emergencies</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      Outdoor sessions may be rescheduled if conditions are unsafe (heavy rain, lightning, extreme heat/cold).
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      If that happens, you may choose a new date or receive a refund—no fees.
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-navy mb-3">No-Show Policy</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      If you don&apos;t arrive within 15 minutes of the start time (and we haven&apos;t heard from you), it counts as a cancellation.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      No refunds or reschedules are available for no-shows.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      Running late? Let us know—we&apos;ll do our best to accommodate you.
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-navy mb-3">Late Arrivals</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      Please arrive 10 minutes early for check-in and a quick safety briefing.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      Arrivals within 15 minutes may join the remaining class time, but we can&apos;t extend the session.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      More than 15 minutes late? For safety reasons participation may not be possible (see No-Show Policy).
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="mt-16 text-center bg-gradient-to-r from-accent-primary/10 to-navy/10 rounded-2xl p-8 border-2 border-accent-primary/20">
            <div className="max-w-2xl mx-auto">
              <div className="bg-accent-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-4">Questions About These Policies?</h3>
              <p className="text-gray-600 mb-6 text-lg">
                We&apos;re here to help! If you have a unique situation or want to talk it through, reach out any time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:support@streetwiseselfdefense.com"
                  className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-semibold transition-colors inline-block text-lg shadow-md hover:shadow-lg"
                >
                  Email Us
                </a>
                <a
                  href="/public-class-policies"
                  className="border-2 border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-white px-8 py-4 rounded-xl font-semibold transition-colors inline-block text-lg shadow-md hover:shadow-lg"
                >
                  View Public Class Policies
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default PrivateClassPolicies;
