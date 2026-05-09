'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import useOwnerRequestsInbox from '@/hooks/useOwnerRequestsInbox'
import type { RecentBuildingConversation } from '@/lib/messages/messageService'

type DashboardContact = {
  id: string
  name: string
}

type UseDashboardCommunicationParams = {
  buildingId: string
  isHomeView: boolean
  managerContact: DashboardContact | null
  recentConversations: RecentBuildingConversation[]
  shouldOpenMessages: boolean
  openConversation: () => Promise<void>
  markRecentConversationRead: (
    conversation: RecentBuildingConversation
  ) => void
  openBuildingMessages: () => void
  openMessagesForBuilding: (buildingId: string) => void
}

export function useDashboardCommunication({
  buildingId,
  isHomeView,
  managerContact,
  recentConversations,
  shouldOpenMessages,
  openConversation,
  markRecentConversationRead,
  openBuildingMessages,
  openMessagesForBuilding,
}: UseDashboardCommunicationParams) {
  const [messagesInboxOpen, setMessagesInboxOpen] = useState(false)

  const canOpenMessages = isHomeView
    ? recentConversations.length > 0
    : Boolean(managerContact)

  const globalUnreadMessageCount = useMemo(
    () =>
      recentConversations.reduce(
        (total, conversation) => total + conversation.unread_count,
        0
      ),
    [recentConversations]
  )

  const ownerRequests = useOwnerRequestsInbox(buildingId, {
    enabled: Boolean(buildingId) && !isHomeView && Boolean(managerContact),
    initialDelayMs: 300,
  })

  useEffect(() => {
    if (!shouldOpenMessages || !buildingId || !managerContact) return

    void openConversation()
    openBuildingMessages()
  }, [
    buildingId,
    managerContact,
    openBuildingMessages,
    openConversation,
    shouldOpenMessages,
  ])

  const openMessagesInbox = useCallback(() => {
    setMessagesInboxOpen(true)
  }, [])

  const closeMessagesInbox = useCallback(() => {
    setMessagesInboxOpen(false)
  }, [])

  const selectInboxConversation = useCallback(
    (conversation: RecentBuildingConversation) => {
      markRecentConversationRead(conversation)

      if (conversation.building_id === buildingId) {
        setMessagesInboxOpen(false)
        void openConversation()
        return
      }

      setMessagesInboxOpen(false)
      openMessagesForBuilding(conversation.building_id)
    },
    [
      buildingId,
      markRecentConversationRead,
      openConversation,
      openMessagesForBuilding,
    ]
  )

  return {
    canOpenMessages,
    globalUnreadMessageCount,
    messagesInboxOpen,
    ownerRequests,
    openMessagesInbox,
    closeMessagesInbox,
    selectInboxConversation,
  }
}
