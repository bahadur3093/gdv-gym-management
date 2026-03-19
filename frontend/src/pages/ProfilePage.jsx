import { useAuth }  from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { useAttendance } from '../hooks/useAttendance'
import PageHeader from '../components/PageHeader'
import styles     from './ProfilePage.module.css'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const { data } = useAttendance()

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'ME'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className='page'>
      <div className={styles.inner}>
        <PageHeader greeting='Your' title='Profile' />

        {/* Avatar */}
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.name}>{user?.name}</div>
          <div className={styles.flat}>Flat {user?.flat_number}{user?.tower ? ` · Tower ${user.tower}` : ''}</div>
          <span className='badge badge-success' style={{ marginTop: 10 }}>ACTIVE MEMBER</span>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <div className={styles.statVal} style={{ color: 'var(--accent)' }}>
              {user?.current_streak ?? 0}
            </div>
            <div className={styles.statLbl}>Day streak</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statVal} style={{ color: 'var(--accent2)' }}>
              {user?.longest_streak ?? 0}
            </div>
            <div className={styles.statLbl}>Best streak</div>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <div className={styles.statVal}>
              {data?.stats?.percentage ?? 0}%
            </div>
            <div className={styles.statLbl}>This month</div>
          </div>
        </div>

        {/* Info card */}
        <div className='card' style={{ margin: '0 20px 16px' }}>
          <div className={styles.infoRow}>
            <div className={styles.infoLbl}>Phone</div>
            <div className={styles.infoVal}>{user?.phone}</div>
          </div>
          <div className='divider' />
          <div className={styles.infoRow}>
            <div className={styles.infoLbl}>Flat number</div>
            <div className={styles.infoVal}>
              {user?.flat_number}{user?.tower ? `, Tower ${user.tower}` : ''}
            </div>
          </div>
          <div className='divider' />
          <div className={styles.infoRow}>
            <div className={styles.infoLbl}>Member since</div>
            <div className={styles.infoVal}>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                : '—'}
            </div>
          </div>
          <div className='divider' />
          <div className={styles.infoRow}>
            <div className={styles.infoLbl}>Role</div>
            <div className={styles.infoVal} style={{ textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>

        {/* Settings card */}
        <div className='card' style={{ margin: '0 20px 16px' }}>
          {/* Theme toggle */}
          <button className={styles.settingRow} onClick={toggle}>
            <span className={styles.settingIcon}>🌓</span>
            <span className={styles.settingLabel}>Appearance</span>
            <span className={styles.settingValue}>
              {theme === 'light' ? 'Light mode' : 'Dark mode'}
            </span>
          </button>
          <div className='divider' />
          {/* Admin panel link */}
          {user?.role === 'admin' && (
            <>
              <button className={styles.settingRow} onClick={() => navigate('/admin')}>
                <span className={styles.settingIcon}>⚙️</span>
                <span className={styles.settingLabel}>Admin panel</span>
                <span style={{ color: 'var(--text3)', fontSize: 18 }}>›</span>
              </button>
              <div className='divider' />
            </>
          )}
          {/* Logout */}
          <button className={styles.settingRow} onClick={handleLogout} style={{ color: 'var(--danger)' }}>
            <span className={styles.settingIcon}>🚪</span>
            <span className={styles.settingLabel} style={{ color: 'var(--danger)' }}>Sign out</span>
          </button>
        </div>

        <div className={styles.version}>Society Gym v1.0 · Made with ❤️ for our community</div>
      </div>
    </div>
  )
}
