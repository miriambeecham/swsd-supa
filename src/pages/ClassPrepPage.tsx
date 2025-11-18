import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Users, Shield, Clock, Camera, AlertCircle, CheckCircle, Home, ParkingCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ClassPrepData {
  className: string;
  classType: string;
  date: string;
  startTime: string;
  endTime: string;
  startTimeNew?: string;
  endTimeNew?: string;
  location: string;
  venueName?: string;
  city?: string;
  arrivalInstructions?: string;
  specialNotes?: string;
  partnerOrganization?: string;
  instructorName?: string;
  instructorPhone?: string;
  waiverUrl?: string;
  parkingInstructions?: string;
  parkingMapUrl?: string;
}

const ClassPrepPage = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const [classData, setClassData] = useState<ClassPrepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scheduleId) {
      fetchClassPrepData();
    }
  }, [scheduleId]);

  const fetchClassPrepData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch schedule data
      const scheduleResponse = await fetch(`/api/schedules`);
      if (!scheduleResponse.ok) throw new Error('Failed to fetch schedule');
      
      const schedulesData = await scheduleResponse.json();
      const schedule = schedulesData.records.find((s: any) => s.id === scheduleId);
      
      if (!schedule) throw new Error('Class not found');

      // Fetch class data
      const classesResponse = await fetch(`/api/classes`);
      if (!classesResponse.ok) throw new Error('Failed to fetch class info');
      
      const classesData = await classesResponse.json();
      const classId = schedule.fields['Class']?.[0];
      const classInfo = classesData.records.find((c: any) => c.id === classId);

      if (!classInfo) throw new Error('Class information not found');

      setClassData({
        className: classInfo.fields['Class Name'] || 'Self-Defense Class',
        classType: classInfo.fields['Type']?.toLowerCase() || '',
        date: schedule.fields['Date'] || '',
        startTime: schedule.fields['Start Time'] || '',
        endTime: schedule.fields['End Time'] || '',
        startTimeNew: schedule.fields['Start Time New'],
        endTimeNew: schedule.fields['End Time New'],
        location: schedule.fields['Location'] || classInfo.fields['Location'] || '',
        venueName: schedule.fields['Venue Name'] || '',
        city: schedule.fields['City'] || classInfo.fields['City'] || 'Walnut Creek',
        arrivalInstructions: schedule.fields['Arrival Instructions'] || 'Please arrive 15 minutes early',
        specialNotes: schedule.fields['Special Notes'] || '',
        partnerOrganization: classInfo.fields['Partner Organization'] || '',
        instructorName: classInfo.fields['Instructor'] || 'Jay Beecham',
        instructorPhone: '925-532-9953',
        waiverUrl: schedule.fields['Waiver URL'],
        parkingInstructions: schedule.fields['Parking Instructions'] || '',
        parkingMapUrl: schedule.fields['Parking Map URL'] || ''
      });
    } catch (err) {
      console.error('Error fetching class prep data:', err);
      setError('Unable to load class information. Please contact us if this issue persists.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    try {
      return new Date(timeString).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Los_Angeles'
      });
    } catch {
      return timeString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading class information...</p>
        </div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 mb-4">
            <AlertCircle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Class Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
            href={`tel:${classData?.instructorPhone || '925-532-9953'}`}
            className="bg-accent-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors inline-block"
          >
            Contact Us
          </a>
        </div>
      </div>
    );
  }

  const address = classData.location;
  const encodedAddress = encodeURIComponent(address);
  const startTimeDisplay = formatTime(classData.startTimeNew) || classData.startTime;
  const endTimeDisplay = formatTime(classData.endTimeNew) || classData.endTime;

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Class Preparation - {classData.className}</title>
        <meta name="description" content={`Everything you need to know to prepare for your ${classData.className} class with Streetwise Self Defense.`} />
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Header */}
      <section className="relative py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Preparing for Your</h1>
            <h1 className="text-4xl font-bold text-accent-primary mb-6">{classData.className}</h1>
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
              {classData.waiverUrl ? (
                <p className="text-gray-700 mb-3">
                  Please make sure to complete the{' '}
                  <a 
                    href={classData.waiverUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-primary font-semibold underline hover:text-accent-dark"
                  >
                    electronic activity waiver
                  </a>{' '}
                  before class, and come prepared to have fun and laugh a lot…
                </p>
              ) : (
                <p className="text-gray-700 mb-3">
                  Please also make sure to <strong>take care of the electronic activity waiver</strong> (link in text message or email I sent you), 
                  please be sure to check your spam folder if you can't find it, and come prepared to have fun and laugh a lot…
                </p>
              )}
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">Thank You! ~jhb</p>
              <p className="text-gray-600 font-medium">{classData.instructorName} (Founder/Instructor)</p>
              <p className="text-sm text-gray-500 mt-2">
                Any problems? Please call/text me at 
                <a href={`tel:${classData.instructorPhone}`} className="text-accent-primary font-semibold"> {classData.instructorPhone}</a>
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
                  <div className="text-gray-700 text-lg mb-4">
                    <p className="mb-2">
                      <strong>{formatDate(classData.date)}</strong>
                    </p>
                    <p className="mb-2">
                      <strong>{startTimeDisplay} - {endTimeDisplay}</strong>
                    </p>
                    {classData.arrivalInstructions && (
                      <span className="block text-base text-gray-600 mt-1">
                        ({classData.arrivalInstructions})
                      </span>
                    )}
                  </div>
                  
                  {classData.venueName && (
                    <p className="text-gray-700 text-lg mb-4">
                      We will be training at <strong>{classData.venueName}</strong> in {classData.city}.
                    </p>
                  )}
                  
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

                  {classData.specialNotes && (
                    <p className="text-gray-700 mb-4">
                      <strong>Note:</strong> {classData.specialNotes}
                    </p>
                  )}

                  {classData.venueName?.toLowerCase().includes('yoga') && (
                    <p className="text-gray-700 mb-4">
                      Note: No outside food or drink, except water, is allowed in the studio.
                    </p>
                  )}
                  
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Please call/text me with updates or questions:</p>
                    <a href={`tel:${classData.instructorPhone}`} className="text-accent-primary font-semibold text-lg">
                      {classData.instructorPhone}
                    </a>
                  </div>
                </div>
                <div className="relative">
                  <img
                    src={classData.classType.includes('mother') ? "/mothers-daughters.png" : "/adult-teen.png"}
                    alt={classData.className}
                    className="w-full h-full object-cover rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Parking Information Section - NEW */}
      {classData.parkingInstructions && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-navy text-white px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <ParkingCircle className="w-8 h-8 text-accent-primary" />
                    <div>
                      <h3 className="text-2xl font-bold">Parking Information</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="bg-white text-navy px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 print:hidden"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print Parking Info
                  </button>
                </div>
              </div>
              <div className="p-8" id="parking-info-print">
                {/* Print-only header */}
                <div className="hidden print:block mb-6 pb-4 border-b-2 border-gray-300">
                  <h1 className="text-2xl font-bold text-navy mb-2">{classData.className}</h1>
                  <p className="text-lg text-gray-700">
                    <strong>{formatDate(classData.date)}</strong> at <strong>{startTimeDisplay}</strong>
                  </p>
                  <p className="text-gray-700 mt-1">{address}</p>
                </div>

                <div className="prose prose-lg max-w-none mb-6">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h3 className="text-xl font-bold text-navy mb-3 mt-4" {...props} />,
                      h2: ({node, ...props}) => <h4 className="text-lg font-bold text-navy mb-2 mt-3" {...props} />,
                      h3: ({node, ...props}) => <h5 className="text-base font-bold text-navy mb-2 mt-2" {...props} />,
                      p: ({node, ...props}) => <p className="text-gray-700 mb-3 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside text-gray-700 mb-3 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="ml-4" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                      a: ({node, ...props}) => <a className="text-accent-primary hover:underline" {...props} />,
                    }}
                  >
                    {classData.parkingInstructions}
                  </ReactMarkdown>
                </div>

                {/* Parking Map */}
                {classData.parkingMapUrl && (
                  <div className="mt-6">
                    {classData.parkingMapUrl.includes('google.com/maps/embed') ? (
                      /* Google Maps Embed */
                      <div className="relative w-full print:h-96" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          src={classData.parkingMapUrl}
                          className="absolute top-0 left-0 w-full h-full rounded-lg border-2 border-gray-200 print:static print:h-96"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Parking Map"
                        ></iframe>
                      </div>
                    ) : (
                      /* Image Map */
                      <div className="w-full">
                        <img
                          src={classData.parkingMapUrl}
                          alt="Parking Map"
                          className="w-full h-auto rounded-lg border-2 border-gray-200 shadow-sm print:max-h-96 print:object-contain"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Print-only footer */}
                <div className="hidden print:block mt-6 pt-4 border-t-2 border-gray-300">
                  <p className="text-sm text-gray-600">
                    Questions? Call/text Jay at <strong>925-532-9953</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Printed from Streetwise Self Defense Class Prep Page
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Print-specific styles */}
          <style>{`
            @media print {
              /* Hide everything except parking section */
              body * {
                visibility: hidden;
              }
              
              #parking-info-print,
              #parking-info-print * {
                visibility: visible;
              }
              
              #parking-info-print {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }

              /* Remove margins and padding for better print layout */
              @page {
                margin: 0.5in;
              }

              /* Ensure colors print */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              /* Make map fit on page */
              iframe {
                page-break-inside: avoid;
              }

              img {
                page-break-inside: avoid;
              }
            }
          `}</style>
        </section>
      )}

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
                      src={classData.classType.includes('mother') ? "/mothers-daughters.png" : "/adult-teen.png"}
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
              Contact {classData.instructorName} directly for any questions or concerns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              
                href={`tel:${classData.instructorPhone}`}
                className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-xl font-semibold transition-colors text-lg"
              >
                Call: {classData.instructorPhone}
              </a>
              
                href={`sms:${classData.instructorPhone}`}
                className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl font-semibold transition-colors text-lg print:bg-gray-200 print:text-black"
              >
                Text: {classData.instructorPhone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClassPrepPage;
