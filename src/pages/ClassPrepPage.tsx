import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Users, Shield, Clock, Camera, AlertCircle, CheckCircle, Home, ParkingCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ClassPrepData {
  className: string;
  classType: string;
  date: string;
  startTime: string;
  endTime: string;
  startTimeNew?: string;
  endTimeNew?: string;
  location: string;
  venueName?: string;
  city?: string;
  arrivalInstructions?: string;
  specialNotes?: string;
  partnerOrganization?: string;
  instructorName?: string;
  instructorPhone?: string;
  waiverUrl?: string;
  parkingInstructions?: string;
  parkingMapUrl?: string;
}

const ClassPrepPage = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const [classData, setClassData] = useState<ClassPrepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scheduleId) {
      fetchClassPrepData();
    }
  }, [scheduleId]);

  const fetchClassPrepData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch schedule data
      const scheduleResponse = await fetch(`/api/schedules`);
      if (!scheduleResponse.ok) throw new Error('Failed to fetch schedule');
      
      const schedulesData = await scheduleResponse.json();
      const schedule = schedulesData.records.find((s: any) => s.id === scheduleId);
      
      if (!schedule) throw new Error('Class not found');

      // Fetch class data
      const classesResponse = await fetch(`/api/classes`);
      if (!classesResponse.ok) throw new Error('Failed to fetch class info');
      
      const classesData = await classesResponse.json();
      const classId = schedule.fields['Class']?.[0];
      const classInfo = classesData.records.find((c: any) => c.id === classId);

      if (!classInfo) throw new Error('Class information not found');

      setClassData({
        className: classInfo.fields['Class Name'] || 'Self-Defense Class',
        classType: classInfo.fields['Type']?.toLowerCase() || '',
        date: schedule.fields['Date'] || '',
        startTime: schedule.fields['Start Time'] || '',
        endTime: schedule.fields['End Time'] || '',
        startTimeNew: schedule.fields['Start Time New'],
        endTimeNew: schedule.fields['End Time New'],
        location: schedule.fields['Location'] || classInfo.fields['Location'] || '',
        venueName: schedule.fields['Venue Name'] || '',
        city: schedule.fields['City'] || classInfo.fields['City'] || 'Walnut Creek',
        arrivalInstructions: schedule.fields['Arrival Instructions'] || 'Please arrive 15 minutes early',
        specialNotes: schedule.fields['Special Notes'] || '',
        partnerOrganization: classInfo.fields['Partner Organization'] || '',
        instructorName: classInfo.fields['Instructor'] || 'Jay Beecham',
        instructorPhone: '925-532-9953',
        waiverUrl: schedule.fields['Waiver URL'],
        parkingInstructions: schedule.fields['Parking Instructions'] || '',
        parkingMapUrl: schedule.fields['Parking Map URL'] || ''
      });
    } catch (err) {
      console.error('Error fetching class prep data:', err);
      setError('Unable to load class information. Please contact us if this issue persists.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    try {
      return new Date(timeString).toLocaleTimeStri
