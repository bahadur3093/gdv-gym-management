import { useState, useEffect } from 'react'
import { useAuth }  from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useNavigate } from 'react-router-dom'
import { usePendingPayments } from '@/hooks/usePayments'
import { useMaintenance }     from '@/hooks/useMaintenance'
import { useTodayAttendance } from '@/hooks/useAttendance'
import { Member } from '@/types'
import PageHeader from '@/components/PageHeader'
import StatCard   from '@/components/StatCard'
import api        from '@/utils/api'

type Tab = 'overview' | 'members' | 'payments' | 'attendance'

export default function AdminPage() {
  const { user }      = useAuth()
  const { showToast } = useToast()
  const navigate      = useNavigate()

  const { pending, loading: paymentsLoading, approve } = usePendingPayments()
  const { issues, updateStatus } = useMaintenance('open')
  const { data: todayData, loading: attendanceLoading } = useTodayAttendance()

  const [pendingMembers, setPendingMembers] = useState<Member[]>([])
  const [tab, setTab] = useState<Tab>('overview')

  if (user?.role !== 'admin') {
    navigate('/', { replace: true })
    return null
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    api.get<Member[]>('/auth/members?status=pending')
      .then(res => setPendingMembers(res.data))
      .catch(() => {})
  }, [])

  const approveMember = async (id: string) => {
    try {
      await api.patch(`/auth/${id}/approve`)
      setPendingMembers(m => m.filter(x => x.id !== id))
      showToast('Member approved!')
    } catch {
      showToast('Failed to approve member', 'error')
    }
  }

  const handlePayment = async (id: string, action: 'approve' | 'reject') => {
    try {
      await approve(id, action)
      showToast(`Payment ${action === 'approve' ? 'approved' : 'rejected'}`)
    } catch {
      showToast('Failed to update payment', 'error')
    }
  }

  const TABS: { val: Tab; label: string }[] = [
    { val: 'overview',   label: 'Overview'   },
    { val: 'members',    label: 'Members'    },
    { val: 'payments',   label: 'Payments'   },
    { val: 'attendance', label: 'Attendance' },
  ]

  return (
    <div className="min-h-[100dvh]">
      <div className="px-6">
        <PageHeader greeting="Admin" title="Dashboard" />

        <div className="grid grid-cols-3 gap-2.5 pb-5">
          <StatCard icon="👥" iconBg="rgba(0,200,255,0.15)"
            value={todayData?.count ?? '—'} valueColor="var(--accent2)" label="In gym today" />
          <StatCard icon="💸" iconBg="rgba(255,181,71,0.15)"
            value={pending.length}
            valueColor={pending.length > 0 ? 'var(--warn)' : 'var(--accent)'} label="Pending payments" />
          <StatCard icon="👤" iconBg="rgba(255,92,92,0.12)"
            value={pendingMembers.length}
            valueColor={pendingMembers.length > 0 ? 'var(--danger)' : 'var(--accent)'} label="Pending members" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2.5 pb-4 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button
              key={t.val}
              className={`flex-shrink-0 px-3.5 py-2 rounded-[20px] text-[13px] font-semibold transition-colors duration-200 ${tab === t.val ? 'bg-[var(--text)] text-[var(--bg)] border border-[var(--text)]' : 'bg-[var(--bg2)] border border-[var(--border)] text-[var(--text2)]'}`}
              onClick={() => setTab(t.val)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div>
            {pendingMembers.length > 0 && (
              <div className="mb-3 bg-[rgba(255,92,92,0.06)] border border-[rgba(255,92,92,0.2)] rounded-[14px] px-4 py-3 flex items-center gap-2 text-[13px]">
                <span>⚠️</span>
                <span><b>{pendingMembers.length} member{pendingMembers.length > 1 ? 's' : ''}</b> waiting for approval</span>
                <button className="ml-auto bg-transparent border-none text-[var(--accent)] font-semibold whitespace-nowrap" onClick={() => setTab('members')}>Review →</button>
              </div>
            )}
            {pending.length > 0 && (
              <div className="mb-3 bg-[rgba(255,181,71,0.07)] border border-[rgba(255,181,71,0.3)] rounded-[14px] px-4 py-3 flex items-center gap-2 text-[13px]">
                <span>💸</span>
                <span><b>{pending.length} payment{pending.length > 1 ? 's' : ''}</b> awaiting verification</span>
                <button className="ml-auto bg-transparent border-none text-[var(--accent)] font-semibold whitespace-nowrap" onClick={() => setTab('payments')}>Review →</button>
              </div>
            )}
            {pendingMembers.length === 0 && pending.length === 0 && (
              <div className="text-center py-10">
                <div className="text-5xl">✅</div>
                <div className="font-['Open Sans'] text-[16px] font-bold mt-3">All caught up!</div>
                <div className="text-sm mt-1 text-[var(--text2)]">No pending approvals</div>
              </div>
            )}
          </div>
        )}

        {/* Members */}
        {tab === 'members' && (
          <div className="mb-5 bg-[var(--bg2)] border border-[var(--border)] rounded-[20px] shadow-[var(--shadow)]">
            {pendingMembers.length === 0
              ? <div className="p-7 text-center text-[14px] text-[var(--text2)]">No pending member requests</div>
              : pendingMembers.map((m, i) => (
                  <div key={m.id} className="flex items-start gap-3 px-4 py-4" style={{ borderBottom: i < pendingMembers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div className="h-10 w-10 rounded-full bg-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--text1)]">
                      {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[15px] text-[var(--text1)] truncate">{m.name}</div>
                      <div className="text-[13px] text-[var(--text2)]">Villa {m.flat_number}{m.tower ? ` · Zone ${m.tower}` : ''} · {m.phone}</div>
                      <div className="text-[12px] text-[var(--text3)]">Registered {new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <button onClick={() => approveMember(m.id)} className="rounded-[10px] px-3 py-1.5 text-[12px] font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)]">Approve</button>
                  </div>
                ))
            }
          </div>
        )}

        {/* Payments */}
        {tab === 'payments' && (
          <div className="mb-5 bg-[var(--bg2)] border border-[var(--border)] rounded-[20px] shadow-[var(--shadow)]">
            {paymentsLoading
              ? <div className="p-7 text-center text-[14px] text-[var(--text2)]">Loading...</div>
              : pending.length === 0
              ? <div className="p-7 text-center text-[14px] text-[var(--text2)]">No pending payments 🎉</div>
              : pending.map((p, i) => (
                  <div key={p.id} className="flex items-start justify-between gap-3 px-4 py-4" style={{ borderBottom: i < pending.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold text-[var(--text1)] truncate">{p.members?.name}</div>
                      <div className="text-[13px] text-[var(--text2)]">Villa {p.members?.flat_number} · {new Date(p.month + '-02').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
                      <div className="text-[13px] text-[var(--text3)]">UTR: {p.utr_number}</div>
                      <div className="text-[13px] text-[var(--text2)]">₹{p.amount} · {new Date(p.submitted_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button onClick={() => handlePayment(p.id, 'approve')} className="rounded-[10px] px-3 py-1.5 text-[14px] font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)]">✓</button>
                      <button onClick={() => handlePayment(p.id, 'reject')} className="rounded-[10px] px-3 py-1.5 text-[14px] font-semibold text-white bg-[var(--danger)] hover:bg-[var(--danger-dark)]">✕</button>
                    </div>
                  </div>
                ))
            }
          </div>
        )}

        {/* Attendance */}
        {tab === 'attendance' && (
          <div className="mb-5 bg-[var(--bg2)] border border-[var(--border)] rounded-[20px] shadow-[var(--shadow)]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] text-[14px] font-semibold text-[var(--text1)]">
              <span>Today · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              <span className="rounded-full bg-[var(--border)] px-2.5 py-0.5 text-[12px] font-semibold text-[var(--text2)]">{todayData?.count ?? 0} members</span>
            </div>
            {attendanceLoading
              ? <div className="p-7 text-center text-[14px] text-[var(--text2)]">Loading...</div>
              : !todayData?.checkins?.length
              ? <div className="p-7 text-center text-[14px] text-[var(--text2)]">No check-ins today yet</div>
              : todayData.checkins.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: i < todayData.checkins.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div className="h-10 w-10 rounded-full bg-[var(--border)] flex items-center justify-center text-sm font-bold text-[var(--text1)]">
                      {c.members?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[var(--text1)]">{c.members?.name}</div>
                      <div className="text-xs text-[var(--text2)]">Villa {c.members?.flat_number}</div>
                    </div>
                    <div className="ml-auto text-xs text-[var(--text3)]">
                      {new Date(c.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
            }
          </div>
        )}
      </div>
    </div>
  )
}
