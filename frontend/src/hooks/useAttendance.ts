import { useState, useEffect, useCallback } from 'react'
import api from '@/utils/api'
import { AttendanceResponse, TodayAttendance } from '@/types'

export function useAttendance(month?: string) {
  const [data, setData]       = useState<AttendanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    const params = month ? `?month=${month}` : ''
    api.get<AttendanceResponse>(`/attendance/me${params}`)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load attendance'))
      .finally(() => setLoading(false))
  }, [month])

  useEffect(() => { load() }, [load])

  const checkIn = async () => {
    const res = await api.post('/attendance/checkin')
    return res.data
  }

  return { data, loading, error, checkIn, reload: load }
}

export function useTodayAttendance() {
  const [data, setData]       = useState<TodayAttendance | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<TodayAttendance>('/attendance/today')
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}
