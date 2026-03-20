import { useNavigate } from 'react-router-dom'
import { useAuth }       from '@/context/AuthContext'
import { useAttendance } from '@/hooks/useAttendance'
import { usePayments }   from '@/hooks/usePayments'
import { useMaintenance } from '@/hooks/useMaintenance'
import PageHeader from '@/components/PageHeader'
import StatCard   from '@/components/StatCard'

const currentMonth = new Date().toISOString().slice(0, 7)

export default function HomePage() {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const { data: attendanceData } = useAttendance(currentMonth)
  const { payments }             = usePayments()
  const { issues }               = useMaintenance()

  const thisMonthPayment = payments.find(p => p.month === currentMonth)
  const openIssues       = issues.filter(i => i.status !== 'resolved').length
  const stats            = attendanceData?.stats

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning,'
    if (h < 17) return 'Good afternoon,'
    return 'Good evening,'
  }

  const firstName = user?.name?.split(' ')[0] || 'there'

  const nextDue = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    1
  ).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-[100dvh]">
      <div className="px-6">
        <PageHeader
          greeting={greeting()}
          title={firstName}
          titleAccent="👋"
          right={
            <button
              className="w-10 h-10 bg-[var(--bg3)] border border-[var(--border)] rounded-[13px] flex items-center justify-center text-[var(--text2)] relative transition-all duration-300 cursor-pointer hover:bg-[var(--bg4)]"
              onClick={() => navigate('/admin')}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {user?.role === 'admin' && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[var(--accent)] rounded-full border-2 border-[var(--bg3)]" />}
            </button>
          }
        />

        {/* Membership card */}
        <div className="my-5 bg-gradient-to-br from-[#0F2E26] to-[#0A1F2E] rounded-[28px] p-5 relative overflow-hidden border border-[rgba(0,229,160,0.2)] shadow-[0_8px_32px_rgba(0,229,160,0.1)]">
          <div className="flex justify-between items-start">
            <span className="bg-[rgba(0,229,160,0.2)] text-[#00E5A0] text-[10px] font-bold py-1 px-2.5 rounded-full border border-[rgba(0,229,160,0.3)] tracking-widest">ACTIVE MEMBER</span>
            <span className="text-xl">🏋️</span>
          </div>
          <div className="font-['Open Sans'] text-[20px] font-bold text-white my-3">{user?.name}</div>
          {/* Villa label — no block */}
          <div className="text-[13px] text-[rgba(255,255,255,0.5)] mb-4">
            Villa {user?.flat_number}
            {user?.tower ? ` · Zone ${user.tower}` : ''}
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[11px] text-[rgba(255,255,255,0.4)] mb-1">NEXT DUE</div>
              <div className="font-['Open Sans'] text-sm font-bold text-[#FFB547]">{nextDue}</div>
            </div>
            <div className="text-right">
              <div className="font-['Open Sans'] text-[28px] font-extrabold text-[#00E5A0] leading-tight">{user?.current_streak ?? 0}</div>
              <div className="text-[11px] text-[rgba(255,255,255,0.4)]">day streak 🔥</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5 text-[rgba(255,255,255,0.4)]">
              <span>Attendance this month</span>
              <span>{stats?.presentDays ?? 0}/{stats?.daysInMonth ?? 30} days</span>
            </div>
            <div className="h-1 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00E5A0] to-[#00C8FF] rounded-full transition-all duration-500"
                style={{ width: `${stats?.percentage ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5 pb-5">
          <StatCard icon="📅" iconBg="rgba(0,229,160,0.15)"
            value={stats?.presentDays ?? '—'} valueColor="var(--accent)" label="Days this month" />
          <StatCard icon="💳" iconBg="rgba(0,200,255,0.15)"
            value={thisMonthPayment?.status === 'approved' ? 'Paid' : 'Pending'}
            valueColor={thisMonthPayment?.status === 'approved' ? 'var(--accent)' : 'var(--warn)'}
            label="This month" />
          <StatCard icon="🔧" iconBg="rgba(255,181,71,0.15)"
            value={openIssues}
            valueColor={openIssues > 0 ? 'var(--warn)' : 'var(--accent)'}
            label="Open issues" />
        </div>

        {/* Quick actions */}
        <div className="mb-3">
          <span className="font-['Open Sans'] text-base font-bold">Quick actions</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 pb-5">
          {[
            { icon: '📊', title: 'Attendance', sub: 'View your log',   val: `${stats?.percentage ?? 0}%`, color: 'var(--accent)',  path: '/attendance'  },
            { icon: '💸', title: 'Payments',   sub: 'Due this month',  val: '₹500',                       color: 'var(--warn)',    path: '/payments'    },
            { icon: '🔧', title: 'Issues',     sub: 'Report equipment', val: String(openIssues),          color: 'var(--danger)', path: '/maintenance' },
            { icon: '👤', title: 'Profile',    sub: 'Settings & info', val: `V${user?.flat_number ?? ''}`, color: 'var(--accent2)', path: '/profile'   },
          ].map(item => (
            <div
              key={item.path}
              className="bg-[var(--bg2)] border border-[var(--border)] rounded-[14px] p-4 cursor-pointer transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[var(--shadow)] active:translate-y-0"
              onClick={() => navigate(item.path)}
            >
              <div className="text-2xl mb-2.5">{item.icon}</div>
              <div className="font-['Open Sans'] text-[14px] font-bold mb-1">{item.title}</div>
              <div className="text-[11px] text-[var(--text2)] mb-2">{item.sub}</div>
              <div className="font-['Open Sans'] text-2xl font-extrabold" style={{ color: item.color }}>{item.val}</div>
            </div>
          ))}
        </div>

        {/* Admin panel link */}
        {user?.role === 'admin' && (
          <div
            className="mb-5 bg-gradient-to-br from-[rgba(0,200,255,0.08)] to-[rgba(0,229,160,0.06)] border border-[rgba(0,200,255,0.2)] rounded-[14px] p-4 flex items-center gap-3 cursor-pointer transition-all duration-300 hover:from-[rgba(0,200,255,0.14)] hover:to-[rgba(0,229,160,0.1)]"
            onClick={() => navigate('/admin')}
          >
            <span className="text-xl">⚡</span>
            <div>
              <div className="font-semibold text-sm">Admin panel</div>
              <div className="text-xs mt-0.5 text-[var(--text2)]">
                Approve members, payments & manage issues
              </div>
            </div>
            <span className="ml-auto text-lg text-[var(--text3)]">›</span>
          </div>
        )}
      </div>
    </div>
  )
}
