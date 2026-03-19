import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../config/supabase.js';
import { sendNotification } from '../services/notificationService.js';

const signToken = (user) =>
  jwt.sign(
    { id: user.id, flatNumber: user.flat_number, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, phone, flatNumber, tower, password } = req.body;

    if (!name || !phone || !flatNumber || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from('members')
      .insert({ name, phone, flat_number: flatNumber, tower, password_hash: passwordHash, role: 'member', status: 'pending' })
      .select('id, name, flat_number, role, status')
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Phone number already registered' });
      throw error;
    }

    // Notify all admins of new registration
    await sendNotification({ role: 'admin' }, `New member request: ${name} (Flat ${flatNumber})`);

    res.status(201).json({ message: 'Registration submitted. Admin will approve shortly.', user: data });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const { data: user, error } = await supabase
      .from('members')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.status === 'pending') return res.status(403).json({ error: 'Account pending admin approval' });
    if (user.status === 'inactive') return res.status(403).json({ error: 'Account inactive. Contact admin.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user);
    res.json({ token, user: { id: user.id, name: user.name, flatNumber: user.flat_number, role: user.role } });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('id, name, phone, flat_number, tower, role, status, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
};


// PATCH /api/auth/:id/approve  (admin only)
export const approveUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('members')
      .update({ status: 'active' })
      .eq('id', id)
      .select('id, name, flat_number')
      .single();

    if (error) throw error;

    // Notify the newly approved member
    await sendNotification({ userId: id }, `Welcome to the gym, ${data.name}! Your account is now active.`);

    res.json({ message: 'Member approved', user: data });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/members?status=pending  (admin only)
// Returns all members, optionally filtered by status
export const getMembers = async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('members')
      .select('id, name, phone, flat_number, tower, role, status, current_streak, created_at')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/fcm-token
// Saves the device FCM token so we can send push notifications to this device
export const saveFCMToken = async (req, res, next) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ error: 'FCM token is required' })

    await supabase
      .from('members')
      .update({ fcm_token: token, updated_at: new Date().toISOString() })
      .eq('id', req.user.id)

    res.json({ message: 'FCM token saved' })
  } catch (err) {
    next(err)
  }
}