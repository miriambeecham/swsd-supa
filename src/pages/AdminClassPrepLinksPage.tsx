import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Copy, ExternalLink, Calendar, Clock } from 'lucide-react';

interface ClassWithPrepLink {
  id: string;
  className: string;
  date: string;
  startTime: string;
  location: string;
  prepUrl: string;
}

const AdminClassPrepLinksPage = () => {
  const [classes, setClasses] = useState<ClassWithPrepLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
          
          return {
            id: schedule.id,
            className: classRecord?.fields['Class Name'] || 'Unknown Class',
            date: schedule.fields['Date'] || '',
            startTime: schedule.fields['Start Time New'] || schedule.fields['Start Time'] || '',
            location: schedule.fields['Location'] || classRecord?.fields['Location'] || '',
            prepUrl: `${window.location.origin}/class-prep/${schedule.id}`
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

  const copyToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-navy mb-2">Class Preparation Links</h1>
            <p className="text-gray-600">Internal use only - Share these links with students after booking</p>
          </div>

          <div className="space-y-4">
            {classes.map((classItem) => (
              <div key={classItem.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-navy mb-2">
                      {classItem.className}
                    </h3>
                    
<div className="space-y-1 text-sm text-gray-600 mb-3">
  <div className="flex items-center gap-2">
    <Calendar className="w-4 h-4" />
    <span>{formatDate(classItem.date)}</span>
  </div>
  {classItem.startTime && (
    <div className="flex items-center gap-2 mt-2">
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

                    <div className="bg-gray-50 rounded p-3 font-mono text-sm break-all">
                      {classItem.prepUrl}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => copyToClipboard(classItem.prepUrl, classItem.id)}
                      className="flex items-center gap-2 bg-accent-primary hover:bg-accent-dark text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <Copy className="w-4 h-4" />
                      {copiedId === classItem.id ? 'Copied!' : 'Copy URL'}
                    </button>
                    
                    
                      <a href={classItem.prepUrl}
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
