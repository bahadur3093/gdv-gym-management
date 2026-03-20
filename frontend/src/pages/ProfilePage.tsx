import { useAuth }  from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { useAttendance } from '@/hooks/useAttendance'
import PageHeader from '@/components/PageHeader'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate  = useNavigate()
  const { data }  = useAttendance()

  const initials = user?.name
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ME'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const infoRows = [
    { label: 'Phone',        val: user?.phone },
    { label: 'Villa number', val: `Villa ${user?.flat_number}${user?.tower ? `, Zone ${user.tower}` : ''}` },
    { label: 'Member since', val: user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : '—' },
    { label: 'Role',         val: user?.role, capitalize: true },
  ]

  return (
    <div className="min-h-[100dvh]">
      <div className="px-6">
        <PageHeader greeting="Your" title="Profile" />

        {/* Avatar */}
        <div className="flex flex-col items-center pb-6">
          <div className="h-20 w-20 rounded-[24px] bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] flex items-center justify-center font-['Open Sans'] text-[28px] font-extrabold text-[#0D1117] mb-3">
            {initials}
          </div>
          <div className="font-['Open Sans'] text-[22px] font-bold text-[var(--text1)]">{user?.name}</div>
          <div className="text-[13px] text-[var(--text2)] mt-1">
            Villa {user?.flat_number}{user?.tower ? ` · Zone ${user.tower}` : ''}
          </div>
          <span className="mt-2.5 bg-[rgba(0,229,160,0.12)] text-[var(--accent)] text-[11px] font-bold px-3.5 py-1 rounded-[20px] border border-[rgba(0,229,160,0.3)] tracking-wider">
            ACTIVE MEMBER
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center mb-4 bg-[var(--bg2)] border border-[var(--border)] rounded-[16px] p-4 shadow-[var(--shadow)]">
          <div className="flex-1 text-center">
            <div className="font-['Open Sans'] text-[24px] font-extrabold" style={{ color: 'var(--accent)' }}>
              {user?.current_streak ?? 0}
            </div>
            <div className="text-[11px] text-[var(--text2)] mt-1">Day streak</div>
          </div>
          <div className="h-9 w-px bg-[var(--border)]" />
          <div className="flex-1 text-center">
            <div className="font-['Open Sans'] text-[24px] font-extrabold" style={{ color: 'var(--accent2)' }}>
              {user?.longest_streak ?? 0}
            </div>
            <div className="text-[11px] text-[var(--text2)] mt-1">Best streak</div>
          </div>
          <div className="h-9 w-px bg-[var(--border)]" />
          <div className="flex-1 text-center">
            <div className="font-['Open Sans'] text-[24px] font-extrabold">{data?.stats?.percentage ?? 0}%</div>
            <div className="text-[11px] text-[var(--text2)] mt-1">This month</div>
          </div>
        </div>

        {/* Info card */}
        <div className="mb-4 bg-[var(--bg2)] border border-[var(--border)] rounded-[20px] shadow-[var(--shadow)]">
          {infoRows.map((row, i) => (
            <div key={row.label}>
              <div className="flex justify-between px-4 py-3">
                <div className="text-[11px] font-semibold text-[var(--text3)] uppercase tracking-[0.05em]">
                  {row.label}
                </div>
                <div className={`text-[14px] font-medium ${row.capitalize ? 'capitalize' : ''}`}>
                  {row.val ?? '—'}
                </div>
              </div>
              {i < infoRows.length - 1 && <div className="h-px bg-[var(--border)]" />}
            </div>
          ))}
        </div>

        {/* Settings card */}
        <div className="mb-4 bg-[var(--bg2)] border border-[var(--border)] rounded-[20px] shadow-[var(--shadow)]">
          {user?.role === 'admin' && (
            <>
              <button
                className="flex items-center gap-3 w-full px-4 py-3 text-left transition-colors duration-150 hover:bg-[var(--bg3)]"
                onClick={() => navigate('/admin')}
              >
                <span className="text-[20px]">⚙️</span>
                <span className="flex-1 text-[14px] font-medium text-[var(--text)]">Admin panel</span>
                <span className="text-[18px] text-[var(--text3)]">›</span>
              </button>
              <div className="h-px bg-[var(--border)]" />
            </>
          )}

          <div className="h-px bg-[var(--border)]" />
          <button
            className="flex items-center gap-3 w-full px-4 py-3 text-left transition-colors duration-150 hover:bg-[var(--bg3)] text-[var(--danger)]"
            onClick={handleLogout}
          >
            <span className="text-[20px]">🚪</span>
            <span className="flex-1 text-[14px] font-medium" style={{ color: 'var(--danger)' }}>
              Sign out
            </span>
          </button>
        </div>

        <div className="text-center text-[12px] text-[var(--text3)] pb-5">
          GDV Gym v2.0
        </div>
      </div>
    </div>
  )
}
