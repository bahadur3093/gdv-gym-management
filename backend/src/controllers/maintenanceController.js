import supabase from '../config/supabase.js';
import { sendNotification } from '../services/notificationService.js';

// POST /api/maintenance
export const reportIssue = async (req, res, next) => {
  try {
    const { title, description, equipment, priority = 'medium' } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const { data, error } = await supabase
      .from('maintenance_issues')
      .insert({
        reported_by: req.user.id,
        title,
        description,
        equipment,
        priority,
        status: 'open',
      })
      .select()
      .single();

    if (error) throw error;

    await sendNotification(
      { role: 'admin' },
      `New issue reported by ${req.user.name}: "${title}" — Priority: ${priority.toUpperCase()}`
    );

    res.status(201).json({ message: 'Issue reported successfully', issue: data });
  } catch (err) {
    next(err);
  }
};

// GET /api/maintenance?status=open
export const getIssues = async (req, res, next) => {
  try {
    const { status } = req.query;

    // Explicitly name the foreign key relationship to avoid ambiguity
    let query = supabase
      .from('maintenance_issues')
      .select('*, reporter:members!reported_by(name, flat_number)')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    // Rename reporter back to members so frontend doesn't need changing
    const normalized = data.map(issue => ({
      ...issue,
      members: issue.reporter,
    }));

    res.json(normalized);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/maintenance/:id  (admin only)
export const updateIssueStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const updatePayload = {
      status,
      admin_note: adminNote,
      updated_by: req.user.id,
    };

    if (status === 'resolved') {
      updatePayload.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('maintenance_issues')
      .update(updatePayload)
      .eq('id', id)
      .select('*, reporter:members!reported_by(id, name)')
      .single();

    if (error) throw error;

    const statusLabel = { open: 'reopened', in_progress: 'in progress', resolved: 'resolved' }[status];
    await sendNotification(
      { userId: data.reporter.id },
      `Your issue "${data.title}" has been marked as ${statusLabel}.${adminNote ? ' Note: ' + adminNote : ''}`
    );

    res.json({ message: `Issue marked as ${status}`, issue: data });
  } catch (err) {
    next(err);
  }
};