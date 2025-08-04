import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, Users, ArrowLeft, MapPin, ExternalLink, Mail, ArrowLeftRight } from 'lucide-react';

interface ClassSchedule {
  id: string;
  class_name: string;
  description: string;
  type: string;
  age_range: string;
  duration: number;
  max_participants?: number;
  location: string;
  instructor: string;
  price: number;
  pricing_unit: string;
  partner_organization?: string;
  booking_method: 'external' | 'contact';
  registration_instructions: string;
  date: string;
  start_time: string;
  end_time: string;
  booking_url?: string;
  registration_opens?: string; // New field for registration opening date/time
  is_cancelled: boolean;
  special_notes?: string;
}

const PublicClassesPage = () => {
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [activeTab, setActiveTab] = useState<'adult-teen' | 'mother-daughter'>('adult-teen');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClassesFromAirtable();
  }, []);

  const fetchClassesFromAirtable = async () => {
    try {
      setLoading(true);
      setError(null);

      // Import API functions directly from lib
      const { getClasses, getSchedules } = await import('../lib/api');

      const [classesData, schedulesData] = await Promise.all([
        getClasses(),
        getSchedules()
      ]);

      // Combine classes with their schedules
      const combinedData: ClassSchedule[] = schedulesData.records
        .map(scheduleRecord => {
          const classId = scheduleRecord.fields['Class']?.[0];
          const classRecord = classesData.records.find(c => c.id === classId);

          if (!classRecord || !classRecord.fields['Is Active'] || scheduleRecord.fields['Is Cancelled']) {
            return null;
          }

          return {
            id: scheduleRecord.id,
            class_name: classRecord.fields['Class Name'] || '',
            description: classRecord.fields['Description'] || '',
            type: classRecord.fields['Type']?.toLowerCase() || 'public',
            age_range: classRecord.fields['Age Range'] || '',
            duration: classRecord.fields['Duration'] || 60,
            max_participants: classRecord.fields['Max Participants'],
            location: classRecord.fields['Location'] || '',
            instructor: classRecord.fields['Instructor'] || '',
            price: classRecord.fields['Price'] || 0,
            pricing_unit: scheduleRecord.fields['Pricing Unit'] || 'per person',
            partner_organization: classRecord.fields['Partner Organization'],
            booking_method: classRecord.fields['Booking Method']?.toLowerCase() || 'contact',
            registration_instructions: classRecord.fields['Registration Instructions'] || '',
            date: scheduleRecord.fields['Date'] || '',
            start_time: scheduleRecord.fields['Start Time'] || '',
            end_time: scheduleRecord.fields['End Time'] || '',
            booking_url: scheduleRecord.fields['Booking URL'],
            registration_opens: scheduleRecord.fields['Registration Opens'], // New field
            is_cancelled: scheduleRecord.fields['Is Cancelled'] || false,
            special_notes: scheduleRecord.fields['Special Notes']
          };
        })
        .filter(Boolean)
        .filter(classData => {
          // Only show future classes (including today)
          const classDate = new Date(classData.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Start of today
          return classDate >= today;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setClassSchedules(combinedData);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load class schedule. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatRegistrationDate = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }) + ' at ' + date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  const formatClassDate = (dateString: string) => {
    // Add noon time to prevent timezone issues
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleBooking = (classSchedule: ClassSchedule) => {
    switch (classSchedule.booking_method) {
      case 'external':
        if (classSchedule.booking_url) {
          window.open(classSchedule.booking_url, '_blank');
        } else {
          window.location.href = `mailto:info@streetwiseselfdefense.com?subject=Registration Inquiry - ${classSchedule.class_name}&body=Hi, I'm interested in registering for ${classSchedule.class_name} on ${new Date(classSchedule.date).toLocaleDateString()}.`;
        }
        break;
      case 'contact':
      default:
        window.location.href = `mailto:info@streetwiseselfdefense.com?subject=Class Registration Inquiry - ${classSchedule.class_name}&body=Hi, I'm interested in registering for ${classSchedule.class_name} on ${new Date(classSchedule.date).toLocaleDateString()}.`;
        break;
    }
  };

  const handleLocationClick = (location: string) => {
    const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location)}`;
    window.open(mapUrl, '_blank');
  };

  // Filter classes by type for different sections
  // Filter classes by type for different sections
  const motherDaughterClasses = classSchedules.filter(c => 
    c.type === 'public: mother & daughter'
  );

  const adultTeenClasses = classSchedules.filter(c => 
    c.type === 'public: adult & teen'
  );

  const ClassCard = ({ classData }: { classData: ClassSchedule }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-4 relative">
   

      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Class Title - Less emphasized */}
          <h4 className="text-base font-medium text-navy mb-1">{classData.class_name}</h4>

          {/* Partner Organization - If present */}
          {classData.partner_organization && (
            <p className="text-sm text-gray-500 mb-2">
              Hosted by {classData.partner_organization}
            </p>
          )}

          {/* Date, Time & Location - All in one container */}
          <div className="mb-4 space-y-2">
            <div className="flex items-start gap-2 min-h-[24px]">
              <Calendar className="w-4 h-4 text-accent-primary mt-0.5 flex-shrink-0" />
              <span className="text-md font-semibold text-accent-primary leading-tight">
                {formatClassDate(classData.date)}
              </span>
            </div>
            <div className="flex items-start gap-2 min-h-[24px]">
              <Clock className="w-4 h-4 text-accent-primary mt-0.5 flex-shrink-0" />
              <span className="text-md font-medium text-accent-primary leading-tight">
                {classData.start_time} - {classData.end_time}
              </span>
            </div>
            <button
              onClick={() => handleLocationClick(classData.location)}
              className="flex items-start gap-2 min-h-[24px] text-accent-primary hover:text-accent-dark transition-colors cursor-pointer text-left"
            >
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-md font-medium underline leading-tight">{classData.location}</span>
            </button>
          </div>

          {/* Special Notes */}
          {classData.special_notes && (
            <p className="text-sm text-accent-primary font-medium">
              Note: {classData.special_notes}
            </p>
          )}
        </div>

        {/* Button/Registration Area */}
        <div className="ml-4">
          {classData.booking_url ? (
            // Regular booking button for classes open for registration
            <button
              onClick={() => handleBooking(classData)}
              className="bg-accent-primary hover:bg-accent-dark text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-300 flex items-center gap-2"
            >
              {classData.booking_method === 'contact' ? 'Contact Us' : 'Register'}
              {classData.booking_method === 'external' ? 
                <ExternalLink className="w-4 h-4" /> : 
                <Mail className="w-4 h-4" />
              }
            </button>
          ) : classData.registration_opens ? (
            // Registration opens text with inline badge
            <div className="text-center text-gray-600 text-sm font-medium max-w-[120px]">
              <div className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium mb-2 inline-block">
                Coming Soon
              </div>
              <div>
                Registration opens<br />
                <span className="font-medium">
                  {formatRegistrationDate(classData.registration_opens)}
                </span>
              </div>
            </div>
          ) : (
            // Fallback contact button for classes without registration date
            <button
              onClick={() => handleBooking(classData)}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-300 flex items-center gap-2"
            >
              Contact Us
              <Mail className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading class schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 mb-4">
            <ExternalLink className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unable to Load Schedule</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchClassesFromAirtable}
            className="bg-accent-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (

    <div className="min-h-screen bg-white">
       {/*SEO Tags*/}
        <Helmet>
          <title>Women's Self Defense Classes | Walnut Creek | East Bay | SF Bay Area</title>
          <meta name="description" content="Women-only self defense classes in Walnut Creek, CA. Serving East Bay and San Francisco residents including Lafayette, Pleasant Hill, Orinda, Berkeley, Oakland, and surrounding areas. Mother-daughter training and adult/teen programs." />
          <meta name="keywords" content="women's self defense Walnut Creek, East Bay self defense, mother daughter classes, teen self defense, Lafayette, Pleasant Hill, Orinda, Berkeley, Oakland, Bay Area women's safety" />
          <meta property="og:title" content="Women's Self Defense Classes | Walnut Creek | Streetwise Self Defense" />
          <meta property="og:description" content="Women-only self defense classes in Walnut Creek, serving the East Bay and SF" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://streetwiseselfdefense.com/public-classes" />
          <link rel="canonical" href="https://streetwiseselfdefense.com/public-classes" />
          <meta property="og:title" content="Public Self Defense Classes - Streetwise Self Defense" />
          <meta property="og:description" content="Women-only self defense classes in the SF Bay Area. Adult & teen classes and mother-daughter programs. Learn practical safety skills in a supportive environment." />
          <meta property="og:image" content="https://www.streetwiseselfdefense.com/self-defense-action.png" />
          <meta property="og:url" content="https://www.streetwiseselfdefense.com/public-classes" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Streetwise Self Defense" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Public Self Defense Classes - Streetwise Self Defense" />
          <meta name="twitter:description" content="Women-only self defense classes in the SF Bay Area. Adult & teen classes and mother-daughter programs." />
          <meta name="twitter:image" content="https://www.streetwiseselfdefense.com/self-defense-action.png" />
        </Helmet>
      {/* Header with Background */}
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
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-6">Public Classes</h1>
            <p className="text-xl text-gray-600 mb-8">
              Join our empowering self-defense classes in a supportive, women-only environment. Choose from our
              specialized programs designed for different age groups and relationships.
            </p>
          </div>
        </div>
      </section>

      {/* Tabbed Class Sections */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <div className="mb-12">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-700">Choose Your Program:</h3>
            </div>
            <div className="flex justify-center">
              <div className="bg-white rounded-lg p-1 border-2 border-gray-200 shadow-sm w-full max-w-2xl flex flex-col md:flex-row">
                <button
                  onClick={() => setActiveTab('adult-teen')}
                  className={`flex-1 px-8 py-4 rounded-md font-semibold transition-colors ${
                    activeTab === 'adult-teen'
                      ? 'bg-accent-primary text-white shadow-md'
                      : 'text-navy hover:text-accent-primary hover:bg-accent-light'
                  }`}
                >
                  Adult & Teen Classes
                  <div className="text-sm opacity-80">Ages 15+</div>
                </button>
                <button
                  onClick={() => setActiveTab('mother-daughter')}
                  className={`flex-1 px-8 py-4 rounded-md font-semibold transition-colors ${
                    activeTab === 'mother-daughter'
                      ? 'bg-accent-primary text-white shadow-md'
                      : 'text-navy hover:text-accent-primary hover:bg-accent-light'
                  }`}
                >
                  Mother & Daughter Classes
                  <div className="text-sm opacity-80">Ages 12-15</div>
                </button>
              </div>
            </div>
          </div>
          {/* Tab Content */}
          {activeTab === 'adult-teen' && (
            <div className="mb-12">
              <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
                <div className="relative w-full md:w-64 h-auto md:h-48 rounded-lg overflow-hidden md:flex-shrink-0">
                  <img
                    src="/adult-teen.png"
                    alt="Adult & Teen Classes"
                    className="w-full h-auto md:h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-navy mb-4">Adult & Teen Classes (Ages 15+)</h2>
                  <p className="text-gray-600 text-base md:text-lg mb-4">
                    Comprehensive self-defense training for teens and adults in a women-only environment. Learn practical
                    techniques, situational awareness, and confidence-building strategies. Our classes combine physical
                    techniques with mental preparedness to help you feel safe and empowered. Classes are led by experienced 
                    instructors and cost $75 per person.
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-500">
                    <span>• 3-hour sessions</span>
                    <span>• Maximum 10 participants per class</span>
                    <span>• Beginner to advanced levels</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-navy mb-4">Upcoming Classes</h3>
                {adultTeenClasses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No upcoming Adults & Teens classes scheduled.</p>
                  </div>
                ) : (
                  adultTeenClasses.map((classData) => (
                    <ClassCard key={classData.id} classData={classData} />
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'mother-daughter' && (
            <div className="mb-12">
              <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
                <div className="relative w-full md:w-64 h-auto md:h-48 rounded-lg overflow-hidden md:flex-shrink-0">
                  <img
                    src="/mothers-daughters.png"
                    alt="Mother & Daughter Classes"
                    className="w-full h-auto md:h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-navy mb-4">Mother & Daughter Classes (Ages 12-15)</h2>
                  <p className="text-gray-600 text-base md:text-lg mb-4">
                    A unique bonding experience that empowers both mothers and daughters with essential self-defense
                    skills. These classes focus on building confidence, communication, and practical techniques in a fun,
                    supportive environment. Perfect for strengthening your relationship while learning to protect
                    yourselves. Classes are led by experienced instructors. The cost is $139 per mother-daughter pair for a 3-hour class sponsored by the City of Walnut Creek, or $99 per pair for a 2-hour class sponsored by Diablo Valley College.
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-500">
                    <span>• 2-3-hour sessions</span>
                    <span>• Maximum 5 pairs per class</span>
                    <span>• All skill levels welcome</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-navy mb-4">Upcoming Classes</h3>
                {motherDaughterClasses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No upcoming Mother & Daughter Classes scheduled.</p>
                  </div>
                ) : (
                  motherDaughterClasses.map((classData) => (
                    <ClassCard key={classData.id} classData={classData} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-navy mb-6 text-center">What to Expect</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-accent-primary/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-accent-primary" />
                </div>
                <h4 className="font-semibold text-navy mb-2">Supportive Environment</h4>
                <p className="text-gray-600 text-sm">
                  Women-only classes create a comfortable, judgment-free space for learning
                </p>
              </div>
              <div className="text-center">
                <div className="bg-accent-primary/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-accent-primary" />
                </div>
                <h4 className="font-semibold text-navy mb-2">Flexible Scheduling</h4>
                <p className="text-gray-600 text-sm">Multiple class times throughout the year to fit your schedule</p>
              </div>
              <div className="text-center">
                <div className="bg-accent-primary/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-accent-primary" />
                </div>
                <h4 className="font-semibold text-navy mb-2">Immediate Skills</h4>
                <p className="text-gray-600 text-sm">Learn practical techniques you can use right away to stay safe</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Questions About Our Classes?</h2>
          <p className="text-xl mb-8 opacity-90">
            We're here to help you find the perfect class for your needs and schedule.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-accent-primary hover:bg-accent-dark text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Contact Us
            </Link>
            <Link
              to="/faq"
              className="border-2 border-white text-white hover:bg-white hover:text-navy px-8 py-4 rounded-lg font-semibold text-lg transition-colors bg-transparent"
            >
              View FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicClassesPage;