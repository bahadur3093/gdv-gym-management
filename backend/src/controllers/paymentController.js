import supabase from '../config/supabase.js';
import { generateUPIDeepLink } from '../services/upiService.js';
import { sendNotification } from '../services/notificationService.js';

// GET /api/payments/upi-link
// Generates a UPI deep link pre-filled with member's ID in the remarks
export const generateUPILink = async (req, res, next) => {
  try {
    const { id, flatNumber, name } = req.user;
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    // Remark format: GYM-FLAT203-JUN2025 — unique per member per month
    const monthTag = new Date(month + '-01')
      .toLocaleString('en-IN', { month: 'short', year: 'numeric' })
      .replace(' ', '')
      .toUpperCase();

    const remark = `GYM-FLAT${flatNumber}-${monthTag}`;

    const link = generateUPIDeepLink({
      upiId: process.env.SOCIETY_UPI_ID,
      name: process.env.SOCIETY_NAME,
      amount: process.env.GYM_FEE_AMOUNT,
      remark,
    });

    res.json({ link, remark, amount: process.env.GYM_FEE_AMOUNT, month });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/submit
// Member submits UTR number after paying via UPI
export const submitPayment = async (req, res, next) => {
  try {
    const memberId = req.user.id;
    const { utrNumber, month, amount } = req.body;

    if (!utrNumber || !month) {
      return res.status(400).json({ error: 'UTR number and month are required' });
    }

    // Validate UTR format — 12 digits
    if (!/^\d{12}$/.test(utrNumber)) {
      return res.status(400).json({ error: 'UTR must be exactly 12 digits' });
    }

    // Check for duplicate UTR submission
    const { data: duplicate } = await supabase
      .from('payments')
      .select('id')
      .eq('utr_number', utrNumber)
      .single();

    if (duplicate) {
      return res.status(409).json({ error: 'This UTR number has already been submitted' });
    }

    // Check if already paid for this month
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('member_id', memberId)
      .eq('month', month)
      .single();

    if (existingPayment?.status === 'approved') {
      return res.status(409).json({ error: `Payment for ${month} is already approved` });
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        member_id: memberId,
        month,
        amount: amount || process.env.GYM_FEE_AMOUNT,
        utr_number: utrNumber,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Notify all admins
    await sendNotification(
      { role: 'admin' },
      `Payment submitted by ${req.user.name} (Flat ${req.user.flatNumber}) for ${month}. UTR: ${utrNumber}`
    );

    res.status(201).json({ message: 'Payment submitted for verification', payment: data });
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/me
export const getMyPayments = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('id, month, amount, utr_number, status, submitted_at, approved_at')
      .eq('member_id', req.user.id)
      .order('month', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// GET /api/payments/pending  (admin only)
export const getPending = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('id, month, amount, utr_number, status, submitted_at, members(name, flat_number, tower)')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true }); // oldest first

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/payments/:id/approve  (admin only)
export const approvePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const { data, error } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        approved_at: new Date().toISOString(),
        approved_by: req.user.id,
      })
      .eq('id', id)
      .select('*, members(id, name, flat_number)')
      .single();

    if (error) throw error;

    // Notify the member of approval or rejection
    const msg = action === 'approve'
      ? `Your payment for ${data.month} has been approved. All good!`
      : `Your payment for ${data.month} was rejected. Please contact admin or resubmit.`;

    await sendNotification({ userId: data.members.id }, msg);

    res.json({ message: `Payment ${newStatus}`, payment: data });
  } catch (err) {
    next(err);
  }
};
