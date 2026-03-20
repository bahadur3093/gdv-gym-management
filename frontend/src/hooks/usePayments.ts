import { useState, useEffect, useCallback } from 'react'
import api from '@/utils/api'
import { Payment, UPILinkResponse } from '@/types'

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading]   = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api.get<Payment[]>('/payments/me')
      .then(res => setPayments(res.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const getUPILink = async (month: string): Promise<UPILinkResponse> => {
    const res = await api.get<UPILinkResponse>(`/payments/upi-link?month=${month}`)
    return res.data
  }

  const submitPayment = async (utrNumber: string, month: string) => {
    const res = await api.post('/payments/submit', { utrNumber, month })
    load()
    return res.data
  }

  return { payments, loading, getUPILink, submitPayment, reload: load }
}

export function usePendingPayments() {
  const [pending, setPending] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api.get<Payment[]>('/payments/pending')
      .then(res => setPending(res.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const approve = async (id: string, action: 'approve' | 'reject') => {
    await api.patch(`/payments/${id}/approve`, { action })
    load()
  }

  return { pending, loading, approve, reload: load }
}
