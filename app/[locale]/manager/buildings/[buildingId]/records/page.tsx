'use client'

import { useCallback, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Download, MessageSquareMore } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useCompactHeader } from '@/hooks/useCompactHeader'
import useHeaderConversation from '@/hooks/useHeaderConversation'
import { useManagerRecordsPage } from '@/hooks/useManagerRecordsPage'
import ManagerHeader from '@/components/layout/ManagerHeader'
import ManagerBottomNav from '@/components/layout/ManagerBottomNav'
import ManagerBuildingChip from '@/components/layout/ManagerBuildingChip'
import ConversationModal from '@/components/messages/ConversationModal'
import GlobalMessagesInboxModal from '@/components/messages/GlobalMessagesInboxModal'
import InventoryFilters from '@/components/inventory/InventoryFilters'
import ManagerRecordsInventoryContent from '@/components/manager/records/ManagerRecordsInventoryContent'
import ManagerRecordsTreatmentContent from '@/components/manager/records/ManagerRecordsTreatmentContent'
import ManagerTreatmentFilters from '@/components/manager/records/ManagerTreatmentFilters'
import ManagerTaskFormModal from '@/components/manager/ManagerTaskFormModal'
import { exportInventoryToExcel } from '@/lib/inventory/exportInventory'
import { buildTaskDraftFromMessage } from '@/lib/messages/messageTaskDraft'
import { exportTreatmentHistoryToExcel } from '@/lib/tasks/exportTreatmentHistory'
import type { TaskDraft } from '@/lib/tasks/taskTypes'
import {
  exportUnitsWorkbook,
  formatRecordCategory,
} from '@/lib/unit-history/unitsWorkbook'

export default function ManagerRecordsPage() {
  const router = useRouter()
  const params = useParams<{ buildingId: string }>()
  const buildingId = params.buildingId
  const locale = useLocale()
  const t = useTranslations()
  const headerConversation = useHeaderConversation({ preferredBuildingId: buildingId })
  const [messageTaskDraft, setMessageTaskDraft] = useState<TaskDraft | null>(null)
  const [messageTaskSourceId, setMessageTaskSourceId] = useState<string | null>(null)
  const [messageTaskModalOpen, setMessageTaskModalOpen] = useState(false)
  const [unitsScope, setUnitsScope] = useState<'all' | 'apartments' | 'common'>('all')
  const [unitsYear, setUnitsYear] = useState<'all' | string>('all')
  const { scrollRef, compactHeader } = useCompactHeader<HTMLElement>(18)
  const handleRedirect = useCallback(
    (path: '/login' | '/manager') => router.replace(path),
    [router]
  )
  const records = useManagerRecordsPage({
    buildingId,
    onRedirect: handleRedirect,
  })

  const {
    building,
    buildings,
    clearInventoryFilters,
    commonSummaries,
    conditionFilter,
    expandedApartment,
    filteredInventory,
    filteredTreatments,
    groupedCategories,
    groupedTreatments,
    hasInventoryFilters,
    inventorySearch,
    loading,
    onlyLowStock,
    pestFilter,
    apartmentSummaries,
    setConditionFilter,
    setInventorySearch,
    setOnlyLowStock,
    setTab,
    setViewMode,
    tab,
    toggleApartment,
    totalLowStock,
    treatmentSearch,
    unitHistoryRows,
    updatePestFilter,
    updateTreatmentSearch,
    updateVisitFilter,
    viewMode,
    visitFilter,
  } = records

  const availableUnitYears = useMemo(
    () =>
      Array.from(
        new Set(
          unitHistoryRows.map((row) =>
            new Date(`${row.happened_at}T12:00:00`).getFullYear().toString()
          )
        )
      ).sort((a, b) => Number(b) - Number(a)),
    [unitHistoryRows]
  )

  const filteredUnitHistoryRows = useMemo(() => {
    return unitHistoryRows.filter((row) => {
      const matchesScope =
        unitsScope === 'all'
          ? true
          : unitsScope === 'apartments'
            ? /^\s*(apto|apt|apartamento)\b/i.test(row.unit_label)
            : !/^\s*(apto|apt|apartamento)\b/i.test(row.unit_label)

      const rowYear = new Date(`${row.happened_at}T12:00:00`).getFullYear().toString()
      const matchesYear = unitsYear === 'all' ? true : rowYear === unitsYear

      return matchesScope && matchesYear
    })
  }, [unitHistoryRows, unitsScope, unitsYear])

  const filteredApartmentSummaries = useMemo(() => {
    const allowed = new Set(filteredUnitHistoryRows.map((row) => row.unit_key))
    return apartmentSummaries.filter((unit) => allowed.has(unit.unitKey))
  }, [apartmentSummaries, filteredUnitHistoryRows])

  const filteredCommonSummaries = useMemo(() => {
    const allowed = new Set(filteredUnitHistoryRows.map((row) => row.unit_key))
    return commonSummaries.filter((unit) => allowed.has(unit.unitKey))
  }, [commonSummaries, filteredUnitHistoryRows])

  const handleDownload = () => {
    if (!building) return

    if (tab === 'inventory') {
      exportInventoryToExcel({
        items: filteredInventory,
        buildingName: building.name,
        locale,
        t,
        includeMinimumStock: false,
        includeHistorySheet: false,
      })
      return
    }

    if (tab === 'units') {
      void exportUnitsWorkbook({
        buildingName: building.name,
        apartments: filteredApartmentSummaries,
        common: filteredCommonSummaries,
        rows: filteredUnitHistoryRows,
        locale,
        t,
      })
      return
    }

    exportTreatmentHistoryToExcel({
      treatments: filteredTreatments,
      buildingName: building.name,
      locale,
      t,
    })
  }

  const downloadDisabled =
    tab === 'inventory'
      ? filteredInventory.length === 0
      : tab === 'units'
        ? filteredUnitHistoryRows.length === 0
        : filteredTreatments.length === 0

  return (
    <>
      <main className="h-screen overflow-hidden bg-[#F6F8FC]">
        <div className="mx-auto flex h-screen w-full max-w-md flex-col overflow-hidden bg-[#F6F8FC]">
          <ManagerHeader
            compact={compactHeader}
            title="Records"
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
              <div className="space-y-4">
                {building ? (
                  <ManagerBuildingChip
                    buildingId={building.id}
                    buildingName={building.name}
                    buildings={buildings}
                    getBuildingHref={(nextBuildingId) =>
                      `/manager/buildings/${nextBuildingId}/records`
                    }
                    label="Edificio actual"
                    mainHref="/manager"
                    mainLabel="Mis edificios"
                    mainDescription="Ver todos tus edificios"
                    size="compact"
                  />
                ) : null}

                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloadDisabled}
                  className={`flex w-full items-center justify-center gap-3 rounded-[30px] border px-5 py-4 text-[18px] font-semibold shadow-[0_12px_24px_rgba(20,41,82,0.08)] ${
                    downloadDisabled
                      ? 'cursor-not-allowed border-[#E7EDF5] bg-white text-[#A1AFC4]'
                      : 'border-[#DCE7F5] bg-white text-[#2F66C8] hover:bg-[#F8FBFF]'
                  }`}
                >
                  <Download size={22} />
                  Export Excel
                </button>
              </div>
            }
          />

          <section ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-28 pt-3">
            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center text-[#6E7F9D]">
                Loading records...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-[24px] border border-[#E7EDF5] bg-white p-4 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
                  <div className="grid grid-cols-3 gap-2 rounded-[20px] bg-[#F5F8FF] p-1.5">
                    <button
                      type="button"
                      onClick={() => setTab('inventory')}
                      className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                        tab === 'inventory'
                          ? 'bg-[#2F66C8] text-white shadow-[0_8px_18px_rgba(47,102,200,0.24)]'
                          : 'text-[#5E6E8C] hover:bg-white'
                      }`}
                    >
                      Inventory
                    </button>

                    <button
                      type="button"
                      onClick={() => setTab('units')}
                      className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                        tab === 'units'
                          ? 'bg-[#2F66C8] text-white shadow-[0_8px_18px_rgba(47,102,200,0.24)]'
                          : 'text-[#5E6E8C] hover:bg-white'
                      }`}
                    >
                      Apartamentos
                    </button>

                    <button
                      type="button"
                      onClick={() => setTab('treatments')}
                      className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                        tab === 'treatments'
                          ? 'bg-[#2F66C8] text-white shadow-[0_8px_18px_rgba(47,102,200,0.24)]'
                          : 'text-[#5E6E8C] hover:bg-white'
                      }`}
                    >
                      Treatments
                    </button>
                  </div>

                  <div className="mt-4">
                    {tab === 'inventory' ? (
                      <InventoryFilters
                        search={inventorySearch}
                        onSearchChange={setInventorySearch}
                        conditionFilter={conditionFilter}
                        onConditionFilterChange={setConditionFilter}
                        onlyLowStock={onlyLowStock}
                        onToggleOnlyLowStock={() =>
                          setOnlyLowStock((prev) => !prev)
                        }
                        totalLowStock={totalLowStock}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        hasActiveFilters={hasInventoryFilters}
                        onClearFilters={() => {
                          clearInventoryFilters()
                        }}
                      />
                    ) : tab === 'treatments' ? (
                      <ManagerTreatmentFilters
                        search={treatmentSearch}
                        onSearchChange={updateTreatmentSearch}
                        pestFilter={pestFilter}
                        onPestFilterChange={updatePestFilter}
                        visitFilter={visitFilter}
                        onVisitFilterChange={updateVisitFilter}
                      />
                    ) : (
                      <div className="space-y-3 rounded-[20px] border border-[#E7EDF5] bg-[#F9FBFF] px-4 py-3">
                        <p className="text-sm text-[#5E6E8C]">
                          Exporta un Excel con el historial de trabajos realizados por apartamento y areas comunes.
                        </p>

                        <div className="grid grid-cols-3 gap-2 rounded-[18px] bg-white p-1">
                          {[
                            { id: 'all', label: 'Todo' },
                            { id: 'apartments', label: 'Aptos' },
                            { id: 'common', label: 'Areas' },
                          ].map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() =>
                                setUnitsScope(option.id as 'all' | 'apartments' | 'common')
                              }
                              className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                                unitsScope === option.id
                                  ? 'bg-[#2F66C8] text-white shadow-[0_8px_18px_rgba(47,102,200,0.24)]'
                                  : 'text-[#5E6E8C] hover:bg-[#F5F8FF]'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>

                        <select
                          value={unitsYear}
                          onChange={(event) => setUnitsYear(event.target.value)}
                          className="h-11 w-full rounded-[16px] border border-[#E3EAF3] bg-white px-4 text-sm font-semibold text-[#142952] outline-none"
                        >
                          <option value="all">Todos los anos</option>
                          {availableUnitYears.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {tab === 'inventory' ? (
                  <ManagerRecordsInventoryContent
                    viewMode={viewMode}
                    groupedCategories={groupedCategories}
                    filteredInventory={filteredInventory}
                    t={t}
                  />
                ) : tab === 'treatments' ? (
                  <ManagerRecordsTreatmentContent
                    groupedTreatments={groupedTreatments}
                    expandedApartment={expandedApartment}
                    locale={locale}
                    t={t}
                    onToggleApartment={toggleApartment}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-[#E7EDF5] bg-white p-4 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8C9AB3]">
                            Historial por unidad
                          </p>
                          <h3 className="mt-1 text-lg font-bold text-[#142952]">
                            {filteredUnitHistoryRows.length} trabajos registrados
                          </h3>
                        </div>
                      </div>
                    </div>

                    {filteredApartmentSummaries.length > 0 ? (
                      <div className="rounded-[24px] border border-[#E7EDF5] bg-white p-4 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-[15px] font-bold uppercase tracking-[0.12em] text-[#7B8BA8]">
                            Apartamentos
                          </h3>
                          <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-sm font-semibold text-[#2F66C8]">
                            {filteredApartmentSummaries.length}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {filteredApartmentSummaries.map((unit) => (
                            <div
                              key={unit.unitKey}
                              className="rounded-[20px] border border-[#EEF2F7] px-4 py-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-lg font-bold text-[#142952]">
                                    {unit.unitLabel}
                                  </p>
                                  <p className="mt-1 text-sm text-[#6E7F9D]">
                                    {unit.totalEvents} trabajos registrados
                                  </p>
                                </div>
                                <span className="rounded-full bg-[#FFF4E6] px-3 py-1 text-sm font-semibold text-[#E18A1D]">
                                  {formatRecordCategory(unit.lastEventCategory)}
                                </span>
                              </div>
                              <p className="mt-3 text-sm font-semibold text-[#142952]">
                                {unit.lastEventTitle}
                              </p>
                              <p className="mt-1 text-sm text-[#6E7F9D]">
                                Ultimo trabajo: {unit.lastEventDate}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {filteredCommonSummaries.length > 0 ? (
                      <div className="rounded-[24px] border border-[#E7EDF5] bg-white p-4 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-[15px] font-bold uppercase tracking-[0.12em] text-[#7B8BA8]">
                            Areas comunes
                          </h3>
                          <span className="rounded-full bg-[#EEF4FF] px-3 py-1 text-sm font-semibold text-[#2F66C8]">
                            {filteredCommonSummaries.length}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {filteredCommonSummaries.map((unit) => (
                            <div
                              key={unit.unitKey}
                              className="rounded-[20px] border border-[#EEF2F7] px-4 py-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-lg font-bold text-[#142952]">
                                    {unit.unitLabel}
                                  </p>
                                  <p className="mt-1 text-sm text-[#6E7F9D]">
                                    {unit.totalEvents} trabajos registrados
                                  </p>
                                </div>
                                <span className="rounded-full bg-[#FFF4E6] px-3 py-1 text-sm font-semibold text-[#E18A1D]">
                                  {formatRecordCategory(unit.lastEventCategory)}
                                </span>
                              </div>
                              <p className="mt-3 text-sm font-semibold text-[#142952]">
                                {unit.lastEventTitle}
                              </p>
                              <p className="mt-1 text-sm text-[#6E7F9D]">
                                Ultimo trabajo: {unit.lastEventDate}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {filteredUnitHistoryRows.length === 0 ? (
                      <div className="rounded-[24px] border border-[#E7EDF5] bg-white p-6 text-center text-[#6E7F9D] shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
                        No hay trabajos para los filtros seleccionados.
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </section>

          {building ? (
            <ManagerBottomNav buildingId={building.id} active="records" />
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
