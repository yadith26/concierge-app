'use client'

import { useState } from 'react'
import { createFollowUpFromSource } from '@/lib/tasks/taskFormActions'
import type { FollowUpSourceTask } from '@/lib/tasks/followUpHelpers'

type UseTaskFollowUpFlowParams = {
  buildingId: string
  profileId: string
  finalizeClose: () => Promise<void>
  setMessage: (message: string) => void
}

export function useTaskFollowUpFlow({
  buildingId,
  profileId,
  finalizeClose,
  setMessage,
}: UseTaskFollowUpFlowParams) {
  const [showFollowUpPrompt, setShowFollowUpPrompt] = useState(false)
  const [followUpSourceTask, setFollowUpSourceTask] =
    useState<FollowUpSourceTask | null>(null)
  const [creatingFollowUp, setCreatingFollowUp] = useState(false)

  const handleCreateFollowUp = async () => {
    if (!followUpSourceTask) {
      await finalizeClose()
      return
    }

    setCreatingFollowUp(true)

    try {
      await createFollowUpFromSource({
        sourceTask: followUpSourceTask,
        buildingId,
        profileId,
      })

      await finalizeClose()
    } catch (error) {
      console.error('Error creando seguimiento:', error)

      if (
        error instanceof Error &&
        error.message ===
          'Ya existe un seguimiento pendiente para este tratamiento'
      ) {
        setMessage(error.message)
      } else {
        setMessage('No se pudo crear la tarea de seguimiento.')
      }

      setShowFollowUpPrompt(false)
    } finally {
      setCreatingFollowUp(false)
    }
  }

  const handleSkipFollowUp = async () => {
    await finalizeClose()
  }

  const promptFollowUp = (sourceTask: FollowUpSourceTask) => {
    setFollowUpSourceTask(sourceTask)
    setShowFollowUpPrompt(true)
  }

  return {
    showFollowUpPrompt,
    setShowFollowUpPrompt,
    followUpSourceTask,
    creatingFollowUp,
    handleCreateFollowUp,
    handleSkipFollowUp,
    promptFollowUp,
  }
}
