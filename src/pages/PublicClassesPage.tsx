import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, ArrowLeft, MapPin, ExternalLink, Filter, Mail } from 'lucide-react';

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
  booking_method: 'external' | 'contact';
  registration_instructions: string;
  date: string;
  start_time: string;
  end_time: string;
  booking_url?: string;
  is_cancelled: boolean;
  special_notes?: string;
}

const PublicClassesPage = () => {
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClassesFromAirtable();
  }, []);

  const fetchClassesFromAirtable = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both Classes and Class Schedules from Airtable
      const [classesResponse, schedulesResponse] = await Promise.all([
        fetch(`https://api.airtable.com/v0/${import.meta.env.VITE_AIRTABLE_BASE_ID}/Classes`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`
          }
        }),
        fetch(`https://api.airtable.com/v0/${import.meta.env.VITE_AIRTABLE_BASE_ID}/Class%20Schedules`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`
          }
        })
      ]);

      if (!classesResponse.ok || !schedulesResponse.ok) {
        throw new Error('Failed to fetch data from Airtable');
      }

      const classesData = await classesResponse.json();
      const schedulesData = await schedulesResponse.json();

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
            booking_method: classRecord.fields['Booking Method']?.toLowerCase() || 'contact',
            registration_instructions: classRecord.fields['Registration Instructions'] || '',
            date: scheduleRecord.fields['Date'] || '',
            start_time: scheduleRecord.fields['Start Time'] || '',
            end_time: scheduleRecord.fields['End Time'] || '',
            booking_url: scheduleRecord.fields['Booking URL'],
            is_cancelled: scheduleRecord.fields['Is Cancelled'] || false,
            special_notes: scheduleRecord.fields['Special Notes']
          };
        })
        .filter(Boolean)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setClassSchedules(combinedData);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load class schedule. Please try again later.');
    } finally {
      setLoading(false);
    }
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

  // Filter classes by type for different sections
  const motherDaughterClasses = classSchedules.filter(c => 
    c.class_name.toLowerCase().includes('mother') || 
    c.class_name.toLowerCase().includes('daughter') ||
    c.age_range.includes('12-15')
  );

  const adultTeenClasses = classSchedules.filter(c => 
    c.age_range.includes('15+') || 
    c.class_name.toLowerCase().includes('adult') ||
    c.class_name.toLowerCase().includes('teen')
  );

  const ClassCard = ({ classData }: { classData: ClassSchedule }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-navy mb-2">{classData.class_name}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(classData.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{classData.start_time} - {classData.end_time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{classData.location}</span>
            </div>
          </div>
          {classData.instructor && (
            <p className="text-sm text-gray-600 mb-2">
              <strong>Instructor:</strong> {classData.instructor}
            </p>
          )}
          {classData.price > 0 && (
            <p className="text-sm text-gray-600 mb-2">
              <strong>Price:</strong> ${classData.price}
            </p>
          )}
          {classData.special_notes && (
            <p className="text-sm text-accent-primary font-medium">
              Note: {classData.special_notes}
            </p>
          )}
        </div>
        <button
          onClick={() => handleBooking(classData)}
          className="bg-accent-primary hover:bg-accent-dark text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-300 flex items-center gap-2 ml-4"
        >
          {classData.booking_method === 'contact' ? 'Contact Us' : 'Register Now'}
          {classData.booking_method === 'external' ? 
            <ExternalLink className="w-4 h-4" /> : 
            <Mail className="w-4 h-4" />
          }
        </button>
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
      {/* Header with Background */}
      <section className="relative py-16">
        <div 
          className="absolute inset-0 bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/swsd-logo-bug.png)'
          }}
        ></div>
        <div className="absolute inset-0 bg-white/95"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-navy transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-navy mb-6">Public Classes</h1>
            <p className="text-xl text-gray-600 mb-8">
              Join our empowering self-defense classes in a supportive, women-only environment. Choose from our
              specialized programs designed for different age groups and relationships.
            </p>
          </div>
        </div>
      </section>

      {/* Mother-Daughter Classes Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="flex items-start gap-8 mb-8">
              <div className="relative w-64 h-48 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src="/mothers-daughters.jpg"
                  alt="Mother-Daughter Classes"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-navy mb-4">Mother-Daughter Classes (Ages 12-15)</h2>
                <p className="text-gray-600 text-lg mb-4">
                  A unique bonding experience that empowers both mothers and daughters with essential self-defense
                  skills. These classes focus on building confidence, communication, and practical techniques in a fun,
                  supportive environment. Perfect for strengthening your relationship while learning to protect
                  yourselves.
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>• 3-hour sessions</span>
                  <span>• Maximum 10 pairs per class</span>
                  <span>• All skill levels welcome</span>
                  <span>• $139 per pair</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-navy mb-4">Upcoming Mother-Daughter Classes</h3>
              {motherDaughterClasses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No upcoming mother-daughter classes scheduled.</p>
                </div>
              ) : (
                motherDaughterClasses.map((classData) => (
                  <ClassCard key={classData.id} classData={classData} />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Adult & Teen Classes Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="flex items-start gap-8 mb-8">
              <div className="relative w-64 h-48 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src="/adult-teen.jpg"
                  alt="Adult & Teen Classes"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-navy mb-4">Adult & Teen Classes (Ages 15+)</h2>
                <p className="text-gray-600 text-lg mb-4">
                  Comprehensive self-defense training for teens and adults in a women-only environment. Learn practical
                  techniques, situational awareness, and confidence-building strategies. Our classes combine physical
                  techniques with mental preparedness to help you feel safe and empowered.
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>• 3-hour sessions</span>
                  <span>• Maximum 20 participants per class</span>
                  <span>• Beginner to advanced levels</span>
                  <span>• $75 per person</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-navy mb-4">Upcoming Adult & Teen Classes</h3>
              {adultTeenClasses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No upcoming adult & teen classes scheduled.</p>
                </div>
              ) : (
                adultTeenClasses.map((classData) => (
                  <ClassCard key={classData.id} classData={classData} />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-accent-light rounded-2xl p-8">
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
                <p className="text-gray-600 text-sm">Multiple class times throughout the week to fit your schedule</p>
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
              to="/contact"
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