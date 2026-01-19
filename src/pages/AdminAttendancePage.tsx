// /src/pages/AdminAttendancePage.tsx
// ✅ REDESIGNED: Summary cards + tabbed interface (Roster | Communications | Surveys)
// ✅ Sticky table headers, "No Consent Recorded" wording, Survey tracking
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import TeachingAssistantsTab from '../components/admin/TeachingAssistantsTab';
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
  Check,
  Upload,
  MessageSquare,
  ClipboardList,
  Star,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  X
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

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
  smsOptedOutDate?: string;
  smsConsentDate?: string;
  bookingId: string;
  bookingNumber?: number;
  isPrimaryContact: boolean;
  bookingDate?: string;
  // Email tracking
  confirmationEmailStatus?: string;
  confirmationEmailSentAt?: string;
  confirmationEmailDeliveredAt?: string;
  confirmationEmailClickedAt?: string;
  reminderEmailStatus?: string;
  reminderEmailSentAt?: string;
  reminderEmailDeliveredAt?: string;
  reminderEmailClickedAt?: string;
  followupEmailStatus?: string;
  followupEmailSentAt?: string;
  followupEmailClickedAt?: string;
  // SMS tracking
  reminderSmsStatus?: string;
  reminderSmsSentAt?: string;
  reminderSmsDeliveredAt?: string;
  preclassSmsStatus?: string;
  preclassSmsSentAt?: string;
  preclassSmsDeliveredAt?: string;
}

interface SurveyResponse {
  id: string;
  submissionDate?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  overallExperience?: string;
  confidenceLevel?: string;
  mostValuable?: string;
  areasForImprovement?: string;
  wouldRecommend?: string;
  optInCommunication?: string;
  willingToShare?: string;
  writtenTestimonial?: string;
  reviewPlatformClicked?: string;
  preferredContactMethod?: string[];
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
  surveyResponses?: SurveyResponse[];
  totalParticipants: number;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatPacificTimeShort = (isoTimestamp?: string): string | null => {
  if (!isoTimestamp) return null;
  return new Date(isoTimestamp).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatScheduleDateTime = (date: Date): string => {
  return date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
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

// Normalize phone number for comparison
const normalizePhone = (phone?: string): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
};

// ============================================
// SUMMARY CARDS COMPONENT
// ============================================

interface SummaryCardsProps {
  roster: Participant[];
  attendanceState: Record<string, string>;
  surveyResponses: SurveyResponse[];
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ roster, attendanceState, surveyResponses }) => {
  const primaryContacts = roster.filter(p => p.isPrimaryContact);
  
  // Attendance counts
  const presentCount = Object.values(attendanceState).filter(s => s === 'Present').length;
  const absentCount = Object.values(attendanceState).filter(s => s === 'Absent').length;
  const notRecordedCount = Object.values(attendanceState).filter(s => s === 'Not Recorded' || !s).length;
  
  // Email counts
  const emailDelivered = primaryContacts.filter(p => 
    p.reminderEmailStatus === 'Delivered' || 
    p.reminderEmailStatus === 'Opened' || 
    p.reminderEmailStatus === 'Clicked'
  ).length;
  const emailClicked = primaryContacts.filter(p => p.reminderEmailClickedAt).length;
  const emailBounced = primaryContacts.filter(p => 
    p.confirmationEmailStatus === 'Bounced' || 
    p.reminderEmailStatus === 'Bounced'
  ).length;
  
  // SMS counts
  const smsWithConsent = primaryContacts.filter(p => p.smsConsentDate && !p.smsOptedOutDate).length;
  const smsNoConsent = primaryContacts.filter(p => !p.smsConsentDate && !p.smsOptedOutDate).length;
  const smsOptedOut = primaryContacts.filter(p => p.smsOptedOutDate).length;
  const smsSent = primaryContacts.filter(p => p.reminderSmsStatus || p.preclassSmsStatus).length;

  // Survey counts - count all surveys for this class
  const surveyCompleted = surveyResponses.length;
  const followupSent = primaryContacts.filter(p => p.followupEmailSentAt).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Participants Card */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <Users className="w-5 h-5 text-accent-primary" />
          <span className="text-sm font-medium">Participants</span>
        </div>
        <div className="text-3xl font-bold text-navy">{roster.length}</div>
        <div className="text-xs text-gray-500 mt-1">
          {primaryContacts.length} booking{primaryContacts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Attendance Card */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium">Attendance</span>
        </div>
        <div className="text-3xl font-bold text-navy">{presentCount}</div>
        <div className="text-xs text-gray-500 mt-1 space-x-2">
          <span className="text-red-600">{absentCount} absent</span>
          <span>·</span>
          <span>{notRecordedCount} pending</span>
        </div>
      </div>

      {/* Communications Card */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <Mail className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium">Communications</span>
        </div>
        <div className="text-3xl font-bold text-navy">{emailClicked}</div>
        <div className="text-xs text-gray-500 mt-1 space-x-2">
          <span>clicked reminder</span>
          {emailBounced > 0 && (
            <>
              <span>·</span>
              <span className="text-red-600">{emailBounced} bounced</span>
            </>
          )}
        </div>
      </div>

      {/* Surveys Card */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <ClipboardList className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium">Surveys</span>
        </div>
        <div className="text-3xl font-bold text-navy">{surveyCompleted}</div>
        <div className="text-xs text-gray-500 mt-1">
          of {followupSent} sent
        </div>
      </div>
    </div>
  );
};

// ============================================
// ROSTER TAB COMPONENT
// ============================================

interface RosterTabProps {
  roster: Participant[];
  attendanceState: Record<string, string>;
  onAttendanceChange: (participantId: string, value: string) => void;
  copiedField: string | null;
  onCopy: (text: string, fieldId: string) => void;
  onParticipantConvertedToTA?: () => void; // Callback to refresh TA data
}

const RosterTab: React.FC<RosterTabProps> = ({ 
  roster, 
  attendanceState, 
  onAttendanceChange,
  copiedField,
  onCopy,
  onParticipantConvertedToTA
}) => {
  const [convertingParticipant, setConvertingParticipant] = useState<string | null>(null);
  const [participantTAStatus, setParticipantTAStatus] = useState<Record<string, { isTA: boolean; taName?: string }>>({});
  const [conversionMessage, setConversionMessage] = useState<{ participantId: string; message: string; type: 'success' | 'error' } | null>(null);

  // Check TA status for all participants on mount
  useEffect(() => {
    const checkAllParticipantTAStatus = async () => {
      try {
        // Fetch all TAs once
        const response = await fetch('/api/admin/teaching-assistants');
        if (!response.ok) return;
        
        const data = await response.json();
        const allTAs = data.assistants || [];
        
        // Build status map by matching names
        const statusMap: Record<string, { isTA: boolean; taName?: string }> = {};
        
        for (const participant of roster) {
          const fullName = `${participant.firstName} ${participant.lastName}`.toLowerCase().trim();
          const matchingTA = allTAs.find((ta: any) => ta.name.toLowerCase().trim() === fullName);
          
          if (matchingTA) {
            statusMap[participant.id] = { isTA: true, taName: matchingTA.name };
          } else {
            statusMap[participant.id] = { isTA: false };
          }
        }
        
        setParticipantTAStatus(statusMap);
      } catch (error) {
        console.error('Error checking TA status:', error);
      }
    };
    
    if (roster.length > 0) {
      checkAllParticipantTAStatus();
    }
  }, [roster]);

  const handleConvertToTA = async (participantId: string) => {
    setConvertingParticipant(participantId);
    setConversionMessage(null);
    
    try {
      const response = await fetch('/api/admin/teaching-assistants/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.existingTA) {
          throw new Error(`Already exists: ${data.existingTA.name}`);
        }
        throw new Error(data.error || 'Failed to convert');
      }
      
      // Update local status
      setParticipantTAStatus(prev => ({
        ...prev,
        [participantId]: { isTA: true, taName: data.assistant.name }
      }));
      
      const contactInfo = data.contactInfoCopied ? ' (contact info copied)' : '';
      setConversionMessage({
        participantId,
        message: `Converted to TA${contactInfo}`,
        type: 'success'
      });
      
      // Clear message after 3 seconds
      setTimeout(() => setConversionMessage(null), 3000);
      
      // Notify parent to refresh TA data if needed
      if (onParticipantConvertedToTA) {
        onParticipantConvertedToTA();
      }
      
    } catch (error) {
      setConversionMessage({
        participantId,
        message: error instanceof Error ? error.message : 'Failed to convert',
        type: 'error'
      });
      setTimeout(() => setConversionMessage(null), 4000);
    } finally {
      setConvertingParticipant(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Age Group
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Contact
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Attendance
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                TA
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white">
            {roster.map((participant, index) => {
              const currentStatus = attendanceState[participant.id] || 'Not Recorded';
              const rowColor = 
                currentStatus === 'Absent' ? 'bg-red-50' :
                currentStatus === 'Present' ? 'bg-green-50' :
                '';

              const isNewBookingGroup = index === 0 || 
                roster[index - 1].bookingId !== participant.bookingId;

              const taStatus = participantTAStatus[participant.id];
              const isConverting = convertingParticipant === participant.id;
              const messageForThis = conversionMessage?.participantId === participant.id ? conversionMessage : null;

              return (
                <tr 
                  key={participant.id} 
                  className={`
                    ${rowColor} 
                    ${isNewBookingGroup ? 'border-t-4 border-gray-600' : 'border-t border-gray-200'}
                  `}
                >
                  {/* Name column */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
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
                      
                      {!participant.isPrimaryContact && (
                        <span className="text-gray-400 text-sm mr-2">└─</span>
                      )}
                      
                      <div className="text-sm font-medium text-gray-900">
                        {participant.firstName} {participant.lastName}
                      </div>
                    </div>
                  </td>

                  {/* Age Group column */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {participant.ageGroup}
                    </span>
                  </td>

                  {/* Contact column */}
                  <td className="px-4 py-3">
                    {participant.isPrimaryContact ? (
                      <div className="space-y-1">
                        {participant.contactEmail && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate max-w-[180px]">{participant.contactEmail}</span>
                            <button
                              onClick={() => onCopy(participant.contactEmail, `email-${participant.id}`)}
                              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                              title="Copy email"
                            >
                              {copiedField === `email-${participant.id}` ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                        {participant.contactPhone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{participant.contactPhone}</span>
                            {participant.smsOptedOutDate ? (
                              <span 
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700" 
                                title="Opted out of SMS"
                              >
                                🚫
                              </span>
                            ) : !participant.smsConsentDate ? (
                              <span 
                                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700" 
                                title="No SMS consent recorded"
                              >
                                ⚠️
                              </span>
                            ) : null}
                            <button
                              onClick={() => onCopy(participant.contactPhone, `phone-${participant.id}`)}
                              className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                              title="Copy phone"
                            >
                              {copiedField === `phone-${participant.id}` ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">—</div>
                    )}
                  </td>

                  {/* Attendance column */}
                  <td className="px-4 py-3 text-center">
                    <select
                      value={currentStatus}
                      onChange={(e) => onAttendanceChange(participant.id, e.target.value)}
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

                  {/* TA column */}
                  <td className="px-4 py-3 text-center">
                    {messageForThis ? (
                      <span className={`text-xs ${messageForThis.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {messageForThis.message}
                      </span>
                    ) : taStatus?.isTA ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                        <Check className="w-3 h-3" />
                        TA
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConvertToTA(participant.id)}
                        disabled={isConverting}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                        title="Convert to Teaching Assistant"
                      >
                        {isConverting ? (
                          <span className="animate-pulse">...</span>
                        ) : (
                          <>
                            <GraduationCap className="w-3 h-3" />
                            Convert
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

      {roster.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No participants registered for this class yet
        </div>
      )}
    </div>
  );
};

// ============================================
// COMMUNICATIONS TAB COMPONENT
// ============================================

interface CommunicationsTabProps {
  roster: Participant[];
  classDate: string;
}

const CommunicationsTab: React.FC<CommunicationsTabProps> = ({ roster, classDate }) => {
  const primaryContacts = roster.filter(p => p.isPrimaryContact);
  
  const scheduledTimes = useMemo(() => {
    const [year, month, day] = classDate.split('-').map(Number);
    const now = new Date();
    
    const reminderEmail = new Date(year, month - 1, day - 1, 10, 0, 0);
    const afternoonSms = new Date(year, month - 1, day - 1, 15, 0, 0);
    const preclassSms = new Date(year, month - 1, day, 8, 0, 0);
    const followupEmail = new Date(year, month - 1, day + 1, 10, 0, 0);

    return {
      reminderEmail: { date: reminderEmail, isPast: reminderEmail < now },
      afternoonSms: { date: afternoonSms, isPast: afternoonSms < now },
      preclassSms: { date: preclassSms, isPast: preclassSms < now },
      followupEmail: { date: followupEmail, isPast: followupEmail < now }
    };
  }, [classDate]);

  const renderCommCell = (
    status: string | undefined,
    sentAt: string | undefined,
    deliveredAt: string | undefined,
    clickedAt: string | undefined,
    scheduledDate: Date,
    isPast: boolean,
    isConditional: boolean = false
  ) => {
    if (status === 'no-consent') {
      return <span className="text-yellow-600 text-xs">⚠️ No Consent</span>;
    }
    if (status === 'opted-out') {
      return <span className="text-red-600 text-xs">🚫 Opted Out</span>;
    }
    
    if (sentAt || status) {
      const displayStatus = status || 'Sent';
      const displayTime = clickedAt || deliveredAt || sentAt;
      
      let statusColor = 'text-gray-600';
      let icon = '📧';
      
      if (displayStatus === 'Delivered') {
        statusColor = 'text-green-600';
        icon = '🟢';
      } else if (displayStatus === 'Clicked' || clickedAt) {
        statusColor = 'text-blue-600';
        icon = '✅';
      } else if (displayStatus === 'Bounced' || displayStatus === 'Failed' || displayStatus === 'Undelivered') {
        statusColor = 'text-red-600';
        icon = '❌';
      }
      
      return (
        <div className={`text-xs ${statusColor}`}>
          <span>{icon} {formatPacificTimeShort(displayTime)}</span>
        </div>
      );
    }
    
    if (!isPast) {
      return (
        <span className="text-xs text-gray-500 italic">
          {formatScheduleDateTime(scheduledDate)}{isConditional ? '?' : ''}
        </span>
      );
    }
    
    return <span className="text-xs text-gray-400">—</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Booking
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Contact
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Confirmation
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Reminder Email
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Follow-up Email
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Afternoon SMS
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Pre-class SMS
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {primaryContacts.map((participant) => {
              const hasSmsConsent = !!participant.smsConsentDate;
              const hasOptedOut = !!participant.smsOptedOutDate;
              const canReceiveSms = hasSmsConsent && !hasOptedOut;
              const hasClickedReminderEmail = !!participant.reminderEmailClickedAt;
              
              return (
                <tr key={participant.id}>
                  <td className="px-3 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      #{participant.bookingNumber}
                    </div>
                    <div className="text-xs text-gray-500">
                      {participant.firstName} {participant.lastName}
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <div className="text-xs text-gray-600 truncate max-w-[150px]">
                      {participant.contactEmail}
                    </div>
                    <div className="text-xs text-gray-500">
                      {participant.contactPhone}
                    </div>
                  </td>

                  <td className="px-3 py-3 text-center">
                    {renderCommCell(
                      participant.confirmationEmailStatus,
                      participant.confirmationEmailSentAt,
                      participant.confirmationEmailDeliveredAt,
                      participant.confirmationEmailClickedAt,
                      new Date(),
                      true,
                      false
                    )}
                  </td>

                  <td className="px-3 py-3 text-center">
                    {renderCommCell(
                      participant.reminderEmailStatus,
                      participant.reminderEmailSentAt,
                      participant.reminderEmailDeliveredAt,
                      participant.reminderEmailClickedAt,
                      scheduledTimes.reminderEmail.date,
                      scheduledTimes.reminderEmail.isPast,
                      false
                    )}
                  </td>

                  <td className="px-3 py-3 text-center">
                    {renderCommCell(
                      participant.followupEmailStatus,
                      participant.followupEmailSentAt,
                      undefined,
                      participant.followupEmailClickedAt,
                      scheduledTimes.followupEmail.date,
                      scheduledTimes.followupEmail.isPast,
                      false
                    )}
                  </td>

                  <td className="px-3 py-3 text-center">
                    {!canReceiveSms ? (
                      hasOptedOut ? (
                        <span className="text-red-600 text-xs">🚫 Opted Out</span>
                      ) : (
                        <span className="text-yellow-600 text-xs" title="No SMS consent recorded">⚠️ None</span>
                      )
                    ) : (
                      renderCommCell(
                        participant.reminderSmsStatus,
                        participant.reminderSmsSentAt,
                        participant.reminderSmsDeliveredAt,
                        undefined,
                        scheduledTimes.afternoonSms.date,
                        scheduledTimes.afternoonSms.isPast,
                        true
                      )
                    )}
                  </td>

                  <td className="px-3 py-3 text-center">
                    {!canReceiveSms ? (
                      hasOptedOut ? (
                        <span className="text-red-600 text-xs">🚫 Opted Out</span>
                      ) : (
                        <span className="text-yellow-600 text-xs" title="No SMS consent recorded">⚠️ None</span>
                      )
                    ) : (
                      renderCommCell(
                        participant.preclassSmsStatus,
                        participant.preclassSmsSentAt,
                        participant.preclassSmsDeliveredAt,
                        undefined,
                        scheduledTimes.preclassSms.date,
                        scheduledTimes.preclassSms.isPast,
                        false
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {primaryContacts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No bookings for this class yet
        </div>
      )}
      
      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <span>🟢 Delivered</span>
          <span>✅ Clicked</span>
          <span>❌ Failed</span>
          <span><span className="inline-flex items-center px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">⚠️ None</span> No SMS consent</span>
          <span><span className="inline-flex items-center px-1.5 py-0.5 rounded bg-red-100 text-red-700">🚫</span> SMS opted out</span>
          <span><span className="italic">Italic</span> = Scheduled</span>
          <span><span className="italic">?</span> = Conditional</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SURVEYS TAB COMPONENT
// ============================================

interface SurveysTabProps {
  roster: Participant[];
  surveyResponses: SurveyResponse[];
  classDate: string;
}

const SurveysTab: React.FC<SurveysTabProps> = ({ roster, surveyResponses, classDate }) => {
  const [expandedSurveyId, setExpandedSurveyId] = useState<string | null>(null);
  const primaryContacts = roster.filter(p => p.isPrimaryContact);
  
  // Calculate if follow-up should have been sent
  const [year, month, day] = classDate.split('-').map(Number);
  const followupDate = new Date(year, month - 1, day + 1, 10, 0, 0);
  const isPastFollowup = followupDate < new Date();

  // Track which surveys have been matched
  const matchedSurveyIds = new Set<string>();

  // Match surveys to participants
  const participantSurveyData = primaryContacts.map(participant => {
    // Try to match survey by email, then phone, then name
    const matchedSurvey = surveyResponses.find(survey => {
      if (survey.email && participant.contactEmail && 
          survey.email.toLowerCase() === participant.contactEmail.toLowerCase()) {
        return true;
      }
      if (survey.phone && participant.contactPhone && 
          normalizePhone(survey.phone) === normalizePhone(participant.contactPhone)) {
        return true;
      }
      if (survey.firstName && survey.lastName && 
          survey.firstName.toLowerCase() === participant.firstName?.toLowerCase() &&
          survey.lastName.toLowerCase() === participant.lastName?.toLowerCase()) {
        return true;
      }
      return false;
    });

    // Track matched survey
    if (matchedSurvey) {
      matchedSurveyIds.add(matchedSurvey.id);
    }

    // Determine status
    let status: 'completed' | 'sent' | 'not-sent' = 'not-sent';
    if (matchedSurvey) {
      status = 'completed';
    } else if (participant.followupEmailSentAt) {
      status = 'sent';
    }

    return {
      participant,
      survey: matchedSurvey,
      status
    };
  });

  // Find unmatched surveys
  const unmatchedSurveys = surveyResponses.filter(survey => !matchedSurveyIds.has(survey.id));

  const getRatingDisplay = (rating?: string) => {
    if (!rating) return '—';
    
    const ratingMap: Record<string, { stars: number; color: string }> = {
      'Excellent': { stars: 5, color: 'text-green-600' },
      'Good': { stars: 4, color: 'text-green-500' },
      'Neutral': { stars: 3, color: 'text-yellow-500' },
      'Poor': { stars: 2, color: 'text-orange-500' },
      'Very Poor': { stars: 1, color: 'text-red-500' }
    };
    
    const ratingInfo = ratingMap[rating];
    if (!ratingInfo) return rating;
    
    return (
      <div className={`flex items-center gap-1 ${ratingInfo.color}`}>
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-3 h-3 ${i < ratingInfo.stars ? 'fill-current' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Booking
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Rating
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Recommend
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Review Volunteer
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                Details
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {participantSurveyData.map(({ participant, survey, status }) => (
              <React.Fragment key={participant.id}>
                <tr className={expandedSurveyId === survey?.id ? 'bg-purple-50' : ''}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      #{participant.bookingNumber}
                    </div>
                    <div className="text-xs text-gray-500">
                      {participant.firstName} {participant.lastName}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    {status === 'completed' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        ✅ Completed
                      </span>
                    )}
                    {status === 'sent' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        📧 Sent
                      </span>
                    )}
                    {status === 'not-sent' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {isPastFollowup ? '—' : '⏳ Not Yet Sent'}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {status === 'completed' ? getRatingDisplay(survey?.overallExperience) : '—'}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {status === 'completed' && survey?.wouldRecommend ? (
                      survey.wouldRecommend === 'Yes' ? (
                        <span className="text-green-600 text-sm font-medium">👍 Yes</span>
                      ) : (
                        <span className="text-red-600 text-sm font-medium">👎 No</span>
                      )
                    ) : '—'}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {status === 'completed' && survey?.willingToShare ? (
                      survey.willingToShare === 'Google/Yelp Review' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          ⭐ Google/Yelp
                        </span>
                      ) : survey.willingToShare === 'Write Here' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          ✍️ Written
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Private</span>
                      )
                    ) : '—'}
                  </td>

                  <td className="px-4 py-3 text-center">
                    {status === 'completed' && survey ? (
                      <button
                        onClick={() => setExpandedSurveyId(
                          expandedSurveyId === survey.id ? null : survey.id
                        )}
                        className="text-accent-primary hover:text-accent-dark transition-colors"
                      >
                        {expandedSurveyId === survey.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    ) : '—'}
                  </td>
                </tr>

                {/* Expanded Survey Details */}
                {expandedSurveyId === survey?.id && survey && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 bg-purple-50">
                      <div className="rounded-lg bg-white p-4 shadow-inner">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-semibold text-navy">Survey Response Details</h4>
                          <button
                            onClick={() => setExpandedSurveyId(null)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Submitted</p>
                            <p className="text-gray-900">{formatPacificTimeShort(survey.submissionDate) || 'Unknown'}</p>
                          </div>
                          
                          <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Confidence Level</p>
                            <p className="text-gray-900">{survey.confidenceLevel || '—'}</p>
                          </div>
                          
                          {survey.mostValuable && (
                            <div className="md:col-span-2">
                              <p className="text-gray-500 text-xs uppercase mb-1">Most Valuable Part</p>
                              <p className="text-gray-900 bg-gray-50 p-2 rounded">{survey.mostValuable}</p>
                            </div>
                          )}
                          
                          {survey.areasForImprovement && (
                            <div className="md:col-span-2">
                              <p className="text-gray-500 text-xs uppercase mb-1">Areas for Improvement</p>
                              <p className="text-gray-900 bg-gray-50 p-2 rounded">{survey.areasForImprovement}</p>
                            </div>
                          )}
                          
                          {survey.writtenTestimonial && (
                            <div className="md:col-span-2">
                              <p className="text-gray-500 text-xs uppercase mb-1">Written Testimonial</p>
                              <p className="text-gray-900 bg-blue-50 p-3 rounded border border-blue-200 italic">
                                "{survey.writtenTestimonial}"
                              </p>
                            </div>
                          )}
                          
                          <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Opt-in to Communications</p>
                            <p className="text-gray-900">{survey.optInCommunication || '—'}</p>
                          </div>
                          
                          {survey.reviewPlatformClicked && (
                            <div>
                              <p className="text-gray-500 text-xs uppercase mb-1">Review Platform Clicked</p>
                              <p className="text-gray-900">{survey.reviewPlatformClicked}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {primaryContacts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No bookings for this class yet
        </div>
      )}
      
      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <span><span className="text-green-600">✅</span> Completed survey</span>
          <span><span className="text-yellow-600">📧</span> Follow-up sent, awaiting response</span>
          <span><span className="text-gray-500">⏳</span> Follow-up not yet sent</span>
        </div>
      </div>

      {/* Unmatched Surveys Section */}
      {unmatchedSurveys.length > 0 && (
        <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
            ⚠️ Unmatched Surveys ({unmatchedSurveys.length})
          </h4>
          <p className="text-xs text-orange-700 mb-3">
            These surveys are linked to this class but couldn't be matched to a booking by email, phone, or name.
          </p>
          <div className="space-y-2">
            {unmatchedSurveys.map(survey => (
              <div key={survey.id} className={`bg-white rounded border ${expandedSurveyId === survey.id ? 'border-orange-400' : 'border-orange-200'}`}>
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">
                        {survey.firstName} {survey.lastName || '(no name)'}
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5">
                        {survey.email && <div>📧 {survey.email}</div>}
                        {survey.phone && <div>📱 {survey.phone}</div>}
                        <div>Submitted: {formatPacificTimeShort(survey.submissionDate)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm">{getRatingDisplay(survey.overallExperience)}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {survey.wouldRecommend === 'Yes' ? '👍 Would recommend' : survey.wouldRecommend === 'No' ? '👎 Would not recommend' : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedSurveyId(
                          expandedSurveyId === survey.id ? null : survey.id
                        )}
                        className="text-accent-primary hover:text-accent-dark transition-colors"
                      >
                        {expandedSurveyId === survey.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedSurveyId === survey.id && (
                  <div className="px-3 pb-3 border-t border-orange-200">
                    <div className="rounded-lg bg-gray-50 p-4 mt-3">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-semibold text-navy">Survey Response Details</h4>
                        <button
                          onClick={() => setExpandedSurveyId(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs uppercase mb-1">Submitted</p>
                          <p className="text-gray-900">{formatPacificTimeShort(survey.submissionDate) || 'Unknown'}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500 text-xs uppercase mb-1">Confidence Level</p>
                          <p className="text-gray-900">{survey.confidenceLevel || '—'}</p>
                        </div>
                        
                        {survey.mostValuable && (
                          <div className="md:col-span-2">
                            <p className="text-gray-500 text-xs uppercase mb-1">Most Valuable Part</p>
                            <p className="text-gray-900 bg-white p-2 rounded">{survey.mostValuable}</p>
                          </div>
                        )}
                        
                        {survey.areasForImprovement && (
                          <div className="md:col-span-2">
                            <p className="text-gray-500 text-xs uppercase mb-1">Areas for Improvement</p>
                            <p className="text-gray-900 bg-white p-2 rounded">{survey.areasForImprovement}</p>
                          </div>
                        )}
                        
                        {survey.writtenTestimonial && (
                          <div className="md:col-span-2">
                            <p className="text-gray-500 text-xs uppercase mb-1">Written Testimonial</p>
                            <p className="text-gray-900 bg-blue-50 p-3 rounded border border-blue-200 italic">
                              "{survey.writtenTestimonial}"
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <p className="text-gray-500 text-xs uppercase mb-1">Opt-in to Communications</p>
                          <p className="text-gray-900">{survey.optInCommunication || '—'}</p>
                        </div>
                        
                        {survey.reviewPlatformClicked && (
                          <div>
                            <p className="text-gray-500 text-xs uppercase mb-1">Review Platform Clicked</p>
                            <p className="text-gray-900">{survey.reviewPlatformClicked}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

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
  const [activeTab, setActiveTab] = useState<'roster' | 'communications' | 'surveys' | 'assistants'>('roster');

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

  // Warn before leaving with unsaved changes
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

  // Track changes
  useEffect(() => {
    const hasChanges = JSON.stringify(attendanceState) !== JSON.stringify(initialAttendanceState);
    setHasUnsavedChanges(hasChanges);
  }, [attendanceState, initialAttendanceState]);

  // Fetch class schedules
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const [schedulesResponse, classesResponse] = await Promise.all([
          fetch('/api/schedules'),
          fetch('/api/classes')
        ]);
        
        if (!schedulesResponse.ok || !classesResponse.ok) throw new Error('Failed to fetch data');
        
        const schedulesData = await schedulesResponse.json();
        const classesData = await classesResponse.json();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sixWeeksAgo = new Date();
        sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42);
        sixWeeksAgo.setHours(0, 0, 0, 0);
        
        const filtered = schedulesData.records
          .filter((schedule: any) => {
            if (schedule.fields['Is Cancelled']) return false;
            const classDate = new Date(schedule.fields.Date + 'T00:00:00');
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
        
        const queryClassScheduleId = searchParams.get('classScheduleId');
        if (queryClassScheduleId && filtered.find((c: ClassSchedule) => c.id === queryClassScheduleId)) {
          setCurrentClassId(queryClassScheduleId);
        } else {
          const todayStr = today.toISOString().split('T')[0];
          const todayOrLaterClass = filtered.find((cls: ClassSchedule) => cls.date >= todayStr);
          if (todayOrLaterClass) {
            setCurrentClassId(todayOrLaterClass.id);
          } else if (filtered.length > 0) {
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
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to logout?')) return;
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleClassChange = (newClassId: string) => {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to switch classes?')) return;
    setCurrentClassId(newClassId);
  };

  const handlePreviousClass = () => {
    const currentIndex = allClasses.findIndex(c => c.id === currentClassId);
    if (currentIndex > 0) handleClassChange(allClasses[currentIndex - 1].id);
  };

  const handleNextClass = () => {
    const currentIndex = allClasses.findIndex(c => c.id === currentClassId);
    if (currentIndex < allClasses.length - 1) handleClassChange(allClasses[currentIndex + 1].id);
  };

  const handleAttendanceChange = (participantId: string, value: string) => {
    setAttendanceState(prev => ({ ...prev, [participantId]: value }));
  };

  const handleMarkAllPresent = () => {
    const newState: Record<string, string> = {};
    rosterData?.roster.forEach(participant => { newState[participant.id] = 'Present'; });
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
        if (updatedState[id] === 'Not Recorded') updatedState[id] = 'Present';
      });
      setAttendanceState(updatedState);
      setInitialAttendanceState(updatedState);

      const response = await fetch('/api/admin/mark-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classScheduleId: currentClassId, attendanceRecords })
      });

      if (!response.ok) throw new Error('Failed to save attendance');
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
      p.bookingNumber || '', p.isPrimaryContact ? 'Yes' : 'No', p.lastName, p.firstName,
      p.ageGroup, attendanceState[p.id] || 'Not Recorded', p.contactEmail, p.contactPhone
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))].join('\n');
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
            <button onClick={handleLogout} className="mt-6 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg transition-colors">
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
            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-navy transition-colors">
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

          {/* Class Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePreviousClass}
              disabled={!hasPrevious}
              className={`p-2 rounded-lg transition-colors ${hasPrevious ? 'bg-accent-primary hover:bg-accent-dark text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <select
              value={currentClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
            >
              {allClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>{formatDate(cls.date)} - {cls.className}</option>
              ))}
            </select>

            <button
              onClick={handleNextClass}
              disabled={!hasNext}
              className={`p-2 rounded-lg transition-colors ${hasNext ? 'bg-accent-primary hover:bg-accent-dark text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Class Info */}
        {rosterData && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-navy mb-2">{rosterData.classInfo.className}</h2>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-accent-primary" />
                      <span>{formatDate(rosterData.classInfo.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-accent-primary" />
                      <span>{formatTime(rosterData.classInfo.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-accent-primary" />
                      <span>{rosterData.classInfo.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{currentClassId}</code>
                  <button
                    onClick={() => copyToClipboard(currentClassId, 'classScheduleId')}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy Class Schedule ID"
                  >
                    {copiedField === 'classScheduleId' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => navigate('/admin/import')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary hover:bg-accent-dark text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    Import
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <SummaryCards 
                roster={rosterData.roster} 
                attendanceState={attendanceState} 
                surveyResponses={rosterData.surveyResponses || []}
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('roster')}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === 'roster' ? 'bg-white text-accent-primary border-t-2 border-x border-accent-primary' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="font-bold">Roster</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('communications')}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === 'communications' ? 'bg-white text-accent-primary border-t-2 border-x border-accent-primary' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="font-bold">Communications</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('surveys')}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === 'surveys' ? 'bg-white text-accent-primary border-t-2 border-x border-accent-primary' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  <span className="font-bold">Surveys</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('assistants')}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === 'assistants' ? 'bg-white text-accent-primary border-t-2 border-x border-accent-primary' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
            >
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span className="font-bold">Teaching Assistants</span>
                </span>
            </button>
            </div>

            {/* Action Buttons (only on Roster tab) */}
            {activeTab === 'roster' && (
              <>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <button
                    onClick={handleDownloadCurrentClassCSV}
                    className="flex items-center gap-2 text-accent-primary hover:text-accent-dark transition-colors text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download CSV
                  </button>
                  
                  <div className="flex gap-3 ml-auto">
                    <button
                      onClick={handleMarkAllPresent}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark All Present
                    </button>
                    <button
                      onClick={handleSaveAttendance}
                      disabled={saving}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                        saving ? 'bg-gray-400 cursor-not-allowed' : saveSuccess ? 'bg-green-600 text-white' : 'bg-accent-primary hover:bg-accent-dark text-white'
                      }`}
                    >
                      {saveSuccess ? <><Check className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save'}</>}
                    </button>
                  </div>
                </div>

                {hasUnsavedChanges && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-4 text-sm">
                    ⚠️ You have unsaved changes. Remember to click "Save" before leaving this page.
                  </div>
                )}
              </>
            )}

            {/* Tab Content */}
            {activeTab === 'roster' && (
              <RosterTab 
                roster={rosterData.roster}
                attendanceState={attendanceState}
                onAttendanceChange={handleAttendanceChange}
                copiedField={copiedField}
                onCopy={copyToClipboard}
              />
            )}
            {activeTab === 'communications' && (
              <CommunicationsTab 
                roster={rosterData.roster}
                classDate={rosterData.classInfo.date}
              />
            )}
            {activeTab === 'surveys' && (
              <SurveysTab 
                roster={rosterData.roster}
                surveyResponses={rosterData.surveyResponses || []}
                classDate={rosterData.classInfo.date}
              />
            )}
            {activeTab === 'assistants' && (
              <TeachingAssistantsTab 
                classScheduleId={currentClassId}
                roster={rosterData.roster}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAttendancePage;
