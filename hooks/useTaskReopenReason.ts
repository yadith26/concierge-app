'use client'

import { useCallback, useState } from 'react'

type ReopenRequest = {
  taskTitle: string
  onConfirm: (reason: string) => Promise<boolean> | boolean
}

type UseTaskReopenReasonOptions = {
  requiredMessage: string
  failedMessage: string
}

export function useTaskReopenReason({
  requiredMessage,
  failedMessage,
}: UseTaskReopenReasonOptions) {
  const [request, setRequest] = useState<ReopenRequest | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const requestReopen = useCallback((nextRequest: ReopenRequest) => {
    setRequest(nextRequest)
    setReason('')
    setError(null)
    setSaving(false)
  }, [])

  const close = useCallback(() => {
    if (saving) return

    setRequest(null)
    setReason('')
    setError(null)
  }, [saving])

  const confirm = useCallback(async () => {
    if (!request) return false

    const trimmedReason = reason.trim()

    if (!trimmedReason) {
      setError(requiredMessage)
      return false
    }

    setSaving(true)
    setError(null)

    try {
      const didConfirm = await request.onConfirm(trimmedReason)

      if (didConfirm === false) {
        setError(failedMessage)
        return false
      }

      setRequest(null)
      setReason('')
      setError(null)
      return true
    } finally {
      setSaving(false)
    }
  }, [failedMessage, reason, request, requiredMessage])

  return {
    open: Boolean(request),
    taskTitle: request?.taskTitle || '',
    reason,
    error,
    saving,
    setReason,
    requestReopen,
    close,
    confirm,
  }
}
