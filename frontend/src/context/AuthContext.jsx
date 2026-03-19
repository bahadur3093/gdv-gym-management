import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'
import { requestNotificationPermission } from '../utils/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // On app load, check if a valid token exists and fetch the user
  useEffect(() => {
    const token = localStorage.getItem('gym_token')
    if (!token) { setLoading(false); return }

    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => localStorage.removeItem('gym_token'))
      .finally(() => setLoading(false))
  }, [])

  // Register FCM token whenever user logs in
  useEffect(() => {
    if (!user) return
    registerFCMToken()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const registerFCMToken = async () => {
    try {
      const token = await requestNotificationPermission()
      if (!token) return
      await api.post('/auth/fcm-token', { token })
    } catch (err) {
      console.error('[FCM] Registration failed:', err.message)
    }
  }

  const login = async (phone, password) => {
    const res = await api.post('/auth/login', { phone, password })
    localStorage.setItem('gym_token', res.data.token)
    setUser(res.data.user)
    return res.data.user
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
export const useAuth = () => useContext(AuthContext)