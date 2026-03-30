// src/pages/AdminClassPrepLinksPage.tsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Copy, ExternalLink, Calendar, Clock } from 'lucide-react';

interface ClassWithPrepLink {
  id: string;
  className: string;
  classType: string;
  date: string;
  startTime: string;
  location: string;
  prepUrl: string;
  bookingUrl?: string;
}

const AdminClassPrepLinksPage = () => {
  const [classes, setClasses] = useState<ClassWithPrepLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'prep' | 'booking' | null>(null);

  useEffect(() => {
    fetchClassLinks();
  }, []);

  const fetchClassLinks = async () => {
    try {
      const [classesResponse, schedulesResponse] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/schedules')
      ]);

      const [classesData, schedulesData] = await Promise.all([
        classesResponse.json(),
        schedulesResponse.json()
      ]);

      const classLinks = schedulesData.records
        .filter(schedule => !schedule.fields['Is Cancelled'])
        .map(schedule => {
          const classId = schedule.fields['Class']?.[0];
          const classRecord = classesData.records.find(c => c.id === classId);
          const classType = classRecord?.fields['Type'] || '';
          
          // Determine if this is a community class that needs a booking URL
          const isCommunityClass = classType.toLowerCase().includes('community');
          
          return {
            id: schedule.id,
            className: classRecord?.fields['Class Name'] || 'Unknown Class',
            classType: classType,
            date: schedule.fields['Date'] || '',
            startTime: schedule.fields['Start Time New'] || schedule.fields['Start Time'] || '',
            location: schedule.fields['Location'] || classRecord?.fields['Location'] || '',
            prepUrl: `${window.location.origin}/class-prep/${schedule.id}`,
            bookingUrl: isCommunityClass ? `${window.location.origin}/book-community-md/${schedule.id}` : undefined
          };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setClasses(classLinks);
    } catch (error) {
      console.error('Error fetching class links:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (url: string, id: string, type: 'prep' | 'booking') => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedType(null);
    }, 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T12:00:00').toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <Helmet>
        <title>Admin - Class Prep Links</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-navy mb-2">Class Preparation Links</h1>
              <p className="text-gray-600">Internal use only - Share these links with students after booking</p>
            </div>
            <a
              href="/admin/schedules"
              className="flex items-center gap-2 bg-accent-primary hover:bg-accent-dark text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap text-sm font-medium"
            >
              <Calendar className="w-4 h-4" />
              Manage Schedules
            </a>
          </div>

          <div className="space-y-4">
            {classes.map((classItem) => (
              <div key={classItem.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-navy">
                          {classItem.className}
                        </h3>
                        {classItem.bookingUrl && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                            Community
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(classItem.date)}</span>
                        </div>
                        {classItem.startTime && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(classItem.startTime)}</span>
                          </div>
                        )}
                        {classItem.location && (
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 text-center">📍</span>
                            <span>{classItem.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Booking URL (for community classes only) */}
                  {classItem.bookingUrl && (
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Booking Page URL (share with community organizer)
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-blue-50 border border-blue-200 rounded p-3 font-mono text-sm break-all">
                          {classItem.bookingUrl}
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => copyToClipboard(classItem.bookingUrl!, classItem.id, 'booking')}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <Copy className="w-4 h-4" />
                            {copiedId === classItem.id && copiedType === 'booking' ? 'Copied!' : 'Copy'}
                          </button>
                          <a 
                            href={classItem.bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Class Prep URL (always shown) */}
                  <div className={classItem.bookingUrl ? 'border-t pt-4' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class Prep Page URL {classItem.bookingUrl ? '(sent after booking)' : ''}
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-gray-50 border border-gray-200 rounded p-3 font-mono text-sm break-all">
                        {classItem.prepUrl}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => copyToClipboard(classItem.prepUrl, classItem.id, 'prep')}
                          className="flex items-center gap-2 bg-accent-primary hover:bg-accent-dark text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <Copy className="w-4 h-4" />
                          {copiedId === classItem.id && copiedType === 'prep' ? 'Copied!' : 'Copy'}
                        </button>
                        <a 
                          href={classItem.prepUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {classes.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No upcoming classes scheduled
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminClassPrepLinksPage;
