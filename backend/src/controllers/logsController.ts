import { Request, Response, NextFunction } from 'express'
import supabase from '../config/supabase.js'

// GET /api/logs/members
// All members with optional search by name
export const getMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, status } = req.query as Record<string, string>

    let query = supabase
      .from('members')
      .select('id, name, phone, flat_number, tower, role, status, current_streak, longest_streak, created_at')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status) as typeof query
    if (search) query = query.ilike('name', `%${search}%`) as typeof query

    const { data, error } = await query
    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
}

// GET /api/logs/checkins
// All check-ins with filters: from, to, search (member name)
export const getCheckins = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { from, to, search, limit = '50', offset = '0' } = req.query as Record<string, string>

    let query = supabase
      .from('attendance')
      .select('date, checked_in_at, checked_out_at, duration_mins, auto_checkout, members!inner(id, name, flat_number, tower)', { count: 'exact' })
      .order('checked_in_at', { ascending: false })
      .limit(parseInt(limit))
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    if (from)     query = query.gte('date', from) as typeof query
    if (to)       query = query.lte('date', to) as typeof query
    if (search)   query = query.ilike('members.name', `%${search}%`) as typeof query

    const { data, error, count } = await query
    if (error) throw error
    res.json({ total: count, records: data })
  } catch (err) {
    next(err)
  }
}

// GET /api/logs/payments
// Payment collection stats: total, by month, by year, per member
// Optional filters: from, to, status, search (member name)
export const getPaymentLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { from, to, status, search } = req.query as Record<string, string>

    let query = supabase
      .from('payments')
      .select('id, month, amount, status, is_partial, reason, submitted_at, approved_at, utr_number, members!inner(id, name, flat_number, tower)')
      .order('month', { ascending: false })

    if (status)   query = query.eq('status', status) as typeof query
    if (from)     query = query.gte('month', from.slice(0, 7)) as typeof query
    if (to)       query = query.lte('month', to.slice(0, 7)) as typeof query
    if (search)   query = query.ilike('members.name', `%${search}%`) as typeof query

    const { data, error } = await query
    if (error) throw error

    // ── Aggregate stats ──────────────────────────────────────
    const approved = data.filter((p: any) => p.status === 'approved')

    const totalCollected = approved.reduce((sum: number, p: any) => sum + Number(p.amount), 0)

    // By month: { 'YYYY-MM': total }
    const byMonth: Record<string, number> = {}
    approved.forEach((p: any) => {
      byMonth[p.month] = (byMonth[p.month] || 0) + Number(p.amount)
    })

    // By year: { 'YYYY': total }
    const byYear: Record<string, number> = {}
    approved.forEach((p: any) => {
      const year = p.month.slice(0, 4)
      byYear[year] = (byYear[year] || 0) + Number(p.amount)
    })

    // Per member: [{ member, total, months }]
    const memberMap: Record<string, { name: string; flat_number: string; total: number; months: number }> = {}
    approved.forEach((p: any) => {
      const id = p.members.id
      if (!memberMap[id]) {
        memberMap[id] = { name: p.members.name, flat_number: p.members.flat_number, total: 0, months: 0 }
      }
      memberMap[id].total  += Number(p.amount)
      memberMap[id].months += 1
    })

    res.json({
      records: data,
      stats: {
        totalCollected,
        totalTransactions: approved.length,
        byMonth: Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0])),
        byYear:  Object.entries(byYear).sort((a, b) => b[0].localeCompare(a[0])),
        byMember: Object.values(memberMap).sort((a, b) => b.total - a.total),
      },
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/logs/member-summary  (for member's own financial view)
export const getMemberSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user!.id
    const GYM_FEE  = parseInt(process.env.GYM_FEE_AMOUNT || '500')

    // Get member join date
    const { data: member } = await supabase
      .from('members')
      .select('created_at')
      .eq('id', memberId)
      .single()

    if (!member) { res.status(404).json({ error: 'Member not found' }); return }

    // All payments for this member
    const { data: payments, error } = await supabase
      .from('payments')
      .select('month, amount, status, submitted_at, approved_at, utr_number, is_partial, reason')
      .eq('member_id', memberId)
      .order('month', { ascending: false })

    if (error) throw error

    const approved = payments.filter(p => p.status === 'approved')
    const totalPaid = approved.reduce((sum, p) => sum + Number(p.amount), 0)

    // By year
    const byYear: Record<string, number> = {}
    approved.forEach(p => {
      const year = p.month.slice(0, 4)
      byYear[year] = (byYear[year] || 0) + Number(p.amount)
    })

    // Calculate total outstanding from join date to now
    const joinDate    = new Date(member.created_at)
    const joinMonth   = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`
    const now         = new Date()
    const nowMonth    = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    let totalDue = 0
    let cursor   = new Date(joinMonth + '-01')
    const end    = new Date(nowMonth + '-01')

    while (cursor <= end) {
      const month      = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
      const monthPaid  = approved.filter(p => p.month === month).reduce((s, p) => s + Number(p.amount), 0)
      totalDue        += Math.max(0, GYM_FEE - monthPaid)
      cursor.setMonth(cursor.getMonth() + 1)
    }

    res.json({
      totalPaid,
      totalOutstanding: totalDue,
      gymFee: GYM_FEE,
      byYear: Object.entries(byYear).sort((a, b) => b[0].localeCompare(a[0])),
      payments,
    })
  } catch (err) {
    next(err)
  }
}