'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import {
  fetchConversationMessages,
  markConversationAsRead,
  sendBuildingMessage,
  type BuildingMessage,
  type MessagePriority,
} from '@/lib/messages/messageService'
import { TASK_SELECT_FIELDS, normalizeTask } from '@/lib/tasks/taskHelpers'
import type { Task } from '@/lib/tasks/taskTypes'
import { fetchBuildingsForUser } from '@/lib/buildings/buildingMembershipService'
import type {
  BuildingSummary,
  ConciergeSummary,
  ManagerBuildingUnitSummary,
  OwnerRequestSummary,
  TaskFilter,
} from '@/lib/manager/managerDashboardTypes'
import {
  getFilteredManagerTasks,
  getManagerEventSummary,
  getManagerTaskFilterTitle,
  getManagerTaskSummary,
} from '@/lib/manager/managerDashboardHelpers'

type RedirectPath = '/login' | '/dashboard'

type UseManagerBuildingDashboardParams = {
  buildingId: string
  onRedirect: (path: RedirectPath) => void
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

export function useManagerBuildingDashboard({
  buildingId,
  onRedirect,
}: UseManagerBuildingDashboardParams) {
  const [building, setBuilding] = useState<BuildingSummary | null>(null)
  const [buildings, setBuildings] = useState<
    Pick<BuildingSummary, 'id' | 'name' | 'address' | 'invite_code'>[]
  >([])
  const [concierge, setConcierge] = useState<ConciergeSummary | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [ownerRequests, setOwnerRequests] = useState<OwnerRequestSummary[]>([])
  const [unitSummary, setUnitSummary] = useState<ManagerBuildingUnitSummary>({
    available: 0,
    expiringSoon: 0,
    garages: 0,
    occupied: 0,
    previewUnits: [],
    problematic: 0,
    storages: 0,
    totalApartments: 0,
  })
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('today')
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [profileId, setProfileId] = useState('')
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const [messageBody, setMessageBody] = useState('')
  const [messageError, setMessageError] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [conversationMessages, setConversationMessages] = useState<
    BuildingMessage[]
  >([])
  const [conversationLoading, setConversationLoading] = useState(false)
  const [messageSuccess, setMessageSuccess] = useState('')

  const reloadDashboard = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    const {
      data: { user },
      error: userError,
    } = await getSafeAuthUser()

    if (userError || !user) {
      onRedirect('/login')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      setErrorMessage('No se pudo cargar tu perfil.')
      setLoading(false)
      return
    }

    setProfileId(profile.id)

    if (profile.role !== 'manager') {
      onRedirect('/dashboard')
      return
    }

    try {
      const managerBuildings = await fetchBuildingsForUser({
        userId: profile.id,
        role: 'manager',
      })
      setBuildings(managerBuildings)
    } catch {
      setBuildings([])
    }

    const { data: membership, error: membershipError } = await supabase
      .from('building_users')
      .select('id')
      .eq('building_id', buildingId)
      .eq('user_id', profile.id)
      .eq('role', 'manager')
      .maybeSingle()

    if (membershipError || !membership) {
      setErrorMessage('No tienes acceso a este edificio.')
      setLoading(false)
      return
    }

    const [
      { data: buildingData, error: buildingError },
      { data: tasksData, error: tasksError },
      { data: requestsData, error: requestsError },
      { data: buildingUnitsData, error: buildingUnitsError },
    ] = await Promise.all([
      supabase
        .from('buildings_new')
        .select('id, name, address, invite_code, concierge_id')
        .eq('id', buildingId)
        .single(),
      supabase
        .from('tasks')
        .select(TASK_SELECT_FIELDS)
        .eq('building_id', buildingId)
        .order('task_date', { ascending: true }),
      supabase
        .from('owner_requests')
        .select(
          'id, title, description, suggested_date, apartment_or_area, category_suggestion, status, created_at'
        )
        .eq('building_id', buildingId)
        .order('created_at', { ascending: false }),
      supabase
        .from('building_units')
        .select(
          'unit_key, unit_label, status, tenant_name, lease_end, garage_label, storage_label, unit_kind'
        )
        .eq('building_id', buildingId)
        .order('unit_label', { ascending: true }),
    ])

    if (buildingError || !buildingData) {
      setErrorMessage('No se pudo cargar el edificio.')
      setLoading(false)
      return
    }

    if (tasksError || requestsError || buildingUnitsError) {
      setErrorMessage('No se pudo cargar toda la informacion del edificio.')
    }

    setBuilding(buildingData as BuildingSummary)
    setTasks(((tasksData as Task[]) || []).map(normalizeTask))
    setOwnerRequests((requestsData as OwnerRequestSummary[]) || [])

    const units =
      ((buildingUnitsData as Array<{
        garage_label: string | null
        lease_end: string | null
        status: 'occupied' | 'available' | 'expiring_soon' | 'problematic' | 'inactive'
        storage_label: string | null
        tenant_name: string | null
        unit_key: string
        unit_kind: 'apartment' | 'common_area' | 'garage' | 'storage'
        unit_label: string
      }>) || [])

    const apartmentUnits = units.filter((unit) => unit.unit_kind === 'apartment')
    setUnitSummary({
      available: apartmentUnits.filter((unit) => unit.status === 'available').length,
      expiringSoon: apartmentUnits.filter((unit) => unit.status === 'expiring_soon')
        .length,
      garages: units.filter((unit) => unit.garage_label?.trim()).length,
      occupied: apartmentUnits.filter((unit) => unit.status === 'occupied').length,
      previewUnits: apartmentUnits.slice(0, 4).map((unit) => ({
        lease_end: unit.lease_end,
        status: unit.status,
        tenant_name: unit.tenant_name,
        unit_key: unit.unit_key,
        unit_label: unit.unit_label,
      })),
      problematic: apartmentUnits.filter((unit) => unit.status === 'problematic')
        .length,
      storages: units.filter((unit) => unit.storage_label?.trim()).length,
      totalApartments: apartmentUnits.length,
    })

    const nextBuilding = buildingData as BuildingSummary

    if (nextBuilding.concierge_id) {
      const { data: conciergeProfile } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_key, profile_photo_url')
        .eq('id', nextBuilding.concierge_id)
        .maybeSingle()

      if (conciergeProfile) {
        const fullName = [
          conciergeProfile.first_name,
          conciergeProfile.last_name,
        ]
          .filter(Boolean)
          .join(' ')

        setConcierge({
          avatar_key:
            typeof conciergeProfile.avatar_key === 'string'
              ? conciergeProfile.avatar_key
              : null,
          id: conciergeProfile.id,
          name: fullName || 'Conserje asignado',
          profile_photo_url:
            typeof conciergeProfile.profile_photo_url === 'string'
              ? conciergeProfile.profile_photo_url
              : null,
        })
      } else {
        setConcierge(null)
      }
    } else {
      setConcierge(null)
    }

    setLoading(false)
  }, [buildingId, onRedirect])

  useEffect(() => {
    void reloadDashboard()
  }, [reloadDashboard])

  const summary = useMemo(() => getManagerTaskSummary(tasks), [tasks])

  const filteredTasks = useMemo(
    () => getFilteredManagerTasks(summary, activeFilter),
    [activeFilter, summary]
  )

  const eventSummary = useMemo(
    () => getManagerEventSummary(ownerRequests),
    [ownerRequests]
  )

  const activeFilterTitle = getManagerTaskFilterTitle(activeFilter)

  const loadConversation = useCallback(async () => {
    if (!building || !profileId || !concierge) return

    setConversationLoading(true)
    setMessageError('')

    try {
      const nextMessages = await fetchConversationMessages({
        buildingId: building.id,
        firstUserId: profileId,
        secondUserId: concierge.id,
      })

      setConversationMessages(nextMessages)

      await markConversationAsRead({
        buildingId: building.id,
        recipientId: profileId,
        senderId: concierge.id,
      })
    } catch (error) {
      setMessageError(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar la conversacion.'
      )
    } finally {
      setConversationLoading(false)
    }
  }, [building, concierge, profileId])

  const openConversation = useCallback(async () => {
    setMessageError('')
    setMessageSuccess('')
    setMessageModalOpen(true)
    await loadConversation()
  }, [loadConversation])

  const closeConversation = useCallback(() => {
    setMessageModalOpen(false)
    setMessageError('')
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (!building || !profileId || !concierge) {
      setMessageError('Este edificio todavia no tiene un conserje asignado.')
      return
    }

    setSendingMessage(true)
    setMessageError('')
    setMessageSuccess('')

    try {
      const { priority, relatedApartment } = parseMessageMetadata(messageBody)

      await sendBuildingMessage({
        buildingId: building.id,
        senderId: profileId,
        senderRole: 'manager',
        recipientId: concierge.id,
        recipientRole: 'concierge',
        body: messageBody,
        priority,
        relatedApartment,
      })

      setMessageBody('')
      await loadConversation()
      setMessageSuccess(`Mensaje enviado a ${concierge.name}.`)
    } catch (error) {
      setMessageError(
        error instanceof Error ? error.message : 'No se pudo enviar el mensaje.'
      )
    } finally {
      setSendingMessage(false)
    }
  }, [building, concierge, loadConversation, messageBody, profileId])

  const toggleTaskExpansion = useCallback((taskId: string) => {
    setExpandedTaskId((current) => (current === taskId ? null : taskId))
  }, [])

  return {
    activeFilter,
    activeFilterTitle,
    building,
    buildings,
    closeConversation,
    concierge,
    conversationLoading,
    conversationMessages,
    errorMessage,
    eventSummary,
    expandedTaskId,
    filteredTasks,
    handleSendMessage,
    loading,
    messageBody,
    messageError,
    messageModalOpen,
    messageSuccess,
    openConversation,
    profileId,
    reloadDashboard,
    sendingMessage,
    setActiveFilter,
    setMessageBody,
    summary,
    unitSummary,
    toggleTaskExpansion,
  }
}
