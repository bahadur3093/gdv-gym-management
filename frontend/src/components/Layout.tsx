import { Outlet, useLocation, useNavigate } from 'react-router-dom'

interface NavItem {
  path:  string
  icon:  string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { path: '/',            icon: '🏠', label: 'Home'    },
  { path: '/attendance',  icon: '📊', label: 'Attend'  },
  { path: '/payments',    icon: '💸', label: 'Pay'     },
  { path: '/maintenance', icon: '🔧', label: 'Issues'  },
  { path: '/profile',     icon: '👤', label: 'Profile' },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-[100dvh] relative">
      <main className="pb-[100px]">
        <Outlet />
      </main>

      <nav className="fixed bottom-4 left-1/2 z-[100] w-full px-6 -translate-x-1/2">
        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-[1rem] flex items-end px-2 py-2 shadow-[var(--nav-shadow)] backdrop-blur-[20px] h-16">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                className={`relative flex-1 flex flex-col items-center justify-end bg-transparent border-none p-0 h-11 transition-all duration-300 ${active ? '' : ''}`}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
              >
                <span className={`absolute bottom-0 flex h-10 w-10 items-center justify-center rounded-[16px] ${active ? 'bg-[var(--accent)] text-white shadow-[0_6px_20px_rgba(0,229,160,0.45)] text-[22px] opacity-100 translate-y-[-12px]' : 'bg-[var(--bg3)] text-[var(--text)] opacity-40 hover:opacity-65'}`}>{item.icon}</span>
                <span className={`absolute bottom-[-1px] text-[9px] font-black tracking-[0.04em] text-[var(--accent)] ${active ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
