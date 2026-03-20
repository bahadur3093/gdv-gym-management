import { useState, useEffect, useCallback } from 'react'
import api from '@/utils/api'
import { MaintenanceIssue, IssueStatus, ReportIssuePayload } from '@/types'

export function useMaintenance(statusFilter?: IssueStatus) {
  const [issues, setIssues]   = useState<MaintenanceIssue[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    const params = statusFilter ? `?status=${statusFilter}` : ''
    api.get<MaintenanceIssue[]>(`/maintenance${params}`)
      .then(res => setIssues(res.data))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const reportIssue = async (payload: ReportIssuePayload) => {
    const res = await api.post('/maintenance', payload)
    load()
    return res.data
  }

  const updateStatus = async (id: string, status: IssueStatus, adminNote: string) => {
    await api.patch(`/maintenance/${id}`, { status, adminNote })
    load()
  }

  return { issues, loading, reportIssue, updateStatus, reload: load }
}
