import React from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Users, Shield, Clock, Camera, AlertCircle, CheckCircle } from 'lucide-react';

const CityWalnutCreekStaticPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Class Preparation - City of Walnut Creek Self Defense</title>
        <meta name="description" content="Everything you need to know to prepare for your self-defense class with the City of Walnut Creek." />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Header */}
      <section className="relative py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">City of Walnut Creek Arts and Recreation</h1>
            <h1 className="text-4xl font-bold text-accent-primary mb-6">& Streetwise Self Defense</h1>
            <p className="text-xl opacity-90">Class Preparation Information</p>
          </div>

          {/* Print Button */}
          <div className="text-center mt-8 no-print">
            <button
              onClick={() => window.print()}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print or Save as PDF
            </button>
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
                <h3 className="text-xl font-bold text-navy mb-3">Welcome to Your Self Defense Class!</h3>
                <p className="text-gray-700 leading-relaxed">
                  This is an active (interactive) class where you will learn the most effective ways to hurt someone who is trying to hurt you, 
                  or at a minimum, surprise/hurt them enough to get them to let go of you long enough for you to get away. The primary person 
                  that gets hit in this class will be me. However, <strong>PLEASE TELL ME</strong> about any injuries or physical restrictions 
                  you are dealing with before class. We can almost always work around them without too many problems.
                </p>
              </div>
            </div>

            <div className="bg-accent-primary/10 border-l-4 border-accent-primary p-4 rounded-r-lg">
              <p className="text-gray-700">
                Please also make sure to <strong>take care of the electronic activity waiver</strong> (link in text message or email I sent you), 
                and come prepared to have fun and laugh a lot…
              </p>
              <div className="mt-3 text-center">
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-accent-primary hover:bg-accent-dark text-white px-6 py-3 rounded-lg inline-block font-semibold transition-colors"
                >
                  Complete Electronic Waiver
                </a>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">Thanks! ~jhb</p>
              <p className="text-sm text-gray-500 mt-2">
                Any problems? Please call/text 
                <a href="tel:925-532-9953" className="text-accent-primary font-semibold"> 925-532-9953</a>
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
                <MapPin className="w-8 h-8 text-accent-primary" />
                <div>
                  <h3 className="text-2xl font-bold">Where Do We Meet</h3>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h4 className="text-xl font-bold text-navy mb-4">Walnut Creek Arts and Recreation</h4>
                  <div className="space-y-2 text-gray-700">
                    <p className="font-semibold">Assembly Hall, Civic Park</p>
                    <p>1375 Civic Drive</p>
                    <p>Walnut Creek, CA 94596</p>
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Please call Jay (Instructor) with updates or questions:</p>
                    <a href="tel:925-532-9953" className="text-accent-primary font-semibold text-lg">925.532.9953</a>
                  </div>
                </div>
                <div className="relative">
                  <img
                    src="/adult-teen.png"
                    alt="Self Defense Class"
                    className="w-full h-48 object-cover rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Parking */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-yellow/20 p-3 rounded-lg flex-shrink-0">
                <MapPin className="w-6 h-6 text-yellow-700" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy mb-4">Parking Information</h3>
                <div className="prose prose-gray max-w-none">
                  <p>
                    The entrance to the parking lot at Civic Park is off the east side of Civic Drive, just across from the 
                    Contra Costa County Fire Department. If you follow the red arrow <strong>(SEE MAP BELOW)</strong> around 
                    the back of the Civic Park Community Center, you can park right next to the building where the class is being held.
                  </p>
                  <p>
                    Keep in mind that during most of the year, it will be getting dark or will be dark by the time class is over, 
                    so parking closer might be helpful. There is a short sidewalk from the parking lot to the Auditorium in the building on the right.
                  </p>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="mt-6 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Parking Map</p>
              <p className="text-sm text-gray-400">Map showing parking area with red arrow will be inserted here</p>
            </div>
          </div>
        </div>
      </section>

      {/* What to Bring & Not Bring */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* What to Bring */}
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
                    <span>Water Bottle</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
                    <span>Snack (optional, but you don't want to be hungry)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
                    <span>Note pad (optional)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
                    <span><strong>Sense of humor (not optional)</strong></span>
                  </li>
                </ul>
              </div>
            </div>

            {/* What NOT to Bring */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-red-500 text-white px-6 py-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6" />
                  <h3 className="text-xl font-bold">What NOT to Bring</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="font-bold text-red-800 mb-2">PLEASE do not wear jewelry!</p>
                </div>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>Diamonds especially, can hurt me or your training partner.</p>
                  <p>Chains around your neck, earrings, and bracelets can get in the way, lost or possibly broken when working with defensive techniques.</p>
                  <p>Plain band rings are usually okay, as long as they are secure and won't fall off.</p>
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
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <p className="text-gray-700 mb-4">
                      I encourage you to wear clothing that is comfortable (for exercise) & that covers your knees. 
                      We try to make the class as realistic as we can, so there will be a fair amount of scenario-based 
                      interaction with your training partner or with me on the mats.
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-navy">Popular choices:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Running tights</li>
                        <li>• Yoga pants</li>
                        <li>• Sweatpants</li>
                        <li>• Comfortable t-shirts or exercise clothing</li>
                      </ul>
                    </div>
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> I do not recommend shorts for these types of activities.
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      src="/mothers-daughters.png"
                      alt="Self Defense Training"
                      className="w-full h-48 object-cover rounded-lg shadow-md"
                    />
                  </div>
                </div>
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
                <h3 className="text-xl font-bold text-navy mb-4">About That Camera in the Corner…</h3>
                <div className="prose prose-gray max-w-none">
                  <p>
                    I film every workshop I teach, both for your safety and my own, at the request of my insurance carrier. 
                    These videos get moved directly to an external disk drive in my office and are not used for promotional purposes. 
                    The quality isn't that great but if someone were to get hurt during the class, at least there would be a video 
                    so that we could see what happened.
                  </p>
                  <p>
                    On rare occasions we might do something that will help the company or another student in some way. When that happens, 
                    I will reach out to you to ask permission, or I will anonymize (blur) your face and any identifiable characteristics 
                    (like clothing) so that your identity will not be recognized.
                  </p>
                  <p>
                    I was a military intelligence officer, and I have worked with survivors of abusive relationships, and what that means 
                    is that I take your security very seriously. If you have a specific concern about being photographed, or having a 
                    specific class/location associated with your identity, please let me know so we can take whatever precautions are necessary.
                  </p>
                  <p className="font-medium">Thanks!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-navy text-white print:bg-white print:text-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/10 rounded-2xl p-8 print:bg-gray-100">
            <Phone className="w-12 h-12 text-accent-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Questions About Your Class?</h3>
            <p className="text-xl opacity-90 mb-6">
              Contact Jay directly for any questions or concerns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:925-532-9953"
                className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-semibold transition-colors text-lg"
              >
                Call: (925) 532-9953
              </a>
              <a
                href="sms:925-532-9953"
                className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl font-semibold transition-colors text-lg print:bg-gray-200 print:text-black"
              >
                Text: (925) 532-9953
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:bg-white { background-color: white !important; }
          .print\\:text-black { color: black !important; }
          .print\\:bg-gray-100 { background-color: #f3f4f6 !important; }
          .print\\:bg-gray-200 { background-color: #e5e7eb !important; }

          /* Hide unnecessary elements when printing */
          .no-print { display: none !important; }

          /* Ensure good contrast for printing */
          .shadow-lg { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>
    </div>
  );
};

export default CityWalnutCreekStaticPage;