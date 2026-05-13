'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createFollowUpFromSource } from '@/lib/tasks/taskFormActions'
import {
  reprogramExistingFollowUps,
  type ExistingFollowUpDecisionItem,
  type FollowUpSourceTask,
} from '@/lib/tasks/followUpHelpers'

type UseTaskFollowUpFlowParams = {
  buildingId: string
  profileId: string
  finalizeClose: () => Promise<void>
  setMessage: (message: string) => void
  onResultMessage?: (message: string) => void
}

export function useTaskFollowUpFlow({
  buildingId,
  profileId,
  finalizeClose,
  setMessage,
  onResultMessage,
}: UseTaskFollowUpFlowParams) {
  const t = useTranslations('taskFollowUpFlow')
  const [showFollowUpPrompt, setShowFollowUpPrompt] = useState(false)
  const [showExistingDecision, setShowExistingDecision] = useState(false)
  const [followUpSourceTask, setFollowUpSourceTask] =
    useState<FollowUpSourceTask | null>(null)
  const [existingFollowUps, setExistingFollowUps] = useState<
    ExistingFollowUpDecisionItem[]
  >([])
  const [deferredExistingFollowUps, setDeferredExistingFollowUps] = useState<
    ExistingFollowUpDecisionItem[]
  >([])
  const [creatingFollowUp, setCreatingFollowUp] = useState(false)
  const [pendingSummaryParts, setPendingSummaryParts] = useState<string[]>([])

  const finishWithSummary = async (extraSummaryParts: string[] = []) => {
    const finalParts = [...pendingSummaryParts, ...extraSummaryParts].filter(Boolean)

    if (finalParts.length > 0) {
      onResultMessage?.(finalParts.join(' '))
    }

    setPendingSummaryParts([])
    setExistingFollowUps([])
    setDeferredExistingFollowUps([])
    setShowExistingDecision(false)
    setShowFollowUpPrompt(false)
    await finalizeClose()
  }

  const handleCreateFollowUp = async () => {
    if (!followUpSourceTask) {
      await finalizeClose()
      return
    }

    setCreatingFollowUp(true)

    try {
      const result = await createFollowUpFromSource({
        sourceTask: followUpSourceTask,
        buildingId,
        profileId,
      })

      const summaryParts: string[] = []

      if (result.status === 'created') {
        if (result.createdApartments.length > 0) {
          summaryParts.push(
            t('createdPart', { count: result.createdApartments.length })
          )
        }
      }

      const combinedExistingFollowUps = [
        ...(result.existingFollowUps || []),
        ...deferredExistingFollowUps,
      ]

      if (combinedExistingFollowUps.length > 0) {
        setPendingSummaryParts(summaryParts)
        setExistingFollowUps(combinedExistingFollowUps)
        setDeferredExistingFollowUps([])
        setShowFollowUpPrompt(false)
        setShowExistingDecision(true)
        return
      }

      if (result.status === 'skipped') {
        await finishWithSummary()
        return
      }

      await finishWithSummary(summaryParts)
    } catch {
      setMessage(t('createError'))

      setShowFollowUpPrompt(false)
    } finally {
      setCreatingFollowUp(false)
    }
  }

  const handleSkipFollowUp = async () => {
    if (deferredExistingFollowUps.length > 0) {
      setExistingFollowUps(deferredExistingFollowUps)
      setDeferredExistingFollowUps([])
      setShowFollowUpPrompt(false)
      setShowExistingDecision(true)
      return
    }

    await finalizeClose()
  }

  const handleKeepExistingFollowUps = async () => {
    await finishWithSummary([
      t('unchangedPart', { count: existingFollowUps.length }),
    ])
  }

  const handleReprogramExistingFollowUps = async () => {
    setCreatingFollowUp(true)

    try {
      const reprogrammed = await reprogramExistingFollowUps({
        items: existingFollowUps,
      })

      const summaryParts: string[] = []

      if (reprogrammed.length > 0) {
        summaryParts.push(
          t('reprogrammedPart', { count: reprogrammed.length })
        )
      }

      const unchangedCount = existingFollowUps.length - reprogrammed.length

      if (unchangedCount > 0) {
        summaryParts.push(t('unchangedPart', { count: unchangedCount }))
      }

      await finishWithSummary(summaryParts)
    } catch {
      setMessage(t('createError'))
      setShowExistingDecision(false)
    } finally {
      setCreatingFollowUp(false)
    }
  }

  const promptFollowUp = (
    sourceTask: FollowUpSourceTask,
    deferredItems: ExistingFollowUpDecisionItem[] = []
  ) => {
    setFollowUpSourceTask(sourceTask)
    setDeferredExistingFollowUps(deferredItems)
    setShowFollowUpPrompt(true)
  }

  const promptExistingFollowUps = (
    items: ExistingFollowUpDecisionItem[],
    summaryParts: string[] = []
  ) => {
    setPendingSummaryParts(summaryParts)
    setExistingFollowUps(items)
    setShowFollowUpPrompt(false)
    setShowExistingDecision(true)
  }

  return {
    showFollowUpPrompt,
    showExistingDecision,
    setShowFollowUpPrompt,
    followUpSourceTask,
    existingFollowUps,
    creatingFollowUp,
    handleCreateFollowUp,
    handleSkipFollowUp,
    handleKeepExistingFollowUps,
    handleReprogramExistingFollowUps,
    promptFollowUp,
    promptExistingFollowUps,
  }
}
