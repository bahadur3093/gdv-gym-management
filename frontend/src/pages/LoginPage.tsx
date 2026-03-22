import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth }  from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { AxiosError } from 'axios'
import { ApiError } from '@/types'

export default function LoginPage() {
  const [phone, setPhone]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }     = useAuth()
  const { showToast } = useToast()
  const navigate      = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(phone, password)
      navigate('/', { replace: true })
    } catch (err) {
      const error = err as AxiosError<ApiError>
      showToast(error.response?.data?.error || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] flex items-center justify-center px-6">
      <div className="w-full">
        <div className="text-[48px] text-center mb-3">🏋️</div>
        <h1 className="font-['Open Sans'] text-[28px] font-extrabold text-center text-[var(--text)] mb-1.5">Society Gym</h1>
        <p className="text-[14px] text-[var(--text2)] text-center mb-8">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text2)] tracking-widest uppercase mb-2">Phone number</label>
            <input
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-[14px] px-4 py-3 text-[var(--text)] outline-none transition duration-300 font-['Open Sans'] focus:border-[var(--accent)]"
              type="tel"
              placeholder="98765 43210"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[var(--text2)] tracking-widest uppercase mb-2">Password</label>
            <input
              className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-[14px] px-4 py-3 text-[var(--text)] outline-none transition duration-300 font-['Open Sans'] focus:border-[var(--accent)]"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className="w-full bg-[var(--accent)] text-[#0D1117] border-none rounded-[14px] px-5 py-3 font-['Open Sans'] text-[15px] font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,229,160,0.35)] hover:-translate-y-[1px] disabled:opacity-40 disabled:cursor-not-allowed"
            type="submit"
            disabled={loading || phone.length < 10 || !password}
          >
            {loading
              ? <span className="spinner w-5 h-5" />
              : 'Sign in'
            }
          </button>
        </form>

        <p className="text-[13px] text-[var(--text2)] text-center mt-6">
          New member? <Link className="text-[var(--accent)] font-semibold" to="/register">Register here</Link>
        </p>
      </div>
    </div>
  )
}
