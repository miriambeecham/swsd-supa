import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Users, ArrowLeft } from 'lucide-react';
import { useMotherDaughterClasses, useAdultTeenClasses } from '../hooks/useClasses';
import ClassCard from '../components/ClassCard';
import BookingModal from '../components/BookingModal';
import { useState } from 'react';
import type { ClassSchedule } from '../lib/supabase';

const PublicClassesPage = () => {
  const { classes: motherDaughterClasses, loading: mdLoading, error: mdError, refetch: refetchMD } = useMotherDaughterClasses();
  const { classes: adultTeenClasses, loading: atLoading, error: atError, refetch: refetchAT } = useAdultTeenClasses();
  
  const [selectedClass, setSelectedClass] = useState<(ClassSchedule & { class?: any }) | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const handleSignUp = (scheduleId: string) => {
    const allClasses = [...motherDaughterClasses, ...adultTeenClasses];
    const classToBook = allClasses.find(c => c.id === scheduleId);
    if (classToBook) {
      setSelectedClass(classToBook);
      setIsBookingModalOpen(true);
    }
  };

  const handleBookingComplete = () => {
    // Refresh the class lists to update available spots
    refetchMD();
    refetchAT();
    setIsBookingModalOpen(false);
    setSelectedClass(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="relative py-16">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/8613313/pexels-photo-8613313.jpeg?auto=compress&cs=tinysrgb&w=1600)'
          }}
        ></div>
        <div className="absolute inset-0 bg-white/80"></div>
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

      {/* Mother-Daughter Classes */}
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
                  <span>• 2-hour sessions</span>
                  <span>• Maximum 10 pairs per class</span>
                  <span>• All skill levels welcome</span>
                  <span>• $75 per pair</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-navy mb-4">Upcoming Mother-Daughter Classes</h3>
              {mdLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading classes...</p>
                </div>
              ) : mdError ? (
                <div className="text-center py-8">
                  <p className="text-red-600">Error loading classes: {mdError}</p>
                </div>
              ) : motherDaughterClasses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No upcoming mother-daughter classes scheduled.</p>
                </div>
              ) : (
                motherDaughterClasses.map((classData) => (
                  <ClassCard 
                    key={classData.id} 
                    classData={classData} 
                    onSignUp={handleSignUp}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Adult & Teen Classes */}
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
                  <span>• 2-hour sessions</span>
                  <span>• Maximum 12 participants per class</span>
                  <span>• Beginner to advanced levels</span>
                  <span>• $45 per person</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-navy mb-4">Upcoming Adult & Teen Classes</h3>
              {atLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading classes...</p>
                </div>
              ) : atError ? (
                <div className="text-center py-8">
                  <p className="text-red-600">Error loading classes: {atError}</p>
                </div>
              ) : adultTeenClasses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No upcoming adult & teen classes scheduled.</p>
                </div>
              ) : (
                adultTeenClasses.map((classData) => (
                  <ClassCard 
                    key={classData.id} 
                    classData={classData} 
                    onSignUp={handleSignUp}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Additional Info */}
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

      {/* Booking Modal */}
      {selectedClass && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedClass(null);
          }}
          classSchedule={selectedClass}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </div>
  );
};

export default PublicClassesPage;