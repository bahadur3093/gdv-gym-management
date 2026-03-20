import { Request } from 'express'

export type MemberRole   = 'member' | 'admin'
export type MemberStatus = 'pending' | 'active' | 'inactive'

export interface Member {
  id:             string
  name:           string
  phone:          string
  flat_number:    string
  tower?:         string
  role:           MemberRole
  status:         MemberStatus
  password_hash:  string
  current_streak: number
  longest_streak: number
  fcm_token?:     string
  created_at:     string
  updated_at:     string
}

export interface JwtPayload {
  id:         string
  flatNumber: string
  role:       MemberRole
  name:       string
}

export interface AuthRequest extends Request {
  user: JwtPayload
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected'
export type IssueStatus   = 'open' | 'in_progress' | 'resolved'
export type IssuePriority = 'low' | 'medium' | 'high'
