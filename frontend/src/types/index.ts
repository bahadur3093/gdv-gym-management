// ── Member ─────────────────────────────────────────────────────
export type MemberRole   = 'member' | 'admin'
export type MemberStatus = 'pending' | 'active' | 'inactive'

export interface Member {
  id:              string
  name:            string
  phone:           string
  flat_number:     string
  tower?:          string
  role:            MemberRole
  status:          MemberStatus
  current_streak:  number
  longest_streak:  number
  fcm_token?:      string
  created_at:      string
  updated_at:      string
}

// ── Auth ───────────────────────────────────────────────────────
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

// ── Attendance ─────────────────────────────────────────────────
export interface AttendanceRecord {
  date:          string   // YYYY-MM-DD
  checked_in_at: string   // ISO timestamp
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

export interface TodayCheckin {
  checked_in_at: string
  members: Pick<Member, 'id' | 'name' | 'flat_number' | 'tower'>
}

export interface TodayAttendance {
  date:     string
  count:    number
  checkins: TodayCheckin[]
}

// ── Payments ───────────────────────────────────────────────────
export type PaymentStatus = 'pending' | 'approved' | 'rejected'

export interface Payment {
  id:           string
  member_id:    string
  month:        string   // YYYY-MM
  amount:       number
  utr_number:   string
  status:       PaymentStatus
  approved_by?: string
  approved_at?: string
  submitted_at: string
  members?:     Pick<Member, 'name' | 'flat_number' | 'tower'>
}

export interface UPILinkResponse {
  link:   string
  remark: string
  amount: string
  month:  string
}

// ── Maintenance ────────────────────────────────────────────────
export type IssueStatus   = 'open' | 'in_progress' | 'resolved'
export type IssuePriority = 'low' | 'medium' | 'high'

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

// ── API generic ────────────────────────────────────────────────
export interface ApiError {
  error: string
}
