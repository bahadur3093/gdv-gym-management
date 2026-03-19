import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Layout.module.css'

const NAV_ITEMS = [
  { path: '/',            icon: '🏠', label: 'Home'    },
  { path: '/attendance',  icon: '📊', label: 'Attend'  },
  { path: '/payments',    icon: '💸', label: 'Pay'     },
  { path: '/maintenance', icon: '🔧', label: 'Issues'  },
  { path: '/profile',     icon: '👤', label: 'Profile' },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user }  = useAuth()

  return (
    <div className={styles.shell}>
      {/* Page content renders here */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* Floating bottom nav */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                className={`${styles.navItem} ${active ? styles.active : ''}`}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
              >
                <span className={styles.iconWrap}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
