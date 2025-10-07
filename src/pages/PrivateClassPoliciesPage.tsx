import React from 'react';
import { CreditCard, Calendar, XCircle, Info, Mail } from 'lucide-react';

const PrivateClassPolicies = () => {
  return (
    <div>
      {/* Header Section */}
      <section className="relative h-80 lg:h-96 flex items-center">
        <div 
          className="absolute inset-8 lg:inset-12 bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/swsd-logo-bug.png)'
          }}
        ></div>
        <div className="absolute inset-0 bg-white/95"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4 lg:mb-6">
              Private Class Booking Policies
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-6">
              Clear policies for our private training sessions
            </p>
            <p className="text-base">
              <a href="/public-class-policies" className="text-accent-primary hover:text-accent-dark underline font-medium">
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
                <h2 className="text-2xl font-bold">Payment Policy</h2>
              </div>
            </div>
            <div className="p-6 bg-white">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">50% deposit required at time of booking</strong> (when selecting your date).
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">Remaining balance due 2 weeks prior to class date.</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    Deposit becomes non-refundable if cancellation occurs within 4 weeks of class date.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    Payment plans available for groups—contact us to discuss.
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
                <h2 className="text-2xl font-bold">Rescheduling Policy</h2>
              </div>
            </div>
            <div className="p-6 bg-white">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">Requests must be made at least 2 weeks before class date.</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">Within 2 weeks of class:</strong> Rescheduling is allowed with a $50 rebooking fee.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    The rebooking fee applies to each reschedule request.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    Every effort will be made to accommodate your preferred new date, subject to instructor availability.
                  </span>
                </li>
              </ul>

              <div className="mt-6 bg-gradient-to-r from-navy/10 to-accent-primary/10 border-l-4 border-navy p-4 rounded">
                <p className="text-gray-700">
                  <strong className="text-navy">Need to reschedule?</strong> Email us at{' '}
                  <a href="mailto:support@streetwiseselfdefense.com" className="text-accent-primary hover:text-accent-dark underline font-semibold">
                    support@streetwiseselfdefense.com
                  </a>
                  {' '}with your booking details.
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
                <h2 className="text-2xl font-bold">Cancellation Policy</h2>
              </div>
            </div>
            <div className="p-6 bg-white">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">Full refund available if cancellation is made at least 4 weeks before class date.</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">Within 4 weeks of class:</strong> Deposit is non-refundable.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">Within 2 weeks of class:</strong> Full fee is non-refundable, but every effort will be made to help you reschedule.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-navy font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">Substitutions allowed:</strong> Replacement participants must meet class requirements (age, eligibility, group size limits).
                  </span>
                </li>
              </ul>

              <div className="mt-6 bg-gradient-to-r from-navy/10 to-accent-primary/10 border-l-4 border-navy p-4 rounded">
                <p className="text-gray-700 mb-3">
                  <strong className="text-navy">Need to cancel?</strong> Email us at{' '}
                  <a href="mailto:support@streetwiseselfdefense.com" className="text-accent-primary hover:text-accent-dark underline font-semibold">
                    support@streetwiseselfdefense.com
                  </a>
                  {' '}with your booking details.
                </p>
                <p className="text-sm text-gray-600">
                  <strong className="text-navy">Why these policies?</strong> Private classes require significant advance coordination and block instructor availability. These timelines allow us to potentially rebook the slot and serve other customers.
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
                      In the rare event we must cancel a class (illness, emergency, unsafe conditions), you will receive a <strong className="text-navy">full refund or priority rescheduling</strong> at your preference.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      We will notify you as soon as possible, typically at least 48 hours in advance when feasible.
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-navy mb-3">Weather & Emergencies</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      Outdoor classes may be rescheduled due to unsafe weather conditions (heavy rain, lightning, extreme heat/cold).
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      You will be notified and offered a reschedule or refund at no charge.
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
                      If you do not arrive within 15 minutes of class start time without prior notice, it will be treated as a cancellation.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      No refund or reschedule will be available for no-shows.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      <strong className="text-navy">Please contact us immediately if you're running late</strong>—we'll do our best to accommodate you.
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
                      Please arrive 10 minutes before your scheduled class time for check-in and safety briefing.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      Late arrivals (within 15 minutes) may participate in the remaining class time, but no refund or time extension is provided.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-navy font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      Arrivals more than 15 minutes late may not be able to participate for safety reasons (see No-Show Policy above).
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
                We're here to help! If you have questions or need to discuss a special situation, please don't hesitate to reach out.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                
                  href="mailto:support@streetwiseselfdefense.com"
                  className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-semibold transition-colors inline-block text-lg shadow-md hover:shadow-lg"
                >
                  Email Us
                </a>
                
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
