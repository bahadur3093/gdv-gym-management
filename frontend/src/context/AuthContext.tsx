import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '@/utils/api'
import { Member } from '@/types'

interface AuthContextType {
  user:    Member | null
  loading: boolean
  login:   (phone: string, password: string) => Promise<Member>
  logout:  () => void
  setUser: (user: Member | null) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  // On app load — if token exists, fetch user
  useEffect(() => {
    const token = localStorage.getItem('gym_token')
    if (!token) { setLoading(false); return }

    api.get<Member>('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => localStorage.removeItem('gym_token'))
      .finally(() => setLoading(false))
  }, [])

  // Register FCM token after login
  useEffect(() => {
    if (!user) return
    import('@/utils/firebase')
      .then(({ requestNotificationPermission }) => requestNotificationPermission())
      .then(token => {
        if (token) api.post('/auth/fcm-token', { token }).catch(() => {})
      })
      .catch(() => {})
  }, [user?.id])

  const login = async (phone: string, password: string): Promise<Member> => {
    // 1. Login — get the JWT token
    const loginRes = await api.post<{ token: string }>('/auth/login', { phone, password })
    const token = loginRes.data.token

    // 2. Store token BEFORE calling /me — interceptor reads it from here
    localStorage.setItem('gym_token', token)

    // 3. Now fetch the full user object with consistent snake_case fields
    const meRes = await api.get<Member>('/auth/me')
    setUser(meRes.data)
    return meRes.data
  }

  const logout = () => {
    localStorage.removeItem('gym_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}