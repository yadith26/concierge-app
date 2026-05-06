'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { useParams, useSearchParams } from 'next/navigation'
import { Building2, ChevronRight, KeyRound, MessageSquare, Plus, Users } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { useCompactHeader } from '@/hooks/useCompactHeader'
import { useManagerBuildingDashboard } from '@/hooks/useManagerBuildingDashboard'
import ManagerHeader from '@/components/layout/ManagerHeader'
import ManagerBottomNav from '@/components/layout/ManagerBottomNav'
import ConversationModal from '@/components/messages/ConversationModal'
import ManagerTaskFormModal from '@/components/manager/ManagerTaskFormModal'
import ManagerDashboardSummary from '@/components/manager/dashboard/ManagerDashboardSummary'
import ManagerDashboardEventsCard from '@/components/manager/dashboard/ManagerDashboardEventsCard'
import ManagerDashboardTaskSection from '@/components/manager/dashboard/ManagerDashboardTaskSection'
import ManagerDashboardHeaderContent from '@/components/manager/dashboard/ManagerDashboardHeaderContent'
import { buildTaskDraftFromMessage } from '@/lib/messages/messageTaskDraft'
import type { TaskDraft } from '@/lib/tasks/taskTypes'

export default function ManagerBuildingDetailPage() {
  const router = useRouter()
  const locale = useLocale()
  const params = useParams<{ buildingId: string }>()
  const searchParams = useSearchParams()
  const buildingId = params.buildingId

  const [messageTaskDraft, setMessageTaskDraft] = useState<TaskDraft | null>(null)
  const [messageTaskSourceId, setMessageTaskSourceId] = useState<string | null>(null)
  const [messageTaskModalOpen, setMessageTaskModalOpen] = useState(false)
  const didHandleAutoOpenRef = useRef(false)

  const { scrollRef, compactHeader } = useCompactHeader<HTMLElement>(18)

  const handleRedirect = useCallback(
    (path: '/login' | '/dashboard') => router.replace(path),
    [router]
  )

  const dashboard = useManagerBuildingDashboard({
    buildingId,
    onRedirect: handleRedirect,
  })

  const {
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
    sendingMessage,
    setActiveFilter,
    setMessageBody,
    summary,
    unitSummary,
    toggleTaskExpansion,
  } = dashboard

  useEffect(() => {
    const openChat = searchParams.get('openChat')
    const contactId = searchParams.get('contactId')

    if (didHandleAutoOpenRef.current) return
    if (loading) return
    if (!openChat || !contactId) return
    if (!building || !concierge) return
    if (contactId !== concierge.id) return

    didHandleAutoOpenRef.current = true

    void openConversation()

    router.replace(`/manager/buildings/${buildingId}`)
  }, [
    building,
    buildingId,
    concierge,
    loading,
    openConversation,
    router,
    searchParams,
  ])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F6F8FC] px-5 py-8">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center">
          <p className="text-[#6E7F9D]">Cargando edificio...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="h-screen overflow-hidden bg-[#F6F8FC]">
      <div className="mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#F6F8FC]">
        <ManagerHeader
          compact={compactHeader}
          title="Dashboard"
          flatBottom
          rightSlot={
            compactHeader && building ? (
              <button
                type="button"
                onClick={() => router.push(`/manager/buildings/${building.id}/agenda`)}
                className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[#D9E0EA] bg-[#2F66C8] text-white shadow-[0_10px_24px_rgba(47,102,200,0.26)] hover:bg-[#2859B2]"
                aria-label="Nuevo evento"
              >
                <Plus size={20} />
              </button>
            ) : null
          }
          headerContent={
            building ? (
              <ManagerDashboardHeaderContent
                building={building}
                buildings={buildings}
                concierge={concierge}
                onOpenConversation={openConversation}
              />
            ) : null
          }
          secondaryAction={
            concierge
              ? {
                  icon: <MessageSquare size={19} />,
                  label: `Enviar mensaje a ${concierge.name}`,
                  onClick: openConversation,
                }
              : null
          }
        />

        <section
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-5 pb-36 pt-4"
        >
          {errorMessage ? (
            <div className="mb-4 rounded-3xl border border-[#F1D3D3] bg-[#FFF5F5] px-5 py-4 text-sm font-medium text-[#C53030]">
              {errorMessage}
            </div>
          ) : null}

          {messageSuccess ? (
            <div className="mb-4 rounded-3xl border border-[#C7E6D2] bg-[#F2FBF5] px-5 py-4 text-sm font-medium text-[#177B52]">
              {messageSuccess}
            </div>
          ) : null}

          <ManagerDashboardSummary
            summary={{
              completed: summary.completedTasks.length,
              overdue: summary.overdueTasks.length,
              pending: summary.pendingTasks.length,
              today: summary.todayTasks.length,
              upcoming: summary.upcomingTasks.length,
              urgent: summary.urgentTasks.length,
            }}
            activeFilter={activeFilter}
            onFilterChange={(filter) => {
              setActiveFilter(filter as typeof activeFilter)
            }}
          />

          <ManagerDashboardEventsCard
            eventSummary={eventSummary}
            onOpenAgenda={() => router.push(`/manager/buildings/${buildingId}/agenda`)}
          />

          <section className="rounded-[26px] border border-[#E7EDF5] bg-white p-5 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C9AB3]">
                  Apartamentos
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#142952]">
                  {unitSummary.totalApartments} apartamentos
                </h2>
                <p className="mt-1 text-sm text-[#6E7F9D]">
                  Estado rapido y acceso directo a las unidades del edificio.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/manager/buildings/${buildingId}/units`)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#EEF4FF] px-4 py-2 text-sm font-semibold text-[#2F66C8]"
              >
                Ver lista
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <MetricPill
                icon={<Building2 size={16} />}
                label="Aptos"
                value={unitSummary.totalApartments}
                onClick={() => router.push(`/manager/buildings/${buildingId}/units`)}
              />
              <MetricPill
                icon={<Users size={16} />}
                label="Ocupados"
                value={unitSummary.occupied}
                onClick={() =>
                  router.push(`/manager/buildings/${buildingId}/units?filter=occupied`)
                }
              />
              <MetricPill
                icon={<KeyRound size={16} />}
                label="Disponibles"
                value={unitSummary.available}
                onClick={() =>
                  router.push(`/manager/buildings/${buildingId}/units?filter=available`)
                }
              />
            </div>

            <div className="mt-4 space-y-3">
              {unitSummary.previewUnits.length > 0 ? (
                unitSummary.previewUnits.map((unit) => (
                  <button
                    key={unit.unit_key}
                    type="button"
                    onClick={() =>
                      router.push(`/manager/buildings/${buildingId}/units/${unit.unit_key}`)
                    }
                    className="flex w-full items-center justify-between rounded-[18px] border border-[#EEF2F7] px-4 py-3 text-left transition hover:bg-[#FBFCFE]"
                  >
                    <div className="min-w-0">
                      <p className="text-base font-bold text-[#142952]">
                        {unit.unit_label}
                      </p>
                      <p className="mt-1 truncate text-sm text-[#6E7F9D]">
                        {unit.tenant_name ||
                          (unit.status === 'available'
                            ? 'Disponible'
                            : unit.status === 'expiring_soon'
                              ? 'Contrato por vencer'
                              : unit.status === 'problematic'
                                ? 'Requiere atencion'
                                : 'Sin inquilino')}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getUnitStatusChip(
                        unit.status
                      )}`}
                    >
                      {getUnitStatusLabel(unit.status)}
                    </span>
                  </button>
                ))
              ) : (
                <div className="rounded-[18px] border border-[#EEF2F7] px-4 py-4 text-sm text-[#6E7F9D]">
                  Aun no hay apartamentos registrados en este edificio.
                </div>
              )}
            </div>
          </section>

          <ManagerDashboardTaskSection
            title={activeFilterTitle}
            tasks={filteredTasks}
            expandedTaskId={expandedTaskId}
            onToggleTask={toggleTaskExpansion}
          />
        </section>

        {building ? <ManagerBottomNav buildingId={building.id} active="home" /> : null}
      </div>

      <ConversationModal
        open={messageModalOpen}
        title="Conversacion"
        subtitle={concierge ? concierge.name : 'Sin conserje asignado'}
        currentUserId={profileId}
        messages={conversationMessages}
        value={messageBody}
        sending={sendingMessage}
        loading={conversationLoading}
        error={messageError}
        onChange={setMessageBody}
        onClose={closeConversation}
        onSubmit={handleSendMessage}
        canSaveAsTask
        onSaveAsTask={(message) => {
          setMessageTaskDraft(buildTaskDraftFromMessage({ locale, message }))
          setMessageTaskSourceId(message.id)
          closeConversation()
          setMessageTaskModalOpen(true)
        }}
      />

      {building ? (
        <ManagerTaskFormModal
          open={messageTaskModalOpen}
          onClose={() => {
            setMessageTaskModalOpen(false)
            setMessageTaskDraft(null)
            setMessageTaskSourceId(null)
          }}
          buildingId={building.id}
          managerId={profileId}
          conciergeId={concierge?.id || null}
          sourceMessageId={messageTaskSourceId}
          onCreated={() => {
            setMessageTaskModalOpen(false)
            setMessageTaskDraft(null)
            setMessageTaskSourceId(null)
          }}
          initialValues={messageTaskDraft}
        />
      ) : null}
    </main>
  )
}

function MetricPill({
  icon,
  label,
  onClick,
  value,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  value: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[18px] border border-[#E7EDF5] bg-[#F9FBFF] px-3 py-3 text-left transition hover:bg-white"
    >
      <span className="flex items-center gap-2 text-[#2F66C8]">{icon}</span>
      <span className="mt-2 block text-xl font-bold leading-none text-[#142952]">
        {value}
      </span>
      <span className="mt-1 block text-xs font-medium text-[#7B8BA8]">
        {label}
      </span>
    </button>
  )
}

function getUnitStatusLabel(
  status: 'occupied' | 'available' | 'expiring_soon' | 'problematic' | 'inactive'
) {
  if (status === 'occupied') return 'Ocupado'
  if (status === 'available') return 'Disponible'
  if (status === 'expiring_soon') return 'Por vencer'
  if (status === 'problematic') return 'Problema'
  return 'Inactivo'
}

function getUnitStatusChip(
  status: 'occupied' | 'available' | 'expiring_soon' | 'problematic' | 'inactive'
) {
  if (status === 'occupied') return 'bg-[#EAF8EF] text-[#1D7D45]'
  if (status === 'available') return 'bg-[#EEF4FF] text-[#3461C9]'
  if (status === 'expiring_soon') return 'bg-[#FFF4E6] text-[#D97706]'
  if (status === 'problematic') return 'bg-[#FFF0F0] text-[#C53030]'
  return 'bg-[#F2F5FA] text-[#7B8BA8]'
}
