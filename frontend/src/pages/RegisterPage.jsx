import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import api from '../utils/api'
import styles from './AuthPage.module.css'

export default function RegisterPage() {
  const [form, setForm]     = useState({ name: '', phone: '', flatNumber: '', tower: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone]     = useState(false)
  const { showToast } = useToast()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      setDone(true)
    } catch (err) {
      showToast(err.response?.data?.error || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className={styles.page}>
      <div className={styles.inner} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 className={styles.title}>Request submitted!</h2>
        <p className={styles.sub} style={{ marginBottom: 32 }}>
          The admin will approve your account shortly. You'll be able to log in once approved.
        </p>
        <button className='btn btn-primary' onClick={() => navigate('/login')}>
          Back to login
        </button>
      </div>
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.logo}>🏋️</div>
        <h1 className={styles.title}>Join the gym</h1>
        <p className={styles.sub}>Register as a society member</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className='input-group'>
            <label className='input-label'>Full name</label>
            <input className='input' placeholder='Rajan Sharma' value={form.name} onChange={set('name')} required />
          </div>

          <div className='input-group'>
            <label className='input-label'>Phone number</label>
            <input className='input' type='tel' placeholder='98765 43210' value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
              maxLength={10} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className='input-group'>
              <label className='input-label'>Flat no.</label>
              <input className='input' placeholder='203' value={form.flatNumber} onChange={set('flatNumber')} required />
            </div>
            <div className='input-group'>
              <label className='input-label'>Tower</label>
              <input className='input' placeholder='B' value={form.tower} onChange={set('tower')} />
            </div>
          </div>

          <div className='input-group'>
            <label className='input-label'>Password</label>
            <input className='input' type='password' placeholder='Create a password' value={form.password}
              onChange={set('password')} minLength={6} required />
          </div>

          <button className='btn btn-primary' type='submit'
            disabled={loading || !form.name || form.phone.length < 10 || !form.flatNumber || !form.password}>
            {loading ? <span className='spinner' /> : 'Submit registration'}
          </button>
        </form>

        <p className={styles.link}>
          Already registered? <Link to='/login'>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
