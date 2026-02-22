// /src/components/admin/TeachingAssistantsTab.tsx
// Teaching Assistants tab - assign TAs to this class
// ✅ UPDATED: Uses Persons + Teaching Assignments tables
// Note: Converting students to TAs is done on the Roster tab

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  X, 
  Check, 
  AlertCircle, 
  Mail, 
  Phone,
  Loader2,
  GraduationCap,
  Trash2,
  Edit2,
  User,
  Heart,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Types
interface Person {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: string[];
  status: 'Active' | 'Inactive';
  notes: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  emergencyContactEmail?: string;
}

interface TeachingAssignment {
  id: string;
  personId: string;
  person: Person | null;
  classScheduleId: string;
  assignmentNotes: string;
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

// TA Form Data Type
interface PersonFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  emergencyContactEmail: string;
}

const emptyFormData: PersonFormData = {
  name: '',
  email: '',
  phone: '',
  notes: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  emergencyContactEmail: ''
};

// Add/Edit Person Modal Component
const PersonModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PersonFormData) => Promise<void>;
  saving: boolean;
  initialData?: PersonFormData;
  mode: 'add' | 'edit';
}> = ({ isOpen, onClose, onSave, saving, initialData, mode }) => {
  const [formData, setFormData] = useState<PersonFormData>(initialData || emptyFormData);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || emptyFormData);
    }
  }, [isOpen, initialData]);

  const handleChange = (field: keyof PersonFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-navy">
            {mode === 'add' ? 'Add New Teaching Assistant' : 'Edit Teaching Assistant'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Basic Information
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                placeholder="Full name"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="email@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                placeholder="Availability, specialties, etc."
              />
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Emergency Contact
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="Emergency contact name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <input
                  type="text"
                  value={formData.emergencyContactRelationship}
                  onChange={(e) => handleChange('emergencyContactRelationship', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="e.g., Spouse, Parent, Friend"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="(555) 555-5555"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.emergencyContactEmail}
                  onChange={(e) => handleChange('emergencyContactEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                  placeholder="emergency@example.com"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {mode === 'add' ? <UserPlus className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  {mode === 'add' ? 'Add TA' : 'Save Changes'}
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
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [allTAPersons, setAllTAPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [selectedPersonToAdd, setSelectedPersonToAdd] = useState<string>('');
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);

  // Fetch assignments and all TA persons on mount
  useEffect(() => {
    fetchData();
  }, [classScheduleId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch teaching assignments for this class (includes person details)
      const assignmentsResponse = await fetch(
        `/api/admin/teaching-assignments?classScheduleId=${classScheduleId}`
      );
      if (!assignmentsResponse.ok) throw new Error('Failed to fetch teaching assignments');
      const assignmentsData = await assignmentsResponse.json();
      setAssignments(assignmentsData.assignments || []);

      // Fetch all persons with "Teaching Assistant" role for the dropdown
      const personsResponse = await fetch('/api/admin/persons?role=Teaching%20Assistant');
      if (!personsResponse.ok) throw new Error('Failed to fetch persons');
      const personsData = await personsResponse.json();
      setAllTAPersons(personsData.persons || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleAssignTA = async () => {
    if (!selectedPersonToAdd) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/teaching-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          personId: selectedPersonToAdd,
          classScheduleId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign TA');
      }
      
      // Refresh data to get the new assignment with person details
      await fetchData();
      
      setSelectedPersonToAdd('');
      showSuccess('Teaching assistant assigned to class');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign TA');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassignTA = async (assignmentId: string) => {
    if (!confirm('Remove this teaching assistant from this class?')) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/teaching-assignments?id=${assignmentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to remove TA');
      
      setAssignments(assignments.filter(a => a.id !== assignmentId));
      showSuccess('Teaching assistant removed from class');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove TA');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePerson = async (formData: PersonFormData) => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          roles: ['Teaching Assistant']
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create person');
      }
      
      const data = await response.json();
      setAllTAPersons([...allTAPersons, data.person]);
      setShowAddModal(false);
      showSuccess(`Teaching assistant "${data.person.name}" created`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create person');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPerson = async (formData: PersonFormData) => {
    if (!editingPerson) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/persons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPerson.id,
          ...formData
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update person');
      }
      
      const data = await response.json();
      
      // Update in allTAPersons
      setAllTAPersons(allTAPersons.map(p => p.id === data.person.id ? data.person : p));
      
      // Update in assignments if present
      setAssignments(assignments.map(a => 
        a.personId === data.person.id 
          ? { ...a, person: data.person }
          : a
      ));
      
      setShowEditModal(false);
      setEditingPerson(null);
      showSuccess(`Teaching assistant "${data.person.name}" updated`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update person');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (person: Person) => {
    setEditingPerson(person);
    setShowEditModal(true);
  };

  // Get available persons (not already assigned to this class)
  const assignedPersonIds = assignments.map(a => a.personId);
  const availablePersons = allTAPersons.filter(
    p => p.status === 'Active' && !assignedPersonIds.includes(p.id)
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
            Teaching Assistants for This Class
          </h3>
          <span className="text-sm text-gray-500">
            {assignments.length} assigned
          </span>
        </div>

        {assignments.length === 0 ? (
          <p className="text-gray-500 text-sm italic mb-4">No teaching assistants assigned to this class yet.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {assignments.map(assignment => {
              const person = assignment.person;
              if (!person) return null;

              return (
                <div 
                  key={assignment.id} 
                  className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                >
                  {/* Main Row */}
                  <div className="flex items-center justify-between p-3">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => setExpandedPersonId(expandedPersonId === person.id ? null : person.id)}
                    >
                      <div className="font-medium text-navy">{person.name}</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                        {person.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {person.email}
                          </span>
                        )}
                        {person.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {person.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedPersonId(expandedPersonId === person.id ? null : person.id)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Show details"
                      >
                        {expandedPersonId === person.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(person)}
                        className="p-2 text-gray-500 hover:text-accent-primary hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit TA"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleUnassignTA(assignment.id)}
                        disabled={saving}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove from class"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedPersonId === person.id && (
                    <div className="px-3 pb-3 border-t border-gray-200 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                        {/* Notes */}
                        {person.notes && (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-gray-500 uppercase mb-1">Notes</p>
                            <p className="text-sm text-gray-700">{person.notes}</p>
                          </div>
                        )}
                        
                        {/* Emergency Contact */}
                        {(person.emergencyContactName || person.emergencyContactPhone || person.emergencyContactEmail) && (
                          <div className="sm:col-span-2 bg-red-50 rounded-lg p-3 border border-red-100">
                            <p className="text-xs text-red-700 uppercase mb-2 font-medium flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              Emergency Contact
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              {person.emergencyContactName && (
                                <div>
                                  <span className="text-gray-500">Name: </span>
                                  <span className="text-gray-900">{person.emergencyContactName}</span>
                                  {person.emergencyContactRelationship && (
                                    <span className="text-gray-500"> ({person.emergencyContactRelationship})</span>
                                  )}
                                </div>
                              )}
                              {person.emergencyContactPhone && (
                                <div>
                                  <span className="text-gray-500">Phone: </span>
                                  <span className="text-gray-900">{person.emergencyContactPhone}</span>
                                </div>
                              )}
                              {person.emergencyContactEmail && (
                                <div>
                                  <span className="text-gray-500">Email: </span>
                                  <span className="text-gray-900">{person.emergencyContactEmail}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* No extra info message */}
                        {!person.notes && !person.emergencyContactName && !person.emergencyContactPhone && !person.emergencyContactEmail && (
                          <p className="text-sm text-gray-400 italic sm:col-span-2">
                            No additional information. Click Edit to add notes or emergency contact.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Existing TA Dropdown */}
        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assign a Teaching Assistant
          </label>
          <div className="flex gap-2">
            <select
              value={selectedPersonToAdd}
              onChange={(e) => setSelectedPersonToAdd(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
            >
              <option value="">Select a teaching assistant...</option>
              {availablePersons.map(person => (
                <option key={person.id} value={person.id}>
                  {person.name}{person.email ? ` (${person.email})` : ''}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignTA}
              disabled={!selectedPersonToAdd || saving}
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

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> To convert a former student to a Teaching Assistant, go to the <strong>Roster</strong> tab of a specific class which they attended as a student, and click the "Add as a potential TA" button next to their name. Their contact info will be copied automatically if they were the one who booked.
        </p>
      </div>

      {/* Add Person Modal */}
      <PersonModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleCreatePerson}
        saving={saving}
        mode="add"
      />

      {/* Edit Person Modal */}
      <PersonModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingPerson(null);
        }}
        onSave={handleEditPerson}
        saving={saving}
        mode="edit"
        initialData={editingPerson ? {
          name: editingPerson.name,
          email: editingPerson.email || '',
          phone: editingPerson.phone || '',
          notes: editingPerson.notes || '',
          emergencyContactName: editingPerson.emergencyContactName || '',
          emergencyContactRelationship: editingPerson.emergencyContactRelationship || '',
          emergencyContactPhone: editingPerson.emergencyContactPhone || '',
          emergencyContactEmail: editingPerson.emergencyContactEmail || ''
        } : undefined}
      />
    </div>
  );
};

export default TeachingAssistantsTab;
