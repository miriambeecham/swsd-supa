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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allClasses, setAllClasses] = useState<ClassSchedule[]>([]);
  const [currentClassId, setCurrentClassId] = useState<string>('');
  const [rosterData, setRosterData] = useState<RosterData | null>(null);
  const [attendanceState, setAttendanceState] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  // Fetch all class schedules
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        // Fetch both schedules and classes
        const [schedulesResponse, classesResponse] = await Promise.all([
          fetch('/api/schedules'),
          fetch('/api/classes')
        ]);
        
        if (!schedulesResponse.ok || !classesResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const schedulesData = await schedulesResponse.json();
        const classesData = await classesResponse.json();
        
        // Filter to only upcoming/recent classes and match with class names
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
        
        // Set first class as default
        if (filtered.length > 0) {
          setCurrentClassId(filtered[0].id);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Fetch roster when class changes
  useEffect(() => {
    if (!currentClassId) return;

    const fetchRoster = async () => {
      try {
        const response = await fetch(`/api/admin/class-roster?classScheduleId=${currentClassId}`);
        if (!response.ok) throw new Error('Failed to fetch roster');
        
        const data = await response.json();
        setRosterData(data);
        
        // Initialize attendance state from existing data
        const initialState: Record<string, string> = {};
        data.roster.forEach((participant: Participant) => {
          initialState[participant.id] = participant.attendance;
        });
        setAttendanceState(initialState);
      } catch (error) {
        console.error('Error fetching roster:', error);
      }
    };

    fetchRoster();
  }, [currentClassId]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handlePreviousClass = () => {
    const currentIndex = allClasses.findIndex(c => c.id === currentClassId);
    if (currentIndex > 0) {
      setCurrentClassId(allClasses[currentIndex - 1].id);
    }
  };

  const handleNextClass = () => {
    const currentIndex = allClasses.findIndex(c => c.id === currentClassId);
    if (currentIndex < allClasses.length - 1) {
      setCurrentClassId(allClasses[currentIndex + 1].id);
    }
  };

  const handleAttendanceChange = (participantId: string, value: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [participantId]: value
    }));
  };

  const handleRecordNoAbsences = () => {
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
      // Auto-mark "Not Recorded" as "Present" when saving
      const attendanceRecords = Object.entries(attendanceState).map(([participantId, attendance]) => ({
        participantId,
        attendance: attendance === 'Not Recorded' ? 'Present' : attendance
      }));

      // Update local state to reflect the auto-marking
      const updatedState = { ...attendanceState };
      Object.keys(updatedState).forEach(id => {
        if (updatedState[id] === 'Not Recorded') {
          updatedState[id] = 'Present';
        }
      });
      setAttendanceState(updatedState);

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

  const handleDownloadCSV = () => {
    if (!rosterData) return;

    const headers = ['Last Name', 'First Name', 'Age Group', 'Attendance', 'Contact Email', 'Contact Phone'];
    const rows = rosterData.roster.map(p => [
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
              onChange={(e) => setCurrentClassId(e.target.value)}
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
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={handleRecordNoAbsences}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Record No Absences
              </button>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                Download CSV
              </button>
              <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ml-auto ${
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
                    {rosterData.roster.map((participant) => {
                      const currentStatus = attendanceState[participant.id] || 'Not Recorded';
                      const rowColor = 
                        currentStatus === 'Absent' ? 'bg-red-50' :
                        currentStatus === 'Present' ? 'bg-green-50' :
                        '';

                      return (
                        <tr key={participant.id} className={rowColor}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {participant.lastName}, {participant.firstName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {participant.ageGroup}
                            </span>
                          </td>
                          <td className="px-6 py-4">
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
