// src/pages/LbnlClassPrepPage.tsx
// Highly customized class prep page for the LBNL private session (June 17, 2026).
// Rendered in place of the data-driven ClassPrepPage for that specific schedule
// so the already-distributed /class-prep/<id> link keeps working.
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Phone, Users, Shield, Camera, AlertCircle, CheckCircle, Home, Mail } from 'lucide-react';

const INSTRUCTOR_PHONE = '925-532-9953';

const LbnlClassPrepPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Class Preparation - Private Self Defense Sessions</title>
        <meta name="description" content="Everything you need to know to prepare for your Private Self Defense Session with Streetwise Self Defense." />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Header */}
      <section className="relative py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Preparing for Your</h1>
            <h1 className="text-4xl font-bold text-accent-primary mb-6">Private Self Defense Sessions</h1>
            <p className="text-xl opacity-90">With Streetwise Self Defense</p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-accent-primary/20 p-3 rounded-lg flex-shrink-0">
                <Users className="w-6 h-6 text-accent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy mb-3">About Your Self Defense Class</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  This is an active, interactive class where you will learn practical ways to escape from
                  someone trying to hurt you. However, <strong>please tell me</strong> about any injuries or
                  physical restrictions before class so we can work around them.
                </p>
              </div>
            </div>

            <div className="bg-accent-primary/10 border-l-4 border-accent-primary p-4 rounded-r-lg">
              <p className="text-gray-700">
                Please complete and sign the <strong>electronic activity waiver</strong> sent by the
                Women&rsquo;s Support &amp; Empowerment Council (WSEC), and come prepared to have fun and laugh a lot.
              </p>
            </div>

            {/* Additional contacts */}
            <div className="mt-6">
              <h4 className="text-base font-bold text-navy mb-3">Additional Contacts</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold text-navy">Liana Klivansky</p>
                  <p className="text-sm text-gray-600">Women&rsquo;s Support &amp; Empowerment Council</p>
                  <p className="text-sm text-gray-700 mt-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-accent-primary" />
                    <a href="tel:510-486-4199" className="hover:underline">510-486-4199</a>
                    <span className="text-gray-500">(office)</span>
                  </p>
                  <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-accent-primary" />
                    <a href="mailto:lmklivansky@lbl.gov" className="hover:underline break-all">lmklivansky@lbl.gov</a>
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold text-navy">Jay Beecham</p>
                  <p className="text-sm text-gray-600">Streetwise Self Defense</p>
                  <p className="text-sm text-gray-700 mt-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-accent-primary" />
                    <a href={`tel:${INSTRUCTOR_PHONE}`} className="hover:underline">{INSTRUCTOR_PHONE}</a>
                    <span className="text-gray-500">(voice or text)</span>
                  </p>
                  <p className="text-sm text-gray-700 mt-1 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-accent-primary" />
                    <a href="mailto:jay@streetwiseselfdefense.com" className="hover:underline break-all">jay@streetwiseselfdefense.com</a>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">Thank You! ~jhb</p>
              <p className="text-gray-600 font-medium">Jay Beecham (Founder/Instructor)</p>
              <p className="text-sm text-gray-500 mt-2">
                Any problems? Please call/text me at
                <a href={`tel:${INSTRUCTOR_PHONE}`} className="text-accent-primary font-semibold"> {INSTRUCTOR_PHONE}</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meeting Location */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-navy text-white px-8 py-6">
              <div className="flex items-center gap-4">
                <Home className="w-8 h-8 text-accent-primary" />
                <div>
                  <h3 className="text-2xl font-bold">Class Time &amp; Location</h3>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="text-gray-700 text-lg mb-4">
                    <p className="mb-2">
                      <strong>Wednesday, June 17, 2026</strong>
                    </p>
                    <p className="mb-2">
                      <strong>4:30 PM &ndash; 7:30 PM</strong>
                    </p>
                    <span className="block text-base text-gray-600 mt-1">
                      (Please arrive approximately 15 minutes early.)
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-700">
                      We will be meeting at <strong>Building 67, 3rd Floor, Room 3111</strong>.
                    </p>
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
                    <p>Please call/text me with updates or questions:</p>
                    <a href={`tel:${INSTRUCTOR_PHONE}`} className="text-accent-primary font-semibold text-lg">
                      {INSTRUCTOR_PHONE}
                    </a>
                  </div>
                </div>
                <div className="relative">
                  <img
                    src="/adult-teen.png"
                    alt="Private Self Defense Sessions"
                    className="w-full h-full object-cover rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What to Bring & Not Bring */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-accent-primary text-white px-6 py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6" />
                  <h3 className="text-xl font-bold">What to Bring</h3>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
                    <span>Water bottle</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
                    <span>Notepad (optional)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
                    <span>Please bring that <strong>sense of humor</strong> &mdash; this will be fun!</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-red-500 text-white px-6 py-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6" />
                  <h3 className="text-xl font-bold">What NOT to Bring</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-bold text-red-800">Please do not wear jewelry.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What to Wear */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-navy/20 p-3 rounded-lg flex-shrink-0">
                <Shield className="w-6 h-6 text-navy" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy mb-4">What to Wear</h3>
                <p className="text-gray-700">
                  Comfortable exercise clothing that covers the knees. Shorts are not recommended.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About the Camera */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-3 rounded-lg flex-shrink-0">
                <Camera className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy mb-4">About That Camera in the Corner&hellip;</h3>
                <div className="prose prose-gray max-w-none">
                  <p>
                    Classes may be recorded for participant safety, instructional quality, and insurance purposes.
                  </p>
                  <p>
                    Recordings are stored privately and are not generally used for promotional purposes.
                    Any changes to that policy will be addressed individually and separately.
                  </p>
                  <p>
                    Please let Jay know if you have any privacy concerns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 rounded-2xl p-8">
            <Phone className="w-12 h-12 text-accent-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Questions About Your Class?</h3>
            <p className="text-xl opacity-90 mb-6">
              Contact Jay Beecham directly for any questions or concerns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`tel:${INSTRUCTOR_PHONE}`}
                className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-semibold transition-colors text-lg"
              >
                Call: {INSTRUCTOR_PHONE}
              </a>
              <a
                href={`sms:${INSTRUCTOR_PHONE}`}
                className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl font-semibold transition-colors text-lg"
              >
                Text: {INSTRUCTOR_PHONE}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LbnlClassPrepPage;
