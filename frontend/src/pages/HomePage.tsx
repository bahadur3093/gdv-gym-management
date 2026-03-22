import { useState } from 'react'
import { useNavigate }     from 'react-router-dom'
import { useAuth }         from '@/context/AuthContext'
import { useAttendance, useCurrentlyIn, useMySession } from '@/hooks/useAttendance'
import { usePayments }     from '@/hooks/usePayments'
import { useMaintenance }  from '@/hooks/useMaintenance'
import { useToast }        from '@/context/ToastContext'
import { AxiosError }      from 'axios'
import { ApiError }        from '@/types'
import PageHeader          from '@/components/PageHeader'
import StatCard            from '@/components/StatCard'

const currentMonth = new Date().toISOString().slice(0, 7)
const todayStr     = new Date().toISOString().split('T')[0]

export default function HomePage() {
  const { user }      = useAuth()
  const navigate      = useNavigate()
  const { showToast } = useToast()
  const { data: attendanceData, checkIn, checkOut, reload } = useAttendance(currentMonth)
  const { data: currentlyIn, reload: reloadCurrent } = useCurrentlyIn()
  const { isCheckedIn, openSession } = useMySession(user?.id)
  const { payments }           = usePayments()
  const { issues }             = useMaintenance()
  const [actioning, setActioning] = useState(false)

  const thisMonthPayment = payments.find(p => p.month === currentMonth && p.status === 'approved')
  const openIssues       = issues.filter(i => i.status !== 'resolved').length
  const stats            = attendanceData?.stats
  const isMember         = user?.role === 'member'

  // isCheckedIn and openSession come from useMySession (live /current endpoint)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning,'
    if (h < 17) return 'Good afternoon,'
    return 'Good evening,'
  }

  const firstName = user?.name?.split(' ')[0] || 'there'

  const nextDue = new Date(
    new Date().getFullYear(), new Date().getMonth() + 1, 1
  ).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  const refreshAll = () => Promise.all([reload(), reloadCurrent()])

  const handleCheckIn = async () => {
    setActioning(true)
    try {
      await checkIn()
      await refreshAll()
      showToast('Checked in! Have a great workout 💪')
    } catch (err) {
      const e = err as AxiosError<ApiError>
      showToast(e.response?.data?.error || 'Check-in failed', 'error')
    } finally {
      setActioning(false)
    }
  }

  const handleCheckOut = async () => {
    setActioning(true)
    try {
      await checkOut()
      await refreshAll()
      showToast('Checked out! See you next time 👋')
    } catch (err) {
      const e = err as AxiosError<ApiError>
      showToast(e.response?.data?.error || 'Check-out failed', 'error')
    } finally {
      setActioning(false)
    }
  }

  const qaItems = [
    { icon: '📊', title: 'Attendance', sub: 'View your log',    val: `${stats?.percentage ?? 0}%`, color: 'var(--accent)',   path: '/attendance'  },
    { icon: '💸', title: 'Payments',   sub: 'Dues & history',   val: '₹500',                       color: 'var(--warn)',     path: '/payments'    },
    { icon: '🔧', title: 'Issues',     sub: 'Report equipment', val: String(openIssues),            color: 'var(--danger)',  path: '/maintenance' },
    { icon: '👤', title: 'Profile',    sub: 'Settings & info',  val: `V${user?.flat_number ?? ''}`, color: 'var(--accent2)', path: '/profile'     },
  ]

  return (
    <div className="min-h-dvh">
      <div className="px-6 mx-auto">

        <PageHeader
          greeting={greeting()}
          title={firstName}
          titleAccent="👋"
          right={
            user?.role === 'admin' ? (
              <button
                onClick={() => navigate('/admin')}
                className="relative w-[42px] h-[42px] flex items-center justify-center rounded-[13px] transition-all duration-200 cursor-pointer hover:opacity-80"
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)' }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="absolute top-2 right-2 w-[7px] h-[7px] rounded-full" style={{ background: 'var(--accent)', border: '2px solid var(--bg3)' }} />
              </button>
            ) : undefined
          }
        />

        {/* ── Membership card ── */}
        <div className="mb-5 rounded-[20px] p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0F2E26 0%, #0A1F2E 100%)', border: '1px solid rgba(0,229,160,0.2)', boxShadow: '0 8px 32px rgba(0,229,160,0.1)' }}>
          <div className="absolute pointer-events-none rounded-full"
            style={{ top: -40, right: -40, width: 160, height: 160, background: 'radial-gradient(circle, rgba(0,229,160,0.15) 0%, transparent 70%)' }} />
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full tracking-widest"
              style={{ background: 'rgba(0,229,160,0.2)', color: '#00E5A0', border: '1px solid rgba(0,229,160,0.3)' }}>
              ACTIVE MEMBER
            </span>
            <span className="text-xl">🏋️</span>
          </div>
          <div className="mt-3 mb-1 text-xl font-bold text-white">{user?.name}</div>
          <div className="text-sm mb-[18px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Villa {user?.flat_number}{user?.tower ? ` · Zone ${user.tower}` : ''}
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>NEXT DUE</div>
              <div className="text-sm font-bold" style={{ color: '#FFB547' }}>{nextDue}</div>
            </div>
            <div className="text-right">
              <div className="text-[28px] font-extrabold leading-none" style={{ color: '#00E5A0' }}>
                {user?.current_streak ?? 0}
              </div>
              <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>day streak 🔥</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[11px] mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span>Attendance this month</span>
              <span>{stats?.presentDays ?? 0}/{stats?.daysInMonth ?? 30} days</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${stats?.percentage ?? 0}%`, background: 'linear-gradient(90deg, #00E5A0, #00C8FF)' }} />
            </div>
          </div>
        </div>

        {/* ── Check in / out button (members only) ── */}
        {isMember && (
          <div className="mb-5">
            {isCheckedIn ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 rounded-[14px] px-4 py-3"
                  style={{ background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)' }}>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                    Checked in at {openSession ? new Date(openSession.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <button
                  onClick={handleCheckOut}
                  disabled={actioning}
                  className="w-full rounded-[14px] py-4 text-sm font-bold transition-all duration-200 flex items-center justify-content-center gap-2 justify-center"
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  {actioning ? <span className="spinner w-5 h-5" /> : '🚪 Check out'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={actioning}
                className="w-full rounded-[14px] py-4 text-base font-bold transition-all duration-200 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                style={{ background: 'var(--accent)', color: '#0D1117', boxShadow: '0 4px 20px rgba(0,229,160,0.3)' }}>
                {actioning ? <span className="spinner w-5 h-5" /> : '📍 Check in to gym'}
              </button>
            )}
          </div>
        )}

        {/* ── Who's in the gym ── */}
        {(currentlyIn?.count ?? 0) > 0 && (
          <div className="mb-5 rounded-[16px] p-4" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                  {currentlyIn!.count} {currentlyIn!.count === 1 ? 'person' : 'people'} in gym
                </span>
              </div>
              <span className="text-xs" style={{ color: 'var(--text3)' }}>right now</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {currentlyIn!.members.map((m, i) => (
                <div key={i} className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                    {m.members.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>
                    V{m.members.flat_number}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Stats ── */}
        {isMember && (
          <div className="grid grid-cols-3 gap-2.5 pb-5">
            <StatCard icon="📅" iconBg="rgba(0,229,160,0.15)" value={stats?.presentDays ?? '—'} valueColor="var(--accent)" label="Days this month" />
            <StatCard icon="💳" iconBg="rgba(0,200,255,0.15)"
              value={thisMonthPayment ? 'Paid' : 'Pending'}
              valueColor={thisMonthPayment ? 'var(--accent)' : 'var(--warn)'}
              label="This month" />
            <StatCard icon="🔧" iconBg="rgba(255,181,71,0.15)" value={openIssues}
              valueColor={openIssues > 0 ? 'var(--warn)' : 'var(--accent)'} label="Open issues" />
          </div>
        )}

        {/* ── Quick actions ── */}
        {isMember && (
          <>
            <div className="mb-3">
              <span className="text-base font-bold" style={{ color: 'var(--text)' }}>Quick actions</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pb-5">
              {qaItems.map(item => (
                <div key={item.path} onClick={() => navigate(item.path)}
                  className="rounded-[14px] p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                  <div className="text-2xl mb-2.5">{item.icon}</div>
                  <div className="text-sm font-bold mb-0.5" style={{ color: 'var(--text)' }}>{item.title}</div>
                  <div className="text-[11px] mb-2.5" style={{ color: 'var(--text2)' }}>{item.sub}</div>
                  <div className="text-[22px] font-extrabold" style={{ color: item.color }}>{item.val}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── Admin shortcut ── */}
        {user?.role === 'admin' && (
          <div onClick={() => navigate('/admin')}
            className="mb-5 rounded-[14px] px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, rgba(0,200,255,0.08), rgba(0,229,160,0.06))', border: '1px solid rgba(0,200,255,0.2)' }}>
            <span className="text-xl">⚡</span>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Admin panel</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>Approve members, payments & manage issues</div>
            </div>
            <span className="ml-auto text-lg" style={{ color: 'var(--text3)' }}>›</span>
          </div>
        )}

      </div>
    </div>
  )
}