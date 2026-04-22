// /api/admin/teaching-assignments.js
// GET: Fetch teaching assignments (optionally filtered by classScheduleId)
// POST: Create a new teaching assignment
// DELETE: Remove a teaching assignment
import { requireSupabase, airtableIdToUuid, outerId } from '../_supabase.js';
import { requireAdminAuth } from '../_admin-auth.js';

const PERSON_COLS = 'id, airtable_record_id, name, email, phone, roles, status, notes, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone, emergency_contact_email';
const SCHEDULE_COLS = 'id, airtable_record_id';

const formatPerson = (p) => p ? {
  id: outerId(p),
  name: p.name || '',
  email: p.email || '',
  phone: p.phone || '',
  roles: p.roles || [],
  status: p.status || 'Active',
  notes: p.notes || '',
  emergencyContactName: p.emergency_contact_name || '',
  emergencyContactRelationship: p.emergency_contact_relationship || '',
  emergencyContactPhone: p.emergency_contact_phone || '',
  emergencyContactEmail: p.emergency_contact_email || '',
} : null;

export default async function handler(req, res) {
  if (!requireAdminAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  if (req.method === 'GET') {
    try {
      const { classScheduleId } = req.query;
      let query = supabase
        .from('teaching_assignments')
        .select(`*, persons(${PERSON_COLS}), class_schedules(${SCHEDULE_COLS})`);

      if (classScheduleId) {
        const scheduleUuid = /^rec/.test(classScheduleId)
          ? await airtableIdToUuid('class_schedules', classScheduleId)
          : classScheduleId;
        if (!scheduleUuid) return res.status(200).json({ assignments: [] });
        query = query.eq('class_schedule_id', scheduleUuid);
      }

      const { data, error } = await query;
      if (error) throw error;

      const assignments = (data || []).map((a) => ({
        id: outerId(a),
        personId: outerId(a.persons),
        person: formatPerson(a.persons),
        classScheduleId: outerId(a.class_schedules),
        assignmentNotes: a.assignment_notes || '',
      }));

      return res.status(200).json({ assignments });
    } catch (error) {
      console.error('Error fetching teaching assignments:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { personId, classScheduleId, assignmentNotes } = req.body;
      if (!personId) return res.status(400).json({ error: 'Person ID is required' });
      if (!classScheduleId) return res.status(400).json({ error: 'Class Schedule ID is required' });

      const personUuid = /^rec/.test(personId)
        ? await airtableIdToUuid('persons', personId)
        : personId;
      const scheduleUuid = /^rec/.test(classScheduleId)
        ? await airtableIdToUuid('class_schedules', classScheduleId)
        : classScheduleId;
      if (!personUuid) return res.status(400).json({ error: 'Unknown person' });
      if (!scheduleUuid) return res.status(400).json({ error: 'Unknown class schedule' });

      const { data: existing } = await supabase
        .from('teaching_assignments')
        .select('id')
        .eq('person_id', personUuid)
        .eq('class_schedule_id', scheduleUuid)
        .maybeSingle();
      if (existing) {
        return res.status(400).json({ error: 'This person is already assigned to this class' });
      }

      const insertRow = { person_id: personUuid, class_schedule_id: scheduleUuid };
      if (assignmentNotes) insertRow.assignment_notes = assignmentNotes.trim();

      const { data, error } = await supabase
        .from('teaching_assignments')
        .insert(insertRow)
        .select('*')
        .single();
      if (error) throw error;

      return res.status(201).json({
        assignment: {
          id: outerId(data),
          personId,
          classScheduleId,
          assignmentNotes: data.assignment_notes || '',
        },
      });
    } catch (error) {
      console.error('Error creating teaching assignment:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Assignment ID is required' });

      const isAirtableId = /^rec/.test(id);
      let query = supabase.from('teaching_assignments').delete();
      query = isAirtableId ? query.eq('airtable_record_id', id) : query.eq('id', id);

      const { error } = await query;
      if (error) throw error;
      return res.status(200).json({ success: true, deletedId: id });
    } catch (error) {
      console.error('Error deleting teaching assignment:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
