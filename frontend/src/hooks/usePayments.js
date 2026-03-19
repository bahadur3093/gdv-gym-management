import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'

export function usePayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/payments/me')
      .then(res => setPayments(res.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const getUPILink = async (month) => {
    const res = await api.get(`/payments/upi-link?month=${month}`)
    return res.data
  }

  const submitPayment = async (utrNumber, month) => {
    const res = await api.post('/payments/submit', { utrNumber, month })
    load() // refresh list
    return res.data
  }

  return { payments, loading, getUPILink, submitPayment, reload: load }
}

export function usePendingPayments() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/payments/pending')
      .then(res => setPending(res.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const approve = async (id, action) => {
    await api.patch(`/payments/${id}/approve`, { action })
    load()
  }

  return { pending, loading, approve, reload: load }
}
