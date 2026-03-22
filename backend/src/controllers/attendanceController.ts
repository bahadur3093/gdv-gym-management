import { Request, Response, NextFunction } from 'express'
import supabase from '../config/supabase.js'

// POST /api/attendance/checkin  (members only)
export const checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user!.id
    const today    = new Date().toISOString().split('T')[0]

    // Check already checked in today with no checkout
    const { data: existing } = await supabase
      .from('attendance')
      .select('id, checked_in_at, checked_out_at')
      .eq('member_id', memberId)
      .eq('date', today)
      .is('checked_out_at', null)
      .single()

    if (existing) {
      res.status(409).json({ error: 'Already checked in', checkedInAt: existing.checked_in_at })
      return
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert({
        member_id:     memberId,
        date:          today,
        checked_in_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    await updateStreak(memberId, today)
    res.status(201).json({ message: 'Checked in successfully', attendance: data })
  } catch (err) {
    next(err)
  }
}

// POST /api/attendance/checkout  (members only)
export const checkOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user!.id
    const today    = new Date().toISOString().split('T')[0]

    // Find open session for today
    const { data: session, error: fetchError } = await supabase
      .from('attendance')
      .select('id, checked_in_at')
      .eq('member_id', memberId)
      .eq('date', today)
      .is('checked_out_at', null)
      .single()

    if (fetchError || !session) {
      res.status(404).json({ error: 'No active check-in found for today' })
      return
    }

    const now          = new Date()
    const checkedIn    = new Date(session.checked_in_at)
    const durationMins = Math.round((now.getTime() - checkedIn.getTime()) / 60000)

    const { data, error } = await supabase
      .from('attendance')
      .update({
        checked_out_at: now.toISOString(),
        auto_checkout:  false,
        duration_mins:  durationMins,
      })
      .eq('id', session.id)
      .select()
      .single()

    if (error) throw error
    res.json({ message: 'Checked out successfully', attendance: data })
  } catch (err) {
    next(err)
  }
}

// GET /api/attendance/current  — who is in the gym right now
export const getCurrentlyIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('attendance')
      .select('checked_in_at, members(id, name, flat_number, tower)')
      .eq('date', today)
      .is('checked_out_at', null)
      .order('checked_in_at', { ascending: true })

    if (error) throw error
    res.json({ count: data.length, members: data })
  } catch (err) {
    next(err)
  }
}

// GET /api/attendance/me?month=YYYY-MM  — member's own history
export const getMyAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user!.id
    const month    = (req.query.month as string) || new Date().toISOString().slice(0, 7)

    const startDate = `${month}-01`
    const endDate   = new Date(month + '-01')
    endDate.setMonth(endDate.getMonth() + 1)
    const endDateStr = endDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('attendance')
      .select('date, checked_in_at, checked_out_at, duration_mins, auto_checkout')
      .eq('member_id', memberId)
      .gte('date', startDate)
      .lt('date', endDateStr)
      .order('date', { ascending: false })

    if (error) throw error

    // Total days in the month (e.g. 31 for March)
    const daysInMonth = new Date(endDate.getTime() - 1).getDate()

    // For the current month: only count days elapsed so far (today inclusive)
    // For past months: use the full month
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const isCurrentMonth = month === currentMonth

    // daysElapsed = how many days of this month have passed (including today)
    // For past months this equals daysInMonth
    const daysElapsed = isCurrentMonth ? now.getDate() : daysInMonth

    // Count unique days attended (one check-in per day counts as one day)
    const uniqueDays = new Set(data.map(a => a.date)).size
    const presentDays = uniqueDays

    // Percentage out of days elapsed — so 10/10 days = 100%, not 10/31 = 32%
    const percentage = daysElapsed > 0
      ? Math.round((presentDays / daysElapsed) * 100)
      : 0

    res.json({ attendance: data, stats: { presentDays, daysInMonth, daysElapsed, percentage, month } })
  } catch (err) {
    next(err)
  }
}

// GET /api/attendance/history  — admin full history with filters
// Query params: from, to, memberId, villa, limit, offset
export const getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      from,
      to,
      memberId,
      villa,
      limit  = '50',
      offset = '0',
    } = req.query as Record<string, string>

    let query = supabase
      .from('attendance')
      .select('date, checked_in_at, checked_out_at, duration_mins, auto_checkout, members!inner(id, name, flat_number, tower)', { count: 'exact' })
      .order('checked_in_at', { ascending: false })
      .limit(parseInt(limit))
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    if (from)     query = query.gte('date', from) as typeof query
    if (to)       query = query.lte('date', to) as typeof query
    if (memberId) query = query.eq('member_id', memberId) as typeof query
    if (villa)    query = query.eq('members.flat_number', villa) as typeof query

    const { data, error, count } = await query
    if (error) throw error

    res.json({ total: count, records: data })
  } catch (err) {
    next(err)
  }
}

// POST /api/attendance/auto-checkout  — called by cron-job.org every 15 min
export const autoCheckout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate cron secret to prevent abuse
    const secret = req.headers['x-cron-secret']
    if (secret !== process.env.CRON_SECRET) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { data, error } = await supabase.rpc('auto_checkout_sessions')
    if (error) throw error

    console.log(`[AUTO-CHECKOUT] Checked out ${data} sessions`)
    res.json({ message: 'Auto-checkout complete', sessionsCheckedOut: data })
  } catch (err) {
    next(err)
  }
}

// ── Internal helper ──────────────────────────────────────────
async function updateStreak(memberId: string, today: string): Promise<void> {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const { data } = await supabase
    .from('attendance')
    .select('id')
    .eq('member_id', memberId)
    .eq('date', yesterdayStr)
    .not('checked_out_at', 'is', null)
    .single()

  if (data) {
    await supabase.rpc('increment_streak', { member_id: memberId })
  } else {
    await supabase.from('members').update({ current_streak: 1 }).eq('id', memberId)
  }
}