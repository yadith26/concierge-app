'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { supabase } from '@/lib/supabase'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import { fetchBuildingsForUser } from '@/lib/buildings/buildingMembershipService'
import { getLocalDateInputValue } from '@/lib/dates/localDate'
import type { TaskCategory } from '@/lib/tasks/taskTypes'
import { TASK_SELECT_FIELDS, normalizeTask } from '@/lib/tasks/taskHelpers'
import type { AgendaTask } from '@/components/agenda/AgendaTypes'
import {
  getAgendaDays,
  getDateKey,
  getMonthLabel,
  getTasksForDayByKey,
} from '@/lib/agenda/agendaHelpers'
import { parseSmartTaskInput } from '@/lib/tasks/taskSmartParser'
import type {
  AgendaEntry,
  BuildingSummary,
  OwnerRequestRow,
} from '@/components/manager/agenda/managerAgendaTypes'

type UseManagerAgendaPageParams = {
  buildingId: string
}

export default function useManagerAgendaPage({
  buildingId,
}: UseManagerAgendaPageParams) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('managerAgenda')
  const todayInput = getLocalDateInputValue()

  const [building, setBuilding] = useState<BuildingSummary | null>(null)
  const [buildings, setBuildings] = useState<BuildingSummary[]>([])
  const [profileId, setProfileId] = useState('')
  const [tasks, setTasks] = useState<AgendaTask[]>([])
  const [events, setEvents] = useState<OwnerRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [compactHeader, setCompactHeader] = useState(false)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(
    getDateKey(new Date())
  )
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [savingEvent, setSavingEvent] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState(todayInput)
  const [formLocation, setFormLocation] = useState('')
  const [formCategory, setFormCategory] = useState<TaskCategory | ''>('')
  const [formNotes, setFormNotes] = useState('')
  const [formCategoryEditedManually, setFormCategoryEditedManually] =
    useState(false)
  const [formLocationEditedManually, setFormLocationEditedManually] =
    useState(false)
  const [message, setMessage] = useState('')

  const scrollRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setMessage('')

      const {
        data: { user },
        error: userError,
      } = await getSafeAuthUser()

      if (userError || !user) {
        router.replace('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        setMessage(t('profileLoadError'))
        setLoading(false)
        return
      }

      if (profile.role !== 'manager') {
        router.replace('/dashboard')
        return
      }

      setProfileId(profile.id)

      const { data: membership } = await supabase
        .from('building_users')
        .select('id')
        .eq('building_id', buildingId)
        .eq('user_id', profile.id)
        .eq('role', 'manager')
        .maybeSingle()

      if (!membership) {
        setMessage(t('noAccess'))
        setLoading(false)
        return
      }

      const nextBuildings = await fetchBuildingsForUser({
        userId: profile.id,
        role: 'manager',
      })
      setBuildings(nextBuildings)

      const [
        { data: buildingData, error: buildingError },
        { data: tasksData, error: tasksError },
        { data: eventData, error: eventError },
      ] = await Promise.all([
        supabase
          .from('buildings_new')
          .select('id, name, address')
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
          .order('suggested_date', { ascending: true }),
      ])

      if (buildingError || !buildingData) {
        setMessage(t('buildingLoadError'))
        setLoading(false)
        return
      }

      if (tasksError) {
        setMessage(t('tasksLoadError'))
      }

      if (eventError) {
        setMessage(t('eventsLoadError'))
      }

      setBuilding(buildingData as BuildingSummary)
      setTasks(((tasksData as AgendaTask[]) || []).map(normalizeTask))
      setEvents((eventData as OwnerRequestRow[]) || [])
      setLoading(false)
    }

    void load()
  }, [buildingId, router, t])

  useEffect(() => {
    if (loading) return

    const element = scrollRef.current
    if (!element) return

    const handleScroll = () => setCompactHeader(element.scrollTop > 18)

    handleScroll()
    element.addEventListener('scroll', handleScroll)

    return () => element.removeEventListener('scroll', handleScroll)
  }, [loading])

  const agendaEntries = useMemo<AgendaEntry[]>(() => {
    const taskEntries = tasks.map((task) => ({
      ...task,
      entryType: 'task' as const,
    }))

    const eventEntries = events
      .filter((event) => !!event.suggested_date)
      .map((event) => ({
        id: `event-${event.id}`,
        title: event.title,
        description: event.description,
        apartment_or_area: event.apartment_or_area,
        apartment_key: null,
        category: event.category_suggestion || 'visit',
        priority: 'medium' as const,
        status: event.status === 'converted' ? 'completed' as const : 'pending' as const,
        task_date: event.suggested_date as string,
        task_time: null,
        pest_treatment_type: null,
        pest_targets: [],
        treatment_visit_type: null,
        task_photos: [],
        task_apartments: [],
        entryType: 'event' as const,
        requestStatus: event.status,
      }))

    return [...taskEntries, ...eventEntries]
  }, [events, tasks])

  const todayKey = getDateKey(new Date())

  const monthLabel = useMemo(
    () => getMonthLabel(currentMonth, locale) || '',
    [currentMonth, locale]
  )

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return t('pickDate')

    return new Date(`${selectedDate}T12:00:00`).toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }, [locale, selectedDate, t])

  const calendarItems = useMemo(
    () => getAgendaDays(currentMonth, agendaEntries, todayKey),
    [agendaEntries, currentMonth, todayKey]
  )

  const selectedEntries = useMemo<AgendaEntry[]>(
    () => getTasksForDayByKey(agendaEntries, selectedDate) as AgendaEntry[],
    [agendaEntries, selectedDate]
  )

  const selectedTasks = useMemo(
    () => selectedEntries.filter((entry) => entry.entryType === 'task'),
    [selectedEntries]
  )

  const selectedEvents = useMemo(
    () => selectedEntries.filter((entry) => entry.entryType === 'event'),
    [selectedEntries]
  )

  const monthlyCount = useMemo(
    () =>
      agendaEntries.filter((entry) => {
        const date = new Date(`${entry.task_date}T12:00:00`)
        return (
          date.getMonth() === currentMonth.getMonth() &&
          date.getFullYear() === currentMonth.getFullYear()
        )
      }).length,
    [agendaEntries, currentMonth]
  )

  const openEventModal = () => {
    setFormTitle('')
    setFormDate(
      selectedDate && selectedDate >= todayInput ? selectedDate : todayInput
    )
    setFormLocation('')
    setFormCategory('')
    setFormNotes('')
    setFormCategoryEditedManually(false)
    setFormLocationEditedManually(false)
    setMessage('')
    setEventModalOpen(true)
  }

  const handleEventTitleChange = (value: string) => {
    setFormTitle(value)
    const parsed = parseSmartTaskInput(value, locale)

    if (!formCategoryEditedManually) {
      setFormCategory(parsed.detectedCategory || '')
    }

    if (!formLocationEditedManually) {
      setFormLocation(parsed.detectedLocation || '')
    }
  }

  const handleEventCategoryChange = (value: TaskCategory | '') => {
    setFormCategory(value)
    setFormCategoryEditedManually(true)
  }

  const handleEventLocationChange = (value: string) => {
    setFormLocation(value)
    setFormLocationEditedManually(true)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    setSelectedDate(todayKey)
  }

  const reloadEvents = async () => {
    const { data: eventData } = await supabase
      .from('owner_requests')
      .select(
        'id, title, description, suggested_date, apartment_or_area, category_suggestion, status, created_at'
      )
      .eq('building_id', buildingId)
      .order('suggested_date', { ascending: true })

    setEvents((eventData as OwnerRequestRow[]) || [])
  }

  const handleCreateEvent = async () => {
    if (!profileId || !buildingId) return

    if (!formTitle.trim() || !formDate) {
      setMessage(t('createEventValidation'))
      return
    }

    if (formDate < todayInput) {
      setMessage(t('eventDatePastError'))
      return
    }

    setSavingEvent(true)
    setMessage('')

    const { error } = await supabase.from('owner_requests').insert({
      building_id: buildingId,
      created_by: profileId,
      title: formTitle.trim(),
      description: formNotes.trim() || null,
      suggested_date: formDate,
      apartment_or_area: formLocation.trim() || null,
      category_suggestion: formCategory || null,
      status: 'pending',
    })

    if (error) {
      setMessage(error.message || t('saveEventError'))
      setSavingEvent(false)
      return
    }

    setEventModalOpen(false)
    setSavingEvent(false)
    setMessage(t('eventCreated'))

    await reloadEvents()
  }

  return {
    building,
    buildings,
    profileId,
    tasks,
    events,
    loading,
    compactHeader,
    expandedTaskId,
    setExpandedTaskId,
    expandedEventId,
    setExpandedEventId,
    currentMonth,
    setCurrentMonth,
    selectedDate,
    setSelectedDate,
    eventModalOpen,
    setEventModalOpen,
    savingEvent,
    formTitle,
    formDate,
    setFormDate,
    formLocation,
    formCategory,
    formNotes,
    setFormNotes,
    message,
    setMessage,
    scrollRef,
    agendaEntries,
    todayKey,
    monthLabel,
    selectedDateLabel,
    calendarItems,
    selectedEntries,
    selectedTasks,
    selectedEvents,
    monthlyCount,
    openEventModal,
    handleEventTitleChange,
    handleEventCategoryChange,
    handleEventLocationChange,
    goToToday,
    handleCreateEvent,
  }
}
