export type MemberRole   = 'member' | 'admin' | 'watchman'
export type MemberStatus = 'pending' | 'active' | 'inactive'
export type PaymentStatus  = 'pending' | 'approved' | 'rejected'
export type IssueStatus    = 'open' | 'in_progress' | 'resolved'
export type IssuePriority  = 'low' | 'medium' | 'high'

export interface Member {
  id:             string
  name:           string
  phone:          string
  password_hash:  string
  flat_number:    string
  tower?:         string
  role:           MemberRole
  status:         MemberStatus
  current_streak: number
  longest_streak: number
  fcm_token?:     string
  created_at:     string
  updated_at:     string
}

export interface JWTPayload {
  id:          string
  flatNumber:  string
  role:        MemberRole
  name:        string
}

export interface AttendanceRecord {
  id:              string
  member_id:       string
  date:            string
  checked_in_at:   string
  checked_out_at?: string
  auto_checkout:   boolean
  duration_mins?:  number
}

export interface Payment {
  id:           string
  member_id:    string
  month:        string
  amount:       number
  utr_number:   string
  status:       PaymentStatus
  reason?:      string
  is_partial:   boolean
  approved_by?: string
  approved_at?: string
  submitted_at: string
}

export interface DuesMonth {
  month:        string          // YYYY-MM
  label:        string          // e.g. "March 2025"
  fullAmount:   number          // e.g. 500
  paidAmount:   number          // total approved payments for this month
  status:       'paid' | 'partial' | 'unpaid'
  remaining:    number
  payments:     Payment[]
}

export interface MaintenanceIssue {
  id:           string
  reported_by:  string
  title:        string
  description:  string
  equipment?:   string
  priority:     IssuePriority
  status:       IssueStatus
  admin_note?:  string
  updated_by?:  string
  created_at:   string
  resolved_at?: string
}