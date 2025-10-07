import React from 'react';
import { CreditCard, Calendar, Info, Mail } from 'lucide-react';

export const PublicClassPolicySummary = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h4 className="font-semibold text-navy mb-3 flex items-center gap-2">
        <Info className="w-5 h-5" />
        Booking Policies - Quick Summary
      </h4>
      <ul className="text-sm text-gray-700 space-y-2">
        <li className="flex items-start gap-2">
          <span className="text-accent-primary font-bold mt-0.5">•</span>
          <span><strong>Payment:</strong> Full payment due at booking</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-accent-primary font-bold mt-0.5">•</span>
          <span><strong>Reschedule:</strong> Free with 72+ hours notice, $20 fee for additional reschedules</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-accent-primary font-bold mt-0.5">•</span>
          <span><strong>Cancellation:</strong> Full refund if cancelled 2+ weeks out</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-accent-primary font-bold mt-0.5">•</span>
          <span><strong>Substitutions:</strong> Always welcome (subject to age/eligibility)</span>
        </li>
      </ul>
      <div className="mt-3 pt-3 border-t border-blue-200">
        <a 
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
              Clear policies for our public training classes
            </p>
            
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
              <p className="text-yellow-900 font-semibold text-sm md:text-base">
                ⚠️ Important: Classes hosted by City of Walnut Creek are subject to their policies.{` `}
                <a 
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
                <h2 className="text-2xl font-bold">Reschedule and Cancellation Policies</h2>
              </div>
            </div>
            <div className="p-6 bg-white">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-accent-primary font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">14 days or more before class:</strong> Full refund or one free reschedule. Additional reschedules $20 each.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent-primary font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">3-14 days before class:</strong>Non-refundable class credit (valid 12 months). 
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent-primary font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">Under 3 days (less than 72 hours) before class start:</strong> No refund or credit. Substitutions allowed.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-accent-primary font-bold text-lg leading-6">•</span>
                  <span className="text-gray-700 flex-1">
                    <strong className="text-navy">Substitutions always allowed:</strong> You may send someone in your place (must meet age and eligibility requirements). Email us at{' '}
                    <a href="mailto:support@streetwiseselfdefense.com" className="text-accent-primary hover:text-accent-dark underline font-semibold">
                      support@streetwiseselfdefense.com
                    </a>{' '}
                    with the replacement participant&apos;s name and email address.
                  </span>
                </li>
              </ul>

              <div className="mt-6 bg-gradient-to-r from-accent-primary/10 to-navy/10 border-l-4 border-accent-primary p-4 rounded">
                <p className="text-gray-700 mb-3">
                  <strong className="text-navy">Need to reschedule?</strong> Email us at{' '}
                  <a href="mailto:support@streetwiseselfdefense.com" className="text-accent-primary hover:text-accent-dark underline font-semibold">
                    support@streetwiseselfdefense.com
                  </a>
                </p>
                <p className="text-sm text-gray-600">
                  Please include: Email address used to register, current class date, preferred new class date, and which participant(s) need to reschedule (if applicable).
                </p>
              </div>

              <div className="mt-6 bg-gradient-to-r from-accent-primary/10 to-navy/10 border-l-4 border-accent-primary p-4 rounded">
                <p className="text-gray-700 mb-3">
                  <strong className="text-navy">Need to cancel?</strong> Email us at{' '}
                  <a href="mailto:support@streetwiseselfdefense.com" className="text-accent-primary hover:text-accent-dark underline font-semibold">
                    support@streetwiseselfdefense.com
                  </a>
                </p>
                <p className="text-sm text-gray-600">
                  Please include: Email address used to register, class date, and which participant(s) are canceling.
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
                      In the rare event we must cancel a class (illness, emergency, unsafe conditions), you will receive a <strong className="text-navy">full refund or priority rescheduling</strong> at your preference.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent-primary font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      <strong className="text-navy">Minimum enrollment required:</strong> The instructor reserves the right to cancel a class if minimum enrollment is not met. You will be notified at least 48 hours before class and offered a full refund or the option to transfer to another class date.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent-primary font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      We will notify you as soon as possible, typically at least 48 hours in advance when feasible.
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-navy mb-3">No-Show Policy</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-accent-primary font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      If you do not arrive within 15 minutes of class start time without prior notice, it will be treated as a cancellation.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent-primary font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      No refund or reschedule will be available for no-shows.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-accent-primary font-bold text-lg leading-6">•</span>
                    <span className="text-gray-700 flex-1">
                      <strong className="text-navy">Please contact us immediately if you&apos;re running late</strong>—we&apos;ll do our best to accommodate you.
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
                We&apos;re here to help! If you have questions or need to discuss a special situation, please don&apos;t hesitate to reach out.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:support@streetwiseselfdefense.com"
                  className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-semibold transition-colors inline-block text-lg shadow-md hover:shadow-lg"
                >
                  Email Us
                </a>
                <a
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
