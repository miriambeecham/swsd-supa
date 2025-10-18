// /src/pages/AdminAttendancePage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  LogOut,
  Save,
  CheckCircle,
  Mail,
  Phone,
  Copy,
  Check
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface ClassSchedule {
  id: string;
  className: string;
  date: string;
  startTime: string;
}

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  ageGroup: string;
  attendance: string;
  contactEmail: string;
  contactPhone: string;
  bookingId: string;
  bookingNumber?: number;
  isPrimaryContact: boolean;
  bookingDate?: string;
}

interface ClassInfo {
  id: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  availableSpots: number;
  bookedSpots: number;
}

interface RosterData {
  classInfo: ClassInfo;
  roster: Participant[];
  totalParticipants: number;
}

const AdminAttendancePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allClasses, setAllClasses] = useState<ClassSchedule[]>([]);
  const [currentClassId, setCurrentClassId] = useState<string>('');
  const [rosterData, setRosterData] = useState<RosterData | null>(null);
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({});
  const [initialAttendanceState, setInitialAttendanceState] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify-session');
        if (!response.ok) {
          navigate('/admin/login');
          return;
        }
        const data = await response.json();
        if (!data.authenticated) {
          navigate('/admin/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/admin/login');
      }
    };
    checkAuth();
  }, [navigate]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Track changes to attendance state
  useEffect(() => {
    const hasChanges = JSON.stringify(attendanceState) !== JSON.stringify(initialAttendanceState);
    setHasUnsavedChanges(hasChanges);
  }, [attendanceState, initialAttendanceState]);

 // ============================================
// SECTION 1: Updated fetchClasses useEffect
// ============================================
// Replace the existing fetchClasses useEffect with this:
  // Fetch all class schedules and handle query parameter
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const [schedulesResponse, classesResponse] = await Promise.all([
          fetch('/api/schedules'),
          fetch('/api/classes')
        ]);
        
        if (!schedulesResponse.ok || !classesResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const schedulesData = await schedulesResponse.json();
        const classesData = await classesResponse.json();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const filtered = schedulesData.records
          .filter((schedule: any) => {
            if (schedule.fields['Is Cancelled']) return false;
            const classDate = new Date(schedule.fields.Date + 'T00:00:00');
            return classDate >= today;
          })
          .map((schedule: any) => {
            const classId = schedule.fields.Class?.[0];
            const classRecord = classesData.records.find((c: any) => c.id === classId);
            
            return {
              id: schedule.id,
              className: classRecord?.fields['Class Name'] || 'Unknown Class',
              date: schedule.fields.Date,
              startTime: schedule.fields['Start Time New'] || schedule.fields['Start Time']
            };
          })
          .sort((a: ClassSchedule, b: ClassSchedule) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );

        setAllClasses(filtered);
        
        // Check if there's a classScheduleId query parameter
        const queryClassScheduleId = searchParams.get('classScheduleId');
        
        if (queryClassScheduleId && filtered.find(c => c.id === queryClassScheduleId)) {
          // If valid classScheduleId in URL, use it
          setCurrentClassId(queryClassScheduleId);
        } else {
          // Otherwise, find first class that is today or in the future
          const todayStr = today.toISOString().split('T')[0];
          const todayOrLaterClass = filtered.find((cls: ClassSchedule) => cls.date >= todayStr);
          
          if (todayOrLaterClass) {
            setCurrentClassId(todayOrLaterClass.id);
          } else if (filtered.length > 0) {
            setCurrentClassId(filtered[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [searchParams]); 

  // Fetch roster when class changes
  useEffect(() => {
    if (!currentClassId) return;

    const fetchRoster = async () => {
      try {
        const response = await fetch(`/api/admin/class-roster?classScheduleId=${currentClassId}`);
        if (!response.ok) throw new Error('Failed to fetch roster');
        
        const data = await response.json();
        setRosterData(data);
        
        const initialState: Record<string, string> = {};
        data.roster.forEach((participant: Participant) => {
          initialState[participant.id] = participant.attendance;
        });
        setAttendanceState(initialState);
        setInitialAttendanceState(initialState);
      } catch (error) {
        console.error('Error fetching roster:', error);
      }
    };

    fetchRoster();
  }, [currentClassId]);

  const handleLogout = async () => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to logout?')) {
        return;
      }
    }
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleClassChange = (newClassId: string) => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to switch classes?')) {
        return;
      }
    }
    setCurrentClassId(newClassId);
  };

  const handlePreviousClass = () => {
    const currentIndex = allClasses.findIndex(c => c.id === currentClassId);
    if (currentIndex > 0) {
      handleClassChange(allClasses[currentIndex - 1].id);
    }
  };

  const handleNextClass = () => {
    const currentIndex = allClasses.findIndex(c => c.id === currentClassId);
    if (currentIndex < allClasses.length - 1) {
      handleClassChange(allClasses[currentIndex + 1].id);
    }
  };

  const handleAttendanceChange = (participantId: string, value: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [participantId]: value
    }));
  };

  const handleMarkAllPresent = () => {
    const newState: Record<string, string> = {};
    rosterData?.roster.forEach(participant => {
      newState[participant.id] = 'Present';
    });
    setAttendanceState(newState);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const attendanceRecords = Object.entries(attendanceState).map(([participantId, attendance]) => ({
        participantId,
        attendance: attendance === 'Not Recorded' ? 'Present' : attendance
      }));

      const updatedState = { ...attendanceState };
      Object.keys(updatedState).forEach(id => {
        if (updatedState[id] === 'Not Recorded') {
          updatedState[id] = 'Present';
        }
      });
      setAttendanceState(updatedState);
      setInitialAttendanceState(updatedState);

      const response = await fetch('/api/admin/mark-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classScheduleId: currentClassId,
          attendanceRecords
        })
      });

      if (!response.ok) throw new Error('Failed to save attendance');

      const result = await response.json();
      console.log('Attendance saved:', result);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

const handleDownloadCurrentClassCSV = () => {
  if (!rosterData) return;

  const headers = ['Booking #', 'Primary Contact', 'Last Name', 'First Name', 'Age Group', 'Attendance', 'Contact Email', 'Contact Phone'];
  const rows = rosterData.roster.map(p => [
    p.bookingNumber || '',
    p.isPrimaryContact ? 'Yes' : 'No',
    p.lastName,
    p.firstName,
    p.ageGroup,
    attendanceState[p.id] || 'Not Recorded',
    p.contactEmail,
    p.contactPhone
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${rosterData.classInfo.className}_${rosterData.classInfo.date}_attendance.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// ============================================
// SECTION 2: Updated handleDownloadAllClassesCSV function
// ============================================
// Replace the existing handleDownloadAllClassesCSV function with this:

const handleDownloadAllClassesCSV = async () => {
  try {
    // Calculate date 4 weeks ago
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    fourWeeksAgo.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allRosterData: Array<{
      className: string;
      date: string;
      participant: any;
      attendance: string;
      isPast: boolean;
      hasUnmarkedAttendance: boolean;
    }> = [];

    // Fetch roster for each class
    for (const cls of allClasses) {
      try {
        const response = await fetch(`/api/admin/class-roster?classScheduleId=${cls.id}`);
        if (response.ok) {
          const data = await response.json();
          const classDate = new Date(data.classInfo.date + 'T00:00:00');
          const isPast = classDate < today;
          
          data.roster.forEach((p: Participant) => {
            const attendance = p.attendance || 'Not Recorded';
            const hasUnmarkedAttendance = attendance === 'Not Recorded';
            
            allRosterData.push({
              className: data.classInfo.className,
              date: data.classInfo.date,
              participant: p,
              attendance: attendance,
              isPast,
              hasUnmarkedAttendance: isPast && hasUnmarkedAttendance
            });
          });
        }
      } catch (error) {
        console.error(`Error fetching roster for class ${cls.id}:`, error);
      }
    }

    if (allRosterData.length === 0) {
      alert('No participant data found.');
      return;
    }

    // Categorize data into three groups
    const pastUnmarked = allRosterData.filter(item => 
      item.isPast && item.hasUnmarkedAttendance
    );
    const future = allRosterData.filter(item => !item.isPast);
    const pastMarked = allRosterData.filter(item => 
      item.isPast && !item.hasUnmarkedAttendance
    );

    // Sort each group by date (oldest first)
    const sortByDate = (a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime();
    
    pastUnmarked.sort(sortByDate);
    future.sort(sortByDate);
    pastMarked.sort(sortByDate);

    const headers = ['Class Name', 'Date', 'Booking #', 'Primary Contact', 'Last Name', 'First Name', 'Age Group', 'Attendance', 'Contact Email', 'Contact Phone'];
    
    const createRows = (items: typeof allRosterData) => 
      items.map(item => [
        item.className,
        item.date,
        item.participant.bookingNumber || '',
        item.participant.isPrimaryContact ? 'Yes' : 'No',
        item.participant.lastName,
        item.participant.firstName,
        item.participant.ageGroup,
        item.attendance,
        item.participant.contactEmail,
        item.participant.contactPhone
      ]);

    // Build CSV with section headers
    const csvRows: string[] = [];
    
    // Add main header
    csvRows.push(headers.join(','));
    
    // Section 1: Past classes with unmarked attendance
    if (pastUnmarked.length > 0) {
      csvRows.push(''); // Empty row
      csvRows.push('"=== PAST CLASSES - ATTENDANCE NOT MARKED ==="');
      csvRows.push(headers.join(','));
      createRows(pastUnmarked).forEach(row => {
        csvRows.push(row.map(cell => `"${cell || ''}"`).join(','));
      });
    }
    
    // Section 2: Future classes
    if (future.length > 0) {
      csvRows.push(''); // Empty row
      csvRows.push('"=== UPCOMING CLASSES ==="');
      csvRows.push(headers.join(','));
      createRows(future).forEach(row => {
        csvRows.push(row.map(cell => `"${cell || ''}"`).join(','));
      });
    }
    
    // Section 3: Past classes with attendance marked
    if (pastMarked.length > 0) {
      csvRows.push(''); // Empty row
      csvRows.push('"=== PAST CLASSES - ATTENDANCE MARKED ==="');
      csvRows.push(headers.join(','));
      createRows(pastMarked).forEach(row => {
        csvRows.push(row.map(cell => `"${cell || ''}"`).join(','));
      });
    }

    const csvContent = csvRows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const todayStr = new Date().toISOString().split('T')[0];
    a.download = `All_Classes_Attendance_${todayStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading all classes CSV:', error);
    alert('Failed to download CSV. Please try again.');
  }
};

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
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

  if (allClasses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <Helmet>
          <title>Attendance - Streetwise Self Defense</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-navy mb-4">No Upcoming Classes</h1>
            <p className="text-gray-600">There are no classes scheduled at this time.</p>
            <button
              onClick={handleLogout}
              className="mt-6 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = allClasses.findIndex(c => c.id === currentClassId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < allClasses.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Helmet>
        <title>Attendance Management - Streetwise Self Defense</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-navy">Attendance Management</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-navy transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

          {/* Class Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePreviousClass}
              disabled={!hasPrevious}
              className={`p-2 rounded-lg transition-colors ${
                hasPrevious
                  ? 'bg-accent-primary hover:bg-accent-dark text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <select
              value={currentClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
            >
              {allClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {formatDate(cls.date)} - {cls.className}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextClass}
              disabled={!hasNext}
              className={`p-2 rounded-lg transition-colors ${
                hasNext
                  ? 'bg-accent-primary hover:bg-accent-dark text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Class Info */}
        {rosterData && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold text-navy mb-4">{rosterData.classInfo.className}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="w-5 h-5 text-accent-primary" />
                  <span>{formatDate(rosterData.classInfo.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-5 h-5 text-accent-primary" />
                  <span>{formatTime(rosterData.classInfo.startTime)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-5 h-5 text-accent-primary" />
                  <span>{rosterData.classInfo.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="w-5 h-5 text-accent-primary" />
                  <span>{rosterData.totalParticipants} participants</span>
                </div>
              </div>
            </div>

{/* Action Buttons */}
<div className="flex flex-wrap items-center gap-4 mb-6">
  <div className="flex items-center gap-4">
    <button
      onClick={handleDownloadCurrentClassCSV}
      className="flex items-center gap-2 text-accent-primary hover:text-accent-dark transition-colors text-sm font-medium"
    >
      <Download className="w-4 h-4" />
      Download This Class
    </button>
    <span className="text-gray-300">|</span>
    <button
      onClick={handleDownloadAllClassesCSV}
      className="flex items-center gap-2 text-accent-primary hover:text-accent-dark transition-colors text-sm font-medium"
    >
      <Download className="w-4 h-4" />
      Download All Classes
    </button>
  </div>
  
  <div className="flex gap-3 ml-auto">
    <button
      onClick={handleMarkAllPresent}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
    >
      <CheckCircle className="w-5 h-5" />
      Mark All as Present
    </button>
    <button
      onClick={handleSaveAttendance}
      disabled={saving}
      className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
        saving
          ? 'bg-gray-400 cursor-not-allowed'
          : saveSuccess
          ? 'bg-green-600 text-white'
          : 'bg-accent-primary hover:bg-accent-dark text-white'
      }`}
    >
      {saveSuccess ? (
        <>
          <Check className="w-5 h-5" />
          Saved!
        </>
      ) : (
        <>
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Attendance'}
        </>
      )}
    </button>
  </div>
</div>

            {hasUnsavedChanges && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6 text-sm">
                ⚠️ You have unsaved changes. Remember to click "Save Attendance" before leaving this page.
              </div>
            )}

            {/* Roster Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age Group
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance
                      </th>
                    </tr>
                  </thead>
           <tbody className="bg-white divide-y divide-gray-200">
  {rosterData.roster.map((participant, index) => {
    const currentStatus = attendanceState[participant.id] || 'Not Recorded';
    const rowColor = 
      currentStatus === 'Absent' ? 'bg-red-50' :
      currentStatus === 'Present' ? 'bg-green-50' :
      '';

    // Check if this is the start of a new booking group
    const isNewBookingGroup = index === 0 || 
      rosterData.roster[index - 1].bookingId !== participant.bookingId;

    return (
      <tr 
        key={participant.id} 
        className={`${rowColor} ${isNewBookingGroup ? 'border-t-4 border-gray-300' : ''}`}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-900">
              {participant.lastName}, {participant.firstName}
            </div>
            {participant.isPrimaryContact && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                Primary Contact
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            {participant.ageGroup}
          </span>
        </td>
        <td className="px-6 py-4">
          {participant.isPrimaryContact ? (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => copyToClipboard(participant.contactEmail, `email-${participant.id}`)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-accent-primary transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="truncate max-w-[200px]">{participant.contactEmail}</span>
                {copiedField === `email-${participant.id}` ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              {participant.contactPhone && (
                <button
                  onClick={() => copyToClipboard(participant.contactPhone, `phone-${participant.id}`)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-accent-primary transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>{participant.contactPhone}</span>
                  {copiedField === `phone-${participant.id}` ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic">
              See primary contact above
            </div>
          )}
        </td>
        <td className="px-6 py-4 text-center">
          <select
            value={currentStatus}
            onChange={(e) => handleAttendanceChange(participant.id, e.target.value)}
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-sm font-medium ${
              currentStatus === 'Present' ? 'text-green-700 bg-green-50 border-green-300' :
              currentStatus === 'Absent' ? 'text-red-700 bg-red-50 border-red-300' :
              'text-gray-600 bg-gray-50 border-gray-300'
            }`}
          >
            <option value="Not Recorded">Not Recorded</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
        </td>
      </tr>
    );
  })}
</tbody>
                </table>
              </div>

              {rosterData.roster.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No participants registered for this class yet
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAttendancePage;
