import { Request, Response, NextFunction } from 'express'
import supabase from '../config/supabase.js'
import { sendNotification } from '../services/notificationService.js'
import { IssueStatus } from '../types/index.js'

// POST /api/maintenance
export const reportIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, equipment, priority = 'medium' } = req.body as {
      title: string; description: string; equipment?: string; priority?: string
    }

    if (!title || !description) {
      res.status(400).json({ error: 'Title and description are required' })
      return
    }

    const { data, error } = await supabase
      .from('maintenance_issues')
      .insert({ reported_by: req.user!.id, title, description, equipment, priority, status: 'open' })
      .select().single()

    if (error) throw error

    await sendNotification(
      { role: 'admin' },
      `New issue by ${req.user!.name}: "${title}" — Priority: ${priority.toUpperCase()}`
    )

    res.status(201).json({ message: 'Issue reported successfully', issue: data })
  } catch (err) {
    next(err)
  }
}

// GET /api/maintenance?status=open
export const getIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.query as { status?: string }

    let query = supabase
      .from('maintenance_issues')
      .select('*, reporter:members!reported_by(name, flat_number)')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status) as typeof query

    const { data, error } = await query
    if (error) throw error

    // Rename reporter → members for frontend consistency
    const normalized = data.map((issue: Record<string, unknown>) => ({
      ...issue,
      members: issue['reporter'],
    }))

    res.json(normalized)
  } catch (err) {
    next(err)
  }
}

// PATCH /api/maintenance/:id  (admin only)
export const updateIssueStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id }                   = req.params
    const { status, adminNote } = req.body as { status: IssueStatus; adminNote?: string }

    const validStatuses: IssueStatus[] = ['open', 'in_progress', 'resolved']
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` })
      return
    }

    const updatePayload: Record<string, unknown> = {
      status, admin_note: adminNote, updated_by: req.user!.id,
    }

    if (status === 'resolved') updatePayload.resolved_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('maintenance_issues')
      .update(updatePayload)
      .eq('id', id)
      .select('*, reporter:members!reported_by(id, name)')
      .single()

    if (error) throw error

    const statusLabel: Record<IssueStatus, string> = {
      open: 'reopened', in_progress: 'in progress', resolved: 'resolved',
    }

    await sendNotification(
      { userId: data.reporter.id },
      `Your issue "${data.title}" has been marked as ${statusLabel[status]}.${adminNote ? ' Note: ' + adminNote : ''}`
    )

    res.json({ message: `Issue marked as ${status}`, issue: data })
  } catch (err) {
    next(err)
  }
}
