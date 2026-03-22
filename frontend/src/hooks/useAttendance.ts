import { useState, useEffect, useCallback } from 'react'
import api from '@/utils/api'
import { AttendanceResponse, CurrentlyInResponse, AttendanceHistoryResponse } from '@/types'

export function useAttendance(month?: string) {
  const [data, setData]       = useState<AttendanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = month ? `?month=${month}` : ''
    return api.get<AttendanceResponse>(`/attendance/me${params}`)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load attendance'))
      .finally(() => setLoading(false))
  }, [month])

  useEffect(() => { load() }, [load])

  const checkIn = async () => {
    const res = await api.post('/attendance/checkin')
    await load()
    return res.data
  }

  const checkOut = async () => {
    const res = await api.post('/attendance/checkout')
    await load()
    return res.data
  }

  return { data, loading, error, checkIn, checkOut, reload: load }
}

export function useCurrentlyIn() {
  const [data, setData]       = useState<CurrentlyInResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    return api.get<CurrentlyInResponse>('/attendance/current')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    // Refresh every 60 seconds
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [load])

  return { data, loading, reload: load }
}

export function useAttendanceHistory(params: Record<string, string> = {}) {
  const [data, setData]       = useState<AttendanceHistoryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    const query = new URLSearchParams(params).toString()
    api.get<AttendanceHistoryResponse>(`/attendance/history${query ? '?' + query : ''}`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [JSON.stringify(params)])

  useEffect(() => { load() }, [load])

  return { data, loading, reload: load }
}

// Simple hook to check if current user has an open session right now
// Uses the /current endpoint and filters for the current user
export function useMySession(userId?: string) {
  const { data, loading, reload } = useCurrentlyIn()
  const openSession = data?.members?.find(m => m.members.id === userId)
  return { isCheckedIn: !!openSession, openSession, loading, reload }
}