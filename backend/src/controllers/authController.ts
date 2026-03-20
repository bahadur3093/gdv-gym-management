import { Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AuthRequest, Member, MemberRole, MemberStatus } from '../types/index.js'
import supabase from '../config/supabase.js'
import { sendNotification } from '../services/notificationService.js'

const signToken = (user: Pick<Member, 'id' | 'name' | 'role' | 'flat_number'>): string =>
  jwt.sign(
    { id: user.id, flatNumber: user.flat_number, role: user.role, name: user.name },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  )

export const register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, phone, flatNumber, tower, password } = req.body as {
      name: string; phone: string; flatNumber: string; tower?: string; password: string
    }
    if (!name || !phone || !flatNumber || !password) {
      res.status(400).json({ error: 'All fields are required' }); return
    }
    const passwordHash = await bcrypt.hash(password, 12)
    const { data, error } = await supabase
      .from('members')
      .insert({ name, phone, flat_number: flatNumber, tower, password_hash: passwordHash, role: 'member' as MemberRole, status: 'pending' as MemberStatus })
      .select('id, name, flat_number, role, status')
      .single()
    if (error) {
      if (error.code === '23505') { res.status(409).json({ error: 'Phone number already registered' }); return }
      throw error
    }
    await sendNotification({ role: 'admin' }, `New member request: ${name} (Villa ${flatNumber})`)
    res.status(201).json({ message: 'Registration submitted. Admin will approve shortly.', user: data })
  } catch (err) { next(err) }
}

export const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone, password } = req.body as { phone: string; password: string }
    const { data: user, error } = await supabase.from('members').select('*').eq('phone', phone).single<Member>()
    if (error || !user)           { res.status(401).json({ error: 'Invalid credentials' }); return }
    if (user.status === 'pending') { res.status(403).json({ error: 'Account pending admin approval' }); return }
    if (user.status === 'inactive'){ res.status(403).json({ error: 'Account inactive. Contact admin.' }); return }
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) { res.status(401).json({ error: 'Invalid credentials' }); return }
    const token = signToken(user)
    res.json({ token, user: { id: user.id, name: user.name, flatNumber: user.flat_number, role: user.role } })
  } catch (err) { next(err) }
}

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('id, name, phone, flat_number, tower, role, status, current_streak, longest_streak, created_at')
      .eq('id', req.user.id)
      .single()
    if (error) throw error
    res.json(data)
  } catch (err) { next(err) }
}

export const approveUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params
    const { data, error } = await supabase.from('members').update({ status: 'active' }).eq('id', id).select('id, name, flat_number').single()
    if (error) throw error
    await sendNotification({ userId: id }, `Welcome to the gym, ${data.name}! Your account is now active.`)
    res.json({ message: 'Member approved', user: data })
  } catch (err) { next(err) }
}

export const getMembers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.query as { status?: MemberStatus }
    let query = supabase.from('members').select('id, name, phone, flat_number, tower, role, status, current_streak, created_at').order('created_at', { ascending: false })
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    res.json(data)
  } catch (err) { next(err) }
}

export const saveFCMToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body as { token: string }
    if (!token) { res.status(400).json({ error: 'FCM token is required' }); return }
    await supabase.from('members').update({ fcm_token: token, updated_at: new Date().toISOString() }).eq('id', req.user.id)
    res.json({ message: 'FCM token saved' })
  } catch (err) { next(err) }
}
