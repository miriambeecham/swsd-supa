import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Users, Shield, Clock, Camera, AlertCircle, CheckCircle, Home, ParkingCircle, XCircle } from 'lucide-react';
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
        parkingInstructions: classInfo.fields['Parking Instructions'] || '',
        parkingMapUrl: classInfo.fields['Parking Map URL'] || ''
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
          <a
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
              <p className="text-gray-700 mb-3">
                Please also make sure to take care of the electronic activity waiver (See Link Below). If you are expecting an email from me, 
                please be sure to check your spam folder if you can't find it, and come prepared to have fun and laugh a lot…
              </p>
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
                    src={classData.classType.includes('mother') 
                      ? '/mom-daughter.png' 
                      : '/adult-teen.png'
                    }
                    alt="Self Defense Class"
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
                <div className="flex items-center gap-4">
                  <ParkingCircle className="w-8 h-8 text-accent-primary" />
                  <div>
                    <h3 className="text-2xl font-bold">Parking Information</h3>
                  </div>
                </div>
              </div>
              <div className="p-8">
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
                      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          src={classData.parkingMapUrl}
                          className="absolute top-0 left-0 w-full h-full rounded-lg border-2 border-gray-200"
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
                          className="w-full h-auto rounded-lg border-2 border-gray-200 shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
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
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Your positive attitude and willingness to learn</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Water bottle (stay hydrated!)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Comfortable athletic clothing</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Athletic shoes (sneakers recommended)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* What NOT to Bring */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-red-600 text-white px-6 py-4">
                <div className="flex items-center gap-3">
                  <XCircle className="w-6 h-6" />
                  <h3 className="text-xl font-bold">What NOT to Bring</h3>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Jewelry (rings, bracelets, necklaces)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Watches or fitness trackers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Long fingernails (risk of injury)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Negative or fearful mindset (leave it at the door!)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Attire */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-start gap-4">
              <div className="bg-accent-primary/20 p-3 rounded-lg flex-shrink-0">
                <Users className="w-6 h-6 text-accent-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy mb-4">Recommended Attire</h3>
                <p className="text-gray-700 mb-4">
                  Wear comfortable athletic clothing that allows full range of motion. Think gym clothes or workout gear.
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-accent-primary mt-1">•</span>
                    <span>Athletic pants, leggings, or shorts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-primary mt-1">•</span>
                    <span>T-shirt or athletic top (avoid loose/baggy clothing)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-primary mt-1">•</span>
                    <span>Sneakers or athletic shoes (no sandals or flip-flops)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-primary mt-1">•</span>
                    <span>Hair tied back if long</span>
                  </li>
                </ul>
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
                <div className="space-y-4 text-gray-700">
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

      {/* Activity Waiver */}
      <section className="py-12 bg-accent-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto mb-6" />
            <h3 className="text-3xl font-bold mb-4">Complete Your Activity Waiver</h3>
            <p className="text-xl mb-8 opacity-90">
              Required before class - takes about 2 minutes
            </p>
            {classData.waiverUrl ? (
              <a
                href={classData.waiverUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-accent-primary px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Complete Waiver Now
              </a>
            ) : (
              <div className="bg-white/10 rounded-lg p-6 max-w-2xl mx-auto">
                <p className="text-lg">
                  The waiver link will be sent to you via email. Please check your inbox (and spam folder) for the link.
                </p>
                <p className="mt-4 text-sm opacity-90">
                  If you haven't received the email, please contact us at{' '}
                  <a href={`tel:${classData.instructorPhone}`} className="font-semibold underline">
                    {classData.instructorPhone}
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final Reminders */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-navy mb-6 text-center">Final Reminders</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-accent-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Arrive Early</h4>
                  <p className="text-gray-600 text-sm">Please arrive 15 minutes before class starts</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-accent-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Complete Waiver</h4>
                  <p className="text-gray-600 text-sm">Required before participation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-6 h-6 text-accent-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Questions?</h4>
                  <p className="text-gray-600 text-sm">
                    Call/text{' '}
                    <a href={`tel:${classData.instructorPhone}`} className="text-accent-primary font-semibold">
                      {classData.instructorPhone}
                    </a>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-6 h-6 text-accent-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Have Fun!</h4>
                  <p className="text-gray-600 text-sm">Come ready to learn, laugh, and feel empowered</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Footer */}
      <section className="py-8 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg mb-2">See you in class!</p>
          <p className="text-accent-primary font-bold text-xl">Jay Beecham</p>
          <p className="text-sm opacity-90 mt-2">Streetwise Self Defense</p>
        </div>
      </section>
    </div>
  );
};

export default ClassPrepPage;
