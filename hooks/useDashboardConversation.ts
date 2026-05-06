'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  fetchConversationMessages,
  markBuildingMessageAsRead,
  markConversationAsRead,
  sendBuildingMessage,
  type BuildingMessage,
  type MessagePriority,
} from '@/lib/messages/messageService'

type DashboardContact = {
  id: string
  name: string
}

type UseDashboardConversationParams = {
  buildingId: string
  profileId: string
  managerContact: DashboardContact | null
  messages: BuildingMessage[]
  setMessages: React.Dispatch<React.SetStateAction<BuildingMessage[]>>
}

function parseMessageMetadata(text: string): {
  priority: MessagePriority
  relatedApartment: string | null
} {
  const lower = text.toLowerCase()

  let priority: MessagePriority = 'normal'

  if (lower.includes('urgente')) {
    priority = 'urgent'
  } else if (lower.includes('importante')) {
    priority = 'important'
  }

  const apartmentMatch =
    text.match(/\bapto\.?\s*[a-z0-9-]+\b/i) ||
    text.match(/\bapt\.?\s*[a-z0-9-]+\b/i) ||
    text.match(/\bapartamento\s*[a-z0-9-]+\b/i)

  return {
    priority,
    relatedApartment: apartmentMatch ? apartmentMatch[0] : null,
  }
}

export function useDashboardConversation({
  buildingId,
  profileId,
  managerContact,
  messages,
  setMessages,
}: UseDashboardConversationParams) {
  const [messagesModalOpen, setMessagesModalOpen] = useState(false)
  const [conversationMessages, setConversationMessages] = useState<
    BuildingMessage[]
  >([])
  const [conversationDraft, setConversationDraft] = useState('')
  const [conversationError, setConversationError] = useState('')
  const [conversationLoading, setConversationLoading] = useState(false)
  const [conversationSending, setConversationSending] = useState(false)

  const loadConversation = useCallback(async () => {
    if (!buildingId || !profileId || !managerContact) return

    setConversationLoading(true)
    setConversationError('')

    try {
      const conversation = await fetchConversationMessages({
        buildingId,
        firstUserId: profileId,
        secondUserId: managerContact.id,
      })

      setConversationMessages(conversation)

      await markConversationAsRead({
        buildingId,
        recipientId: profileId,
        senderId: managerContact.id,
      })

      setMessages((current) =>
        current.map((message) =>
          message.sender_id === managerContact.id
            ? { ...message, read_at: new Date().toISOString() }
            : message
        )
      )
    } catch (error) {
      console.error('Error cargando conversacion:', error)
      setConversationError('No se pudo cargar la conversacion.')
    } finally {
      setConversationLoading(false)
    }
  }, [buildingId, managerContact, profileId, setMessages])

  const openConversation = useCallback(async () => {
    setMessagesModalOpen(true)
    await loadConversation()
  }, [loadConversation])

  const sendConversationMessage = useCallback(async () => {
    if (!buildingId || !profileId || !managerContact) {
      setConversationError('No encontramos el manager del edificio.')
      return
    }

    setConversationSending(true)
    setConversationError('')

    try {
      const { priority, relatedApartment } =
        parseMessageMetadata(conversationDraft)

      await sendBuildingMessage({
        buildingId,
        senderId: profileId,
        senderRole: 'concierge',
        recipientId: managerContact.id,
        recipientRole: 'manager',
        body: conversationDraft,
        priority,
        relatedApartment,
      })

      setConversationDraft('')
      await loadConversation()
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      setConversationError(
        error instanceof Error ? error.message : 'No se pudo enviar el mensaje.'
      )
    } finally {
      setConversationSending(false)
    }
  }, [
    buildingId,
    conversationDraft,
    loadConversation,
    managerContact,
    profileId,
  ])

  const markMessageRead = useCallback(
    async (messageId: string) => {
      const previousMessages = messages

      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? { ...message, read_at: new Date().toISOString() }
            : message
        )
      )

      try {
        await markBuildingMessageAsRead(messageId)
      } catch (error) {
        console.error('Error marcando mensaje como leido:', error)
        setMessages(previousMessages)
      }
    },
    [messages, setMessages]
  )

  const unreadMessageCount = useMemo(
    () => messages.filter((message) => !message.read_at).length,
    [messages]
  )

  return {
    conversationDraft,
    conversationError,
    conversationLoading,
    conversationMessages,
    conversationSending,
    markMessageRead,
    messagesModalOpen,
    openConversation,
    sendConversationMessage,
    setConversationDraft,
    setMessagesModalOpen,
    unreadMessageCount,
  }
}