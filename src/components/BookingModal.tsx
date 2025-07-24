import React, { useState } from 'react';
import { X, CreditCard, User, Phone, Mail, Plus, Minus } from 'lucide-react';
import { createBooking, updateBookingPayment, updateAvailableSpots } from '../lib/api';
import { stripePromise, TEST_CARDS } from '../lib/stripe';
import type { ClassSchedule } from '../lib/supabase';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  classSchedule: ClassSchedule & { class?: any };
  onBookingComplete: () => void;
}

export default function BookingModal({ 
  isOpen, 
  onClose, 
  classSchedule, 
  onBookingComplete 
}: BookingModalProps) {
  const [formData, setFormData] = useState({
    participant_name: '',
    participant_email: '',
    participant_phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    special_requirements: '',
    daughters: [{ name: '' }] // For mother-daughter classes
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Get class data - it could be nested under 'class' or 'classes'
  const classData = classSchedule.class || classSchedule.classes;
  const sponsoringEntity = classData?.sponsoring_entity;
  const weHandleRegistration = classData?.we_handle_registration ?? true;
  
  // Only show booking modal for classes we handle registration for
  if (!weHandleRegistration) {
    return null;
  }
  
  // Get price from Supabase (now in dollars)
  const classPrice = classData?.price_dollars || 0;
  
  const isMotherDaughterClass = classData?.type === 'mothers-daughters';
  
  // Calculate total price based on participants
  const participantCount = isMotherDaughterClass ? 1 + formData.daughters.length : 1;
  const totalPrice = classPrice * participantCount;

  if (!isOpen) return null;

  // Debug logging to see the actual data structure
  console.log('Full classSchedule object:', classSchedule);
  console.log('classSchedule.class:', classSchedule.class);
  console.log('classSchedule.classes:', classSchedule.classes);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDaughterNameChange = (index: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      daughters: prev.daughters.map((daughter, i) => 
        i === index ? { ...daughter, name } : daughter
      )
    }));
  };

  const addDaughter = () => {
    setFormData(prev => ({
      ...prev,
      daughters: [...prev.daughters, { name: '' }]
    }));
  };

  const removeDaughter = (index: number) => {
    if (formData.daughters.length > 1) {
      setFormData(prev => ({
        ...prev,
        daughters: prev.daughters.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create booking in pending state
      const bookingData = {
        schedule_id: classSchedule.id,
        participant_name: formData.participant_name,
        participant_email: formData.participant_email,
        participant_phone: formData.participant_phone,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        special_requirements: formData.special_requirements
      };

      // Add daughter names for mother-daughter classes
      if (isMotherDaughterClass) {
        const daughterNames = formData.daughters.map(d => d.name).filter(name => name.trim());
        bookingData.special_requirements = `Daughters: ${daughterNames.join(', ')}${formData.special_requirements ? '\n\nAdditional notes: ' + formData.special_requirements : ''}`;
      }

      const booking = await createBooking(bookingData);
      setBookingId(booking.id);

      // Move to payment step
      setStep('payment');

    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!bookingId) return;
    
    setIsSubmitting(true);
    setPaymentError(null);

    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe not loaded');

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(totalPrice * 100), // Convert to cents
          bookingId
        }),
      });

      console.log('Payment intent response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment intent error response:', errorText);
        throw new Error(`Failed to create payment intent: ${response.status} - ${errorText}`);
      }

      const { clientSecret } = await response.json();
      console.log('Got client secret, confirming payment...');

      // For testing, confirm payment with test card
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: {
            number: TEST_CARDS.SUCCESS,
            exp_month: 12,
            exp_year: 2025,
            cvc: '123',
          },
          billing_details: {
            name: formData.participant_name,
            email: formData.participant_email,
          },
        },
      });

      if (error) {
        console.error('Payment error:', error);
        setPaymentError(error.message || 'Payment failed');
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Update booking status
        await updateBookingPayment(bookingId, paymentIntent.id);
        
        // Update available spots
        await updateAvailableSpots(classSchedule.id, -participantCount);
        
        setStep('success');
        onBookingComplete();
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      setPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form after a delay to avoid visual glitch
    setTimeout(() => {
      setStep('details');
      setFormData({
        participant_name: '',
        participant_email: '',
        participant_phone: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        special_requirements: '',
        daughters: [{ name: '' }]
      });
      setPaymentError(null);
      setBookingId(null);
    }, 300);
  };

  const isCardDataValid = true; // For testing purposes

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-navy">
              {step === 'details' ? 'Book Your Class' : 
               step === 'payment' ? 'Payment' : 'Booking Complete'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {step === 'details' ? (
            <form onSubmit={handleSubmitDetails} className="space-y-6">
              <div className="bg-accent-light p-4 rounded-lg">
                <h3 className="font-semibold text-navy mb-2">{classData?.title}</h3>
                <p className="text-sm text-gray-600 mb-1">
                  {new Date(classSchedule.start_time).toLocaleDateString()} at{' '}
                  {new Date(classSchedule.start_time).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  Price: ${classPrice.toFixed(2)} per participant
                </p>
                {isMotherDaughterClass && (
                  <p className="text-sm text-accent-primary font-medium mt-2">
                    Total for {participantCount} participants: ${totalPrice.toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  {isMotherDaughterClass ? 'Mother\'s Name *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  name="participant_name"
                  required
                  value={formData.participant_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-1" />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="participant_email"
                  required
                  value={formData.participant_email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="participant_phone"
                  value={formData.participant_phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Mother-Daughter specific fields */}
              {isMotherDaughterClass && (
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-navy mb-4">Daughter Information</h4>
                  {formData.daughters.map((daughter, index) => (
                    <div key={index} className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={daughter.name}
                        onChange={(e) => handleDaughterNameChange(index, e.target.value)}
                        placeholder={`Daughter ${index + 1} name`}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                      />
                      {formData.daughters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDaughter(index)}
                          className="px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addDaughter}
                    className="flex items-center gap-2 text-accent-primary hover:text-accent-dark font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Daughter
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="Emergency contact full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requirements or Notes
                </label>
                <textarea
                  name="special_requirements"
                  value={formData.special_requirements}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="Any special needs, accessibility requirements, or other notes..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent-primary hover:bg-accent-dark disabled:opacity-50 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                {isSubmitting ? 'Processing...' : `Continue to Payment ($${totalPrice.toFixed(2)})`}
              </button>
            </form>
          ) : step === 'payment' ? (
            <div className="text-center">
              <CreditCard className="h-16 w-16 text-accent-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-navy mb-4">Complete Payment</h3>
              
              <div className="bg-accent-light p-4 rounded-lg mb-6">
                <p className="text-navy font-semibold mb-2">Total: ${totalPrice.toFixed(2)}</p>
                <p className="text-sm text-gray-600">
                  {classData?.title} - {participantCount} participant{participantCount > 1 ? 's' : ''}
                </p>
              </div>

              {/* Test Mode Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium mb-2">💳 Test Payment</p>
                <p className="text-xs text-blue-700 mb-2">
                  This will process a test payment using: {TEST_CARDS.SUCCESS}
                </p>
                <p className="text-xs text-blue-600">
                  In production, you would enter your real card details here.
                </p>
              </div>

              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 text-sm">{paymentError}</p>
                </div>
              )}

              
              <div className="space-y-3">
                <button
                  onClick={handlePayment}
                  disabled={isSubmitting || !isCardDataValid}
                  className="w-full bg-accent-primary hover:bg-accent-dark disabled:opacity-50 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white inline-block mr-2"></div>
                      Processing Payment...
                    </>
                  ) : (
                    `Pay $${totalPrice.toFixed(2)}`
                  )}
                </button>
                
                <button
                  onClick={() => setStep('details')}
                  disabled={isSubmitting}
                  className="w-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 py-3 px-6 rounded-lg font-semibold transition-colors"
                >
                  Back to Details
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-navy mb-4">Booking Confirmed!</h3>
              <p className="text-gray-600 mb-6">
                Your class has been booked successfully. You'll receive a confirmation email shortly.
              </p>
              <div className="bg-accent-light p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-1">Class Details:</p>
                <p className="font-semibold text-navy">{classData?.title}</p>
                <p className="text-sm text-gray-600">
                  {new Date(classSchedule.start_time).toLocaleDateString()} at{' '}
                  {new Date(classSchedule.start_time).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-sm text-gray-600">Total Paid: ${totalPrice.toFixed(2)}</p>
              </div>
              <button
                onClick={handleClose}
                className="bg-accent-primary hover:bg-accent-dark text-white py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}