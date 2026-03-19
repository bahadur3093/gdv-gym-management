import { useState } from 'react'
import { usePayments } from '../hooks/usePayments'
import { useToast }    from '../context/ToastContext'
import PageHeader   from '../components/PageHeader'
import BottomSheet  from '../components/BottomSheet'
import styles       from './PaymentsPage.module.css'

const currentMonth = new Date().toISOString().slice(0, 7)
const monthLabel   = (m) => new Date(m + '-02').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

export default function PaymentsPage() {
  const { payments, loading, getUPILink, submitPayment } = usePayments()
  const { showToast } = useToast()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [utr, setUtr]             = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [upiLink, setUpiLink]     = useState(null)

  const thisMonth = payments.find(p => p.month === currentMonth)
  const isPaid    = thisMonth?.status === 'approved'
  const isPending = thisMonth?.status === 'pending'

  const openPaySheet = async () => {
    try {
      const data = await getUPILink(currentMonth)
      setUpiLink(data.link)
    } catch {
      setUpiLink(`upi://pay?pa=societygym@jupiter&pn=SocietyGym&am=500&cu=INR&tn=GYM-JUNE2025`)
    }
    setSheetOpen(true)
  }

  const handleOpenUPI = () => {
    if (upiLink) window.location.href = upiLink
    setTimeout(() => document.getElementById('utr-input')?.focus(), 1500)
  }

  const handleSubmit = async () => {
    if (utr.length !== 12) return
    setSubmitting(true)
    try {
      await submitPayment(utr, currentMonth)
      showToast('Payment submitted! Admin will verify soon.')
      setSheetOpen(false)
      setUtr('')
    } catch (err) {
      showToast(err.response?.data?.error || 'Submission failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const statusBadge = (status) => {
    if (status === 'approved') return <span className='badge badge-success'>Paid</span>
    if (status === 'pending')  return <span className='badge badge-warn'>Pending</span>
    if (status === 'rejected') return <span className='badge badge-danger'>Rejected</span>
    return null
  }

  return (
    <div className='page'>
      <div className={styles.inner}>
        <PageHeader
          greeting='Manage your'
          title='Payments'
          right={
            <div className={styles.feeBadge}>₹500/mo</div>
          }
        />

        {/* Current month status */}
        <div className={`${styles.statusBanner} ${isPaid ? styles.paid : isPending ? styles.pending : styles.due}`}>
          <div className={`${styles.statusIcon} ${isPaid ? styles.paidIcon : isPending ? styles.pendingIcon : styles.dueIcon}`}>
            {isPaid ? '✅' : isPending ? '⏳' : '📅'}
          </div>
          <div>
            <div className={styles.statusTitle}>
              {monthLabel(currentMonth)} — {isPaid ? 'Paid' : isPending ? 'Awaiting approval' : 'Due'}
            </div>
            <div className={styles.statusSub}>
              {isPaid
                ? `Verified by admin on ${new Date(thisMonth.approved_at).toLocaleDateString('en-IN')}`
                : isPending
                ? `UTR ${thisMonth.utr_number} submitted — admin will verify shortly`
                : 'Payment due for this month'}
            </div>
          </div>
        </div>

        {/* Pay button — only if not already paid or pending */}
        {!isPaid && !isPending && (
          <div style={{ padding: '0 20px 20px' }}>
            <button className='btn btn-primary' onClick={openPaySheet}>
              💸 Pay ₹500 for {monthLabel(currentMonth)}
            </button>
          </div>
        )}

        {/* Payment history */}
        <div className={styles.sectionHead}>
          <span className='section-title'>Payment history</span>
        </div>
        <div className='card' style={{ margin: '0 20px 20px' }}>
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className={styles.historyItem} style={{ borderBottom: '1px solid var(--border)' }}>
                <div className='skeleton' style={{ width: 36, height: 36, borderRadius: 10 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className='skeleton' style={{ height: 14, width: '50%' }} />
                  <div className='skeleton' style={{ height: 11, width: '70%' }} />
                </div>
              </div>
            ))
          ) : payments.length === 0 ? (
            <div className={styles.empty}>No payment history yet</div>
          ) : (
            payments.map((p, i) => (
              <div key={p.id} className={styles.historyItem}
                style={{ borderBottom: i < payments.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className={styles.historyIcon}>
                  {p.status === 'approved' ? '✅' : p.status === 'pending' ? '⏳' : '❌'}
                </div>
                <div className={styles.historyInfo}>
                  <div className={styles.historyMonth}>{monthLabel(p.month)}</div>
                  <div className={styles.historyUtr}>UTR: {p.utr_number}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div className={styles.historyAmount}>₹{p.amount}</div>
                  {statusBadge(p.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payment bottom sheet */}
      <BottomSheet open={sheetOpen} onClose={() => { setSheetOpen(false); setUtr('') }}>
        <h2 className={styles.sheetTitle}>Pay {monthLabel(currentMonth)}</h2>
        <p className={styles.sheetSub}>
          Pay ₹500 to the society gym account, then paste the UTR number below.
        </p>

        {/* Steps */}
        {[
          { n: 1, text: <>Tap below to open your UPI app with <b style={{color:'var(--accent)'}}>₹500 pre-filled</b></> },
          { n: 2, text: <>Note the <b style={{color:'var(--accent)'}}>12-digit UTR / Ref number</b> on the success screen</> },
          { n: 3, text: <>Paste it below and tap <b style={{color:'var(--accent)'}}>Submit</b></> },
        ].map(s => (
          <div key={s.n} className={styles.step}>
            <div className={styles.stepNum}>{s.n}</div>
            <div className={styles.stepText}>{s.text}</div>
          </div>
        ))}

        <button className='btn btn-secondary' style={{ marginBottom: 16 }} onClick={handleOpenUPI}>
          ↗ Open UPI app (GPay / PhonePe)
        </button>

        <div className='input-group'>
          <label className='input-label'>UTR / Reference number</label>
          <input
            id='utr-input'
            className='input'
            style={{ fontFamily: 'monospace', letterSpacing: '0.08em', fontSize: 18 }}
            type='tel'
            placeholder='123456789012'
            value={utr}
            maxLength={12}
            onChange={e => setUtr(e.target.value.replace(/\D/g, ''))}
          />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
            12-digit number shown on the UPI success screen
          </div>
        </div>

        <button
          className='btn btn-primary'
          onClick={handleSubmit}
          disabled={utr.length !== 12 || submitting}
        >
          {submitting ? <span className='spinner' /> : 'Submit for verification'}
        </button>
      </BottomSheet>
    </div>
  )
}
