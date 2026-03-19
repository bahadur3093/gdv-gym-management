import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider }         from './context/ThemeContext'
import { ToastProvider, useToast } from './context/ToastContext'

import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import HomePage         from './pages/HomePage'
import AttendancePage   from './pages/AttendancePage'
import PaymentsPage     from './pages/PaymentsPage'
import MaintenancePage  from './pages/MaintenancePage'
import ProfilePage      from './pages/ProfilePage'
import AdminPage        from './pages/AdminPage'
import Layout           from './components/Layout'

// Redirects to /login if not authenticated
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  return user ? children : <Navigate to='/login' replace />
}

// Redirects to /home if already logged in
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenLoader />
  return user ? <Navigate to='/' replace /> : children
}

function FullScreenLoader() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div className='spinner' style={{ width: 32, height: 32 }} />
    </div>
  )
}

// Listens for FCM foreground messages and shows as toasts
// Lazy imports firebase so it never runs outside module context
function ForegroundNotifications() {
  const { showToast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    let unsub = () => {}
    import('./utils/firebase').then(({ onForegroundMessage }) => {
      unsub = onForegroundMessage((body) => showToast(body))
    })
    return () => unsub()
  }, [user, showToast])

  return null
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <ForegroundNotifications />
            <Routes>
              {/* Public routes */}
              <Route path='/login'    element={<PublicRoute><LoginPage /></PublicRoute>} />
              <Route path='/register' element={<PublicRoute><RegisterPage /></PublicRoute>} />

              {/* Protected routes — wrapped in Layout (has the floating nav) */}
              <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route path='/'            element={<HomePage />} />
                <Route path='/attendance'  element={<AttendancePage />} />
                <Route path='/payments'    element={<PaymentsPage />} />
                <Route path='/maintenance' element={<MaintenancePage />} />
                <Route path='/profile'     element={<ProfilePage />} />
                <Route path='/admin'       element={<AdminPage />} />
              </Route>

              {/* Fallback */}
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}