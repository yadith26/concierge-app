'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  ArrowLeft,
  Brush,
  MessageSquareMore,
  Refrigerator,
  ShieldPlus,
  Wrench,
} from 'lucide-react'
import { useRouter, Link } from '@/i18n/navigation'
import { supabase } from '@/lib/supabase'
import { getSafeAuthUser } from '@/lib/auth/getSafeAuthUser'
import { useCompactHeader } from '@/hooks/useCompactHeader'
import useHeaderConversation from '@/hooks/useHeaderConversation'
import ManagerHeader from '@/components/layout/ManagerHeader'
import ManagerBottomNav from '@/components/layout/ManagerBottomNav'
import ManagerUnitSummaryStatCard from '@/components/manager/ManagerUnitSummaryStatCard'
import ManagerUnitYearSection from '@/components/manager/ManagerUnitYearSection'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import ManagerTaskFormModal from '@/components/manager/ManagerTaskFormModal'
import { buildTaskDraftFromMessage } from '@/lib/messages/messageTaskDraft'
import {
  formatApartmentLabel,
  isApartmentReference,
} from '@/lib/locations/normalizeApartment'
import {
  buildEntriesByYear,
  buildUnitSummary,
  formatUnitHistoryDate,
  type UnitHistoryEntry,
} from '@/lib/unit-history/unitDetailHelpers'
import type { TaskDraft } from '@/lib/tasks/taskTypes'

type BuildingSummary = {
  id: string
  name: string
}

export default function ManagerUnitDetailPage() {
  const router = useRouter()
  const locale = useLocale()
  const params = useParams<{ buildingId: string; unitKey: string }>()
  const searchParams = useSearchParams()
  const buildingId = params.buildingId
  const unitKey = params.unitKey
  const { scrollRef, compactHeader } = useCompactHeader<HTMLElement>(18)
  const headerConversation = useHeaderConversation({ preferredBuildingId: buildingId })

  const [loading, setLoading] = useState(true)
  const [messageTaskDraft, setMessageTaskDraft] = useState<TaskDraft | null>(null)
  const [messageTaskSourceId, setMessageTaskSourceId] = useState<string | null>(null)
  const [messageTaskModalOpen, setMessageTaskModalOpen] = useState(false)
  const [building, setBuilding] = useState<BuildingSummary | null>(null)
  const [entries, setEntries] = useState<UnitHistoryEntry[]>([])
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({})
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({})
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const backQuery = new URLSearchParams()
  const search = searchParams.get('search') || ''
  const group = searchParams.get('group') || ''

  if (search.trim()) {
    backQuery.set('search', search)
  }

  if (group.trim()) {
    backQuery.set('group', group)
  }

  const backHref = backQuery.toString()
    ? `/manager/buildings/${buildingId}/units?${backQuery.toString()}`
    : `/manager/buildings/${buildingId}/units`

  const fetchUnitHistory = useCallback(async () => {
    setLoading(true)

    const {
      data: { user },
      error: userError,
    } = await getSafeAuthUser()

    if (userError || !user) {
      router.replace('/login')
      return
    }

    const { data: membership } = await supabase
      .from('building_users')
      .select('id')
      .eq('building_id', buildingId)
      .eq('user_id', user.id)
      .eq('role', 'manager')
      .maybeSingle()

    if (!membership) {
      router.replace('/manager')
      return
    }

    const [
      { data: buildingData },
      { data: historyData, error: historyError },
    ] = await Promise.all([
      supabase
        .from('buildings_new')
        .select('id, name')
        .eq('id', buildingId)
        .maybeSingle(),
      supabase
        .from('unit_history')
        .select('id, unit_key, unit_label, event_type, event_category, title, description, happened_at, metadata')
        .eq('building_id', buildingId)
        .eq('unit_key', unitKey)
        .order('happened_at', { ascending: false })
        .order('created_at', { ascending: false }),
    ])

    if (historyError) {
      console.error('Error loading unit history:', historyError)
    }

    setBuilding((buildingData as BuildingSummary | null) ?? null)
    setEntries((historyData as UnitHistoryEntry[]) ?? [])
    setLoading(false)
  }, [buildingId, router, unitKey])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchUnitHistory()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchUnitHistory])

  const unitLabel = useMemo(() => {
    const rawLabel = entries[0]?.unit_label || unitKey
    return isApartmentReference(rawLabel)
      ? formatApartmentLabel(rawLabel)
      : rawLabel
  }, [entries, unitKey])

  const summary = useMemo(() => buildUnitSummary(entries), [entries])

  const entriesByYear = useMemo(
    () =>
      buildEntriesByYear(entries, {
        paint: <Brush size={18} />,
        repair: <Wrench size={18} />,
        change: <Refrigerator size={18} />,
        pest: <ShieldPlus size={18} />,
      }),
    [entries]
  )

  const toggleSection = useCallback((sectionKey: string) => {
    setExpandedSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }))
  }, [])

  const toggleYear = useCallback((year: string) => {
    setExpandedYears((current) => ({
      ...current,
      [year]: !current[year],
    }))
  }, [])

  const openLatestEntry = useCallback((entry: UnitHistoryEntry | null) => {
    if (!entry) return

    const year = new Date(`${entry.happened_at}T12:00:00`).getFullYear().toString()
    const categoryKey =
      entry.event_category === 'delivery' ? 'change' : entry.event_category
    const sectionKey = `${year}-${categoryKey}`

    setExpandedYears((current) => ({
      ...current,
      [year]: true,
    }))

    setExpandedSections((current) => ({
      ...current,
      [sectionKey]: true,
    }))

    setExpandedEntries((current) => ({
      ...current,
      [entry.id]: true,
    }))

    window.setTimeout(() => {
      entryRefs.current[entry.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 180)
  }, [])

  const toggleEntry = useCallback((entryId: string) => {
    setExpandedEntries((current) => ({
      ...current,
      [entryId]: !current[entryId],
    }))
  }, [])

  const registerSectionRef = useCallback((sectionKey: string, node: HTMLElement | null) => {
    sectionRefs.current[sectionKey] = node
  }, [])

  const registerEntryRef = useCallback((entryId: string, node: HTMLDivElement | null) => {
    entryRefs.current[entryId] = node
  }, [])

  return (
    <>
      <main className="h-screen overflow-hidden bg-[#F6F8FC]">
        <div className="relative mx-auto flex h-screen min-h-0 w-full max-w-md flex-col overflow-hidden bg-[#F6F8FC]">
          <ManagerHeader
            compact={compactHeader}
            title={unitLabel}
            subtitle={building?.name || 'Historial de la unidad'}
            flatBottom
            secondaryAction={
              headerConversation.canOpenConversation
                ? {
                    icon: <MessageSquareMore size={compactHeader ? 19 : 24} />,
                    label: 'Abrir mensajes',
                    count: headerConversation.unreadCount,
                    onClick: () => {
                      void headerConversation.openInbox()
                    },
                  }
                : null
            }
            headerContent={
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 rounded-full border border-[#E7EDF5] bg-white px-4 py-3 text-sm font-semibold text-[#2F66C8] shadow-[0_8px_24px_rgba(20,41,82,0.05)]"
              >
                <ArrowLeft size={16} />
                Volver a unidades
              </Link>
            }
          />

          <section
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto px-4 pb-40 pt-3"
          >
            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center text-[#6E7F9D]">
                Cargando historial...
              </div>
            ) : entries.length > 0 ? (
              <div className="space-y-4">
                <section className="grid grid-cols-2 gap-3">
                  <ManagerUnitSummaryStatCard
                    icon={<Brush size={18} />}
                    label="Ultima pintura"
                    value={summary.paint ? formatUnitHistoryDate(summary.paint.happened_at) : 'Sin registro'}
                    onClick={() => openLatestEntry(summary.paint)}
                    interactive={!!summary.paint}
                    highlighted={!!summary.paint}
                  />
                  <ManagerUnitSummaryStatCard
                    icon={<Refrigerator size={18} />}
                    label="Ultimo reemplazo"
                    value={summary.change ? summary.change.title : 'Sin registro'}
                    onClick={() => openLatestEntry(summary.change)}
                    interactive={!!summary.change}
                    highlighted={!!summary.change}
                  />
                  <ManagerUnitSummaryStatCard
                    icon={<Wrench size={18} />}
                    label="Ultima reparacion"
                    value={summary.repair ? summary.repair.title : 'Sin registro'}
                    onClick={() => openLatestEntry(summary.repair)}
                    interactive={!!summary.repair}
                    highlighted={!!summary.repair}
                  />
                  <ManagerUnitSummaryStatCard
                    icon={<ShieldPlus size={18} />}
                    label="Ultimo control de plagas"
                    value={summary.pest ? formatUnitHistoryDate(summary.pest.happened_at) : 'Sin registro'}
                    onClick={() => openLatestEntry(summary.pest)}
                    interactive={!!summary.pest}
                    highlighted={!!summary.pest}
                  />
                </section>

                {entriesByYear.map((yearData) => (
                  <ManagerUnitYearSection
                    key={yearData.year}
                    yearData={yearData}
                    expandedYear={!!expandedYears[yearData.year]}
                    expandedSections={expandedSections}
                    expandedEntries={expandedEntries}
                    onToggleYear={toggleYear}
                    onToggleSection={toggleSection}
                    onToggleEntry={toggleEntry}
                    registerSectionRef={registerSectionRef}
                    registerEntryRef={registerEntryRef}
                  />
                ))}
              </div>
            ) : (
              <section className="rounded-[28px] border border-[#E7EDF5] bg-white px-6 py-10 text-center shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
                <h2 className="text-xl font-semibold text-[#142952]">Todavia no hay historial para esta unidad</h2>
                <p className="mt-2 text-sm leading-6 text-[#6E7F9D]">
                  Completa trabajos relevantes en esta unidad para construir su historial por ano.
                </p>
              </section>
            )}
          </section>

          {building ? (
            <ManagerBottomNav buildingId={building.id} active="units" />
          ) : null}
        </div>
      </main>

      <ConversationModal
        open={headerConversation.modalOpen}
        title="Mensajes"
        subtitle={headerConversation.contactName || 'Sin contacto asignado'}
        currentUserId={headerConversation.currentUserId}
        messages={headerConversation.messages}
        value={headerConversation.value}
        sending={headerConversation.sending}
        loading={headerConversation.loadingConversation}
        error={headerConversation.error}
        onChange={headerConversation.setValue}
        onClose={headerConversation.closeConversation}
        onSubmit={() => {
          void headerConversation.sendMessage()
        }}
        canSaveAsTask
        onSaveAsTask={(message) => {
          setMessageTaskDraft(buildTaskDraftFromMessage({ locale, message }))
          setMessageTaskSourceId(message.id)
          headerConversation.closeConversation()
          setMessageTaskModalOpen(true)
        }}
      />

      <GlobalMessagesInboxModal
        open={headerConversation.inboxOpen}
        conversations={headerConversation.inboxConversations}
        loading={headerConversation.loadingInbox}
        onClose={headerConversation.closeInbox}
        onSelect={(conversation) => {
          void headerConversation.openInboxConversation(conversation)
        }}
      />

      <ManagerTaskFormModal
        open={messageTaskModalOpen}
        onClose={() => {
          setMessageTaskModalOpen(false)
          setMessageTaskDraft(null)
          setMessageTaskSourceId(null)
        }}
        buildingId={buildingId}
        managerId={headerConversation.currentUserId}
        conciergeId={
          headerConversation.contactRole === 'concierge'
            ? headerConversation.contactId
            : null
        }
        sourceMessageId={messageTaskSourceId}
        onCreated={() => {
          setMessageTaskModalOpen(false)
          setMessageTaskDraft(null)
          setMessageTaskSourceId(null)
        }}
        initialValues={messageTaskDraft}
      />
    </>
  )
}





