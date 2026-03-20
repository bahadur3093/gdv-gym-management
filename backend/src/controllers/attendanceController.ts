import { Response, NextFunction } from 'express'
import { AuthRequest } from '../types/index.js'
import supabase from '../config/supabase.js'

export const checkIn = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user.id
    const today    = new Date().toISOString().split('T')[0]

    const { data: existing } = await supabase
      .from('attendance').select('id, checked_in_at').eq('member_id', memberId).eq('date', today).single()

    if (existing) {
      res.status(409).json({ error: 'Already checked in today', checkedInAt: existing.checked_in_at }); return
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert({ member_id: memberId, date: today, checked_in_at: new Date().toISOString() })
      .select().single()

    if (error) throw error

    // Update streak
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const { data: yest } = await supabase.from('attendance').select('id').eq('member_id', memberId).eq('date', yesterdayStr).single()
    if (yest) {
      await supabase.rpc('increment_streak', { member_id: memberId })
    } else {
      await supabase.from('members').update({ current_streak: 1 }).eq('id', memberId)
    }

    res.status(201).json({ message: 'Check-in successful', attendance: data })
  } catch (err) { next(err) }
}

export const getMyAttendance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user.id
    const month    = (req.query.month as string) || new Date().toISOString().slice(0, 7)
    const startDate = `${month}-01`
    const endDate   = new Date(month + '-01')
    endDate.setMonth(endDate.getMonth() + 1)
    const endDateStr = endDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('attendance').select('date, checked_in_at')
      .eq('member_id', memberId).gte('date', startDate).lt('date', endDateStr)
      .order('date', { ascending: false })

    if (error) throw error

    const daysInMonth  = new Date(endDate.getTime() - 86400000).getDate()
    const presentDays  = data?.length ?? 0
    const percentage   = Math.round((presentDays / daysInMonth) * 100)

    res.json({ attendance: data, stats: { presentDays, daysInMonth, percentage, month } })
  } catch (err) { next(err) }
}

export const getAllToday = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('attendance')
      .select('checked_in_at, members(id, name, flat_number, tower)')
      .eq('date', today)
      .order('checked_in_at', { ascending: false })
    if (error) throw error
    res.json({ date: today, count: data?.length ?? 0, checkins: data })
  } catch (err) { next(err) }
}
