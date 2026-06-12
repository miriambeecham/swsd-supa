// src/pages/SfGiantsClassPrepPage.tsx
// Highly customized class prep page for the San Francisco Giants private session
// (June 16, 2026). Rendered in place of the data-driven ClassPrepPage for that
// specific schedule so the already-distributed /class-prep/<id> link keeps working.
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Phone, Users, Shield, Camera, AlertCircle, CheckCircle, Home, Target } from 'lucide-react';

const JAY_PHONE = '925-532-9953';
const JAY_EMAIL = 'jay@streetwiseselfdefense.com';
const LYZ_PHONE = '415-741-8872';

const TOPICS = [
  'Awareness and recognition of early warning signs',
  'Decision-making under pressure',
  'Boundary setting and communication',
  'De-escalation and disruption strategies',
  'Movement and escape to safety',
  'Scenario-based practice and application',
];

const SfGiantsClassPrepPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Class Preparation - Personal Safety and Self-Protection Training</title>
        <meta name="description" content="Everything you need to know to prepare for your personal safety and self-protection training with Streetwise Self Defense." />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Header */}
      <section className="relative py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Preparing for Your</h1>
            <h1 className="text-4xl font-bold text-accent-primary mb-6">Personal Safety &amp; Self-Protection Training</h1>
            <p className="text-xl opacity-90">San Francisco Giants &middot; With Streetwise Self Defense</p>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-start gap-4">
              <div className="bg-accent-primary/20 p-3 rounded-lg flex-shrink-0">
                <Users className="w-6 h-6 text-accent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy mb-3">About Your Class</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Streetwise Self Defense provides practical self-defense and personal safety training designed
                  to help ordinary people respond more effectively when situations become uncomfortable, uncertain,
                  or begin to escalate. Using a trauma-informed and collaborative approach, we create a supportive
                  learning environment where participation is encouraged, individual boundaries are respected, and
                  participants can build confidence through realistic practice at a pace that works for them.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  The training developed for your class today has been customized specifically for the San Francisco
                  Giants organization and the environments in which many of you work and travel. Rather than teaching
                  isolated techniques, today&rsquo;s class emphasizes recognizing problems earlier, making effective
                  decisions under pressure, and practicing practical responses within realistic scenarios drawn from
                  the environments many of you navigate every day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-navy text-white px-8 py-6">
              <div className="flex items-center gap-4">
                <Target className="w-8 h-8 text-accent-primary" />
                <h3 className="text-2xl font-bold">Topics Include</h3>
              </div>
            </div>
            <div className="p-8">
              <ul className="grid sm:grid-cols-2 gap-3">
                {TOPICS.map((topic) => (
                  <li key={topic} className="flex items-start gap-3 text-gray-700">
                    <div className="w-2 h-2 bg-accent-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Meeting Location */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-navy text-white px-8 py-6">
              <div className="flex items-center gap-4">
                <Home className="w-8 h-8 text-accent-primary" />
                <h3 className="text-2xl font-bold">Class Time &amp; Location</h3>
              </div>
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="text-gray-700 text-lg mb-4">
                    <p className="mb-2">
                      <strong>Tuesday, June 16, 2026</strong>
                    </p>
                    <p className="mb-2">
                      <strong>9:00 AM &ndash; 12:00 PM</strong>
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-700">
                      <strong>153 Townsend Street, 5th Floor</strong>
                    </p>
                  </div>

                  <div className="bg-accent-primary/10 border-l-4 border-accent-primary p-4 rounded-r-lg space-y-2 text-gray-700">
                    <p>Please arrive 10&ndash;15 minutes early.</p>
                    <p>
                      Please note that access to the 5th floor requires an access card and there may be
                      administrative check-in tasks.
                    </p>
                  </div>

                  <div className="mt-4 text-sm text-gray-600">
                    <p>Please call/text with updates or questions:</p>
                    <a href={`tel:${JAY_PHONE}`} className="text-accent-primary font-semibold text-lg">
                      {JAY_PHONE}
                    </a>
                  </div>
                </div>
                <div className="relative">
                  <img
                    src="/adult-teen.png"
                    alt="Personal Safety and Self-Protection Training"
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
                    <span>Your <strong>sense of humor</strong> &mdash; empowerment should be fun!</span>
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
                  <p className="font-bold text-red-800">Please avoid wearing jewelry during class.</p>
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
            <div className="flex items-start gap-4">
              <div className="bg-navy/20 p-3 rounded-lg flex-shrink-0">
                <Shield className="w-6 h-6 text-navy" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy mb-4">What to Wear</h3>
                <p className="text-gray-700">
                  Comfortable exercise clothing appropriate for movement and partner interaction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Recording */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-3 rounded-lg flex-shrink-0">
                <Camera className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy mb-4">About Recording</h3>
                <div className="prose prose-gray max-w-none">
                  <p>
                    Classes may be recorded for safety, instructional quality, and insurance purposes.
                  </p>
                  <p>
                    Recordings are stored privately and are not used for promotional purposes.
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

      {/* Questions or Concerns */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 rounded-2xl p-8">
            <Phone className="w-12 h-12 text-accent-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Questions or Concerns?</h3>
            <p className="text-xl opacity-90 mb-6">
              Please call Lyz Lowry or Jay Beecham.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`tel:${LYZ_PHONE}`}
                className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl font-semibold transition-colors text-lg"
              >
                Lyz Lowry: {LYZ_PHONE}
              </a>
              <a
                href={`tel:${JAY_PHONE}`}
                className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-semibold transition-colors text-lg"
              >
                Jay Beecham: {JAY_PHONE} (voice or text)
              </a>
            </div>
            <p className="mt-6 opacity-90">
              Jay can also be reached at{' '}
              <a href={`mailto:${JAY_EMAIL}`} className="text-accent-primary font-semibold underline break-all">
                {JAY_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SfGiantsClassPrepPage;
