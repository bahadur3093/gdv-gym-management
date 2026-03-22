export type MemberRole   = 'member' | 'admin' | 'watchman'
export type MemberStatus = 'pending' | 'active' | 'inactive'
export type PaymentStatus  = 'pending' | 'approved' | 'rejected'
export type IssueStatus    = 'open' | 'in_progress' | 'resolved'
export type IssuePriority  = 'low' | 'medium' | 'high'

export interface Member {
  id:             string
  name:           string
  phone:          string
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

export interface LoginResponse {
  token: string
  user:  Pick<Member, 'id' | 'name' | 'role'>
}

export interface RegisterPayload {
  name:        string
  phone:       string
  flatNumber:  string
  tower?:      string
  password:    string
}

export interface AttendanceRecord {
  date:            string
  checked_in_at:   string
  checked_out_at?: string
  auto_checkout:   boolean
  duration_mins?:  number
}

export interface AttendanceStats {
  presentDays:  number
  daysInMonth:  number
  percentage:   number
  month:        string
}

export interface AttendanceResponse {
  attendance: AttendanceRecord[]
  stats:      AttendanceStats
}

export interface CurrentlyInMember {
  checked_in_at: string
  members: Pick<Member, 'id' | 'name' | 'flat_number' | 'tower'>
}

export interface CurrentlyInResponse {
  count:   number
  members: CurrentlyInMember[]
}

export interface TodayCheckin {
  checked_in_at:   string
  checked_out_at?: string
  duration_mins?:  number
  auto_checkout:   boolean
  members: Pick<Member, 'id' | 'name' | 'flat_number' | 'tower'>
}

export interface AttendanceHistoryResponse {
  total:   number
  records: TodayCheckin[]
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
  members?:     Pick<Member, 'name' | 'flat_number' | 'tower'>
}

export interface DuesMonth {
  month:      string
  label:      string
  fullAmount: number
  paidAmount: number
  status:     'paid' | 'partial' | 'unpaid'
  remaining:  number
  payments:   Payment[]
}

export interface DuesResponse {
  dues:            DuesMonth[]
  totalOutstanding: number
  gymFee:          number
}

export interface UPILinkResponse {
  link:   string
  remark: string
  amount: string
  month:  string
}

export interface MaintenanceIssue {
  id:          string
  reported_by: string
  title:       string
  description: string
  equipment?:  string
  priority:    IssuePriority
  status:      IssueStatus
  admin_note?: string
  updated_by?: string
  created_at:  string
  resolved_at?: string
  members?:    Pick<Member, 'name' | 'flat_number'>
}

export interface ReportIssuePayload {
  title:       string
  description: string
  equipment?:  string
  priority:    IssuePriority
}

export interface ApiError {
  error: string
}