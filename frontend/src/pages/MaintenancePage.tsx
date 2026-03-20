import { useState } from 'react'
import { useMaintenance } from '@/hooks/useMaintenance'
import { useAuth }        from '@/context/AuthContext'
import { useToast }       from '@/context/ToastContext'
import { IssueStatus, IssuePriority, MaintenanceIssue } from '@/types'
import PageHeader  from '@/components/PageHeader'
import StatCard    from '@/components/StatCard'
import BottomSheet from '@/components/BottomSheet'

const STATUS_CFG: Record<IssueStatus, { icon: string; badgeCls: string; label: string }> = {
  open:        { icon: '🔴', badgeCls: 'badgeDanger',  label: 'Open'        },
  in_progress: { icon: '🟡', badgeCls: 'badgeWarn',    label: 'In progress' },
  resolved:    { icon: '🟢', badgeCls: 'badgeSuccess',  label: 'Resolved'    },
}

const PRIORITY_CFG: Record<IssuePriority, string> = {
  low:    'badgeNeutral',
  medium: 'badgeWarn',
  high:   'badgeDanger',
}

type FilterOption = 'all' | IssueStatus

export default function MaintenancePage() {
  const { issues, loading, reportIssue, updateStatus } = useMaintenance()
  const { user }      = useAuth()
  const { showToast } = useToast()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filter, setFilter]       = useState<FilterOption>('all')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', equipment: '', priority: 'medium' as IssuePriority,
  })

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const openCount     = issues.filter(i => i.status === 'open').length
  const progressCount = issues.filter(i => i.status === 'in_progress').length
  const resolvedCount = issues.filter(i => i.status === 'resolved').length

  const filtered: MaintenanceIssue[] =
    filter === 'all' ? issues : issues.filter(i => i.status === filter)

  const handleReport = async () => {
    if (!form.title || !form.description) return
    setSubmitting(true)
    try {
      await reportIssue(form)
      showToast('Issue reported successfully!')
      setSheetOpen(false)
      setForm({ title: '', description: '', equipment: '', priority: 'medium' })
    } catch {
      showToast('Failed to report issue', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatus = async (id: string, status: IssueStatus) => {
    try {
      await updateStatus(id, status, '')
      showToast(`Issue marked as ${status.replace('_', ' ')}`)
    } catch {
      showToast('Failed to update status', 'error')
    }
  }

  const FILTERS: { val: FilterOption; label: string }[] = [
    { val: 'all',         label: 'All'         },
    { val: 'open',        label: 'Open'        },
    { val: 'in_progress', label: 'In progress' },
    { val: 'resolved',    label: 'Resolved'    },
  ]

  return (
    <div className="min-h-[100dvh]">
      <div className="px-6">
        <PageHeader greeting="Equipment &" title="Maintenance" />

        <div className="grid grid-cols-3 gap-2.5 pb-5">
          <StatCard icon="🔴" iconBg="rgba(255,92,92,0.12)"  value={openCount}     valueColor="var(--danger)" label="Open" />
          <StatCard icon="🟡" iconBg="rgba(255,181,71,0.12)" value={progressCount} valueColor="var(--warn)"   label="In progress" />
          <StatCard icon="🟢" iconBg="rgba(0,229,160,0.12)"  value={resolvedCount} valueColor="var(--accent)" label="Resolved" />
        </div>

        <div className="pb-5">
          <button
            className="w-full bg-[var(--bg3)] border-dashed border-2 border-[rgba(0,229,160,0.35)] rounded-[14px] px-4 py-3 font-['Open Sans'] text-[14px] font-semibold text-[var(--accent)] transition-all duration-300 hover:bg-[var(--accent-dim)]"
            onClick={() => setSheetOpen(true)}
          >
            ＋ Report a new issue
          </button>
        </div>

        <div className="flex gap-2.5 pb-4 overflow-x-auto no-scrollbar">
          {FILTERS.map(f => (
            <button
              key={f.val}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-[20px] text-[12px] font-semibold transition-all duration-200 ${filter === f.val ? 'bg-[var(--accent)] border border-[var(--accent)] text-[#0D1117]' : 'bg-[var(--bg2)] border border-[var(--border)] text-[var(--text2)]'}`}
              onClick={() => setFilter(f.val)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mb-5 bg-[var(--bg2)] border border-[var(--border)] rounded-[20px] shadow-[var(--shadow)]">
          {loading
            ? Array(3).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="skeleton h-3.5 w-3/5 rounded" />
                    <div className="skeleton h-3 w-4/5 rounded" />
                  </div>
                </div>
              ))
            : filtered.length === 0
            ? <div className="p-7 text-center text-[14px] text-[var(--text2)]">
                {filter === 'all' ? 'No issues reported yet' : `No ${filter} issues`}
              </div>
            : filtered.map((issue, i) => {
                const cfg = STATUS_CFG[issue.status]
                return (
                  <div
                    key={issue.id}
                    className="flex items-start gap-3 px-4 py-3"
                    style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className={`w-10 h-10 rounded-[13px] flex items-center justify-center text-[18px] flex-shrink-0 ${issue.status === 'open' ? 'bg-[rgba(255,92,92,0.12)]' : issue.status === 'in_progress' ? 'bg-[rgba(255,181,71,0.12)]' : 'bg-[rgba(0,229,160,0.12)]'}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-medium mb-1">{issue.title}</div>
                      <div className="text-[11px] text-[var(--text2)] leading-5">
                        {issue.equipment && <span>{issue.equipment} · </span>}
                        {issue.members?.name} · Villa {issue.members?.flat_number}
                      </div>
                      <div className="text-[11px] text-[var(--text2)] leading-5 mt-0.5">
                        {new Date(issue.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-[7px] bg-[rgba(0,229,160,0.12)] text-[var(--accent)]">{cfg.label}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-[7px] ${issue.priority === 'low' ? 'bg-[var(--bg3)] text-[var(--text2)]' : issue.priority === 'medium' ? 'bg-[rgba(255,181,71,0.12)] text-[var(--warn)]' : 'bg-[rgba(255,92,92,0.12)] text-[var(--danger)]'}`}>
                          {issue.priority}
                        </span>
                      </div>
                      {issue.admin_note && (
                        <div className="text-[12px] text-[var(--text2)] mt-2 italic">📝 {issue.admin_note}</div>
                      )}
                      {user?.role === 'admin' && issue.status !== 'resolved' && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {issue.status === 'open' && (
                            <button
                              className="px-3 py-1 rounded-[8px] text-[11px] font-semibold border border-[var(--border)] bg-[var(--bg3)] text-[var(--text2)] transition-all duration-200 hover:bg-[var(--bg4)]"
                              onClick={() => handleStatus(issue.id, 'in_progress')}
                            >
                              Mark in progress
                            </button>
                          )}
                          <button
                            className="px-3 py-1 rounded-[8px] text-[11px] font-semibold border border-[rgba(0,229,160,0.3)] bg-[rgba(0,229,160,0.08)] text-[var(--accent)] transition-all duration-200 hover:bg-[rgba(0,229,160,0.15)]"
                            onClick={() => handleStatus(issue.id, 'resolved')}
                          >
                            Mark resolved
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <h2 className="font-['Open Sans'] text-[20px] font-bold mb-1.5">Report an issue</h2>
        <p className="text-[13px] text-[var(--text2)] mb-6">
          Describe the problem so the admin can prioritise and fix it.
        </p>

        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-[var(--text2)] tracking-widest uppercase mb-2">Title</label>
          <input
            className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-[14px] px-4 py-3 text-[var(--text)] outline-none transition duration-300 focus:border-[var(--accent)]"
            placeholder="e.g. Treadmill belt slipping"
            value={form.title}
            onChange={set('title')}
          />
        </div>
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-[var(--text2)] tracking-widest uppercase mb-2">Equipment (optional)</label>
          <input
            className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-[14px] px-4 py-3 text-[var(--text)] outline-none transition duration-300 focus:border-[var(--accent)]"
            placeholder="e.g. Treadmill #2, AC"
            value={form.equipment}
            onChange={set('equipment')}
          />
        </div>
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-[var(--text2)] tracking-widest uppercase mb-2">Description</label>
          <textarea
            className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-[14px] px-4 py-3 text-[var(--text)] outline-none transition duration-300 focus:border-[var(--accent)] resize-none"
            rows={3}
            placeholder="Describe the issue..."
            value={form.description}
            onChange={set('description')}
          />
        </div>
        <div className="mb-5">
          <label className="block text-[11px] font-semibold text-[var(--text2)] tracking-widest uppercase mb-2">Priority</label>
          <div className="flex gap-2.5">
            {(['low', 'medium', 'high'] as IssuePriority[]).map(p => (
              <button
                key={p}
                className={`flex-1 py-2 rounded-[10px] text-[13px] font-semibold transition-all duration-200 ${form.priority === p ? p === 'low' ? 'bg-[rgba(0,229,160,0.12)] border border-[rgba(0,229,160,0.3)] text-[var(--accent)]' : p === 'medium' ? 'bg-[rgba(255,181,71,0.12)] border border-[rgba(255,181,71,0.3)] text-[var(--warn)]' : 'bg-[rgba(255,92,92,0.12)] border border-[rgba(255,92,92,0.3)] text-[var(--danger)]' : 'bg-[var(--bg3)] border border-[var(--border)] text-[var(--text2)]'}`}
                onClick={() => setForm(f => ({ ...f, priority: p }))}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button
          className="w-full bg-[var(--accent)] text-[#0D1117] border-none rounded-[14px] px-4 py-3 font-['Open Sans'] text-[15px] font-bold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,229,160,0.3)] disabled:opacity-40"
          onClick={handleReport}
          disabled={!form.title || !form.description || submitting}
        >
          {submitting ? <span className="spinner w-5 h-5" /> : 'Submit issue'}
        </button>
      </BottomSheet>
    </div>
  )
}
