import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

export function useMaintenance(statusFilter) {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    const params = statusFilter ? `?status=${statusFilter}` : ''
    api.get(`/maintenance${params}`)
      .then(res => setIssues(res.data))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const reportIssue = async (payload) => {
    const res = await api.post('/maintenance', payload)
    load()
    return res.data
  }

  const updateStatus = async (id, status, adminNote) => {
    await api.patch(`/maintenance/${id}`, { status, adminNote })
    load()
  }

  return { issues, loading, reportIssue, updateStatus, reload: load }
}
