import { useState } from 'react'
import { useMaintenance } from '../hooks/useMaintenance'
import { useAuth }        from '../context/AuthContext'
import { useToast }       from '../context/ToastContext'
import PageHeader  from '../components/PageHeader'
import StatCard    from '../components/StatCard'
import BottomSheet from '../components/BottomSheet'
import styles      from './MaintenancePage.module.css'

const PRIORITY_COLORS = { low: 'badge-neutral', medium: 'badge-warn', high: 'badge-danger' }
const STATUS_COLORS   = { open: 'badge-danger', in_progress: 'badge-warn', resolved: 'badge-success' }
const STATUS_ICONS    = { open: '🔴', in_progress: '🟡', resolved: '🟢' }

export default function MaintenancePage() {
  const { issues, loading, reportIssue, updateStatus } = useMaintenance()
  const { user }    = useAuth()
  const { showToast } = useToast()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', equipment: '', priority: 'medium' })
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('all')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const openCount     = issues.filter(i => i.status === 'open').length
  const progressCount = issues.filter(i => i.status === 'in_progress').length
  const resolvedCount = issues.filter(i => i.status === 'resolved').length

  const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter)

  const handleReport = async () => {
    if (!form.title || !form.description) return
    setSubmitting(true)
    try {
      await reportIssue(form)
      showToast('Issue reported successfully!')
      setSheetOpen(false)
      setForm({ title: '', description: '', equipment: '', priority: 'medium' })
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to report issue', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateStatus(id, status, '')
      showToast(`Issue marked as ${status.replace('_', ' ')}`)
    } catch {
      showToast('Failed to update status', 'error')
    }
  }

  return (
    <div className='page'>
      <div className={styles.inner}>
        <PageHeader greeting='Equipment &' title='Maintenance' />

        {/* Stats */}
        <div className={styles.statsGrid}>
          <StatCard icon='🔴' iconBg='rgba(255,92,92,0.12)'   value={openCount}     valueColor='var(--danger)' label='Open' />
          <StatCard icon='🟡' iconBg='rgba(255,181,71,0.12)'  value={progressCount} valueColor='var(--warn)'   label='In progress' />
          <StatCard icon='🟢' iconBg='rgba(0,229,160,0.12)'   value={resolvedCount} valueColor='var(--accent)' label='Resolved' />
        </div>

        {/* Report button */}
        <div style={{ padding: '0 20px 20px' }}>
          <button className={styles.reportBtn} onClick={() => setSheetOpen(true)}>
            ＋ Report a new issue
          </button>
        </div>

        {/* Filter tabs */}
        <div className={styles.filters}>
          {['all', 'open', 'in_progress', 'resolved'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'in_progress' ? 'In progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Issues list */}
        <div className='card' style={{ margin: '0 20px 20px' }}>
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className={styles.issueItem} style={{ borderBottom: '1px solid var(--border)' }}>
                <div className='skeleton' style={{ width: 42, height: 42, borderRadius: 13 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className='skeleton' style={{ height: 14, width: '60%' }} />
                  <div className='skeleton' style={{ height: 11, width: '80%' }} />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              {filter === 'all' ? 'No issues reported yet' : `No ${filter} issues`}
            </div>
          ) : (
            filtered.map((issue, i) => (
              <div key={issue.id} className={styles.issueItem}
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className={`${styles.issueIcon} ${styles[issue.status.replace('_', '')]}`}>
                  {STATUS_ICONS[issue.status]}
                </div>
                <div className={styles.issueInfo}>
                  <div className={styles.issueTitle}>{issue.title}</div>
                  <div className={styles.issueMeta}>
                    {issue.equipment && <span>{issue.equipment} · </span>}
                    Reported by {issue.members?.name} · Flat {issue.members?.flat_number}
                  </div>
                  <div className={styles.issueMeta}>
                    {new Date(issue.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <span className={`badge ${STATUS_COLORS[issue.status]}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                    <span className={`badge ${PRIORITY_COLORS[issue.priority]}`}>
                      {issue.priority}
                    </span>
                  </div>
                  {issue.admin_note && (
                    <div className={styles.adminNote}>📝 {issue.admin_note}</div>
                  )}
                  {/* Admin controls */}
                  {user?.role === 'admin' && issue.status !== 'resolved' && (
                    <div className={styles.adminActions}>
                      {issue.status === 'open' && (
                        <button className={styles.actionBtn} onClick={() => handleStatusUpdate(issue.id, 'in_progress')}>
                          Mark in progress
                        </button>
                      )}
                      <button className={`${styles.actionBtn} ${styles.resolveBtn}`}
                        onClick={() => handleStatusUpdate(issue.id, 'resolved')}>
                        Mark resolved
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Report issue sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
          Report an issue
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>
          Describe the problem clearly so the admin can prioritise and fix it.
        </p>

        <div className='input-group'>
          <label className='input-label'>Title</label>
          <input className='input' placeholder='e.g. Treadmill belt slipping' value={form.title} onChange={set('title')} />
        </div>

        <div className='input-group'>
          <label className='input-label'>Equipment (optional)</label>
          <input className='input' placeholder='e.g. Treadmill #2, AC, Dumbbell rack' value={form.equipment} onChange={set('equipment')} />
        </div>

        <div className='input-group'>
          <label className='input-label'>Description</label>
          <textarea className='input' rows={3} style={{ resize: 'none' }}
            placeholder='Describe the issue in detail...'
            value={form.description} onChange={set('description')} />
        </div>

        <div className='input-group'>
          <label className='input-label'>Priority</label>
          <div className={styles.priorityRow}>
            {['low', 'medium', 'high'].map(p => (
              <button key={p}
                className={`${styles.priorityBtn} ${form.priority === p ? styles[`priority_${p}`] : ''}`}
                onClick={() => setForm(f => ({ ...f, priority: p }))}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <button className='btn btn-primary' onClick={handleReport}
          disabled={!form.title || !form.description || submitting}>
          {submitting ? <span className='spinner' /> : 'Submit issue'}
        </button>
      </BottomSheet>
    </div>
  )
}
