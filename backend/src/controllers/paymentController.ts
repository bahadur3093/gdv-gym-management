import { Request, Response, NextFunction } from 'express'
import supabase from '../config/supabase.js'
import { generateUPIDeepLink } from '../services/upiService.js'
import { sendNotification }    from '../services/notificationService.js'
import { DuesMonth, Payment }  from '../types/index.js'

const GYM_FEE = parseInt(process.env.GYM_FEE_AMOUNT || '500')

// GET /api/payments/dues  — all months from join date with paid/partial/unpaid status
export const getDues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user!.id

    // Get member join date
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('created_at')
      .eq('id', memberId)
      .single()

    if (memberError || !member) throw memberError

    // Get all approved payments for this member
    const { data: payments, error: payError } = await supabase
      .from('payments')
      .select('*')
      .eq('member_id', memberId)
      .eq('status', 'approved')
      .order('month', { ascending: true })

    if (payError) throw payError

    // Build month list from join date to current month
    const joinDate   = new Date(member.created_at)
    const joinMonth  = `${joinDate.getFullYear()}-${String(joinDate.getMonth() + 1).padStart(2, '0')}`
    const now        = new Date()
    const nowMonth   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const dues: DuesMonth[] = []
    let cursor = new Date(joinMonth + '-01')
    const end  = new Date(nowMonth + '-01')

    while (cursor <= end) {
      const month = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
      const label = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

      const monthPayments = (payments as Payment[]).filter(p => p.month === month)
      const paidAmount    = monthPayments.reduce((sum, p) => sum + Number(p.amount), 0)
      const remaining     = Math.max(0, GYM_FEE - paidAmount)

      let status: DuesMonth['status'] = 'unpaid'
      if (paidAmount >= GYM_FEE) status = 'paid'
      else if (paidAmount > 0)   status = 'partial'

      dues.push({ month, label, fullAmount: GYM_FEE, paidAmount, status, remaining, payments: monthPayments })

      cursor.setMonth(cursor.getMonth() + 1)
    }

    const totalOutstanding = dues.reduce((sum, d) => sum + d.remaining, 0)
    res.json({ dues, totalOutstanding, gymFee: GYM_FEE })
  } catch (err) {
    next(err)
  }
}

// GET /api/payments/upi-link
export const generateUPILink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { flatNumber, name } = req.user!
    const month  = (req.query.month as string) || new Date().toISOString().slice(0, 7)
    const amount = (req.query.amount as string) || String(GYM_FEE)

    const monthTag = new Date(month + '-01')
      .toLocaleString('en-IN', { month: 'short', year: 'numeric' })
      .replace(' ', '').toUpperCase()

    const remark = `GYM-VILLA${flatNumber}-${monthTag}`
    const link   = generateUPIDeepLink({
      upiId:  process.env.SOCIETY_UPI_ID!,
      name:   process.env.SOCIETY_NAME!,
      amount,
      remark,
    })

    res.json({ link, remark, amount, month })
  } catch (err) {
    next(err)
  }
}

// POST /api/payments/submit
export const submitPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const memberId = req.user!.id
    const { utrNumber, month, amount, reason } = req.body as {
      utrNumber: string
      month:     string
      amount:    number
      reason?:   string
    }

    if (!utrNumber || !month || !amount) {
      res.status(400).json({ error: 'UTR number, month and amount are required' })
      return
    }

    if (!/^\d{12}$/.test(utrNumber)) {
      res.status(400).json({ error: 'UTR must be exactly 12 digits' })
      return
    }

    // Check duplicate UTR
    const { data: duplicate } = await supabase
      .from('payments').select('id').eq('utr_number', utrNumber).single()

    if (duplicate) {
      res.status(409).json({ error: 'This UTR has already been submitted' })
      return
    }

    const isPartial = Number(amount) < GYM_FEE

    const { data, error } = await supabase
      .from('payments')
      .insert({
        member_id:  memberId,
        month,
        amount:     Number(amount),
        utr_number: utrNumber,
        status:     'pending',
        reason:     reason || null,
        is_partial: isPartial,
      })
      .select()
      .single()

    if (error) throw error

    const amountLabel = isPartial ? `₹${amount} (partial)` : `₹${amount}`
    await sendNotification(
      { role: 'admin' },
      `Payment ${amountLabel} submitted by ${req.user!.name} (Villa ${req.user!.flatNumber}) for ${month}. UTR: ${utrNumber}${reason ? '. Reason: ' + reason : ''}`
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
      .select('id, month, amount, utr_number, status, reason, is_partial, submitted_at, approved_at')
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
      .select('id, month, amount, utr_number, status, reason, is_partial, submitted_at, members(name, flat_number, tower)')
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

    const { data, error } = await supabase
      .from('payments')
      .update({
        status:      action === 'approve' ? 'approved' : 'rejected',
        approved_at: new Date().toISOString(),
        approved_by: req.user!.id,
      })
      .eq('id', id)
      .select('*, members(id, name, flat_number)')
      .single()

    if (error) throw error

    const msg = action === 'approve'
      ? `Your payment of ₹${data.amount} for ${data.month} has been approved!`
      : `Your payment for ${data.month} was rejected. Please contact admin or resubmit.`

    await sendNotification({ userId: data.members.id }, msg)
    res.json({ message: `Payment ${action === 'approve' ? 'approved' : 'rejected'}`, payment: data })
  } catch (err) {
    next(err)
  }
}