'use client'

import type { ReactNode } from 'react'
import {
  CalendarClock,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  NotebookPen,
  Tag,
} from 'lucide-react'
import type { YearGroup } from '@/lib/unit-history/unitDetailHelpers'
import {
  formatUnitHistoryCategory,
  formatUnitHistoryDate,
} from '@/lib/unit-history/unitDetailHelpers'

type ManagerUnitYearSectionProps = {
  yearData: YearGroup
  expandedYear: boolean
  expandedSections: Record<string, boolean>
  expandedEntries: Record<string, boolean>
  onToggleYear: (year: string) => void
  onToggleSection: (sectionKey: string) => void
  onToggleEntry: (entryId: string) => void
  registerSectionRef: (sectionKey: string, node: HTMLElement | null) => void
  registerEntryRef: (entryId: string, node: HTMLDivElement | null) => void
}

export default function ManagerUnitYearSection({
  yearData,
  expandedYear,
  expandedSections,
  expandedEntries,
  onToggleYear,
  onToggleSection,
  onToggleEntry,
  registerSectionRef,
  registerEntryRef,
}: ManagerUnitYearSectionProps) {
  const totalRecords = yearData.groups.reduce(
    (total, group) => total + group.entries.length,
    0
  )

  return (
    <section className="rounded-[28px] border border-[#E7EDF5] bg-white p-5 shadow-[0_8px_24px_rgba(20,41,82,0.05)]">
      <button
        type="button"
        onClick={() => onToggleYear(yearData.year)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="flex min-w-0 items-center gap-2 text-[#142952]">
          <CalendarClock size={18} className="text-[#2F66C8]" />
          <h2 className="text-xl font-bold">{yearData.year}</h2>
          <span className="inline-flex rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#2F66C8]">
            {totalRecords} {totalRecords === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {expandedYear ? (
          <ChevronDown size={20} className="shrink-0 text-[#7B8BA8]" />
        ) : (
          <ChevronRight size={20} className="shrink-0 text-[#7B8BA8]" />
        )}
      </button>

      {expandedYear ? (
        <div className="mt-4 space-y-3">
          {yearData.groups.map((group) => {
            const sectionKey = `${yearData.year}-${group.key}`
            const isExpanded = !!expandedSections[sectionKey]
            const latestEntry = group.entries[0]

            return (
              <article
                key={sectionKey}
                ref={(node) => {
                  registerSectionRef(sectionKey, node)
                }}
                className="overflow-hidden rounded-[22px] border border-[#E7EDF5] bg-[#FBFCFE]"
              >
                <button
                  type="button"
                  onClick={() => onToggleSection(sectionKey)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[#2F66C8]">
                      {group.icon}
                      <span className="text-base font-semibold text-[#142952]">
                        {group.label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#6E7F9D]">
                      {group.entries.length} {group.entries.length === 1 ? 'registro' : 'registros'}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-medium text-[#7B8BA8]">
                      {formatUnitHistoryDate(latestEntry.happened_at)}
                    </span>
                    {isExpanded ? (
                      <ChevronDown size={18} className="text-[#7B8BA8]" />
                    ) : (
                      <ChevronRight size={18} className="text-[#7B8BA8]" />
                    )}
                  </div>
                </button>

                {isExpanded ? (
                  <div className="border-t border-[#E7EDF5] bg-white px-4 py-4">
                    <div className="space-y-3">
                      {group.entries.map((entry, index) => (
                        <div
                          key={entry.id}
                          ref={(node) => {
                            registerEntryRef(entry.id, node)
                          }}
                          className={
                            index === 0
                              ? 'rounded-[18px] border border-[#D6E5FF] bg-[#F5F9FF] px-4 py-4 shadow-[0_8px_24px_rgba(47,102,200,0.08)]'
                              : 'rounded-[18px] border border-[#E7EDF5] bg-[#FBFCFE] px-4 py-4'
                          }
                        >
                          <button
                            type="button"
                            onClick={() => onToggleEntry(entry.id)}
                            className="block w-full text-left"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex rounded-full bg-[#EEF4FF] px-3 py-1 text-xs font-semibold text-[#2F66C8]">
                                    {group.summaryLabel}
                                  </span>
                                  {index === 0 ? (
                                    <span className="inline-flex rounded-full bg-[#DFF4E8] px-3 py-1 text-xs font-semibold text-[#2E8B57]">
                                      Mas reciente
                                    </span>
                                  ) : null}
                                </div>
                                <h3 className="mt-3 text-[17px] font-semibold text-[#142952]">
                                  {entry.title}
                                </h3>
                                {!expandedEntries[entry.id] && entry.description ? (
                                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#5E6E8C]">
                                    {entry.description}
                                  </p>
                                ) : null}
                              </div>

                              <div className="flex shrink-0 items-center gap-3">
                                <div className="text-sm font-medium text-[#7B8BA8]">
                                  {formatUnitHistoryDate(entry.happened_at)}
                                </div>
                                {expandedEntries[entry.id] ? (
                                  <ChevronDown size={16} className="text-[#7B8BA8]" />
                                ) : (
                                  <ChevronRight size={16} className="text-[#7B8BA8]" />
                                )}
                              </div>
                            </div>
                          </button>

                          {expandedEntries[entry.id] ? (
                            <div className="mt-4 border-t border-[#E7EDF5] pt-4">
                              <div className="space-y-3">
                                <EntryDetailRow
                                  icon={<Tag className="h-4 w-4" />}
                                  label="Categoria"
                                  value={formatUnitHistoryCategory(entry.event_category)}
                                />
                                <EntryDetailRow
                                  icon={<ClipboardList className="h-4 w-4" />}
                                  label="Fecha"
                                  value={formatUnitHistoryDate(entry.happened_at)}
                                />
                                <EntryDetailRow
                                  icon={<NotebookPen className="h-4 w-4" />}
                                  label="Descripcion"
                                  value={entry.description?.trim() || 'Sin nota'}
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

function EntryDetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-[#F8FAFE] px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 text-[#7B8BA8]">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[#8C9AB3]">
            {label}
          </p>
          <p className="mt-0.5 break-words text-sm font-medium text-[#142952]">
            {value}
          </p>
        </div>
      </div>
    </div>
  )
}
