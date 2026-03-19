import { useState, useEffect } from 'react'
import { useAuth }  from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useNavigate } from 'react-router-dom'
import { usePendingPayments } from '../hooks/usePayments'
import { useMaintenance }     from '../hooks/useMaintenance'
import { useTodayAttendance } from '../hooks/useAttendance'
import PageHeader from '../components/PageHeader'
import StatCard   from '../components/StatCard'
import styles     from './AdminPage.module.css'
import api        from '../utils/api'

export default function AdminPage() {
  const { user }    = useAuth()
  const { showToast } = useToast()
  const navigate    = useNavigate()

  const { pending, loading: paymentsLoading, approve } = usePendingPayments()
  const { issues, updateStatus } = useMaintenance('open')
  const { data: todayData, loading: attendanceLoading } = useTodayAttendance()

  const [pendingMembers, setPendingMembers] = useState([])
  const [tab, setTab] = useState('overview')

  // Redirect non-admins
  if (user?.role !== 'admin') {
    navigate('/', { replace: true })
    return null
  }

  useEffect(() => {
    api.get('/auth/members?status=pending')
      .catch(() => {})
      .then(res => res && setPendingMembers(res.data || []))
  }, [])

  const approveMember = async (id) => {
    try {
      await api.patch(`/auth/${id}/approve`)
      setPendingMembers(m => m.filter(x => x.id !== id))
      showToast('Member approved!')
    } catch {
      showToast('Failed to approve member', 'error')
    }
  }

  const handlePayment = async (id, action) => {
    try {
      await approve(id, action)
      showToast(`Payment ${action === 'approve' ? 'approved' : 'rejected'}`)
    } catch {
      showToast('Failed to update payment', 'error')
    }
  }

  const TABS = ['overview', 'members', 'payments', 'attendance']

  return (
    <div className='page'>
      <div className={styles.inner}>
        <PageHeader greeting='Admin' title='Dashboard' />

        {/* Overview stats */}
        <div className={styles.statsGrid}>
          <StatCard icon='👥' iconBg='rgba(0,200,255,0.15)' value={todayData?.count ?? '—'}
            valueColor='var(--accent2)' label='In gym today' />
          <StatCard icon='💸' iconBg='rgba(255,181,71,0.15)' value={pending.length}
            valueColor={pending.length > 0 ? 'var(--warn)' : 'var(--accent)'} label='Pending payments' />
          <StatCard icon='👤' iconBg='rgba(255,92,92,0.12)' value={pendingMembers.length}
            valueColor={pendingMembers.length > 0 ? 'var(--danger)' : 'var(--accent)'} label='Pending members' />
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {tab === 'overview' && (
          <div>
            {pendingMembers.length > 0 && (
              <div className={styles.alertBanner}>
                <span>⚠️</span>
                <span><b>{pendingMembers.length} member{pendingMembers.length > 1 ? 's' : ''}</b> waiting for approval</span>
                <button onClick={() => setTab('members')}>Review →</button>
              </div>
            )}
            {pending.length > 0 && (
              <div className={styles.alertBanner} style={{ borderColor: 'rgba(255,181,71,0.3)', background: 'rgba(255,181,71,0.07)' }}>
                <span>💸</span>
                <span><b>{pending.length} payment{pending.length > 1 ? 's' : ''}</b> awaiting verification</span>
                <button onClick={() => setTab('payments')}>Review →</button>
              </div>
            )}
            {pendingMembers.length === 0 && pending.length === 0 && (
              <div className={styles.allGood}>
                <div style={{ fontSize: 40 }}>✅</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginTop: 12 }}>All caught up!</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>No pending approvals</div>
              </div>
            )}
          </div>
        )}

        {/* ── Members tab ── */}
        {tab === 'members' && (
          <div className='card' style={{ margin: '0 20px' }}>
            {pendingMembers.length === 0 ? (
              <div className={styles.empty}>No pending member requests</div>
            ) : (
              pendingMembers.map((m, i) => (
                <div key={m.id} className={styles.memberItem}
                  style={{ borderBottom: i < pendingMembers.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className={styles.memberAvatar}>
                    {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberName}>{m.name}</div>
                    <div className={styles.memberMeta}>Flat {m.flat_number}{m.tower ? ` · Tower ${m.tower}` : ''} · {m.phone}</div>
                    <div className={styles.memberMeta}>
                      Registered {new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <button className={styles.approveBtn} onClick={() => approveMember(m.id)}>
                    Approve
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Payments tab ── */}
        {tab === 'payments' && (
          <div className='card' style={{ margin: '0 20px' }}>
            {paymentsLoading ? (
              <div className={styles.empty}>Loading...</div>
            ) : pending.length === 0 ? (
              <div className={styles.empty}>No pending payments 🎉</div>
            ) : (
              pending.map((p, i) => (
                <div key={p.id} className={styles.payItem}
                  style={{ borderBottom: i < pending.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className={styles.payInfo}>
                    <div className={styles.payName}>{p.members?.name}</div>
                    <div className={styles.payMeta}>Flat {p.members?.flat_number} · {new Date(p.month + '-02').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
                    <div className={styles.payUtr}>UTR: {p.utr_number}</div>
                    <div className={styles.payMeta}>₹{p.amount} · Submitted {new Date(p.submitted_at).toLocaleDateString('en-IN')}</div>
                  </div>
                  <div className={styles.payActions}>
                    <button className={styles.approveBtn} onClick={() => handlePayment(p.id, 'approve')}>✓</button>
                    <button className={styles.rejectBtn}  onClick={() => handlePayment(p.id, 'reject')}>✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Attendance tab ── */}
        {tab === 'attendance' && (
          <div className='card' style={{ margin: '0 20px' }}>
            <div className={styles.attendHeader}>
              Today · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              <span className='badge badge-info'>{todayData?.count ?? 0} members</span>
            </div>
            {attendanceLoading ? (
              <div className={styles.empty}>Loading...</div>
            ) : !todayData?.checkins?.length ? (
              <div className={styles.empty}>No check-ins today yet</div>
            ) : (
              todayData.checkins.map((c, i) => (
                <div key={i} className={styles.checkinRow}
                  style={{ borderBottom: i < todayData.checkins.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className={styles.checkinAvatar}>
                    {c.members?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{c.members?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>Flat {c.members?.flat_number}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>
                    {new Date(c.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
