import { useNavigate } from 'react-router-dom'
import { useAuth }      from '../context/AuthContext'
import { useAttendance } from '../hooks/useAttendance'
import { usePayments }   from '../hooks/usePayments'
import { useMaintenance } from '../hooks/useMaintenance'
import PageHeader from '../components/PageHeader'
import StatCard   from '../components/StatCard'
import styles     from './HomePage.module.css'

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

  return (
    <div className='page'>
      <div className={styles.inner}>
        <PageHeader
          greeting={greeting()}
          title={firstName}
          titleAccent='👋'
          right={
            <button className={styles.notifBtn} onClick={() => navigate('/admin')}>
              <svg width='18' height='18' fill='none' stroke='currentColor' strokeWidth='2' viewBox='0 0 24 24'>
                <path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'/>
                <path d='M13.73 21a2 2 0 0 1-3.46 0'/>
              </svg>
              {user?.role === 'admin' && <span className={styles.notifDot} />}
            </button>
          }
        />

        {/* Membership card */}
        <div className={styles.memberCard}>
          <div className={styles.mcTop}>
            <span className={styles.mcBadge}>ACTIVE MEMBER</span>
            <span style={{ fontSize: 20 }}>🏋️</span>
          </div>
          <div className={styles.mcName}>{user?.name}</div>
          <div className={styles.mcFlat}>
            Flat {user?.flat_number}{user?.tower ? ` · Tower ${user.tower}` : ''}
          </div>
          <div className={styles.mcBottom}>
            <div>
              <div className={styles.mcDueLbl}>NEXT DUE</div>
              <div className={styles.mcDueVal}>
                {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
                  .toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div className={styles.mcStreak}>
              <div className={styles.mcStreakNum}>{user?.current_streak ?? 0}</div>
              <div className={styles.mcStreakLbl}>day streak 🔥</div>
            </div>
          </div>
          <div className={styles.mcProgress}>
            <div className={styles.mcProgressLbl}>
              <span>Attendance this month</span>
              <span>{stats?.presentDays ?? 0}/{stats?.daysInMonth ?? 30} days</span>
            </div>
            <div className={styles.mcProgressBar}>
              <div
                className={styles.mcProgressFill}
                style={{ width: `${stats?.percentage ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsGrid}>
          <StatCard
            icon='📅'
            iconBg='rgba(0,229,160,0.15)'
            value={stats?.presentDays ?? '—'}
            valueColor='var(--accent)'
            label='Days this month'
          />
          <StatCard
            icon='💳'
            iconBg='rgba(0,200,255,0.15)'
            value={thisMonthPayment?.status === 'approved' ? 'Paid' : 'Pending'}
            valueColor={thisMonthPayment?.status === 'approved' ? 'var(--accent)' : 'var(--warn)'}
            label='This month dues'
          />
          <StatCard
            icon='🔧'
            iconBg='rgba(255,181,71,0.15)'
            value={openIssues}
            valueColor={openIssues > 0 ? 'var(--warn)' : 'var(--accent)'}
            label='Open issues'
          />
        </div>

        {/* Quick actions */}
        <div className={styles.sectionHead}>
          <span className='section-title'>Quick actions</span>
        </div>
        <div className={styles.qaGrid}>
          <div className={styles.qaCard} onClick={() => navigate('/attendance')}>
            <div className={styles.qaIcon}>📊</div>
            <div className={styles.qaTitle}>Attendance</div>
            <div className={styles.qaSub}>View your log</div>
            <div className={styles.qaVal} style={{ color: 'var(--accent)' }}>
              {stats?.percentage ?? 0}%
            </div>
          </div>
          <div className={styles.qaCard} onClick={() => navigate('/payments')}>
            <div className={styles.qaIcon}>💸</div>
            <div className={styles.qaTitle}>Payments</div>
            <div className={styles.qaSub}>
              {thisMonthPayment?.status === 'approved' ? 'All paid up' : 'Due this month'}
            </div>
            <div className={styles.qaVal} style={{ color: 'var(--warn)' }}>₹500</div>
          </div>
          <div className={styles.qaCard} onClick={() => navigate('/maintenance')}>
            <div className={styles.qaIcon}>🔧</div>
            <div className={styles.qaTitle}>Issues</div>
            <div className={styles.qaSub}>Report equipment</div>
            <div className={styles.qaVal} style={{ color: 'var(--danger)' }}>{openIssues}</div>
          </div>
          <div className={styles.qaCard} onClick={() => navigate('/profile')}>
            <div className={styles.qaIcon}>👤</div>
            <div className={styles.qaTitle}>Profile</div>
            <div className={styles.qaSub}>Settings & info</div>
            <div className={styles.qaVal} style={{ color: 'var(--accent2)' }}>
              {user?.flat_number}
            </div>
          </div>
        </div>

        {/* Admin quick link */}
        {user?.role === 'admin' && (
          <div className={styles.adminBanner} onClick={() => navigate('/admin')}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Admin panel</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                Approve members, payments & manage issues
              </div>
            </div>
            <span style={{ color: 'var(--text3)', fontSize: 18, marginLeft: 'auto' }}>›</span>
          </div>
        )}
      </div>
    </div>
  )
}
