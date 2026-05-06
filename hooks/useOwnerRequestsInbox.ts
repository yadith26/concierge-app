'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getUnreadRequestCount,
  toOwnerRequestTaskDraft,
  type OwnerRequestItem,
} from '@/lib/owner-requests/ownerRequestHelpers'
import {
  loadOwnerRequests,
  updateOwnerRequestStatus,
} from '@/lib/owner-requests/ownerRequestService'

export default function useOwnerRequestsInbox(
  buildingId: string,
  options?: { enabled?: boolean; initialDelayMs?: number }
) {
  const enabled = options?.enabled ?? true
  const initialDelayMs = options?.initialDelayMs ?? 300
  const [requests, setRequests] = useState<OwnerRequestItem[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadRequests = useCallback(async (): Promise<OwnerRequestItem[]> => {
    if (!enabled || !buildingId) {
      setRequests([])
      return []
    }

    setLoading(true)
    setError('')

    const { data, error: requestsError } = await loadOwnerRequests(buildingId)

    if (requestsError) {
      setError(requestsError.message || 'No se pudieron cargar los eventos del manager.')
      setRequests([])
      setLoading(false)
      return []
    }

    const nextRequests = (data as OwnerRequestItem[]) || []
    setRequests(nextRequests)
    setLoading(false)
    return nextRequests
  }, [buildingId, enabled])

  useEffect(() => {
    if (!enabled) return

    const timeoutId = window.setTimeout(() => {
      void loadRequests()
    }, initialDelayMs)

    return () => window.clearTimeout(timeoutId)
  }, [enabled, initialDelayMs, loadRequests])

  const unreadCount = useMemo(() => getUnreadRequestCount(requests), [requests])
  const openCount = requests.length

  const openModal = useCallback(async () => {
    setModalOpen(true)
    const nextRequests = await loadRequests()

    const pendingIds = nextRequests
      .filter((request) => request.status === 'pending')
      .map((request) => request.id)

    if (pendingIds.length) {
      await updateOwnerRequestStatus(pendingIds, 'viewed')

      setRequests((current) =>
        current.map((request) =>
          pendingIds.includes(request.id)
            ? { ...request, status: 'viewed' }
            : request
        )
      )
    }
  }, [loadRequests])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setError('')
  }, [])

  const archiveRequest = useCallback(async (requestId: string) => {
    const { error: updateError } = await updateOwnerRequestStatus(requestId, 'closed')

    if (updateError) {
      setError(updateError.message || 'No se pudo archivar el evento.')
      return
    }

    setRequests((current) => current.filter((request) => request.id !== requestId))
  }, [])

  const markConverted = useCallback(async (requestId: string) => {
    const { error: updateError } = await updateOwnerRequestStatus(
      requestId,
      'converted'
    )

    if (updateError) {
      setError(updateError.message || 'No se pudo actualizar el evento.')
      return false
    }

    setRequests((current) => current.filter((request) => request.id !== requestId))
    return true
  }, [])

  return {
    requests,
    modalOpen,
    loading,
    error,
    unreadCount,
    openCount,
    openModal,
    closeModal,
    archiveRequest,
    markConverted,
    toTaskDraft: toOwnerRequestTaskDraft,
    reloadRequests: loadRequests,
  }
}
