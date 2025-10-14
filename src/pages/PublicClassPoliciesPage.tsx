import React from 'react';
import { Calendar, Info, Mail } from 'lucide-react';

export const PublicClassPolicySummary = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h4 className="font-semibold text-navy mb-3 flex items-center gap-2">
        <Info className="w-5 h-5" />
        Booking Policies – Quick Summary
      </h4>
      <ul className="text-sm text-gray-700 space-y-2">
        <li className="flex items-start gap-2">
          <span className="text-accent-primary font-bold mt-0.5">•</span>
          <span><strong>Payment:</strong> Full payment due at booking</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-accent-primary font-bold mt-0.5">•</span>
          <span><strong>Reschedule:</strong> Free 14+ days out; $20 after first change</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-accent-primary font-bold mt-0.5">•</span>
          <span><strong>Cancellation:</strong> Full refund 14+ days out</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-accent-primary font-bold mt-0.5">•</span>
          <span><strong>Substitutions:</strong> Always welcome (age/eligibility apply)</span>
        </li>
      </ul>
      <div className="mt-3 pt-3 border-t border-blue-200">
        
          href="/public-class-policies"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-primary hover:text-accent-dark font-medium text-sm underline"
        >
          View full booking policies →
        </a>
      </div>
    </div>
  );
};

const PublicClassPolicies = () => {
  return (
    <div>
      <section className="relative h-80 lg:h-96 flex items-center">
        <div
          className="absolute inset-8 lg:inset-12 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/swsd-logo-bug.png)' }}
        />
        <div className="absolute inset-0 bg-white/95" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4 lg:mb-6">
              Public Class Booking Policies
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6">
              We want signing up for class to be easy and stress-free. Here's how we handle changes if plans shift.
            </p>

            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
              <p className="text-yellow-900 font-semibold text-sm md:text-base">
                ⚠️ <span className="font-bold">Note:</span> Classes hosted by the City of Walnut Creek follow their own rules.{` `}
                
                  href="https://www.walnut-creek.org/departments/parks-recreation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-700"
                >
                  View City of Walnut Creek policies →
                </a>
              </p>
            </div>

            <p className="text-base">
              <a href="/private-class-policies" className="text-accent-primary hover:text-accent-dark underline font-medium">
                View Private Class Policies →
              </a>
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="mb-8 rounded-2xl border-2 border-accent-primary/20 bg-accent-primary/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-accent-primary text-white px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Calendar className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold">Reschedule &amp; Cancellation</h2>
              </div>
            </div>
            <div className="p-6 bg-white">
              {/* Two-column table layout - stacks on mobile */}
              <div className="space-y-3">
                {/* Row 1 */}
                <div className="flex flex-col md:flex-row md:gap-6 border-b border-gray-200 pb-3">
                  <div className="md:w-1/3 mb-2 md:mb-0">
                    <span className="font-bold text-navy">14+ days before class</span>
                  </div>
                  <div className="md:w-2/3 text-gray-700">
                    Choose a full refund or move to another date for free. (Additional reschedules are $20 each.)
                  </div>
                </div>

                {/* Row 2 */}
                <div className="flex flex-col md:flex-row md:gap-6 border-b border-gray-200 pb-3">
                  <div className="md:w-1/3 mb-2 md:mb-0">
                    <span className="font-bold text-navy">3–13 days before class</span>
                  </div>
                  <div className="md:w-2/3 text-gray-700">
                    We'll issue a class credit (valid for 12 months) so you can rebook when you're ready.
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex flex-col md:flex-row md:gap-6 border-b border-gray-200 pb-3">
                  <div className="md:w-1/3 mb-2 md:mb-0">
                    <span className="font-bold text-navy">Less than 3 days (72 hours)</span>
                  </div>
                  <div className="md:w-2/3 text-gray-700">
                    We're not able to refund or reschedule this close in, but substitutions are welcome.
                  </div>
                </div>

                {/* Row 4 */}
                <div className="flex flex-col md:flex-row md:gap-6 pb-3">
                  <div className="md:w-1/3 mb-2 md:mb-0">
                    <span className="font-bold text-navy">Substitutions</span>
                  </div>
                  <div className="md:w-2/3 text-gray-700">
                    Send a friend or family member in your place (age/eligibility apply). Email{` `}
                    <a href="mailto:support@streetwiseselfdefense.com" className="text-accent-primary hover:text-accent-dark underline font-semibold">
                      support@streetwiseselfdefense.com
                    </a>{` `}
                    with their name and email.
                  </div>
                </div>
              </div>

              {/* Combined callout for reschedule/cancel */}
              <div className="mt-6 bg-gradient-to-r from-accent-primary/10 to-navy/10 border-l-4 border-accent-primary p-4 rounded">
                <p className="text-gray-700 mb-3">
                  <strong className="text-navy">Need to reschedule or cancel?</strong> Email us at{` `}
                  <a href="mailto:support@streetwiseselfdefense.com" className="text-accent-primary hover:text-accent-dark underline font-semibold">
                    support@streetwiseselfdefense.com
                  </a>.
                </p>
                <p className="text-sm text-gray-600">
                  Please include: the email you used to register, your current class date, and participant names. For reschedules, also include your preferred new date.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border-2 border-accent-primary/20 bg-accent-primary/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-accent-primary text-white px-8 py-6">
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
                    <span className="text-accent-primary font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      If we ever have to cancel (illness, emergency, unsafe conditions), you'll get a full refund or priority rescheduling—your choice.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent-primary font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      Classes require a minimum number of participants. If we need to cancel, you'll be notified at least 48 hours ahead and offered a full refund or transfer to another date.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center bg-gradient-to-r from-accent-primary/10 to-navy/10 rounded-2xl p-8 border-2 border-accent-primary/20">
            <div className="max-w-2xl mx-auto">
              <div className="bg-accent-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="text-2xl font-bold text-navy mb-4">Questions About These Policies?</h3>
              <p className="text-gray-600 mb-6 text-lg">
                We're here to help! If you have a unique situation or just want to talk it through, reach out any time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                
                  href="mailto:support@streetwiseselfdefense.com"
                  className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-semibold transition-colors inline-block text-lg shadow-md hover:shadow-lg"
                >
                  Email Us
                </a>
                
                  href="/private-class-policies"
                  className="border-2 border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-white px-8 py-4 rounded-xl font-semibold transition-colors inline-block text-lg shadow-md hover:shadow-lg"
                >
                  View Private Class Policies
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default PublicClassPolicies;

