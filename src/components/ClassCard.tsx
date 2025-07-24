import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import type { ClassSchedule } from '../lib/supabase';

interface ClassCardProps {
  classData: ClassSchedule & { class?: any };
  onSignUp: (scheduleId: string) => void;
}

export default function ClassCard({ classData, onSignUp }: ClassCardProps) {
  const isLowSpots = classData.available_spots <= 3;
  const isFull = classData.available_spots === 0;
  
  // Get class data - it could be nested under 'class' or 'classes'
  const classInfo = classData.class || classData.classes;
  const sponsoringEntity = classInfo?.sponsoring_entity;
  const weHandleRegistration = classInfo?.we_handle_registration ?? true;
  const externalUrl = classData.external_registration_url;
  
  // Get class title and address
  const classTitle = classInfo?.title || 'Self Defense Class';
  const classAddress = sponsoringEntity?.address || classInfo?.location || 'Location TBD';

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
  };

  const formatTime = (startTime: string, endTime: string) => {
    const start = format(new Date(startTime), 'h:mm a');
    const end = format(new Date(endTime), 'h:mm a');
    return `${start} - ${end}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-navy mb-2">
              {classTitle}
            </h2>
            <h3 className="text-lg font-semibold text-navy mb-2">
              {formatDate(classData.start_time)}
            </h3>
            <div className="flex items-center gap-4 text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {formatTime(classData.start_time, classData.end_time)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{classAddress}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isLowSpots 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {classData.available_spots} spots left
              </span>
              {isLowSpots && !isFull && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 border border-orange-200">
                  Almost Full
                </span>
              )}
            </div>
          </div>
          {weHandleRegistration ? (
            <button 
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ml-4 ${
                isFull
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-accent-primary hover:bg-accent-dark text-white'
              }`}
              disabled={isFull}
              onClick={() => !isFull && onSignUp(classData.id)}
            >
              {isFull ? "Full" : "Sign Up"}
            </button>
          ) : (
            <a
              href={externalUrl || sponsoringEntity?.website_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ml-4 inline-block text-center ${
                isFull
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none'
                  : 'bg-accent-primary hover:bg-accent-dark text-white'
              }`}
            >
              {isFull ? "Full" : `Register with ${sponsoringEntity?.name || 'Partner'}`}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}