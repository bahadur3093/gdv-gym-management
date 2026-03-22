import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { MemberRole } from '@/types'

interface NavItem {
  path:  string
  icon:  string
  label: string
  roles: MemberRole[]  // which roles see this nav item
}

const NAV_ITEMS: NavItem[] = [
  { path: '/',            icon: '🏠', label: 'Home',     roles: ['member', 'admin', 'watchman'] },
  { path: '/attendance',  icon: '📊', label: 'Attend',   roles: ['member'] },
  { path: '/payments',    icon: '💸', label: 'Pay',      roles: ['member'] },
  { path: '/maintenance', icon: '🔧', label: 'Issues',   roles: ['member', 'admin'] },
  { path: '/watchman',    icon: '🔑', label: 'Gym',      roles: ['watchman'] },
  { path: '/admin',       icon: '⚙️', label: 'Admin',   roles: ['admin'] },
  { path: '/profile',     icon: '👤', label: 'Profile',  roles: ['member', 'admin', 'watchman'] },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const visibleItems = NAV_ITEMS.filter(item =>
    user?.role ? item.roles.includes(user.role) : false
  )

  return (
    <div className="min-h-[100dvh] relative">
      <main className="pb-[100px]">
        <Outlet />
      </main>

      <nav className="fixed bottom-4 left-1/2 z-[100] w-[calc(100%-48px)] -translate-x-1/2">
        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-[1rem] flex items-end px-2 py-2 shadow-[var(--nav-shadow)] backdrop-blur-[20px] h-16">
          {visibleItems.map(item => {
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                className="relative flex-1 flex items-center justify-center h-11"
              >
                <span
                  className={`absolute bottom-0 flex h-10 w-10 items-center justify-center rounded-[16px] transition-all duration-300 ${active ? 'bg-[var(--accent)] text-white shadow-[0_6px_20px_rgba(0,229,160,0.45)] text-[22px] opacity-100 translate-y-[-16px]' : 'bg-[var(--bg3)] text-[var(--text)] opacity-40 hover:opacity-65'}`}
                >
                  {item.icon}
                </span>
                <span
                  className={`absolute bottom-[-1px] text-[9px] font-black tracking-[0.04em] text-[var(--accent)] transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}