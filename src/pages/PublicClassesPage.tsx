import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, Users, MapPin, ExternalLink, Mail, User, UsersRound } from 'lucide-react';

interface ClassSchedule {
  id: string;
  class_name: string;
  type: string;
  available_spots?: number;
  location: string;
  city?: string;
  instructor: string;
  price: number;
  pricing_unit?: string;
  partner_organization?: string;
  booking_method: 'external' | 'contact' | 'swsd website';
  date: string;
  booking_url?: string;
  registration_opens?: string;
  is_cancelled: boolean;
  special_notes?: string;
  start_time_new?: string;
  end_time_new?: string;
}

const PublicClassesPage = () => {
  const navigate = useNavigate();
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<'all' | 'adult-teen' | 'mother-daughter'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isRegistrationClosed = (startTimeNew: string) => {
    if (!startTimeNew) return false;
    
    try {
      const classDateTime = new Date(startTimeNew);
      const nowPacific = new Date().toLocaleString("en-US", {
        timeZone: "America/Los_Angeles"
      });
      const now = new Date(nowPacific);
      const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      return classDateTime <= fourHoursFromNow;
    } catch (error) {
      console.error('Date parsing error:', error);
      return false;
    }
  };
  
  useEffect(() => {
    fetchClassesFromAirtable();
    if (Math.random() < 0.1) {
      fetch('/api/cleanup-expired-bookings', { method: 'POST' }).catch(() => {});
    }
  }, []);

  const handleBookNow = (classData: ClassSchedule) => {
    if (!classData?.id) {
      console.error('Missing class id for booking');
      return;
    }

    const bookingData = {
      id: classData.id,
      class_name: classData.class_name,
      description: classData.description,
      type: classData.type === 'public: mother & daughter' ? 'mother-daughter' : 'adult',
      date: classData.date,
      start_time: classData.start_time_new,
      end_time: classData.end_time_new,
      price: classData.price,
      location: classData.location
    };

    const isMotherDaughter = classData.type === 'public: mother & daughter';
    const path = isMotherDaughter
      ? `/book-mother-daughter-class/${classData.id}`
      : `/book-adult-class/${classData.id}`;

    console.log('Navigating to:', path, bookingData);
    navigate(path, { state: { classSchedule: bookingData } });
  };

  const fetchClassesFromAirtable = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classesResponse, schedulesResponse] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/schedules')
      ]);

      if (!classesResponse.ok || !schedulesResponse.ok) {
        throw new Error('Failed to fetch class data');
      }

      const [classesData, schedulesData] = await Promise.all([
        classesResponse.json(),
        schedulesResponse.json()
      ]);

      const combinedData: ClassSchedule[] = schedulesData.records
        .map(scheduleRecord => {
          const classId = scheduleRecord.fields['Class']?.[0];
          const classRecord = classesData.records.find(c => c.id === classId);

          if (!classRecord || !classRecord.fields['Is Active'] || scheduleRecord.fields['Is Cancelled']) {
            return null;
          }

          const price = scheduleRecord.fields['Price'] || classRecord.fields['Price'] || 0;
          const pricingUnit = scheduleRecord.fields['Pricing Unit'] || classRecord.fields['Pricing Unit'] || '';

          return {
            id: scheduleRecord.id,
            class_name: classRecord.fields['Class Name'] || '',
            type: classRecord.fields['Type']?.toLowerCase() || 'public',
            available_spots: scheduleRecord.fields['Available Spots'],
            location: classRecord.fields['Location'] || '',
            city: classRecord.fields['City'] || '',
            instructor: classRecord.fields['Instructor'] || '',
            price,
            pricing_unit: pricingUnit,
            partner_organization: classRecord.fields['Partner Organization'],
            booking_method: classRecord.fields['Booking Method']?.toLowerCase() || 'contact',
            date: scheduleRecord.fields['Date'] || '',
            start_time_new: scheduleRecord.fields['Start Time New'],
            end_time_new: scheduleRecord.fields['End Time New'],
            booking_url: scheduleRecord.fields['Booking URL'],
            registration_opens: scheduleRecord.fields['Registration Opens'],
            is_cancelled: scheduleRecord.fields['Is Cancelled'] || false,
            special_notes: scheduleRecord.fields['Special Notes']
          };
        })
        .filter(Boolean)
        .filter(classData => {
          if (classData.start_time_new) {
            const classDateTime = new Date(classData.start_time_new);
            const now = new Date();
            return classDateTime > now;
          } else {
            const classDate = new Date(classData.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return classDate >= today;
          }
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setClassSchedules(combinedData);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('database_error');
    } finally {
      setLoading(false);
    }
  };

  const AvailabilityDisplay = ({ classScheduleId, availableSpots }: { classScheduleId: string; availableSpots: number }) => {
    const [remaining, setRemaining] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const checkAvailability = async () => {
        try {
          const response = await fetch('/api/check-availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classScheduleId, requestedSeats: 1 })
          });
          if (response.ok) {
            const data = await response.json();
            setRemaining(data.remaining);
          }
        } catch (error) {
          console.error('Error checking availability:', error);
        } finally {
          setLoading(false);
        }
      };
      checkAvailability();
    }, [classScheduleId]);

    if (loading || remaining === null) return null;

    const isFilling = remaining <= (availableSpots * 0.5);

    return (
      <span className="text-xs ml-2">
        {isFilling ? (
          <span className="text-orange-600 font-medium">
            Only {remaining} spot{remaining !== 1 ? 's' : ''} left!
          </span>
        ) : (
          <span className="text-gray-400">
            {remaining} spot{remaining !== 1 ? 's' : ''} available
          </span>
        )}
      </span>
    );
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
      hour12: true,
      timeZone: 'America/Los_Angeles'
    });
  };

  const formatClassDate = (dateString: string) => {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return new Date(timeString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
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

  const getShortLocation = (fullLocation: string, city?: string) => {
    if (!fullLocation) return '';
    const parts = fullLocation.split(',');
    const venueName = parts[0]?.trim() || fullLocation;
    if (city) return `${venueName}, ${city}`;
    return venueName;
  };

  const getEligibilityLine = (classData: ClassSchedule) => {
    const isMotherDaughter = classData.type === 'public: mother & daughter';
    const audience = isMotherDaughter
      ? 'Girls 12-15 w/ guardian'
      : 'Women 15+';
    
    let priceDisplay = '';
    if (classData.price) {
      priceDisplay = `$${classData.price}`;
      if (classData.pricing_unit) {
        const unitMap: Record<string, string> = {
          'Per Person': '/person',
          'Per Mother/Daughter Pair': '/pair',
        };
        priceDisplay += unitMap[classData.pricing_unit] || '';
      }
    }
    
    const parts = [audience, '3 hrs'];
    if (priceDisplay) parts.push(priceDisplay);
    return parts.join(' • ');
  };

  const ClassCard = ({ classData }: { classData: ClassSchedule }) => {
    const [isFull, setIsFull] = useState(false);
    const [checkingAvailability, setCheckingAvailability] = useState(true);
    
    const isMotherDaughter = classData.type === 'public: mother & daughter';

    useEffect(() => {
      const checkIfFull = async () => {
        if (!classData.available_spots || 
            classData.booking_method?.trim().toLowerCase() !== 'swsd website') {
          setCheckingAvailability(false);
          return;
        }

        const requiredSeats = isMotherDaughter ? 2 : 1;

        try {
          const response = await fetch('/api/check-availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              classScheduleId: classData.id, 
              requestedSeats: requiredSeats
            })
          });
          
          if (response.status === 409) {
            setIsFull(true);
          } else if (response.ok) {
            const data = await response.json();
            if (isMotherDaughter) {
              setIsFull(data.remaining <= 1);
            } else {
              setIsFull(data.remaining <= 0);
            }
          }
        } catch (error) {
          console.error('Error checking availability:', error);
        } finally {
          setCheckingAvailability(false);
        }
      };

      checkIfFull();
    }, [classData.id, classData.available_spots, classData.booking_method, classData.type]);

    const registrationClosed = isRegistrationClosed(classData.start_time_new);
    
    // Gray for adult, navy for M&D
    const borderColor = isMotherDaughter ? 'border-l-navy' : 'border-l-gray-300';
    const iconBgClass = isMotherDaughter ? 'bg-navy/10' : 'bg-gray-100';
    const iconColorClass = isMotherDaughter ? 'text-navy' : 'text-gray-500';

    return (
      <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-3 border-l-4 ${borderColor}`}>
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon + Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Type Icon */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgClass}`}>
              {isMotherDaughter ? (
                <UsersRound className={`w-4 h-4 ${iconColorClass}`} />
              ) : (
                <User className={`w-4 h-4 ${iconColorClass}`} />
              )}
            </div>
            
            {/* Class Info */}
            <div className="min-w-0">
              {/* Row 1: Name + eligibility */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-semibold text-navy">{classData.class_name}</span>
                <span className="text-xs text-gray-400">{getEligibilityLine(classData)}</span>
                {isFull && classData.booking_method?.trim().toLowerCase() === 'swsd website' && (
                  <span className="inline-block bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded text-xs font-medium">
                    Full
                  </span>
                )}
              </div>
              
              {/* Row 2: Date, time, partner */}
              <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span>{formatClassDate(classData.date)} • {formatTime(classData.start_time_new)} – {formatTime(classData.end_time_new)}</span>
                {classData.partner_organization && classData.partner_organization.trim() !== 'Streetwise Self Defense' && (
                  <span className="text-gray-400">• Hosted by {classData.partner_organization}</span>
                )}
                {/* Inline availability */}
                {classData.available_spots && classData.start_time_new && 
                  classData.booking_method?.trim().toLowerCase() === 'swsd website' &&
                  !isFull && !registrationClosed && (
                  <AvailabilityDisplay 
                    classScheduleId={classData.id} 
                    availableSpots={classData.available_spots} 
                  />
                )}
              </div>

              {/* Row 3: Location */}
              {classData.location && (
                <button
                  onClick={() => handleLocationClick(classData.location)}
                  className="flex items-center gap-1 mt-0.5 text-left group"
                >
                  <MapPin className="w-3 h-3 text-accent-primary flex-shrink-0" />
                  <span className="text-xs text-gray-400 group-hover:text-accent-dark transition-colors underline decoration-gray-300 group-hover:decoration-accent-dark">
                    {getShortLocation(classData.location, classData.city)}
                  </span>
                </button>
              )}

              {!classData.location && classData.special_notes && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-400">{classData.special_notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: CTA */}
          <div className="flex-shrink-0">
            {isFull && classData.booking_method?.trim().toLowerCase() === 'swsd website' ? (
              <button
                disabled
                className="bg-gray-200 text-gray-400 px-4 py-1.5 rounded-lg text-sm font-semibold cursor-not-allowed"
              >
                Class Full
              </button>
            ) : registrationClosed ? (
              <button
                disabled
                className="bg-gray-200 text-gray-400 px-4 py-1.5 rounded-lg text-sm font-semibold cursor-not-allowed"
              >
                Closed
              </button>
            ) : (classData.booking_method?.trim().toLowerCase() === 'swsd website' &&
              classData.partner_organization?.trim() === 'Streetwise Self Defense') ? (
              classData.registration_opens && new Date() < new Date(classData.registration_opens) ? (
                <div className="text-center text-gray-500 text-xs font-medium max-w-[110px]">
                  <div className="bg-gray-400 text-white px-2 py-0.5 rounded-full text-xs font-medium mb-1 inline-block">
                    Coming Soon
                  </div>
                  <div>
                    Opens {formatRegistrationDate(classData.registration_opens)}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleBookNow(classData)}
                  className="bg-accent-primary hover:bg-accent-dark text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Register
                </button>
              )
            ) : (classData.booking_method === 'external' && classData.booking_url) ? (
              <a
                href={classData.booking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-accent-primary hover:text-accent-dark text-sm font-medium transition-colors"
              >
                Register with our partner <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : classData.booking_method === 'contact' ? (
              <button
                onClick={() => handleBooking(classData)}
                className="bg-accent-primary hover:bg-accent-dark text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                Contact Us <Mail className="w-3.5 h-3.5" />
              </button>
            ) : classData.registration_opens ? (
              <div className="text-center text-gray-500 text-xs font-medium max-w-[110px]">
                <div className="bg-gray-400 text-white px-2 py-0.5 rounded-full text-xs font-medium mb-1 inline-block">
                  Coming Soon
                </div>
                <div>
                  Opens {formatRegistrationDate(classData.registration_opens)}
                </div>
              </div>
            ) : (classData.partner_organization?.trim() === 'Streetwise Self Defense') ? (
              <button
                onClick={() => handleBooking(classData)}
                className="bg-accent-primary hover:bg-accent-dark text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                Contact Us <Mail className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => handleBooking(classData)}
                className="bg-accent-primary hover:bg-accent-dark text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                Contact Us <Mail className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
//note
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
      <div className="min-h-screen bg-white">
        <Helmet>
          <title>Public Classes | Streetwise Self Defense</title>
        </Helmet>

        {/* Slim hero even during errors */}
        <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #3d566e 100%)' }}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-1/3 bg-cover bg-center opacity-20"
            style={{ backgroundImage: 'url(/adult-teen.png)' }}
          ></div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Public Classes</h1>
            <p className="text-sm text-white/70">Empowering self-defense in a supportive, women-only environment</p>
          </div>
        </section>

        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-lg mx-auto px-4">
            <div className="bg-accent-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-accent-primary" />
            </div>
            <h2 className="text-2xl font-bold text-navy mb-4">We'll Be Right Back</h2>
            <p className="text-gray-600 mb-6">
              Please check back soon for our latest class schedule. We are currently experiencing a temporary disruption with our database provider.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={fetchClassesFromAirtable}
                className="bg-accent-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/contact"
                className="border-2 border-accent-primary text-accent-primary px-6 py-3 rounded-lg font-semibold hover:bg-accent-primary hover:text-white transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get unique cities
  const availableCities = (() => {
    const cities = new Set<string>();
    classSchedules.forEach(classData => {
      if (classData.city && classData.city !== 'Unknown') {
        cities.add(classData.city);
      }
    });
    return ['All', ...Array.from(cities).sort()];
  })();

  // Filter classes
  const filteredClasses = classSchedules
    .filter(c => {
      if (c.type !== 'public: adult & teen' && c.type !== 'public: mother & daughter') return false;
      if (selectedProgram === 'adult-teen' && c.type !== 'public: adult & teen') return false;
      if (selectedProgram === 'mother-daughter' && c.type !== 'public: mother & daughter') return false;
      if (selectedCity !== 'All' && c.city !== selectedCity) return false;
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const programOptions = [
    { value: 'all', label: 'All Programs' },
    { value: 'adult-teen', label: 'Adult & Teen' },
    { value: 'mother-daughter', label: 'Mother & Daughter' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* SEO Tags */}
      <Helmet>
        <title>Women's Self Defense Classes | SF Bay Area | Walnut Creek & East Bay</title>
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

      {/* Slim Hero */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2C3E50 0%, #3d566e 100%)' }}>
        <div 
          className="absolute right-0 top-0 bottom-0 w-1/3 bg-cover bg-center opacity-20"
          style={{ backgroundImage: 'url(/adult-teen.png)' }}
        ></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Public Classes</h1>
          <p className="text-sm text-white/70">Empowering self-defense in a supportive, women-only environment</p>
        </div>
      </section>

      {/* Class Listings */}
      <section className="py-6 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Filters */}
          <div className="mb-5">
            {/* Mobile Dropdowns */}
            <div className="md:hidden space-y-3">
              <div>
                <label htmlFor="program-filter-mobile" className="block text-xs font-medium text-gray-500 mb-1">
                  Program
                </label>
                <select
                  id="program-filter-mobile"
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value as 'all' | 'adult-teen' | 'mother-daughter')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-sm text-gray-700"
                >
                  {programOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {availableCities.length > 2 && (
                <div>
                  <label htmlFor="city-filter-mobile" className="block text-xs font-medium text-gray-500 mb-1">
                    City
                  </label>
                  <select
                    id="city-filter-mobile"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-sm text-gray-700"
                  >
                    {availableCities.map(city => (
                      <option key={city} value={city}>
                        {city === 'All' ? 'All Cities' : city}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Desktop Chips */}
            <div className="hidden md:flex md:items-center md:gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">Program:</span>
                <div className="flex gap-1.5">
                  {programOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedProgram(opt.value as 'all' | 'adult-teen' | 'mother-daughter')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedProgram === opt.value
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {availableCities.length > 2 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">City:</span>
                  <div className="flex gap-1.5">
                    {availableCities.map(city => (
                      <button
                        key={city}
                        onClick={() => setSelectedCity(city)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          selectedCity === city
                            ? 'bg-gray-700 text-white'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {city === 'All' ? 'All Cities' : city}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Class Cards */}
          <div className="space-y-2">
            {filteredClasses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  No upcoming classes match your filters. Try adjusting your selection above.
                </p>
              </div>
            ) : (
              filteredClasses.map((classData) => (
                <ClassCard key={classData.id} classData={classData} />
              ))
            )}
          </div>

          {/* Private Classes Call-out — moved below schedule */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Looking for co-ed classes, training for boys/men, or other specialized instruction?{' '}
            <Link 
              to="/private-classes" 
              className="text-accent-primary hover:text-accent-dark font-medium underline"
            >
              View Private Classes
            </Link>
          </p>
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="py-12 bg-gray-50">
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
