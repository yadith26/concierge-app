'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import {
  fetchConversationMessages,
  fetchRecentBuildingConversations,
  fetchUnreadMessagesCount,
  markConversationAsRead,
  sendBuildingMessage,
  type BuildingMessage,
  type MessagePriority,
  type RecentBuildingConversation,
} from '@/lib/messages/messageService'

type Role = 'concierge' | 'manager'

type Contact = {
  id: string
  name: string
  role: Role
}

type UseHeaderConversationOptions = {
  preferredBuildingId?: string
}

type UseHeaderConversationResult = {
  activeBuildingId: string
  canOpenConversation: boolean
  contactId: string
  currentUserId: string
  contactName: string
  contactRole: Role | null
  unreadCount: number
  inboxOpen: boolean
  inboxConversations: RecentBuildingConversation[]
  loadingInbox: boolean
  modalOpen: boolean
  messages: BuildingMessage[]
  value: string
  loadingConversation: boolean
  sending: boolean
  error: string
  setValue: (value: string) => void
  openInbox: () => Promise<void>
  closeInbox: () => void
  openInboxConversation: (conversation: RecentBuildingConversation) => Promise<void>
  openConversation: () => Promise<void>
  openConversationForBuilding: (buildingId: string) => Promise<void>
  closeConversation: () => void
  sendMessage: () => Promise<void>
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

async function getProfileName(profileId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('id', profileId)
    .maybeSingle()

  if (error || !data) {
    return ''
  }

  return [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Usuario'
}

async function resolveConciergeBuilding(userId: string) {
  const { data, error } = await supabase
    .from('building_users')
    .select('building_id')
    .eq('user_id', userId)
    .eq('role', 'concierge')
    .limit(1)

  if (error) {
    throw new Error(error.message || 'No se pudo obtener el edificio del conserje.')
  }

  return ((data as Array<{ building_id: string }>) || [])[0]?.building_id || ''
}

async function resolveManagerBuilding(userId: string) {
  const { data, error } = await supabase
    .from('building_users')
    .select('building_id')
    .eq('user_id', userId)
    .eq('role', 'manager')
    .limit(1)

  if (error) {
    throw new Error(error.message || 'No se pudo obtener el edificio del manager.')
  }

  return ((data as Array<{ building_id: string }>) || [])[0]?.building_id || ''
}

async function resolveManagerContact(buildingId: string) {
  const { data, error } = await supabase
    .from('building_users')
    .select('user_id')
    .eq('building_id', buildingId)
    .eq('role', 'manager')
    .limit(1)

  if (error) {
    throw new Error(error.message || 'No se pudo obtener el manager del edificio.')
  }

  const managerId = ((data as Array<{ user_id: string }>) || [])[0]?.user_id || ''
  if (!managerId) return null

  return {
    id: managerId,
    name: await getProfileName(managerId),
    role: 'manager' as const,
  }
}

async function resolveConciergeContact(buildingId: string) {
  const { data, error } = await supabase
    .from('building_users')
    .select('user_id')
    .eq('building_id', buildingId)
    .eq('role', 'concierge')
    .limit(1)

  if (error) {
    throw new Error(error.message || 'No se pudo obtener el conserje del edificio.')
  }

  let conciergeId = ((data as Array<{ user_id: string }>) || [])[0]?.user_id || ''

  if (!conciergeId) {
    const { data: buildingData } = await supabase
      .from('buildings_new')
      .select('concierge_id')
      .eq('id', buildingId)
      .maybeSingle()

    conciergeId = (buildingData?.concierge_id as string | null) || ''
  }

  if (!conciergeId) return null

  return {
    id: conciergeId,
    name: await getProfileName(conciergeId),
    role: 'concierge' as const,
  }
}

async function resolveContactForBuilding({
  role,
  buildingId,
}: {
  role: Role
  buildingId: string
}) {
  return role === 'concierge'
    ? resolveManagerContact(buildingId)
    : resolveConciergeContact(buildingId)
}

export default function useHeaderConversation({
  preferredBuildingId,
}: UseHeaderConversationOptions = {}): UseHeaderConversationResult {
  const [currentUserId, setCurrentUserId] = useState('')
  const [currentRole, setCurrentRole] = useState<Role | null>(null)
  const [activeBuildingId, setActiveBuildingId] = useState('')
  const [contact, setContact] = useState<Contact | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [inboxOpen, setInboxOpen] = useState(false)
  const [inboxConversations, setInboxConversations] = useState<
    RecentBuildingConversation[]
  >([])
  const [loadingInbox, setLoadingInbox] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [messages, setMessages] = useState<BuildingMessage[]>([])
  const [value, setValue] = useState('')
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const refreshUnreadCount = useCallback(async (recipientId: string) => {
    try {
      const nextCount = await fetchUnreadMessagesCount({ recipientId })
      setUnreadCount(nextCount)
    } catch {
      setUnreadCount(0)
    }
  }, [])

  const refreshInbox = useCallback(async (userId: string) => {
    setLoadingInbox(true)

    try {
      const conversations = await fetchRecentBuildingConversations({
        userId,
        limit: 20,
      })
      setInboxConversations(conversations)
    } catch {
      setInboxConversations([])
    } finally {
      setLoadingInbox(false)
    }
  }, [])

  const loadConversation = useCallback(
    async ({
      buildingId,
      userId,
      nextContact,
    }: {
      buildingId: string
      userId: string
      nextContact: Contact
    }) => {
      setLoadingConversation(true)
      setError('')

      try {
        const conversation = await fetchConversationMessages({
          buildingId,
          firstUserId: userId,
          secondUserId: nextContact.id,
        })

        setMessages(conversation)

        await markConversationAsRead({
          buildingId,
          recipientId: userId,
          senderId: nextContact.id,
        })

        await refreshUnreadCount(userId)
      } catch (conversationError) {
        setError(
          conversationError instanceof Error
            ? conversationError.message
            : 'No se pudo abrir la conversacion.'
        )
      } finally {
        setLoadingConversation(false)
      }
    },
    [refreshUnreadCount]
  )

  const loadContext = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await getSafeAuthUser()

      if (!user) {
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError || !profile) {
        return
      }

      const role = profile.role as Role
      setCurrentUserId(profile.id)
      setCurrentRole(role)
      await refreshUnreadCount(profile.id)

      const buildingId =
        preferredBuildingId ||
        (role === 'concierge'
          ? await resolveConciergeBuilding(profile.id)
          : await resolveManagerBuilding(profile.id))

      setActiveBuildingId(buildingId)

      if (!buildingId) {
        setContact(null)
        return
      }

      const nextContact = await resolveContactForBuilding({
        role,
        buildingId,
      })

      setContact(nextContact)
    } catch {
      setContact(null)
    }
  }, [preferredBuildingId, refreshUnreadCount])

  useEffect(() => {
    void loadContext()
  }, [loadContext])

  const openConversation = useCallback(async () => {
    if (!contact || !currentUserId || !activeBuildingId) {
      return
    }

    setModalOpen(true)

    await loadConversation({
      buildingId: activeBuildingId,
      userId: currentUserId,
      nextContact: contact,
    })
  }, [activeBuildingId, contact, currentUserId, loadConversation])

  const openConversationForBuilding = useCallback(
    async (buildingId: string) => {
      if (!buildingId || !currentUserId || !currentRole) {
        return
      }

      setError('')
      setActiveBuildingId(buildingId)

      const nextContact = await resolveContactForBuilding({
        role: currentRole,
        buildingId,
      })

      if (!nextContact) {
        setContact(null)
        return
      }

      setContact(nextContact)
      setModalOpen(true)

      await loadConversation({
        buildingId,
        userId: currentUserId,
        nextContact,
      })

      setInboxConversations((currentConversations) =>
        currentConversations.map((conversation) =>
          conversation.building_id === buildingId &&
          conversation.contact_id === nextContact.id
            ? { ...conversation, unread_count: 0 }
            : conversation
        )
      )
    },
    [currentRole, currentUserId, loadConversation]
  )

  const openInbox = useCallback(async () => {
    if (!currentUserId) return

    setInboxOpen(true)
    await refreshInbox(currentUserId)
  }, [currentUserId, refreshInbox])

  const closeInbox = useCallback(() => {
    setInboxOpen(false)
  }, [])

  const openInboxConversation = useCallback(
    async (conversation: RecentBuildingConversation) => {
      if (!currentRole || !currentUserId) return

      const nextContact: Contact = {
        id: conversation.contact_id,
        name: conversation.contact_name,
        role: currentRole === 'manager' ? 'concierge' : 'manager',
      }

      setInboxOpen(false)
      setActiveBuildingId(conversation.building_id)
      setContact(nextContact)
      setModalOpen(true)

      await loadConversation({
        buildingId: conversation.building_id,
        userId: currentUserId,
        nextContact,
      })

      setInboxConversations((currentConversations) =>
        currentConversations.map((item) =>
          item.building_id === conversation.building_id &&
          item.contact_id === conversation.contact_id
            ? { ...item, unread_count: 0 }
            : item
        )
      )
    },
    [currentRole, currentUserId, loadConversation]
  )

  const closeConversation = useCallback(() => {
    setModalOpen(false)
    setError('')
  }, [])

  const sendMessage = useCallback(async () => {
    if (!activeBuildingId || !currentUserId || !currentRole || !contact) {
      return
    }

    setSending(true)
    setError('')

    try {
      const { priority, relatedApartment } = parseMessageMetadata(value)

      await sendBuildingMessage({
        buildingId: activeBuildingId,
        senderId: currentUserId,
        senderRole: currentRole,
        recipientId: contact.id,
        recipientRole: contact.role,
        body: value,
        priority,
        relatedApartment,
      })

      setValue('')

      await loadConversation({
        buildingId: activeBuildingId,
        userId: currentUserId,
        nextContact: contact,
      })
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : 'No se pudo enviar el mensaje.'
      )
    } finally {
      setSending(false)
    }
  }, [activeBuildingId, contact, currentRole, currentUserId, loadConversation, value])

  return useMemo(
    () => ({
      activeBuildingId,
      canOpenConversation: Boolean(currentUserId && activeBuildingId && contact?.id),
      contactId: contact?.id || '',
      currentUserId,
      contactName: contact?.name || '',
      contactRole: contact?.role || null,
      unreadCount,
      inboxOpen,
      inboxConversations,
      loadingInbox,
      modalOpen,
      messages,
      value,
      loadingConversation,
      sending,
      error,
      setValue,
      openInbox,
      closeInbox,
      openInboxConversation,
      openConversation,
      openConversationForBuilding,
      closeConversation,
      sendMessage,
    }),
    [
      activeBuildingId,
      contact,
      currentUserId,
      unreadCount,
      inboxOpen,
      inboxConversations,
      loadingInbox,
      modalOpen,
      messages,
      value,
      loadingConversation,
      sending,
      error,
      openInbox,
      closeInbox,
      openInboxConversation,
      openConversation,
      openConversationForBuilding,
      closeConversation,
      sendMessage,
    ]
  )
}
