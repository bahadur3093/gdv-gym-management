import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth }  from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import styles from './AuthPage.module.css'

export default function LoginPage() {
  const [phone, setPhone]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const { login }   = useAuth()
  const { showToast } = useToast()
  const navigate    = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(phone, password)
      navigate('/', { replace: true })
    } catch (err) {
      showToast(err.response?.data?.error || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.logo}>🏋️</div>
        <h1 className={styles.title}>Society Gym</h1>
        <p className={styles.sub}>Sign in to your account</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className='input-group'>
            <label className='input-label'>Phone number</label>
            <input
              className='input'
              type='tel'
              placeholder='98765 43210'
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              required
            />
          </div>

          <div className='input-group'>
            <label className='input-label'>Password</label>
            <input
              className='input'
              type='password'
              placeholder='Enter your password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            className='btn btn-primary'
            type='submit'
            disabled={loading || phone.length < 10 || !password}
          >
            {loading ? <span className='spinner' /> : 'Sign in'}
          </button>
        </form>

        <p className={styles.link}>
          New member?{' '}
          <Link to='/register'>Register here</Link>
        </p>
      </div>
    </div>
  )
}
