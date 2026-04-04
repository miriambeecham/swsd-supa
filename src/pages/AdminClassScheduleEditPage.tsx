// /src/pages/AdminClassScheduleEditPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  Save,
  Ban,
  AlertTriangle,
  CheckCircle,
  Loader2,
  LogOut,
  GraduationCap,
} from 'lucide-react';

interface ClassOption {
  id: string;
  classId: string;
  location: string;
}

interface TeachingAssignment {
  id: string;
  person: {
    name: string;
    email: string;
  };
}

interface ScheduleFields {
  Class: string[];
  Date: string;
  'Start Time New': string;
  'End Time New': string;
  'Available Spots': number | '';
  'Booked Spots': number | '';
  'Booking URL': string;
  'Waiver URL': string;
  'Registration Opens': string;
  'Special Notes': string;
  'Is Cancelled': boolean;
}

const emptyFields: ScheduleFields = {
  Class: [],
  Date: '',
  'Start Time New': '',
  'End Time New': '',
  'Available Spots': '',
  'Booked Spots': '',
  'Booking URL': '',
  'Waiver URL': '',
  'Registration Opens': '',
  'Special Notes': '',
  'Is Cancelled': false,
};

const AdminClassScheduleEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';

  const [fields, setFields] = useState<ScheduleFields>({ ...emptyFields });
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [teachingAssistants, setTeachingAssistants] = useState<TeachingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Check auth
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
      } catch {
        navigate('/admin/login');
      }
    };
    checkAuth();
  }, [navigate]);

  // Fetch class options + existing record if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Always fetch class options
        const classesRes = await fetch('/api/classes');
        const classesData = await classesRes.json();
        const options = (classesData.records || [])
          .filter((c: any) => c.fields['Is Active'])
          .map((c: any) => ({
            id: c.id,
            classId: c.fields['ID'] || '',
            location: c.fields['Location'] || '',
          }))
          .sort((a: ClassOption, b: ClassOption) => a.classId.localeCompare(b.classId));
        setClassOptions(options);

        // If editing, fetch the existing record
        if (!isNew) {
          const scheduleRes = await fetch(`/api/admin/class-schedule-manage?id=${id}`);
          if (!scheduleRes.ok) {
            throw new Error('Failed to fetch schedule');
          }
          const scheduleData = await scheduleRes.json();
          const record = scheduleData.record;

          setFields({
            Class: record.fields.Class || [],
            Date: record.fields.Date || '',
            'Start Time New': formatDatetimeForInput(record.fields['Start Time New']),
            'End Time New': formatDatetimeForInput(record.fields['End Time New']),
            'Available Spots': record.fields['Available Spots'] ?? '',
            'Booked Spots': record.fields['Booked Spots'] ?? '',
            'Booking URL': record.fields['Booking URL'] || '',
            'Waiver URL': record.fields['Waiver URL'] || '',
            'Registration Opens': record.fields['Registration Opens'] || '',
            'Special Notes': record.fields['Special Notes'] || '',
            'Is Cancelled': record.fields['Is Cancelled'] || false,
          });

          // Fetch teaching assistants for this schedule
          try {
            const taRes = await fetch(`/api/admin/teaching-assignments?classScheduleId=${id}`);
            if (taRes.ok) {
              const taData = await taRes.json();
              setTeachingAssistants(taData.assignments || []);
            }
          } catch (taError) {
            console.error('Error fetching teaching assistants:', taError);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isNew]);

  const formatDatetimeForInput = (isoString: string | undefined): string => {
    if (!isoString) return '';
    // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:MM)
    const date = new Date(isoString);
    const pacificDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const year = pacificDate.getFullYear();
    const month = String(pacificDate.getMonth() + 1).padStart(2, '0');
    const day = String(pacificDate.getDate()).padStart(2, '0');
    const hours = String(pacificDate.getHours()).padStart(2, '0');
    const minutes = String(pacificDate.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const convertLocalToISO = (localDatetime: string): string => {
    if (!localDatetime) return '';
    // localDatetime is in format YYYY-MM-DDTHH:MM
    // We need to interpret it as Pacific time and convert to ISO
    const date = new Date(localDatetime);
    return date.toISOString();
  };

  const updateField = (field: keyof ScheduleFields, value: any) => {
    setFields(prev => ({ ...prev, [field]: value }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const validate = (): string | null => {
    if (!fields.Class || fields.Class.length === 0) {
      return 'Class is required.';
    }
    if (!fields.Date) {
      return 'Date is required.';
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Build the fields object for Airtable, only including non-empty values
      const airtableFields: Record<string, any> = {
        Class: fields.Class,
        Date: fields.Date,
      };

      if (fields['Start Time New']) airtableFields['Start Time New'] = convertLocalToISO(fields['Start Time New']);
      if (fields['End Time New']) airtableFields['End Time New'] = convertLocalToISO(fields['End Time New']);
      if (fields['Available Spots'] !== '') airtableFields['Available Spots'] = Number(fields['Available Spots']);
      if (fields['Booking URL']) airtableFields['Booking URL'] = fields['Booking URL'];
      if (fields['Waiver URL']) airtableFields['Waiver URL'] = fields['Waiver URL'];
      if (fields['Registration Opens']) airtableFields['Registration Opens'] = fields['Registration Opens'];
      if (fields['Special Notes']) airtableFields['Special Notes'] = fields['Special Notes'];
      airtableFields['Is Cancelled'] = fields['Is Cancelled'];

      let response;
      if (isNew) {
        response = await fetch('/api/admin/class-schedule-manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: airtableFields }),
        });
      } else {
        response = await fetch('/api/admin/class-schedule-manage', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, fields: airtableFields }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      const data = await response.json();
      setSuccessMessage(isNew ? 'Schedule created successfully!' : 'Schedule updated successfully!');

      if (isNew) {
        // Navigate to edit page for the newly created record
        setTimeout(() => {
          navigate(`/admin/schedules/${data.record.id}/edit`, { replace: true });
        }, 1500);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      setErrorMessage('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/class-schedule-manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          fields: { 'Is Cancelled': true },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel schedule');
      }

      setSuccessMessage('Schedule marked as cancelled.');
      setTimeout(() => {
        navigate('/admin/schedules');
      }, 1500);
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      setErrorMessage('Failed to cancel schedule. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{isNew ? 'Add Class Schedule' : 'Edit Class Schedule'} - Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/schedules')}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNew ? 'Add Class Schedule' : 'Edit Class Schedule'}
              </h1>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Class (Required) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class <span className="text-red-500">*</span>
            </label>
            <select
              value={fields.Class[0] || ''}
              onChange={(e) => updateField('Class', e.target.value ? [e.target.value] : [])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select a class...</option>
              {classOptions.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.classId}{cls.location ? ` — ${cls.location}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date (Required) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={fields.Date}
              onChange={(e) => updateField('Date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Start Time New / End Time New */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={fields['Start Time New']}
                onChange={(e) => updateField('Start Time New', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <p className="mt-1 text-xs text-gray-500">Full date and time</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="datetime-local"
                value={fields['End Time New']}
                onChange={(e) => updateField('End Time New', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <p className="mt-1 text-xs text-gray-500">Full date and time</p>
            </div>
          </div>

          {/* Available Spots / Booked Spots / Remaining Spots */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Spots
              </label>
              <input
                type="number"
                min="0"
                value={fields['Available Spots']}
                onChange={(e) => updateField('Available Spots', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booked Spots <span className="text-gray-400 font-normal">(read-only)</span>
              </label>
              <input
                type="number"
                value={fields['Booked Spots']}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remaining Spots <span className="text-gray-400 font-normal">(read-only)</span>
              </label>
              <input
                type="number"
                value={fields['Available Spots'] !== '' && fields['Booked Spots'] !== '' ? Number(fields['Available Spots']) - Number(fields['Booked Spots']) : ''}
                readOnly
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Registration Opens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration Opens
            </label>
            <input
              type="date"
              value={fields['Registration Opens']}
              onChange={(e) => updateField('Registration Opens', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="mt-1 text-xs text-gray-500 italic">Optional — date when the class will be open for registration if it is not already</p>
          </div>

          {/* Booking URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Booking URL
            </label>
            <input
              type="url"
              value={fields['Booking URL']}
              onChange={(e) => updateField('Booking URL', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <p className="mt-1 text-xs text-gray-500 italic">Optional — URL for third-party registration links</p>
          </div>

          {/* Waiver URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Waiver URL
            </label>
            <input
              type="url"
              value={fields['Waiver URL']}
              onChange={(e) => updateField('Waiver URL', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Special Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Notes
            </label>
            <textarea
              value={fields['Special Notes']}
              onChange={(e) => updateField('Special Notes', e.target.value)}
              rows={3}
              placeholder="Any special notes for this class..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Teaching Assistants (read-only, only shown when editing) */}
          {!isNew && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teaching Assistants <span className="text-gray-400 font-normal">(read-only)</span>
              </label>
              {teachingAssistants.length > 0 ? (
                <div className="space-y-2">
                  {teachingAssistants.map((ta) => (
                    <div key={ta.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                      <GraduationCap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{ta.person?.name || 'Unknown'}</span>
                      {ta.person?.email && (
                        <span className="text-sm text-gray-400">({ta.person.email})</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No teaching assistants assigned</p>
              )}
              <p className="mt-1 text-xs text-gray-500 italic">Manage teaching assistant assignments from the Attendance page</p>
            </div>
          )}

          {/* Is Cancelled */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isCancelled"
              checked={fields['Is Cancelled']}
              onChange={(e) => updateField('Is Cancelled', e.target.checked)}
              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
            />
            <label htmlFor="isCancelled" className="text-sm font-medium text-gray-700">
              Is Cancelled
            </label>
          </div>

          {/* Required fields note */}
          <p className="text-sm text-gray-500">
            <span className="text-red-500">*</span> indicates a required field
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            {!isNew && !fields['Is Cancelled'] && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Ban className="w-4 h-4" />
                Inactivate
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/schedules')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Saving...' : isNew ? 'Create Schedule' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Confirm Inactivation</h3>
            </div>
            {fields['Booked Spots'] !== '' && Number(fields['Booked Spots']) > 0 && (
              <div className="mb-4 flex items-start gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium">
                  This class currently has {fields['Booked Spots']} registered participant{Number(fields['Booked Spots']) !== 1 ? 's' : ''}. Inactivating it may affect their bookings.
                </span>
              </div>
            )}
            <p className="text-gray-600 mb-6">
              Are you sure you want to inactivate this class schedule? The class will be marked as cancelled
              and will no longer appear as active. This can be undone by unchecking "Is Cancelled".
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                No, Keep It
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4" />
                )}
                {deleting ? 'Inactivating...' : 'Yes, Inactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClassScheduleEditPage;
