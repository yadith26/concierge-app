import { supabase } from '@/lib/supabase'

export type MessagePriority = 'normal' | 'important' | 'urgent'

export type BuildingMessage = {
  id: string
  body: string
  created_at: string
  read_at: string | null
  sender_id: string
  recipient_id?: string
  sender_name: string
  priority?: MessagePriority
  related_apartment?: string | null
}

export type RecentBuildingConversation = {
  building_id: string
  building_name: string
  contact_avatar_key: string | null
  contact_id: string
  contact_name: string
  contact_profile_photo_url: string | null
  last_message_id: string
  last_message_body: string
  last_message_at: string
  unread_count: number
}

async function getProfileNameMap(profileIds: string[]) {
  const uniqueIds = [...new Set(profileIds.filter(Boolean))]

  if (!uniqueIds.length) {
    return new Map<string, string>()
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', uniqueIds)

  if (error) {
    throw new Error(error.message || 'No se pudieron cargar los perfiles.')
  }

  return new Map(
    ((profiles as Array<{
      id: string
      first_name: string | null
      last_name: string | null
    }>) || []).map((profile) => [
      profile.id,
      [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Usuario',
    ])
  )
}

async function getProfileSummaryMap(profileIds: string[]) {
  const uniqueIds = [...new Set(profileIds.filter(Boolean))]

  if (!uniqueIds.length) {
    return new Map<
      string,
      {
        avatar_key: string | null
        name: string
        profile_photo_url: string | null
      }
    >()
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_key, profile_photo_url')
    .in('id', uniqueIds)

  if (error) {
    throw new Error(error.message || 'No se pudieron cargar los perfiles.')
  }

  return new Map(
    ((profiles as Array<{
      id: string
      first_name: string | null
      last_name: string | null
      avatar_key: string | null
      profile_photo_url: string | null
    }>) || []).map((profile) => [
      profile.id,
      {
        avatar_key: profile.avatar_key || null,
        name:
          [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
          'Usuario',
        profile_photo_url: profile.profile_photo_url || null,
      },
    ])
  )
}

async function getBuildingNameMap(buildingIds: string[]) {
  const uniqueIds = [...new Set(buildingIds.filter(Boolean))]

  if (!uniqueIds.length) {
    return new Map<string, string>()
  }

  const { data: buildings, error } = await supabase
    .from('buildings_new')
    .select('id, name')
    .in('id', uniqueIds)

  if (error) {
    throw new Error(error.message || 'No se pudieron cargar los edificios.')
  }

  return new Map(
    ((buildings as Array<{ id: string; name: string | null }>) || []).map(
      (building) => [building.id, building.name || 'Edificio']
    )
  )
}

export async function sendBuildingMessage({
  buildingId,
  senderId,
  senderRole,
  recipientId,
  recipientRole,
  body,
  priority = 'normal',
  relatedApartment = null,
}: {
  buildingId: string
  senderId: string
  senderRole: 'concierge' | 'manager'
  recipientId: string
  recipientRole: 'concierge' | 'manager'
  body: string
  priority?: MessagePriority
  relatedApartment?: string | null
}) {
  const trimmedBody = body.trim()

  if (!trimmedBody) {
    throw new Error('Escribe un mensaje antes de enviarlo.')
  }

  const { error } = await supabase.from('building_messages').insert({
    building_id: buildingId,
    sender_id: senderId,
    sender_role: senderRole,
    recipient_id: recipientId,
    recipient_role: recipientRole,
    body: trimmedBody,
    priority,
    related_apartment: relatedApartment,
  })

  if (error) {
    throw new Error(error.message || 'No se pudo enviar el mensaje.')
  }
}

export async function fetchInboxMessages({
  buildingId,
  recipientId,
  limit = 5,
}: {
  buildingId: string
  recipientId: string
  limit?: number
}): Promise<BuildingMessage[]> {
  const { data, error } = await supabase
    .from('building_messages')
    .select(
      'id, body, created_at, read_at, sender_id, recipient_id, priority, related_apartment'
    )
    .eq('building_id', buildingId)
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message || 'No se pudieron cargar los mensajes.')
  }

  const messages =
    (data as Array<{
      id: string
      body: string
      created_at: string
      read_at: string | null
      sender_id: string
      recipient_id?: string
      priority?: MessagePriority
      related_apartment?: string | null
    }>) || []

  const senderIds = [...new Set(messages.map((message) => message.sender_id))]
  const senderMap = await getProfileNameMap(senderIds)

  return messages.map((message) => ({
    ...message,
    sender_name: senderMap.get(message.sender_id) || 'Usuario',
  }))
}

export async function fetchUnreadMessagesCount({
  recipientId,
  buildingId,
}: {
  recipientId: string
  buildingId?: string
}): Promise<number> {
  let query = supabase
    .from('building_messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', recipientId)
    .is('read_at', null)

  if (buildingId) {
    query = query.eq('building_id', buildingId)
  }

  const { count, error } = await query

  if (error) {
    throw new Error(
      error.message || 'No se pudo obtener la cantidad de mensajes nuevos.'
    )
  }

  return count || 0
}

export async function fetchConversationMessages({
  buildingId,
  firstUserId,
  secondUserId,
}: {
  buildingId: string
  firstUserId: string
  secondUserId: string
}): Promise<BuildingMessage[]> {
  const { data, error } = await supabase
    .from('building_messages')
    .select(
      'id, body, created_at, read_at, sender_id, recipient_id, priority, related_apartment'
    )
    .eq('building_id', buildingId)
    .or(
      `and(sender_id.eq.${firstUserId},recipient_id.eq.${secondUserId}),and(sender_id.eq.${secondUserId},recipient_id.eq.${firstUserId})`
    )
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message || 'No se pudo cargar la conversacion.')
  }

  const messages =
    (data as Array<{
      id: string
      body: string
      created_at: string
      read_at: string | null
      sender_id: string
      recipient_id: string
      priority?: MessagePriority
      related_apartment?: string | null
    }>) || []

  const profileMap = await getProfileNameMap(
    messages.flatMap((message) => [message.sender_id, message.recipient_id])
  )

  return messages.map((message) => ({
    ...message,
    sender_name: profileMap.get(message.sender_id) || 'Usuario',
  }))
}

export async function fetchRecentBuildingConversations({
  userId,
  limit = 4,
}: {
  userId: string
  limit?: number
}): Promise<RecentBuildingConversation[]> {
  const { data, error } = await supabase
    .from('building_messages')
    .select(
      'id, body, created_at, read_at, building_id, sender_id, recipient_id'
    )
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    throw new Error(
      error.message || 'No se pudieron cargar las conversaciones recientes.'
    )
  }

  const messages =
    (data as Array<{
      id: string
      body: string
      created_at: string
      read_at: string | null
      building_id: string
      sender_id: string
      recipient_id: string
    }>) || []

  if (!messages.length) {
    return []
  }

  const buildingIds = [...new Set(messages.map((message) => message.building_id))]
  const profileIds = [
    ...new Set(
      messages.flatMap((message) => [message.sender_id, message.recipient_id])
    ),
  ]

  const [buildingMap, profileMap] = await Promise.all([
    getBuildingNameMap(buildingIds),
    getProfileSummaryMap(profileIds),
  ])

  const conversationMap = new Map<string, RecentBuildingConversation>()

  for (const message of messages) {
    const isOwnMessage = message.sender_id === userId
    const contactId = isOwnMessage ? message.recipient_id : message.sender_id
    const conversationKey = `${message.building_id}::${contactId}`
    const contactProfile = profileMap.get(contactId)

    const existingConversation = conversationMap.get(conversationKey)

    if (!existingConversation) {
      conversationMap.set(conversationKey, {
        building_id: message.building_id,
        building_name: buildingMap.get(message.building_id) || 'Edificio',
        contact_avatar_key: contactProfile?.avatar_key || null,
        contact_id: contactId,
        contact_name: contactProfile?.name || 'Usuario',
        contact_profile_photo_url: contactProfile?.profile_photo_url || null,
        last_message_id: message.id,
        last_message_body: message.body,
        last_message_at: message.created_at,
        unread_count: !isOwnMessage && !message.read_at ? 1 : 0,
      })
      continue
    }

    if (!isOwnMessage && !message.read_at) {
      existingConversation.unread_count += 1
    }
  }

  return Array.from(conversationMap.values())
    .sort(
      (first, second) =>
        new Date(second.last_message_at).getTime() -
        new Date(first.last_message_at).getTime()
    )
    .slice(0, limit)
}

export async function markBuildingMessageAsRead(messageId: string) {
  const { error } = await supabase
    .from('building_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId)
    .is('read_at', null)

  if (error) {
    throw new Error(error.message || 'No se pudo marcar el mensaje como leido.')
  }
}

export async function markConversationAsRead({
  buildingId,
  recipientId,
  senderId,
}: {
  buildingId: string
  recipientId: string
  senderId: string
}) {
  const { error } = await supabase
    .from('building_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('building_id', buildingId)
    .eq('recipient_id', recipientId)
    .eq('sender_id', senderId)
    .is('read_at', null)

  if (error) {
    throw new Error(
      error.message || 'No se pudieron marcar los mensajes como leidos.'
    )
  }
}
