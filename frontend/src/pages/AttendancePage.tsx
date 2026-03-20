import { useState } from 'react'
import { useAttendance } from '@/hooks/useAttendance'
import { useToast }      from '@/context/ToastContext'
import { AxiosError }    from 'axios'
import { ApiError }      from '@/types'
import PageHeader from '@/components/PageHeader'
import StatCard   from '@/components/StatCard'

const DAYS        = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const currentMonth = new Date().toISOString().slice(0, 7)
const todayStr     = new Date().toISOString().split('T')[0]

type DayStatus = 'present' | 'absent' | 'today' | 'today-present' | 'future' | 'empty'

export default function AttendancePage() {
  const [month, setMonth]       = useState(currentMonth)
  const { data, loading, checkIn } = useAttendance(month)
  const { showToast }           = useToast()
  const [checking, setChecking] = useState(false)

  const presentDates = new Set(data?.attendance?.map(a => a.date) || [])

  const handleCheckIn = async () => {
    setChecking(true)
    try {
      await checkIn()
      showToast('Checked in successfully!')
      window.location.reload()
    } catch (err) {
      const error = err as AxiosError<ApiError>
      showToast(error.response?.data?.error || 'Check-in failed', 'error')
    } finally {
      setChecking(false)
    }
  }

  const buildCalendar = (): (number | null)[] => {
    const [y, m] = month.split('-').map(Number)
    const firstDay    = new Date(y, m - 1, 1).getDay()
    const daysInMonth = new Date(y, m, 0).getDate()
    const offset      = (firstDay + 6) % 7
    return [
      ...Array(offset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]
  }

  const cells = buildCalendar()
  const todayCheckedIn = presentDates.has(todayStr)

  const getDayStatus = (day: number | null): DayStatus => {
    if (!day) return 'empty'
    const dateStr = `${month}-${String(day).padStart(2, '0')}`
    if (dateStr === todayStr) return presentDates.has(dateStr) ? 'today-present' : 'today'
    if (dateStr > todayStr) return 'future'
    return presentDates.has(dateStr) ? 'present' : 'absent'
  }

  const changeMonth = (delta: number) => {
    const d = new Date(month + '-02')
    d.setMonth(d.getMonth() + delta)
    if (d <= new Date()) setMonth(d.toISOString().slice(0, 7))
  }

  return (
    <div className="min-h-[100dvh]">
      <div className="px-6">
        <PageHeader
          greeting="Track your"
          title="Attendance"
          right={
            <div className="flex items-center gap-2 bg-[var(--bg3)] border border-[var(--border)] rounded-[12px] px-2.5 py-1.5 text-[13px] font-semibold">
              <button
                className="bg-transparent border-none text-[16px] text-[var(--text2)] px-1 transition-colors duration-200 hover:text-[var(--accent)] disabled:opacity-30"
                onClick={() => changeMonth(-1)}
              >‹</button>
              <span>{new Date(month + '-02').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
              <button
                className="bg-transparent border-none text-[16px] text-[var(--text2)] px-1 transition-colors duration-200 hover:text-[var(--accent)] disabled:opacity-30"
                onClick={() => changeMonth(1)}
                disabled={month >= currentMonth}
              >›</button>
            </div>
          }
        />

        {month === currentMonth && (
          <div className="pb-5">
            {todayCheckedIn ? (
              <div className="flex items-center gap-2.5 bg-[rgba(0,229,160,0.08)] border border-[rgba(0,229,160,0.2)] rounded-[14px] px-4 py-3 text-[14px] font-medium text-[var(--accent)]">
                <span>✅</span>
                <span>
                  Checked in today — {
                    data?.attendance?.find(a => a.date === todayStr)?.checked_in_at
                      ? new Date(data!.attendance.find(a => a.date === todayStr)!.checked_in_at)
                          .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                      : ''
                  }
                </span>
              </div>
            ) : (
              <button
                className="w-full bg-[var(--accent)] text-[#0D1117] border-none rounded-[14px] px-4 py-3 font-['Open Sans'] text-[15px] font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,229,160,0.35)] disabled:opacity-40"
                onClick={handleCheckIn}
                disabled={checking}
              >
                {checking ? <span className="spinner w-5 h-5" /> : '📍 Check in now'}
              </button>
            )}
          </div>
        )}

        {!loading && data?.stats && (
          <div className="grid grid-cols-2 gap-2.5 pb-5">
            <StatCard icon="🔥" iconBg="rgba(255,181,71,0.15)"
              value={data.stats.presentDays} valueColor="var(--accent)" label="Days present" />
            <StatCard icon="📅" iconBg="rgba(0,200,255,0.15)"
              value={`${data.stats.percentage}%`} valueColor="var(--accent2)" label="Attendance rate" />
          </div>
        )}

        {/* Calendar */}
        <div className="mb-5 bg-[var(--bg2)] border border-[var(--border)] rounded-[20px] p-4 shadow-[var(--shadow)]">
          <div className="grid grid-cols-7 gap-0 mb-2">
            {DAYS.map((d, i) => (
              <div key={i} className="text-center text-[11px] font-bold text-[var(--text3)] tracking-wider py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {loading
              ? Array(35).fill(0).map((_, i) => (
                  <div key={i} className="skeleton aspect-square rounded-lg" />
                ))
              : cells.map((day, i) => {
                  const status = getDayStatus(day)
                  let statusClasses = ''
                  if (status === 'future') statusClasses = 'text-[var(--text3)] opacity-40'
                  else if (status === 'present') statusClasses = 'bg-[rgba(0,229,160,0.15)] text-[var(--accent)] border border-[rgba(0,229,160,0.3)]'
                  else if (status === 'absent') statusClasses = 'bg-[rgba(255,92,92,0.08)] text-[var(--danger)]'
                  else if (status === 'today') statusClasses = 'bg-[var(--bg3)] text-[var(--text)] border border-[var(--border)]'
                  else if (status === 'today-present') statusClasses = 'bg-[var(--accent)] text-[#0D1117]'

                  return (
                    <div key={i} className={`aspect-square flex items-center justify-center rounded-[10px] text-[12px] font-semibold ${day ? statusClasses : ''}`}>
                      {day ?? ''}
                    </div>
                  )
                })
            }
          </div>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text2)]">
            <span className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-[3px] bg-[rgba(0,229,160,0.4)]" />Present</span>
            <span className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-[3px] bg-[rgba(255,92,92,0.3)]" />Absent</span>
            <span className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-[3px] bg-[var(--accent)]" />Today</span>
          </div>
        </div>

        {!loading && (data?.attendance?.length ?? 0) > 0 && (
          <>
            <div className="mb-3">
              <span className="font-['Open Sans'] text-[16px] font-bold">Recent check-ins</span>
            </div>
            <div className="mb-5 bg-[var(--bg2)] border border-[var(--border)] rounded-[20px] shadow-[var(--shadow)]">
              {data!.attendance.slice(0, 10).map((a, i) => (
                <div
                  key={a.date}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < 9 ? '1px solid var(--border)' : 'none' }}
                >
                  <div className="flex-1 text-[13px] font-medium">
                    {new Date(a.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div className="text-[12px] text-[var(--text2)] mr-2">
                    {new Date(a.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span className="bg-[rgba(0,229,160,0.12)] text-[var(--accent)] px-2 py-1 rounded-full text-[11px] font-semibold">IN</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
