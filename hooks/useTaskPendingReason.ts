'use client'

import { useState } from 'react'

type PendingReasonRequest = {
  taskId: string
  taskTitle: string
  onConfirm: (reason: string) => Promise<void>
}

export function useTaskPendingReason() {
  const [request, setRequest] = useState<PendingReasonRequest | null>(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const openPendingReason = (params: PendingReasonRequest) => {
    setRequest(params)
    setReason('')
    setSaving(false)
  }

  const closePendingReason = () => {
    if (saving) return
    setRequest(null)
    setReason('')
  }

  const confirmPendingReason = async () => {
    if (!request || !reason.trim()) return

    setSaving(true)
    try {
      await request.onConfirm(reason.trim())
      setRequest(null)
      setReason('')
    } finally {
      setSaving(false)
    }
  }

  return {
    pendingReasonOpen: !!request,
    pendingReasonTaskTitle: request?.taskTitle || '',
    pendingReasonValue: reason,
    pendingReasonSaving: saving,
    setPendingReasonValue: setReason,
    openPendingReason,
    closePendingReason,
    confirmPendingReason,
  }
}
