import { useState } from 'react'
import { useAttendance } from '../hooks/useAttendance'
import { useToast }      from '../context/ToastContext'
import PageHeader from '../components/PageHeader'
import StatCard   from '../components/StatCard'
import styles     from './AttendancePage.module.css'

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const currentMonth = new Date().toISOString().slice(0, 7)
const todayStr     = new Date().toISOString().split('T')[0]

export default function AttendancePage() {
  const [month, setMonth]     = useState(currentMonth)
  const { data, loading, checkIn } = useAttendance(month)
  const { showToast }         = useToast()
  const [checking, setChecking] = useState(false)

  const presentDates = new Set(data?.attendance?.map(a => a.date) || [])

  const handleCheckIn = async () => {
    setChecking(true)
    try {
      await checkIn()
      showToast('Checked in successfully!')
      window.location.reload()
    } catch (err) {
      showToast(err.response?.data?.error || 'Check-in failed', 'error')
    } finally {
      setChecking(false)
    }
  }

  // Build calendar grid for selected month
  const buildCalendar = () => {
    const [y, m] = month.split('-').map(Number)
    const firstDay = new Date(y, m - 1, 1).getDay() // 0=Sun
    const daysInMonth = new Date(y, m, 0).getDate()
    // Adjust so week starts Monday
    const offset = (firstDay + 6) % 7
    const cells = []
    for (let i = 0; i < offset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return cells
  }

  const cells = buildCalendar()
  const [y, m] = month.split('-').map(Number)

  const getDayStatus = (day) => {
    if (!day) return 'empty'
    const dateStr = `${month}-${String(day).padStart(2, '0')}`
    if (dateStr === todayStr) return presentDates.has(dateStr) ? 'today-present' : 'today'
    if (dateStr > todayStr) return 'future'
    return presentDates.has(dateStr) ? 'present' : 'absent'
  }

  const todayCheckedIn = presentDates.has(todayStr)

  return (
    <div className='page'>
      <div className={styles.inner}>
        <PageHeader
          greeting='Track your'
          title='Attendance'
          right={
            <div className={styles.monthPicker}>
              <button onClick={() => {
                const d = new Date(month + '-01')
                d.setMonth(d.getMonth() - 1)
                setMonth(d.toISOString().slice(0, 7))
              }}>‹</button>
              <span>{new Date(month + '-02').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
              <button onClick={() => {
                const d = new Date(month + '-01')
                d.setMonth(d.getMonth() + 1)
                if (d <= new Date()) setMonth(d.toISOString().slice(0, 7))
              }} disabled={month >= currentMonth}>›</button>
            </div>
          }
        />

        {/* Check-in button — only show for current month */}
        {month === currentMonth && (
          <div className={styles.checkinWrap}>
            {todayCheckedIn ? (
              <div className={styles.checkinDone}>
                <span>✅</span>
                <span>Checked in today — {
                  data?.attendance?.find(a => a.date === todayStr)
                    ?.checked_in_at
                    ? new Date(data.attendance.find(a => a.date === todayStr).checked_in_at)
                        .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                    : ''
                }</span>
              </div>
            ) : (
              <button className='btn btn-primary' onClick={handleCheckIn} disabled={checking}>
                {checking ? <span className='spinner' /> : '📍 Check in now'}
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        {!loading && data?.stats && (
          <div className={styles.statsGrid}>
            <StatCard icon='🔥' iconBg='rgba(255,181,71,0.15)' value={data.stats.presentDays}
              valueColor='var(--accent)' label='Days present' />
            <StatCard icon='📅' iconBg='rgba(0,200,255,0.15)' value={`${data.stats.percentage}%`}
              valueColor='var(--accent2)' label='Attendance rate' />
          </div>
        )}

        {/* Calendar */}
        <div className={styles.calCard}>
          <div className={styles.dayHeaders}>
            {DAYS.map((d, i) => <div key={i} className={styles.dayLbl}>{d}</div>)}
          </div>
          <div className={styles.calGrid}>
            {loading
              ? Array(35).fill(0).map((_, i) => (
                  <div key={i} className={`skeleton ${styles.dayCell}`} style={{ height: 36 }} />
                ))
              : cells.map((day, i) => {
                  const status = getDayStatus(day)
                  return (
                    <div key={i} className={`${styles.dayCell} ${day ? styles[status] : styles.empty}`}>
                      {day || ''}
                    </div>
                  )
                })
            }
          </div>
          {/* Legend */}
          <div className={styles.legend}>
            <span className={`${styles.legendDot} ${styles.legendPresent}`} /> Present
            <span className={`${styles.legendDot} ${styles.legendAbsent}`}  /> Absent
            <span className={`${styles.legendDot} ${styles.legendToday}`}   /> Today
          </div>
        </div>

        {/* Recent log */}
        {!loading && data?.attendance?.length > 0 && (
          <>
            <div className={styles.sectionHead}>
              <span className='section-title'>Recent check-ins</span>
            </div>
            <div className='card' style={{ margin: '0 20px 20px' }}>
              {data.attendance.slice(0, 10).map((a, i) => (
                <div key={a.date} className={styles.logItem}
                  style={{ borderBottom: i < 9 ? '1px solid var(--border)' : 'none' }}>
                  <div className={styles.logDate}>
                    {new Date(a.date + 'T00:00:00').toLocaleDateString('en-IN',
                      { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div className={styles.logTime}>
                    {new Date(a.checked_in_at).toLocaleTimeString('en-IN',
                      { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span className='badge badge-success'>IN</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
