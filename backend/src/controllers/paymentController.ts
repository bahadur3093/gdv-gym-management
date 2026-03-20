import { Request, Response, NextFunction } from 'express'
import supabase from '../config/supabase.js'
import { generateUPIDeepLink } from '../services/upiService.js'
import { sendNotification }    from '../services/notificationService.js'

// GET /api/payments/upi-link
export const generateUPILink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, flatNumber, name } = req.user!
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7)

    const monthTag = new Date(month + '-01')
      .toLocaleString('en-IN', { month: 'short', year: 'numeric' })
      .replace(' ', '').toUpperCase()

    const remark = `GYM-VILLA${flatNumber}-${monthTag}`

    const link = generateUPIDeepLink({
      upiId:  process.env.SOCIETY_UPI_ID!,
      name:   process.env.SOCIETY_NAME!,
      amount: process.env.GYM_FEE_AMOUNT!,
      remark,
    })

    res.json({ link, remark, amount: process.env.GYM_FEE_AMOUNT, month })
  } catch (err) {
    next(err)
  }
}

// POST /api/payments/submit
export const submitPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user!.id
    const { utrNumber, month, amount } = req.body as {
      utrNumber: string; month: string; amount?: number
    }

    if (!utrNumber || !month) {
      res.status(400).json({ error: 'UTR number and month are required' })
      return
    }

    if (!/^\d{12}$/.test(utrNumber)) {
      res.status(400).json({ error: 'UTR must be exactly 12 digits' })
      return
    }

    const { data: duplicate } = await supabase
      .from('payments').select('id').eq('utr_number', utrNumber).single()

    if (duplicate) { res.status(409).json({ error: 'This UTR has already been submitted' }); return }

    const { data: existing } = await supabase
      .from('payments').select('id, status').eq('member_id', memberId).eq('month', month).single()

    if (existing?.status === 'approved') {
      res.status(409).json({ error: `Payment for ${month} is already approved` })
      return
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({ member_id: memberId, month, amount: amount || process.env.GYM_FEE_AMOUNT, utr_number: utrNumber, status: 'pending' })
      .select().single()

    if (error) throw error

    await sendNotification(
      { role: 'admin' },
      `Payment submitted by ${req.user!.name} (Villa ${req.user!.flatNumber}) for ${month}. UTR: ${utrNumber}`
    )

    res.status(201).json({ message: 'Payment submitted for verification', payment: data })
  } catch (err) {
    next(err)
  }
}

// GET /api/payments/me
export const getMyPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('id, month, amount, utr_number, status, submitted_at, approved_at')
      .eq('member_id', req.user!.id)
      .order('month', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
}

// GET /api/payments/pending  (admin only)
export const getPending = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('id, month, amount, utr_number, status, submitted_at, members(name, flat_number, tower)')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (err) {
    next(err)
  }
}

// PATCH /api/payments/:id/approve  (admin only)
export const approvePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id }     = req.params
    const { action } = req.body as { action: 'approve' | 'reject' }

    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ error: "Action must be 'approve' or 'reject'" })
      return
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    const { data, error } = await supabase
      .from('payments')
      .update({ status: newStatus, approved_at: new Date().toISOString(), approved_by: req.user!.id })
      .eq('id', id)
      .select('*, members(id, name, flat_number)')
      .single()

    if (error) throw error

    const msg = action === 'approve'
      ? `Your payment for ${data.month} has been approved!`
      : `Your payment for ${data.month} was rejected. Please contact admin or resubmit.`

    await sendNotification({ userId: data.members.id }, msg)
    res.json({ message: `Payment ${newStatus}`, payment: data })
  } catch (err) {
    next(err)
  }
}
