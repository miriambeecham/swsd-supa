// /src/pages/AdminPendingReschedulesPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Calendar,
  LogOut,
  CheckCircle,
  Loader2,
  Users,
  Mail,
  AlertTriangle,
} from 'lucide-react';

// ── Types ──

interface PendingParticipant {
  id: string;
  firstName: string;
  lastName: string;
  ageGroup: string;
}

interface OriginalBookingInfo {
  bookingId: string;
  bookingNumber: number | null;
  scheduleId: string | null;
  classId: string | null;
  className: string;
  classDate: string;
  classStartTime: string;
}

interface PendingReschedule {
  bookingId: string;
  bookingNumber: number | null;
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  rescheduleNotes: string;
  createdAt: string;
  participants: PendingParticipant[];
  originalBooking: OriginalBookingInfo | null;
  assignedClass: any | null;
}

interface UpcomingSchedule {
  id: string;
  classId: string;
  className: string;
  date: string;
  startTime: string;
  availableSpots: number;
}

// ── Helpers ──

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatCreatedDate = (isoString: string) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// ── Main Component ──

const AdminPendingReschedulesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingList, setPendingList] = useState<PendingReschedule[]>([]);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [expandedOriginalClassId, setExpandedOriginalClassId] = useState<string>('');
  const [expandedParticipantCount, setExpandedParticipantCount] = useState(0);
  const [upcomingSchedules, setUpcomingSchedules] = useState<UpcomingSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [capacityWarning, setCapacityWarning] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [toast, setToast] = useState('');
  const [fadingBookingId, setFadingBookingId] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify-session');
        if (!response.ok) { navigate('/admin/login'); return; }
        const data = await response.json();
        if (!data.authenticated) navigate('/admin/login');
      } catch {
        navigate('/admin/login');
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pending-reschedules');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPendingList(data);
    } catch (error) {
      console.error('Error fetching pending reschedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const [schedulesRes, classesRes] = await Promise.all([
        fetch('/api/schedules'),
        fetch('/api/classes'),
      ]);
      if (!schedulesRes.ok || !classesRes.ok) throw new Error('Failed to fetch');

      const schedulesData = await schedulesRes.json();
      const classesData = await classesRes.json();
      const today = new Date().toISOString().split('T')[0];

      const upcoming = schedulesData.records
        .filter((s: any) => {
          if (s.fields['Is Cancelled']) return false;
          if (!s.fields.Date || s.fields.Date < today) return false;
          return true; // Show all future classes, even full ones
        })
        .map((s: any) => {
          const classId = s.fields.Class?.[0];
          const classRecord = classesData.records.find((c: any) => c.id === classId);
          const remaining = (s.fields['Available Spots'] || 0) - (s.fields['Booked Spots'] || 0);
          return {
            id: s.id,
            classId: classId || '',
            className: classRecord?.fields['Class Name'] || 'Unknown Class',
            date: s.fields.Date,
            startTime: s.fields['Start Time New'] || '',
            availableSpots: remaining,
          };
        })
        .sort((a: UpcomingSchedule, b: UpcomingSchedule) => a.date.localeCompare(b.date));

      setUpcomingSchedules(upcoming);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleExpandAssign = (bookingId: string, originalClassId: string, participantCount: number) => {
    if (expandedBookingId === bookingId) {
      setExpandedBookingId(null);
      return;
    }
    setExpandedBookingId(bookingId);
    setExpandedOriginalClassId(originalClassId);
    setExpandedParticipantCount(participantCount);
    setSelectedScheduleId(null);
    setCapacityWarning('');
    setAssignError('');
    fetchUpcomingSchedules();
  };

  const handleScheduleSelect = (val: string | null) => {
    setCapacityWarning('');
    if (val) {
      const selected = upcomingSchedules.find(s => s.id === val);
      // Class type mismatch warning
      if (selected && expandedOriginalClassId && selected.classId !== expandedOriginalClassId) {
        if (!window.confirm(`"${selected.className}" is a different class type than the original. Are you sure you want to assign to this class?`)) {
          return;
        }
      }
      // Capacity warning
      if (selected && selected.availableSpots < expandedParticipantCount) {
        if (selected.availableSpots <= 0) {
          setCapacityWarning(`This class is full. Proceeding will increase the class capacity to accommodate ${expandedParticipantCount} participant(s).`);
        } else {
          setCapacityWarning(`This class only has ${selected.availableSpots} spot(s) available but you're assigning ${expandedParticipantCount} participant(s). Proceeding will increase the class capacity.`);
        }
      }
    }
    setSelectedScheduleId(val);
  };

  const handleConfirmAssign = async (bookingId: string) => {
    if (!selectedScheduleId) return;

    // If capacity warning is showing, confirm before proceeding
    if (capacityWarning) {
      if (!window.confirm('This will exceed the current class capacity. The available spots will be increased automatically. Continue?')) {
        return;
      }
    }

    setAssigning(true);
    setAssignError('');

    try {
      // If we need to increase capacity, do it first
      const selected = upcomingSchedules.find(s => s.id === selectedScheduleId);
      if (selected && selected.availableSpots < expandedParticipantCount) {
        const newCapacity = (selected.availableSpots < 0 ? 0 : selected.availableSpots) + expandedParticipantCount;
        // Fetch current Available Spots to calculate the increase
        const schedRes = await fetch(`/api/admin/class-schedule-manage?id=${selectedScheduleId}`);
        if (schedRes.ok) {
          const schedData = await schedRes.json();
          const currentAvailable = schedData.record?.fields?.['Available Spots'] || 0;
          const needed = expandedParticipantCount - selected.availableSpots;
          await fetch('/api/admin/class-schedule-manage', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: selectedScheduleId,
              fields: { 'Available Spots': currentAvailable + needed },
            }),
          });
        }
      }

      const response = await fetch('/api/admin/assign-reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, newClassScheduleId: selectedScheduleId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Assignment failed');
      }

      setFadingBookingId(bookingId);
      setExpandedBookingId(null);
      setCapacityWarning('');
      setToast('Booking assigned and confirmation email sent');
      setTimeout(() => setToast(''), 4000);

      setTimeout(() => {
        setPendingList(prev => prev.filter(p => p.bookingId !== bookingId));
        setFadingBookingId(null);
      }, 500);
    } catch (error) {
      setAssignError(error instanceof Error ? error.message : 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      navigate('/admin/login');
    } catch {
      console.error('Logout failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block relative w-16 h-16 mb-4">
            <div className="absolute border-4 border-gray-200 rounded-full w-16 h-16"></div>
            <div className="absolute border-4 border-teal-500 border-t-transparent rounded-full w-16 h-16 animate-spin"></div>
          </div>
          <p className="text-gray-600">Loading pending reschedules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Pending Reschedules - Streetwise Self Defense</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">Pending Reschedules</h1>
                <span className="px-2.5 py-0.5 bg-accent-primary text-white text-sm font-medium rounded-full">
                  {pendingList.length}
                </span>
              </div>
              <p className="text-sm text-gray-500">Participants awaiting assignment to a new class</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm">
          <CheckCircle className="w-4 h-4" />
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {pendingList.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-navy mb-2">No pending reschedules</h2>
            <p className="text-gray-500">All participants are assigned to a class.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingList.map(item => (
              <div
                key={item.bookingId}
                className={`bg-white rounded-lg shadow-md overflow-hidden transition-opacity duration-500 ${
                  fadingBookingId === item.bookingId ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className="px-6 py-4">
                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      {item.bookingNumber && (
                        <span className="text-sm font-medium text-gray-500">#{item.bookingNumber}</span>
                      )}
                      <span className="text-sm font-semibold text-navy">
                        {item.contactFirstName} {item.contactLastName}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Mail className="w-3.5 h-3.5" />
                        {item.contactEmail}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      Created {formatCreatedDate(item.createdAt)}
                    </span>
                  </div>

                  {/* Original booking info */}
                  {item.originalBooking && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded mb-3">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>
                        Originally booked for{' '}
                        <span className="font-medium text-gray-700">{item.originalBooking.className}</span>
                        {' '}on {formatDate(item.originalBooking.classDate)}
                      </span>
                    </div>
                  )}

                  {/* Participants — listed vertically */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1.5">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{item.participants.length} participant{item.participants.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="ml-6 space-y-1">
                      {item.participants.map(p => (
                        <div key={p.id} className="text-sm text-gray-700">
                          {p.firstName} {p.lastName}
                          {p.ageGroup && <span className="text-gray-400 ml-1">({p.ageGroup})</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reschedule notes */}
                  {item.rescheduleNotes && (
                    <div className="text-sm text-gray-500 italic bg-gray-50 px-3 py-2 rounded mb-3">
                      {item.rescheduleNotes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2">
                    <button
                      onClick={() => handleExpandAssign(item.bookingId, item.originalBooking?.classId || '', item.participants.length)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary hover:bg-accent-dark text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <Calendar className="w-4 h-4" />
                      {expandedBookingId === item.bookingId ? 'Cancel' : 'Assign to Class'}
                    </button>

                    {item.originalBooking?.scheduleId && (
                      <button
                        onClick={() => navigate(`/admin/attendance?classScheduleId=${item.originalBooking!.scheduleId}`)}
                        className="text-sm text-navy underline hover:text-accent-primary transition-colors"
                      >
                        View Original Booking
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline assignment panel */}
                {expandedBookingId === item.bookingId && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    {loadingSchedules ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-accent-primary" />
                      </div>
                    ) : upcomingSchedules.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">No upcoming classes found.</p>
                    ) : (
                      <div className="space-y-3">
                        <select
                          value={selectedScheduleId || ''}
                          onChange={e => handleScheduleSelect(e.target.value || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary text-sm"
                        >
                          <option value="">Select a class...</option>
                          {(() => {
                            const matching = upcomingSchedules.filter(s => s.classId === expandedOriginalClassId);
                            const other = upcomingSchedules.filter(s => s.classId !== expandedOriginalClassId);
                            return (
                              <>
                                {matching.length > 0 && (
                                  <optgroup label="Same class type">
                                    {matching.map(s => (
                                      <option key={s.id} value={s.id}>
                                        {formatDate(s.date)} — {s.className} ({s.availableSpots > 0 ? `${s.availableSpots} spots` : 'FULL'})
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                                {other.length > 0 && (
                                  <optgroup label="Other classes">
                                    {other.map(s => (
                                      <option key={s.id} value={s.id}>
                                        {formatDate(s.date)} — {s.className} ({s.availableSpots > 0 ? `${s.availableSpots} spots` : 'FULL'})
                                      </option>
                                    ))}
                                  </optgroup>
                                )}
                              </>
                            );
                          })()}
                        </select>

                        {capacityWarning && (
                          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{capacityWarning}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleConfirmAssign(item.bookingId)}
                            disabled={assigning || !selectedScheduleId}
                            className="flex items-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-dark text-white rounded-lg transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                          >
                            {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
                            {assigning ? 'Assigning...' : 'Confirm Assignment'}
                          </button>
                          <button
                            onClick={() => { setExpandedBookingId(null); setCapacityWarning(''); }}
                            className="text-sm text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {assignError && (
                      <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
                        {assignError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPendingReschedulesPage;
