import { useState } from 'react'
import { useCurrentlyIn } from '@/hooks/useAttendance'
import { useMaintenance } from '@/hooks/useMaintenance'
import { useToast }       from '@/context/ToastContext'
import { IssuePriority }  from '@/types'
import PageHeader  from '@/components/PageHeader'
import BottomSheet from '@/components/BottomSheet'

export default function WatchmanPage() {
  const { data: currentlyIn, loading, reload } = useCurrentlyIn()
  const { reportIssue } = useMaintenance()
  const { showToast }   = useToast()

  const [sheetOpen, setSheetOpen]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', equipment: '', priority: 'medium' as IssuePriority,
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleReport = async () => {
    if (!form.title || !form.description) return
    setSubmitting(true)
    try {
      await reportIssue(form)
      showToast('Issue reported to admin!')
      setSheetOpen(false)
      setForm({ title: '', description: '', equipment: '', priority: 'medium' })
    } catch {
      showToast('Failed to report issue', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh pb-28">
      <div className="px-6">
        <PageHeader greeting="Watchman" title="Dashboard" />

        {/* Live count */}
        <div className="rounded-[20px] p-6"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-extrabold" style={{ color: 'var(--accent)' }}>
                {currentlyIn?.count ?? 0}
              </div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>
                {(currentlyIn?.count ?? 0) === 1 ? 'person' : 'people'} in gym right now
              </div>
            </div>
            <button onClick={reload}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
              ↻
            </button>
          </div>

          {loading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl mb-2" />)
          ) : (currentlyIn?.count ?? 0) === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">🏋️</div>
              <div className="text-sm" style={{ color: 'var(--text2)' }}>Gym is empty right now</div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {currentlyIn!.members.map((m, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--accent)' }} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{m.members.name}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text2)' }}>
                      Villa {m.members.flat_number}{m.members.tower ? ` · Zone ${m.members.tower}` : ''}
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text3)' }}>
                    Since {new Date(m.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Report issue button */}
        <div className="px-6 mb-3">
          <span className="text-base font-bold" style={{ color: 'var(--text)' }}>Maintenance</span>
        </div>
        <div className="px-6">
          <button onClick={() => setSheetOpen(true)}
            className="w-full rounded-[14px] py-4 text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={{ background: 'var(--bg3)', border: '1.5px dashed rgba(0,229,160,0.35)', color: 'var(--accent)' }}>
            ＋ Report equipment issue
          </button>
        </div>
      </div>

      {/* Report issue sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <h2 className="text-xl font-bold mb-1.5">Report an issue</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>
          Describe the problem so admin can fix it quickly.
        </p>

        <div className="flex flex-col gap-3 mb-5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text2)' }}>Title</label>
            <input className="w-full rounded-[14px] px-4 py-3.5 text-sm outline-none"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Open Sans, sans-serif' }}
              placeholder="e.g. Treadmill belt slipping" value={form.title} onChange={set('title')} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text2)' }}>Equipment (optional)</label>
            <input className="w-full rounded-[14px] px-4 py-3.5 text-sm outline-none"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Open Sans, sans-serif' }}
              placeholder="e.g. Treadmill #2, AC" value={form.equipment} onChange={set('equipment')} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text2)' }}>Description</label>
            <textarea className="w-full rounded-[14px] px-4 py-3.5 text-sm outline-none resize-none"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Open Sans, sans-serif' }}
              rows={3} placeholder="Describe the issue..." value={form.description} onChange={set('description')} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text2)' }}>Priority</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as IssuePriority[]).map(p => (
                <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: form.priority === p
                      ? p === 'high' ? 'rgba(255,92,92,0.12)' : p === 'medium' ? 'rgba(255,181,71,0.12)' : 'rgba(0,229,160,0.12)'
                      : 'var(--bg3)',
                    color: form.priority === p
                      ? p === 'high' ? 'var(--danger)' : p === 'medium' ? 'var(--warn)' : 'var(--accent)'
                      : 'var(--text2)',
                    border: `1px solid ${form.priority === p
                      ? p === 'high' ? 'rgba(255,92,92,0.3)' : p === 'medium' ? 'rgba(255,181,71,0.3)' : 'rgba(0,229,160,0.3)'
                      : 'var(--border)'}`,
                  }}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleReport} disabled={!form.title || !form.description || submitting}
          className="w-full rounded-[14px] py-4 text-sm font-bold transition-all flex items-center justify-center gap-2"
          style={{ background: 'var(--accent)', color: '#0D1117', opacity: form.title && form.description ? 1 : 0.4 }}>
          {submitting ? <span className="spinner w-5 h-5" /> : 'Submit issue'}
        </button>
      </BottomSheet>
    </div>
  )
}