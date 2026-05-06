'use client'

import { useState } from 'react'
import {
  CalendarDays,
  CalendarPlus2,
  MessageSquareMore,
  Plus,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import ManagerHeader from '@/components/layout/ManagerHeader'
import ManagerBottomNav from '@/components/layout/ManagerBottomNav'
import ManagerBuildingChip from '@/components/layout/ManagerBuildingChip'
import AgendaCalendar from '@/components/agenda/AgendaCalendar'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import useHeaderConversation from '@/hooks/useHeaderConversation'
import useManagerAgendaPage from '@/hooks/useManagerAgendaPage'
import ManagerAgendaEventModal from '@/components/manager/ManagerAgendaEventModal'
import ManagerAgendaDayPanel from '@/components/manager/agenda/ManagerAgendaDayPanel'
import ManagerTaskFormModal from '@/components/manager/ManagerTaskFormModal'
import { buildTaskDraftFromMessage } from '@/lib/messages/messageTaskDraft'
import type { TaskDraft } from '@/lib/tasks/taskTypes'

export default function ManagerAgendaPage() {
  const t = useTranslations('managerAgenda')
  const locale = useLocale()
  const params = useParams<{ buildingId: string }>()
  const buildingId = params.buildingId
  const [messageTaskDraft, setMessageTaskDraft] = useState<TaskDraft | null>(null)
  const [messageTaskSourceId, setMessageTaskSourceId] = useState<string | null>(null)
  const [messageTaskModalOpen, setMessageTaskModalOpen] = useState(false)

  const headerConversation = useHeaderConversation({
    preferredBuildingId: buildingId,
  })

  const {
    building,
    buildings,
    profileId,
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
    scrollRef,
    agendaEntries,
    monthLabel,
    selectedDateLabel,
    calendarItems,
    selectedTasks,
    selectedEvents,
    monthlyCount,
    openEventModal,
    handleEventTitleChange,
    handleEventCategoryChange,
    handleEventLocationChange,
    goToToday,
    handleCreateEvent,
  } = useManagerAgendaPage({ buildingId })

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F6F8FC] px-5 py-8">
        <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center justify-center">
          <p className="text-[#6E7F9D]">{t('loading')}</p>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="h-screen overflow-hidden bg-[#F6F8FC]">
        <div className="mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#F6F8FC]">
          <ManagerHeader
            compact={compactHeader}
            title={t('title')}
            flatBottom
            secondaryAction={
              headerConversation.canOpenConversation
                ? {
                    icon: <MessageSquareMore size={compactHeader ? 19 : 24} />,
                    label: t('messages'),
                    count: headerConversation.unreadCount,
                    onClick: () => {
                      void headerConversation.openInbox()
                    },
                  }
                : null
            }
            rightSlot={
              compactHeader ? (
                <button
                  type="button"
                  onClick={openEventModal}
                  className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[#D9E0EA] bg-[#2F66C8] text-white shadow-[0_10px_24px_rgba(47,102,200,0.26)] hover:bg-[#2859B2]"
                  aria-label={t('newEvent')}
                >
                  <Plus size={20} />
                </button>
              ) : null
            }
            headerContent={
              <div className="space-y-4">
                {building ? (
                  <ManagerBuildingChip
                    buildingId={building.id}
                    buildingName={building.name}
                    buildings={buildings}
                    getBuildingHref={(nextBuildingId) =>
                      `/manager/buildings/${nextBuildingId}/agenda`
                    }
                    label="Edificio actual"
                    mainHref="/manager"
                    mainLabel="Mis edificios"
                    mainDescription="Ver todos tus edificios"
                    size="compact"
                  />
                ) : null}

                <div className="flex items-center gap-3">
                  <div className="inline-flex min-w-0 flex-1 items-center gap-3 rounded-full border border-[#D9E0EA] bg-white/92 px-4 py-3 shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm">
                    <div className="rounded-full bg-[#F3F6FB] p-2 text-[#8C9AB3]">
                      <CalendarDays size={16} />
                    </div>

                    <span className="text-[15px] text-[#6E7F9D]">
                      {t('date')}
                    </span>

                    <span className="truncate text-[15px] font-semibold capitalize text-[#142952]">
                      {selectedDateLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={goToToday}
                    className="shrink-0 rounded-full border border-[#D9E0EA] bg-white/92 px-5 py-3 text-sm font-semibold text-[#2F66C8] shadow-[0_8px_24px_rgba(20,41,82,0.08)] backdrop-blur-sm"
                  >
                    {t('goToToday')}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={openEventModal}
                  className="flex w-full items-center justify-center gap-3 rounded-[30px] bg-[#3E63E6] px-5 py-4 text-[18px] font-semibold text-white shadow-[0_16px_30px_rgba(62,99,230,0.28)]"
                >
                  <CalendarPlus2 size={24} />
                  {t('newEvent')}
                </button>
              </div>
            }
          />

          <section
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-5 pb-10 pt-4"
          >
            {message ? (
              <div className="mb-4 rounded-3xl border border-[#DCE7F5] bg-white px-5 py-4 text-sm font-medium text-[#2F66C8]">
                {message}
              </div>
            ) : null}

            <AgendaCalendar
              monthLabel={monthLabel}
              monthlyStats={{
                total: monthlyCount,
                completed: selectedTasks.filter(
                  (task) => task.status === 'completed'
                ).length,
                urgent: agendaEntries.filter(
                  (entry) =>
                    entry.task_date.startsWith(
                      `${currentMonth.getFullYear()}-${String(
                        currentMonth.getMonth() + 1
                      ).padStart(2, '0')}`
                    ) &&
                    entry.priority === 'high' &&
                    entry.status !== 'completed'
                ).length,
              }}
              days={calendarItems}
              selectedDate={selectedDate}
              onChangeMonth={(direction) => {
                setCurrentMonth((prev) => {
                  const next = new Date(prev)
                  next.setMonth(prev.getMonth() + direction)
                  return next
                })
              }}
              onSelectDate={setSelectedDate}
              onCreateTask={openEventModal}
              onExportMonth={() => {}}
              onTouchStart={() => {}}
              onTouchMove={() => {}}
              onTouchEnd={() => {}}
            />

            <ManagerAgendaDayPanel
              selectedDate={selectedDate}
              selectedTasks={selectedTasks}
              selectedEvents={selectedEvents}
              expandedTaskId={expandedTaskId}
              expandedEventId={expandedEventId}
              onToggleTask={(taskId) =>
                setExpandedTaskId((current) =>
                  current === taskId ? null : taskId
                )
              }
              onToggleEvent={(eventId) =>
                setExpandedEventId((current) =>
                  current === eventId ? null : eventId
                )
              }
            />
          </section>

          {building ? (
            <ManagerBottomNav buildingId={building.id} active="agenda" />
          ) : null}
        </div>
      </main>

      <ConversationModal
        open={headerConversation.modalOpen}
        title={t('messages')}
        subtitle={headerConversation.contactName || t('noAssignedContact')}
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

      <ManagerAgendaEventModal
        open={eventModalOpen}
        title={formTitle}
        date={formDate}
        location={formLocation}
        category={formCategory}
        notes={formNotes}
        saving={savingEvent}
        onClose={() => setEventModalOpen(false)}
        onChangeTitle={handleEventTitleChange}
        onChangeDate={setFormDate}
        onChangeLocation={handleEventLocationChange}
        onChangeCategory={handleEventCategoryChange}
        onChangeNotes={setFormNotes}
        onSubmit={handleCreateEvent}
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
        managerId={profileId || headerConversation.currentUserId}
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
