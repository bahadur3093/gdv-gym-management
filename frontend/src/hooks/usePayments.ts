import { useState, useEffect, useCallback } from 'react'
import api from '@/utils/api'
import { Payment, UPILinkResponse, DuesResponse } from '@/types'

interface MemberSummary {
  totalPaid:        number
  totalOutstanding: number
  gymFee:           number
  byYear:           [string, number][]
  payments:         Payment[]
}

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

  const getUPILink = async (month: string, amount: number): Promise<UPILinkResponse> => {
    const res = await api.get<UPILinkResponse>(`/payments/upi-link?month=${month}&amount=${amount}`)
    return res.data
  }

  const submitPayment = async (utrNumber: string, month: string, amount: number, reason?: string) => {
    const res = await api.post('/payments/submit', { utrNumber, month, amount, reason })
    load()
    return res.data
  }

  return { payments, loading, getUPILink, submitPayment, reload: load }
}

export function useDues() {
  const [data, setData]       = useState<DuesResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api.get<DuesResponse>('/payments/dues')
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  return { data, loading, reload: load }
}

export function useMemberSummary() {
  const [data, setData]       = useState<MemberSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<MemberSummary>('/logs/member-summary')
      .then(res => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading }
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