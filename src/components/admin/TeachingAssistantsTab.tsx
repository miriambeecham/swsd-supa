// /src/components/admin/TeachingAssistantsTab.tsx
// Teaching Assistants tab for the AdminAttendancePage

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  X, 
  Check, 
  AlertCircle, 
  Users, 
  Mail, 
  Phone,
  Loader2,
  GraduationCap,
  Trash2
} from 'lucide-react';

// Types
interface TeachingAssistant {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  notes: string;
}

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  isPrimaryContact: boolean;
}

interface TeachingAssistantsTabProps {
  classScheduleId: string;
  roster: Participant[];
}

// Add New TA Modal Component
const AddTAModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (ta: { name: string; email: string; phone: string; notes: string }) => Promise<void>;
  saving: boolean;
}> = ({ isOpen, onClose, onSave, saving }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ name, email, phone, notes });
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-navy">Add New Teaching Assistant</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
              placeholder="Full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
              placeholder="email@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
              placeholder="(555) 555-5555"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
              placeholder="Availability, specialties, etc."
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Add TA
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
const TeachingAssistantsTab: React.FC<TeachingAssistantsTabProps> = ({ 
  classScheduleId, 
  roster 
}) => {
  const [assignedTAs, setAssignedTAs] = useState<TeachingAssistant[]>([]);
  const [allTAs, setAllTAs] = useState<TeachingAssistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTAToAdd, setSelectedTAToAdd] = useState<string>('');
  const [convertingParticipant, setConvertingParticipant] = useState<string | null>(null);
  const [participantTAStatus, setParticipantTAStatus] = useState<Record<string, { isTA: boolean; taId?: string; taName?: string }>>({});

  // Fetch assigned TAs and all TAs on mount
  useEffect(() => {
    fetchData();
  }, [classScheduleId]);

  // Check TA status for all roster participants
  useEffect(() => {
    if (roster.length > 0) {
      checkParticipantTAStatus();
    }
  }, [roster, allTAs]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch TAs assigned to this class
      const assignedResponse = await fetch(
        `/api/admin/class-schedule-assistants-list?classScheduleId=${classScheduleId}`
      );
      if (!assignedResponse.ok) throw new Error('Failed to fetch assigned TAs');
      const assignedData = await assignedResponse.json();
      setAssignedTAs(assignedData.assistants || []);

      // Fetch all TAs for the dropdown
      const allResponse = await fetch('/api/admin/teaching-assistants');
      if (!allResponse.ok) throw new Error('Failed to fetch all TAs');
      const allData = await allResponse.json();
      setAllTAs(allData.assistants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const checkParticipantTAStatus = async () => {
    const statusMap: Record<string, { isTA: boolean; taId?: string; taName?: string }> = {};
    
    for (const participant of roster) {
      // Check if any TA has this participant as source or matches by name
      const fullName = `${participant.firstName} ${participant.lastName}`.toLowerCase();
      const matchingTA = allTAs.find(ta => ta.name.toLowerCase() === fullName);
      
      if (matchingTA) {
        statusMap[participant.id] = { 
          isTA: true, 
          taId: matchingTA.id,
          taName: matchingTA.name 
        };
      } else {
        statusMap[participant.id] = { isTA: false };
      }
    }
    
    setParticipantTAStatus(statusMap);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleAssignTA = async () => {
    if (!selectedTAToAdd) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const newTAIds = [...assignedTAs.map(ta => ta.id), selectedTAToAdd];
      
      const response = await fetch('/api/admin/class-schedule-assistants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          classScheduleId, 
          teachingAssistantIds: newTAIds 
        })
      });
      
      if (!response.ok) throw new Error('Failed to assign TA');
      
      // Add the TA to the assigned list
      const taToAdd = allTAs.find(ta => ta.id === selectedTAToAdd);
      if (taToAdd) {
        setAssignedTAs([...assignedTAs, taToAdd]);
      }
      
      setSelectedTAToAdd('');
      showSuccess('Teaching assistant assigned to class');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign TA');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassignTA = async (taId: string) => {
    if (!confirm('Remove this teaching assistant from this class?')) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const newTAIds = assignedTAs.filter(ta => ta.id !== taId).map(ta => ta.id);
      
      const response = await fetch('/api/admin/class-schedule-assistants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          classScheduleId, 
          teachingAssistantIds: newTAIds 
        })
      });
      
      if (!response.ok) throw new Error('Failed to remove TA');
      
      setAssignedTAs(assignedTAs.filter(ta => ta.id !== taId));
      showSuccess('Teaching assistant removed from class');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove TA');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateTA = async (taData: { name: string; email: string; phone: string; notes: string }) => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/teaching-assistants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create TA');
      }
      
      const data = await response.json();
      setAllTAs([...allTAs, data.assistant]);
      setShowAddModal(false);
      showSuccess(`Teaching assistant "${data.assistant.name}" created`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create TA');
    } finally {
      setSaving(false);
    }
  };

  const handleConvertParticipant = async (participantId: string) => {
    setConvertingParticipant(participantId);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/teaching-assistants/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.existingTA) {
          throw new Error(`${errorData.error}: ${errorData.existingTA.name}`);
        }
        throw new Error(errorData.error || 'Failed to convert participant');
      }
      
      const data = await response.json();
      
      // Add to all TAs list
      setAllTAs([...allTAs, data.assistant]);
      
      // Update participant status
      setParticipantTAStatus(prev => ({
        ...prev,
        [participantId]: { 
          isTA: true, 
          taId: data.assistant.id,
          taName: data.assistant.name 
        }
      }));
      
      const contactInfo = data.contactInfoCopied ? ' (email & phone copied)' : ' (no contact info available)';
      showSuccess(`Converted to teaching assistant${contactInfo}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert participant');
    } finally {
      setConvertingParticipant(null);
    }
  };

  // Get available TAs (not already assigned)
  const availableTAs = allTAs.filter(
    ta => ta.status === 'Active' && !assignedTAs.some(assigned => assigned.id === ta.id)
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading teaching assistants...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
          <button 
            onClick={() => setError(null)} 
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Assigned TAs Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-navy flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Assigned to This Class
          </h3>
          <span className="text-sm text-gray-500">
            {assignedTAs.length} assistant{assignedTAs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {assignedTAs.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No teaching assistants assigned to this class yet.</p>
        ) : (
          <div className="space-y-3">
            {assignedTAs.map(ta => (
              <div 
                key={ta.id} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <div className="font-medium text-navy">{ta.name}</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                    {ta.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {ta.email}
                      </span>
                    )}
                    {ta.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {ta.phone}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleUnassignTA(ta.id)}
                  disabled={saving}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Remove from class"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Existing TA Dropdown */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Existing Teaching Assistant
          </label>
          <div className="flex gap-2">
            <select
              value={selectedTAToAdd}
              onChange={(e) => setSelectedTAToAdd(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
            >
              <option value="">Select a teaching assistant...</option>
              {availableTAs.map(ta => (
                <option key={ta.id} value={ta.id}>
                  {ta.name}{ta.email ? ` (${ta.email})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignTA}
              disabled={!selectedTAToAdd || saving}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Assign
            </button>
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-3 text-sm text-accent-primary hover:text-accent-dark flex items-center gap-1"
          >
            <UserPlus className="w-4 h-4" />
            Or create a new teaching assistant
          </button>
        </div>
      </div>

      {/* Convert from Roster Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-navy flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          Convert Student to Teaching Assistant
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Click "Convert to TA" next to any student to add them as a teaching assistant. 
          If they booked for themselves, their email and phone will be copied automatically.
        </p>

        {roster.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No students in the roster.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Name</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Primary Contact</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {roster.map(participant => {
                  const taStatus = participantTAStatus[participant.id];
                  const isConverting = convertingParticipant === participant.id;
                  
                  return (
                    <tr key={participant.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3">
                        {participant.firstName} {participant.lastName}
                      </td>
                      <td className="py-2 px-3">
                        {participant.isPrimaryContact && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Yes
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {taStatus?.isTA ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                            <Check className="w-3 h-3" />
                            Already a TA
                          </span>
                        ) : (
                          <button
                            onClick={() => handleConvertParticipant(participant.id)}
                            disabled={isConverting}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-accent-primary text-white rounded hover:bg-accent-dark transition-colors disabled:bg-gray-400"
                          >
                            {isConverting ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Converting...
                              </>
                            ) : (
                              <>
                                <GraduationCap className="w-3 h-3" />
                                Convert to TA
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add TA Modal */}
      <AddTAModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleCreateTA}
        saving={saving}
      />
    </div>
  );
};

export default TeachingAssistantsTab;
