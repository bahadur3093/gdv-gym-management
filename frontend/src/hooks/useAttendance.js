import { useState, useEffect } from 'react'
import api from '../utils/api'

export function useAttendance(month) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    setLoading(true)
    const params = month ? `?month=${month}` : ''
    api.get(`/attendance/me${params}`)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load attendance'))
      .finally(() => setLoading(false))
  }, [month])

  const checkIn = async () => {
    const res = await api.post('/attendance/checkin')
    return res.data
  }

  return { data, loading, error, checkIn }
}

export function useTodayAttendance() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/attendance/today')
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
}
