import { useState, useEffect } from 'react'
import { useAuth }  from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useNavigate } from 'react-router-dom'
import { usePendingPayments } from '@/hooks/usePayments'
import { useMaintenance }     from '@/hooks/useMaintenance'
import { Member, TodayCheckin } from '@/types'
import PageHeader from '@/components/PageHeader'
import StatCard   from '@/components/StatCard'
import api        from '@/utils/api'

type Tab = 'overview' | 'members' | 'payments' | 'attendance'

export default function AdminPage() {
  const { user }      = useAuth()
  const { showToast } = useToast()
  const navigate      = useNavigate()

  const { pending, loading: paymentsLoading, approve } = usePendingPayments()
  const { issues } = useMaintenance('open')

  const [pendingMembers, setPendingMembers] = useState<Member[]>([])
  const [tab, setTab] = useState<Tab>('overview')

  // Attendance history state
  const [records, setRecords]       = useState<TodayCheckin[]>([])
  const [attLoading, setAttLoading] = useState(false)
  const [attTotal, setAttTotal]     = useState(0)
  const [filters, setFilters]       = useState({ from: '', to: '', villa: '' })
  const [page, setPage]             = useState(0)
  const LIMIT = 20

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

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (tab !== 'attendance') return
    loadAttendance()
  }, [tab, filters, page])

  const loadAttendance = async () => {
    setAttLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(page * LIMIT),
        ...(filters.from  && { from: filters.from }),
        ...(filters.to    && { to: filters.to }),
        ...(filters.villa && { villa: filters.villa }),
      })
      const res = await api.get<{ total: number; records: TodayCheckin[] }>(`/attendance/history?${params}`)
      setRecords(res.data.records)
      setAttTotal(res.data.total)
    } catch {
      showToast('Failed to load attendance', 'error')
    } finally {
      setAttLoading(false)
    }
  }

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

  const formatDuration = (mins?: number) => {
    if (!mins) return '—'
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const TABS: { val: Tab; label: string }[] = [
    { val: 'overview',   label: 'Overview'   },
    { val: 'members',    label: 'Members'    },
    { val: 'payments',   label: 'Payments'   },
    { val: 'attendance', label: 'Attendance' },
  ]

  return (
    <div className="min-h-dvh pb-28">
      <div className="px-6">
        <PageHeader greeting="Admin" title="Dashboard" />

        <div className="grid grid-cols-3 gap-2.5 pb-5">
          <StatCard icon="💸" iconBg="rgba(255,181,71,0.15)" value={pending.length}
            valueColor={pending.length > 0 ? 'var(--warn)' : 'var(--accent)'} label="Pending payments" />
          <StatCard icon="👤" iconBg="rgba(255,92,92,0.12)" value={pendingMembers.length}
            valueColor={pendingMembers.length > 0 ? 'var(--danger)' : 'var(--accent)'} label="Pending members" />
          <StatCard icon="🔧" iconBg="rgba(255,181,71,0.12)" value={issues.length}
            valueColor={issues.length > 0 ? 'var(--warn)' : 'var(--accent)'} label="Open issues" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 pb-4 overflow-x-auto no-scrollbar">
          {TABS.map(t => (
            <button key={t.val}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: tab === t.val ? 'var(--text)' : 'var(--bg2)',
                color:      tab === t.val ? 'var(--bg)'   : 'var(--text2)',
                border: `1px solid ${tab === t.val ? 'var(--text)' : 'var(--border)'}`,
              }}
              onClick={() => { setTab(t.val); setPage(0) }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="flex flex-col gap-3">
            {pendingMembers.length > 0 && (
              <div className="rounded-[14px] px-4 py-3.5 flex items-center gap-3 cursor-pointer"
                style={{ background: 'rgba(255,92,92,0.06)', border: '1px solid rgba(255,92,92,0.2)' }}
                onClick={() => setTab('members')}>
                <span>⚠️</span>
                <span className="text-sm"><b>{pendingMembers.length} member{pendingMembers.length > 1 ? 's' : ''}</b> waiting for approval</span>
                <span className="ml-auto text-xs font-bold" style={{ color: 'var(--accent)' }}>Review →</span>
              </div>
            )}
            {pending.length > 0 && (
              <div className="rounded-[14px] px-4 py-3.5 flex items-center gap-3 cursor-pointer"
                style={{ background: 'rgba(255,181,71,0.07)', border: '1px solid rgba(255,181,71,0.3)' }}
                onClick={() => setTab('payments')}>
                <span>💸</span>
                <span className="text-sm"><b>{pending.length} payment{pending.length > 1 ? 's' : ''}</b> awaiting verification</span>
                <span className="ml-auto text-xs font-bold" style={{ color: 'var(--accent)' }}>Review →</span>
              </div>
            )}
            {pendingMembers.length === 0 && pending.length === 0 && (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">✅</div>
                <div className="text-base font-bold" style={{ color: 'var(--text)' }}>All caught up!</div>
                <div className="text-sm mt-1" style={{ color: 'var(--text2)' }}>No pending approvals</div>
              </div>
            )}
          </div>
        )}

        {/* Members */}
        {tab === 'members' && (
          <div className="rounded-[20px] overflow-hidden" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            {pendingMembers.length === 0
              ? <div className="p-7 text-center text-sm" style={{ color: 'var(--text2)' }}>No pending member requests</div>
              : pendingMembers.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: i < pendingMembers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div className="w-11 h-11 rounded-[13px] flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--accent)' }}>
                      {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{m.name}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--text2)' }}>
                        Villa {m.flat_number}{m.tower ? ` · Zone ${m.tower}` : ''} · {m.phone}
                      </div>
                    </div>
                    <button onClick={() => approveMember(m.id)}
                      className="rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all hover:opacity-80"
                      style={{ background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.3)', color: 'var(--accent)' }}>
                      Approve
                    </button>
                  </div>
                ))
            }
          </div>
        )}

        {/* Payments */}
        {tab === 'payments' && (
          <div className="rounded-[20px] overflow-hidden" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
            {paymentsLoading
              ? <div className="p-7 text-center text-sm" style={{ color: 'var(--text2)' }}>Loading...</div>
              : pending.length === 0
              ? <div className="p-7 text-center text-sm" style={{ color: 'var(--text2)' }}>No pending payments 🎉</div>
              : pending.map((p, i) => (
                  <div key={p.id} className="px-4 py-3.5"
                    style={{ borderBottom: i < pending.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{p.members?.name}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text2)' }}>
                          Villa {p.members?.flat_number} · {new Date(p.month + '-02').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                          {p.is_partial && <span className="ml-1 font-semibold" style={{ color: 'var(--warn)' }}> · Partial</span>}
                        </div>
                        <div className="text-xs mt-1" style={{ fontFamily: 'monospace', color: 'var(--accent2)' }}>
                          UTR: {p.utr_number}
                        </div>
                        {p.reason && (
                          <div className="text-[11px] mt-1 italic" style={{ color: 'var(--text2)' }}>
                            "{p.reason}"
                          </div>
                        )}
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
                          ₹{p.amount} · {new Date(p.submitted_at).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <button onClick={() => handlePayment(p.id, 'approve')}
                          className="rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:opacity-80"
                          style={{ background: 'rgba(0,229,160,0.12)', border: '1px solid rgba(0,229,160,0.3)', color: 'var(--accent)' }}>
                          ✓ Approve
                        </button>
                        <button onClick={() => handlePayment(p.id, 'reject')}
                          className="rounded-xl px-3 py-1.5 text-xs font-bold transition-all hover:opacity-80"
                          style={{ background: 'rgba(255,92,92,0.1)', border: '1px solid rgba(255,92,92,0.3)', color: 'var(--danger)' }}>
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        )}

        {/* Attendance history */}
        {tab === 'attendance' && (
          <div className="px-6">
            {/* Filters */}
            <div className="flex flex-col gap-2 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text3)' }}>From</label>
                  <input type="date" value={filters.from}
                    onChange={e => { setFilters(f => ({ ...f, from: e.target.value })); setPage(0) }}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text3)' }}>To</label>
                  <input type="date" value={filters.to}
                    onChange={e => { setFilters(f => ({ ...f, to: e.target.value })); setPage(0) }}
                    className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </div>
              </div>
              <input type="text" placeholder="Filter by villa number"
                value={filters.villa}
                onChange={e => { setFilters(f => ({ ...f, villa: e.target.value })); setPage(0) }}
                className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            </div>

            {/* Records */}
            <div className="rounded-[20px] overflow-hidden mb-4" style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
              {attLoading
                ? Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-16 mx-4 my-2 rounded-xl" />)
                : records.length === 0
                ? <div className="p-7 text-center text-sm" style={{ color: 'var(--text2)' }}>No records found</div>
                : records.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3"
                      style={{ borderBottom: i < records.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0"
                        style={{ background: 'var(--bg3)', color: 'var(--accent)' }}>
                        {r.members?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{r.members?.name}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text2)' }}>
                          Villa {r.members?.flat_number} · {new Date(r.checked_in_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium">
                          {new Date(r.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          {r.checked_out_at && ` – ${new Date(r.checked_out_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                        </div>
                        <div className="text-[11px]" style={{ color: r.auto_checkout ? 'var(--warn)' : 'var(--text3)' }}>
                          {formatDuration(r.duration_mins)}{r.auto_checkout ? ' · auto' : ''}
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>

            {/* Pagination */}
            {attTotal > LIMIT && (
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  ← Prev
                </button>
                <span className="text-sm" style={{ color: 'var(--text2)' }}>
                  {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, attTotal)} of {attTotal}
                </span>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= attTotal}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
                  style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}