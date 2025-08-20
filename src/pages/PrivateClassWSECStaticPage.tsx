import React from 'react';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Users, Shield, Clock, Camera, AlertCircle, CheckCircle, Home } from 'lucide-react';

const PrivateClassStaticPage = () => {
  const address = "B67 Molecular Foundry, 67 Cyclotron Road, Berkeley, CA 94720";
  const encodedAddress = encodeURIComponent(address);

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Class Preparation - Public Self Defense Training</title>
        <meta name="description" content="Everything you need to know to prepare for your private self-defense class with Streetwise Self Defense." />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Header */}
      <section className="relative py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Preparing for Your</h1>
            <h1 className="text-4xl font-bold text-accent-primary mb-6">WSEC Self Defense Class</h1>
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
                  Just a little bit of background information on your self defense class with Streetwise Self Defense. 
                  I will try to keep this short, so here is the bare minimum of things I would like to know before this class:
                </p>
                <p className="text-gray-700 leading-relaxed">
                  This is an active (interactive) class, where you will learn the most effective ways to get away from someone who is trying to hurt you. However, <strong>PLEASE TELL ME</strong> about any injuries or physical restrictions 
                  you are dealing with before class. We can almost always work around them without difficulty, so if something is bothering you, 
                  it is better to know about it ahead of class.
                </p>
              </div>
            </div>

            <div className="bg-accent-primary/10 border-l-4 border-accent-primary p-4 rounded-r-lg">
              <p className="text-gray-700 mb-3">
                Please also make sure to <strong>take care of the electronic activity waiver</strong> (link in text message or email I sent you), 
                please be sure to check your spam folder if you can't find it, and come prepared to have fun and laugh a lot…
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">Thank You! ~jhb</p>
              <p className="text-gray-600 font-medium">Jay Beecham (Founder/Instructor)</p>
              <p className="text-sm text-gray-500 mt-2">
                Any problems? Please call/text me (Jay) at 
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
                <Home className="w-8 h-8 text-accent-primary" />
                <div>
                  <h3 className="text-2xl font-bold">Class Time & Location</h3>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-gray-700 text-lg mb-4">
                    <strong>Thursday, August 21, 4 - 7 pm</strong></p> <p> (Please arrive by 3:45 pm to ensure an on-time start.)</p><p></p><br></br>
                  <p className="text-gray-700 text-lg mb-4">
                    We will be training on site in <strong>Room 6111</strong>.
                  </p>
                  <div className="mb-4">
                    <p className="text-gray-700 mb-2">
                      The address is <strong>{address}</strong>
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a 
                        href={`https://maps.apple.com/?q=${encodedAddress}`}
                        className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="w-4 h-4" />
                        Apple Maps
                      </a>
                      <a 
                        href={`https://maps.google.com/?q=${encodedAddress}`}
                        className="inline-flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="w-4 h-4" />
                        Google Maps
                      </a>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Please call/text me (Jay) with updates or questions:</p>
                    <a href="tel:925-532-9953" className="text-accent-primary font-semibold text-lg">925.532.9953</a>
                  </div>
                </div>
                <div className="relative">
                  <img
                    src="/adult-teen.png"
                    alt="Private Self Defense Class"
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
                    <span>Note pad (optional)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent-primary rounded-full"></div>
                    <span><strong>Sense of humor</strong> (not optional)</span>
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
                  <p>Similarly, chains around your neck, earrings, and bracelets, can get in the way, lost or possibly broken when we are working with some of these defensive techniques.</p>
                  <p>Usually, rings that are plain bands are okay, as long as they are secure and won't fall off.</p>
                  <p>Belly button piercings can be covered with athletic tape (careful taking the tape off!) that will protect them during our class.</p>
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
                      <p className="text-sm font-semibold text-navy">Popular choices with other students:</p>
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
                    I film every workshop I teach, both for your safety and my own, and at the request of my insurance carrier. 
                    These videos get moved directly to an external disk drive in my office and are not usually used for promotional purposes. 
                    The quality isn't that great but if someone were to get hurt during the class, at least there would be a video 
                    so that we could see what happened.
                  </p>
                  <p>
                    Sometimes, we might do something that will help the company (Streetwise) or another student in some way, and when that happens, 
                    I will reach out to you to ask permission, or I will anonymize (blur) your face and any identifiable characteristics 
                    (like clothing) so that your identity can not be recognized.
                  </p>
                  <p>
                    I was a military intelligence officer, and I have worked with survivors of abusive relationships, people dealing with stalkers, 
                    and what that means is that I take your security and privacy very seriously. If you have a specific concern about being photographed, 
                    or having a specific class/location associated with your identity, please let me know so we can take whatever precautions are necessary.
                  </p>
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

export default PrivateClassStaticPage;