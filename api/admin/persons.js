// /api/admin/persons.js
// GET: Fetch persons (optionally filtered by role/status)
// POST: Create a new person
// PATCH: Update an existing person
import { requireSupabase, outerId } from '../_supabase.js';
import { requireAdminAuth } from '../_admin-auth.js';

const formatPerson = (row) => ({
  id: outerId(row),
  name: row.name || '',
  email: row.email || '',
  phone: row.phone || '',
  roles: row.roles || [],
  status: row.status || 'Active',
  notes: row.notes || '',
  emergencyContactName: row.emergency_contact_name || '',
  emergencyContactRelationship: row.emergency_contact_relationship || '',
  emergencyContactPhone: row.emergency_contact_phone || '',
  emergencyContactEmail: row.emergency_contact_email || '',
});

export default async function handler(req, res) {
  if (!requireAdminAuth(req, res)) return;
  const supabase = requireSupabase(res);
  if (!supabase) return;

  if (req.method === 'GET') {
    try {
      const { role, status } = req.query;
      let query = supabase.from('persons').select('*');
      if (role) query = query.contains('roles', [role]);
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ persons: (data || []).map(formatPerson) });
    } catch (error) {
      console.error('Error fetching persons:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        name, email, phone, roles, notes,
        emergencyContactName, emergencyContactRelationship,
        emergencyContactPhone, emergencyContactEmail,
      } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const row = { name: name.trim(), status: 'Active' };
      if (email) row.email = email.trim();
      if (phone) row.phone = phone.trim();
      if (Array.isArray(roles)) row.roles = roles;
      if (notes) row.notes = notes.trim();
      if (emergencyContactName) row.emergency_contact_name = emergencyContactName.trim();
      if (emergencyContactRelationship) row.emergency_contact_relationship = emergencyContactRelationship.trim();
      if (emergencyContactPhone) row.emergency_contact_phone = emergencyContactPhone.trim();
      if (emergencyContactEmail) row.emergency_contact_email = emergencyContactEmail.trim();

      const { data, error } = await supabase.from('persons').insert(row).select('*').single();
      if (error) throw error;
      return res.status(201).json({ person: formatPerson(data) });
    } catch (error) {
      console.error('Error creating person:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const {
        id, name, email, phone, roles, status, notes,
        emergencyContactName, emergencyContactRelationship,
        emergencyContactPhone, emergencyContactEmail,
      } = req.body;
      if (!id) return res.status(400).json({ error: 'Person ID is required' });

      const updates = {};
      if (name !== undefined) updates.name = name.trim();
      if (email !== undefined) updates.email = email.trim();
      if (phone !== undefined) updates.phone = phone.trim();
      if (roles !== undefined) updates.roles = roles;
      if (status !== undefined) updates.status = status;
      if (notes !== undefined) updates.notes = notes.trim();
      if (emergencyContactName !== undefined) updates.emergency_contact_name = emergencyContactName.trim();
      if (emergencyContactRelationship !== undefined) updates.emergency_contact_relationship = emergencyContactRelationship.trim();
      if (emergencyContactPhone !== undefined) updates.emergency_contact_phone = emergencyContactPhone.trim();
      if (emergencyContactEmail !== undefined) updates.emergency_contact_email = emergencyContactEmail.trim();

      const isAirtableId = /^rec/.test(id);
      let query = supabase.from('persons').update(updates);
      query = isAirtableId ? query.eq('airtable_record_id', id) : query.eq('id', id);

      const { data, error } = await query.select('*').maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Person not found' });
      return res.status(200).json({ person: formatPerson(data) });
    } catch (error) {
      console.error('Error updating person:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
