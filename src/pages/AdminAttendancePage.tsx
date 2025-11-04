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

// Email Status Badge Component
const EmailStatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  if (!status || status === '') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        📭 No email sent
      </span>
    );
  }
  
  const statusConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
    'Sent': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '📧', label: 'Sent (pending)' },
    'Delivered': { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', label: 'Delivered' },
    'Opened': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '👁️', label: 'Opened' },
    'Clicked': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🖱️', label: 'Clicked' },
    'Bounced': { bg: 'bg-red-100', text: 'text-red-800', icon: '⚠️', label: 'Bounced' },
    'Spam': { bg: 'bg-orange-100', text: 'text-orange-800', icon: '⚠️', label: 'Marked as spam' },
    'Delayed': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳', label: 'Delayed' }
  };
  
  const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-600', icon: '❓', label: status };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.icon} {config.label}
    </span>
  );
};

// Helper function to format Pacific Time
const formatPacificTime = (isoTimestamp?: string): string | null => {
  if (!isoTimestamp) return null;
  
  return new Date(isoTimestamp).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

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
  // ✅ ADD EMAIL STATUS FIELDS:
  confirmationEmailStatus?: string;
  confirmationEmailSentAt?: string;
  confirmationEmailDeliveredAt?: string;
  confirmationEmailOpenedAt?: string;
  reminderEmailStatus?: string;
  reminderEmailSentAt?: string;
  reminderEmailDeliveredAt?: string;
  reminderEmailOpenedAt?: string;
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
      
      // ✅ UPDATED: Calculate 6 weeks ago
      const sixWeeksAgo = new Date();
      sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42); // 6 weeks = 42 days
      sixWeeksAgo.setHours(0, 0, 0, 0);
      
      const filtered = schedulesData.records
        .filter((schedule: any) => {
          if (schedule.fields['Is Cancelled']) return false;
          const classDate = new Date(schedule.fields.Date + 'T00:00:00');
          // ✅ UPDATED: Include classes from 6 weeks ago to future
          return classDate >= sixWeeksAgo;
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
        // ✅ UPDATED: Find first class that is today or in the future
        const todayStr = today.toISOString().split('T')[0];
        const todayOrLaterClass = filtered.find((cls: ClassSchedule) => cls.date >= todayStr);
        
        if (todayOrLaterClass) {
          setCurrentClassId(todayOrLaterClass.id);
        } else if (filtered.length > 0) {
          // If no future classes, use the most recent past class
          setCurrentClassId(filtered[filtered.length - 1].id);
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
      
{/* Class Schedule ID - for CSV imports */}
<div className="bg-teal-50 border-2 border-accent-primary rounded-lg p-4 mb-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">Class Schedule ID (for imports)</p>
        <code className="text-lg font-mono text-gray-900 bg-white px-3 py-1 rounded border border-gray-300">
          {currentClassId}
        </code>
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(currentClassId);
          setCopiedField('classScheduleId');
          setTimeout(() => setCopiedField(null), 2000);
        }}
        className="text-accent-primary hover:text-accent-dark font-medium transition-colors flex items-center gap-1"
      >
        {copiedField === 'classScheduleId' ? (
          <>
            <Check className="w-4 h-4" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy ID
          </>
        )}
      </button>
    </div>
    
    {/* Import button for all classes */}
    <button
      onClick={() => navigate('/admin/import')}
      className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-dark text-white rounded-lg transition-colors font-medium"
    >
      <Upload className="w-5 h-5" />
      Import Bookings
    </button>
  </div>
</div>

      {/* Date/Time/Location Grid */}
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
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
            Name
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[12%]">
            Age Group
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
            Contact
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
            Email Status
          </th>
          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[18%]">
            Attendance
          </th>
        </tr>
      </thead>
      
      {/* ✅ LIGHTER BORDERS BETWEEN PARTICIPANTS, DARKER BETWEEN BOOKINGS */}
  <tbody className="bg-white">
  {rosterData.roster.map((participant, index) => {
    const currentStatus = attendanceState[participant.id] || 'Not Recorded';
    const rowColor = 
      currentStatus === 'Absent' ? 'bg-red-50' :
      currentStatus === 'Present' ? 'bg-green-50' :
      '';

    const isNewBookingGroup = index === 0 || 
      rosterData.roster[index - 1].bookingId !== participant.bookingId;

    return (
      <tr 
        key={participant.id} 
        className={`
          ${rowColor} 
          ${isNewBookingGroup ? 'border-t-4 border-gray-600' : 'border-t border-gray-200'}
        `}
      >
              {/* ✅ UPDATED NAME COLUMN WITH INDENTATION */}
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  {/* Show booking info only for primary contact */}
                  {participant.isPrimaryContact && (
                    <>
                      <span className="px-2 py-1 bg-accent-primary text-white text-xs font-medium rounded">
                        Primary
                      </span>
                      {isNewBookingGroup && participant.bookingNumber && (
                        <span className="text-xs font-medium text-gray-500">
                          #{participant.bookingNumber}
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* ✅ INDENT NON-PRIMARY PARTICIPANTS */}
                  {!participant.isPrimaryContact && (
                    <span className="text-gray-400 text-sm mr-2">└─</span>
                  )}
                  
                  <div className={!participant.isPrimaryContact ? '' : ''}>
                    <div className="text-sm font-medium text-gray-900">
                      {participant.firstName} {participant.lastName}
                    </div>
                    {participant.bookingDate && isNewBookingGroup && (
                      <div className="text-xs text-gray-500">
                        Booked: {formatDate(participant.bookingDate)}
                      </div>
                    )}
                  </div>
                </div>
              </td>

              {/* Age Group column */}
              <td className="px-4 py-4">
                <span className="text-sm text-gray-600">
                  {participant.ageGroup}
                </span>
              </td>

              {/* Contact column */}
              <td className="px-4 py-4">
                {participant.isPrimaryContact ? (
                  <div className="space-y-1">
                    {participant.contactEmail && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate max-w-xs">{participant.contactEmail}</span>
                        {navigator.clipboard && (
                          <button
                            onClick={() => copyToClipboard(participant.contactEmail, 'email')}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy email"
                          >
                            {copiedField === 'email' ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                    {participant.contactPhone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{participant.contactPhone}</span>
                        {navigator.clipboard && (
                          <button
                            onClick={() => copyToClipboard(participant.contactPhone, 'phone')}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy phone"
                          >
                            {copiedField === 'phone' ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">
                    See primary contact above
                  </div>
                )}
              </td>

              {/* Email Status column */}
              <td className="px-4 py-4">
                {participant.isPrimaryContact ? (
                  <div className="space-y-2">
                    {/* Confirmation Email - Compact */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 min-w-[80px]">Confirmation:</span>
                        <EmailStatusBadge status={participant.confirmationEmailStatus} />
                      </div>
                      {participant.confirmationEmailOpenedAt && (
                        <div className="text-xs text-gray-500 ml-[88px]">
                          Opened {formatPacificTime(participant.confirmationEmailOpenedAt)}
                        </div>
                      )}
                      {participant.confirmationEmailStatus === 'Bounced' && (
                        <div className="text-xs text-red-600 font-medium ml-[88px]">
                          ⚠️ Bounced
                        </div>
                      )}
                    </div>

                    {/* Reminder Email - Compact */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 min-w-[80px]">Reminder:</span>
                        <EmailStatusBadge status={participant.reminderEmailStatus} />
                      </div>
                      {participant.reminderEmailOpenedAt && (
                        <div className="text-xs text-gray-500 ml-[88px]">
                          Opened {formatPacificTime(participant.reminderEmailOpenedAt)}
                        </div>
                      )}
                      {participant.reminderEmailStatus === 'Bounced' && (
                        <div className="text-xs text-red-600 font-medium ml-[88px]">
                          ⚠️ Bounced
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">
                    —
                  </div>
                )}
              </td>

              {/* Attendance column */}
              <td className="px-4 py-4 text-center">
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
