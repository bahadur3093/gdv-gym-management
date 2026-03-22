import { Request, Response, NextFunction } from 'express'
import supabase from '../config/supabase.js'

// POST /api/access/unlock  (members only)
// Unlocks the gym door and auto check-in for today
// When smart lock is installed, replace the stub below with the real API call
export const unlockDoor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user!.id
    const today    = new Date().toISOString().split('T')[0]

    // ── SMART LOCK STUB ──────────────────────────────────────
    // Replace this comment with the actual lock API call e.g.:
    // await fetch('https://your-lock-api.com/unlock', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${process.env.LOCK_API_KEY}` },
    //   body: JSON.stringify({ lockId: process.env.GYM_LOCK_ID })
    // })
    console.log(`[LOCK] Unlock requested by member ${memberId} — stub, no hardware connected`)
    // ─────────────────────────────────────────────────────────

    // Log the unlock event
    await supabase
      .from('unlock_log')
      .insert({ member_id: memberId, method: 'app' })

    // Auto check-in if not already checked in today
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('member_id', memberId)
      .eq('date', today)
      .is('checked_out_at', null)
      .single()

    if (!existing) {
      await supabase
        .from('attendance')
        .insert({
          member_id:     memberId,
          date:          today,
          checked_in_at: new Date().toISOString(),
        })
    }

    res.json({ message: 'Door unlocked', checkedIn: !existing })
  } catch (err) {
    next(err)
  }
}