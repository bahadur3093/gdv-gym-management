import { useState } from 'react'
import { usePayments } from '@/hooks/usePayments'
import { useToast }    from '@/context/ToastContext'
import { AxiosError }  from 'axios'
import { ApiError, PaymentStatus } from '@/types'
import PageHeader  from '@/components/PageHeader'
import BottomSheet from '@/components/BottomSheet'

const currentMonth = new Date().toISOString().slice(0, 7)

const monthLabel = (m: string) =>
  new Date(m + '-02').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

type PaymentVisualStatus = 'paid' | 'pending' | 'rejected'

const STATUS_CONFIG: Record<PaymentStatus, { icon: string; label: string; cls: PaymentVisualStatus }> = {
  approved: { icon: '✅', label: 'Paid',              cls: 'paid'    },
  pending:  { icon: '⏳', label: 'Awaiting approval', cls: 'pending' },
  rejected: { icon: '❌', label: 'Rejected',          cls: 'rejected'},
}

export default function PaymentsPage() {
  const { payments, loading, getUPILink, submitPayment } = usePayments()
  const { showToast }   = useToast()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [utr, setUtr]             = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [upiLink, setUpiLink]     = useState<string | null>(null)

  const thisMonth = payments.find(p => p.month === currentMonth)
  const isPaid    = thisMonth?.status === 'approved'
  const isPending = thisMonth?.status === 'pending'

  const openPaySheet = async () => {
    try {
      const data = await getUPILink(currentMonth)
      setUpiLink(data.link)
    } catch {
      setUpiLink(null)
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
      const error = err as AxiosError<ApiError>
      showToast(error.response?.data?.error || 'Submission failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const currentStatus = thisMonth?.status
  const cfg = currentStatus ? STATUS_CONFIG[currentStatus] : null

  const statusClasses: Record<PaymentVisualStatus, string> = {
    paid: 'bg-[rgba(0,229,160,0.07)] border-[rgba(0,229,160,0.2)]',
    pending: 'bg-[rgba(255,181,71,0.07)] border-[rgba(255,181,71,0.25)]',
    rejected: 'bg-[rgba(255,92,92,0.06)] border-[rgba(255,92,92,0.2)]',
  }

  const statusIconClasses: Record<`${PaymentVisualStatus}Icon`, string> = {
    paidIcon: 'bg-[rgba(0,229,160,0.15)]',
    pendingIcon: 'bg-[rgba(255,181,71,0.15)]',
    rejectedIcon: 'bg-[rgba(255,92,92,0.12)]',
  }

  return (
    <div className="min-h-[100dvh]">
      <div className="px-6">
        <PageHeader
          greeting="Manage your"
          title="Payments"
          right={
            <div className="bg-[rgba(0,229,160,0.12)] border border-[rgba(0,229,160,0.3)] rounded-[12px] px-3.5 py-2 text-[13px] font-bold text-[var(--accent)]">
              ₹500/mo
            </div>
          }
        />

        {/* Current month status banner */}
        {cfg && (
          <div className={`mb-4 rounded-[14px] p-4 flex items-start gap-3 border ${statusClasses[cfg.cls]}`}>
            <div className={`w-11 h-11 rounded-[13px] flex items-center justify-center text-[20px] flex-shrink-0 ${statusIconClasses[`${cfg.cls}Icon`]}`}>
              {cfg.icon}
            </div>
            <div>
              <div className="font-['Open Sans'] text-[15px] font-bold mb-1.5">
                {monthLabel(currentMonth)} — {cfg.label}
              </div>
              <div className="text-[12px] text-[var(--text2)] leading-5">
                {isPaid
                  ? `Verified on ${thisMonth?.approved_at ? new Date(thisMonth.approved_at).toLocaleDateString('en-IN') : '—'}`
                  : isPending
                  ? `UTR ${thisMonth?.utr_number} submitted`
                  : 'Payment rejected — please resubmit'}
              </div>
            </div>
          </div>
        )}

        {/* Pay button */}
        {!isPaid && !isPending && (
          <div className="pb-5">
            <button
              className="w-full bg-[var(--accent)] text-[#0D1117] border-none rounded-[14px] px-4 py-3 font-['Open Sans'] text-[15px] font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,229,160,0.35)] hover:-translate-y-[1px]"
              onClick={openPaySheet}
            >
              💸 Pay ₹500 for {monthLabel(currentMonth)}
            </button>
          </div>
        )}

        {/* History */}
        <div className="mb-3">
          <span className="font-['Open Sans'] text-[16px] font-bold">Payment history</span>
        </div>
        <div className="mb-5 bg-[var(--bg2)] border border-[var(--border)] rounded-[20px] shadow-[var(--shadow)]">
          {loading
            ? Array(4).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="skeleton w-10 h-10 rounded-xl" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="skeleton h-3.5 w-1/2 rounded" />
                    <div className="skeleton h-3 w-2/3 rounded" />
                  </div>
                </div>
              ))
            : payments.length === 0
            ? <div className="p-6 text-center text-[14px] text-[var(--text2)]">No payment history yet</div>
            : payments.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < payments.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div className="w-10 h-10 rounded-[12px] bg-[var(--bg3)] flex items-center justify-center text-[18px] flex-shrink-0">
                    {STATUS_CONFIG[p.status].icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium">{monthLabel(p.month)}</div>
                    <div className="text-[11px] text-[var(--text3)] font-mono mt-1">UTR: {p.utr_number}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="font-['Open Sans'] text-[15px] font-bold text-[var(--accent)]">₹{p.amount}</div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-[9px] py-[3px] rounded-[7px] ${p.status === 'approved' ? 'bg-[rgba(0,229,160,0.12)] text-[var(--accent)]' : p.status === 'pending' ? 'bg-[rgba(255,181,71,0.12)] text-[var(--warn)]' : 'bg-[rgba(255,92,92,0.12)] text-[var(--danger)]'}`}>
                      {STATUS_CONFIG[p.status].label}
                    </span>
                  </div>
                </div>
              ))
          }
        </div>
      </div>

      {/* Payment sheet */}
      <BottomSheet open={sheetOpen} onClose={() => { setSheetOpen(false); setUtr('') }}>
        <h2 className="font-['Open Sans'] text-[20px] font-bold mb-1.5">Pay {monthLabel(currentMonth)}</h2>
        <p className="text-[13px] text-[var(--text2)] mb-6 leading-6">
          Pay ₹500 to the society gym account then paste the UTR number below.
        </p>

        {[
          { n: 1, text: <>Open your UPI app with <b className="text-[var(--accent)]">₹500 pre-filled</b></> },
          { n: 2, text: <>Note the <b className="text-[var(--accent)]">12-digit UTR</b> on the success screen</> },
          { n: 3, text: <>Paste it below and tap <b className="text-[var(--accent)]">Submit</b></> },
        ].map(s => (
          <div key={s.n} className="flex items-start gap-3 mb-4">
            <div className="w-6 h-6 rounded-full bg-[var(--accent-dim)] border border-[rgba(0,229,160,0.3)] flex items-center justify-center font-['Open Sans'] text-[12px] font-bold text-[var(--accent)] mt-1">{s.n}</div>
            <div className="text-[13px] text-[var(--text2)] leading-6">{s.text}</div>
          </div>
        ))}

        <button
          className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-[14px] px-4 py-3 font-['Open Sans'] text-[14px] font-semibold text-[var(--text)] flex items-center justify-center gap-2 mb-4 transition-all duration-300 hover:bg-[var(--bg4)]"
          onClick={handleOpenUPI}
        >
          ↗ Open UPI app (GPay / PhonePe)
        </button>

        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-[var(--text2)] tracking-widest uppercase mb-2">UTR / Reference number</label>
          <input
            id="utr-input"
            className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-[14px] px-4 py-3 font-mono text-[18px] font-semibold tracking-widest text-[var(--text)] outline-none transition duration-300 focus:border-[var(--accent)]"
            type="tel"
            placeholder="123456789012"
            value={utr}
            maxLength={12}
            onChange={e => setUtr(e.target.value.replace(/\D/g, ''))}
          />
          <p className="text-[11px] text-[var(--text3)] mt-2">12-digit number on the UPI success screen</p>
        </div>

        <button
          className="w-full bg-[var(--accent)] text-[#0D1117] border-none rounded-[14px] px-4 py-3 font-['Open Sans'] text-[15px] font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,229,160,0.3)] disabled:opacity-40"
          onClick={handleSubmit}
          disabled={utr.length !== 12 || submitting}
        >
          {submitting ? <span className="spinner w-5 h-5" /> : 'Submit for verification'}
        </button>
      </BottomSheet>
    </div>
  )
}
